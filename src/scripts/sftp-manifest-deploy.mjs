import { createHash } from "node:crypto";
import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { relative, resolve, sep, posix as posixPath } from "node:path";
import { fileURLToPath } from "node:url";

export const DEPLOY_MANIFEST_FILE = ".projectdelta-deploy-manifest.json";
export const DEPLOY_PLAN_FILE = "deploy-plan.json";
export const LFTP_COMMAND_FILE = "deploy.lftp";

const scriptPath = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (!entry.startsWith("--")) {
      throw new Error(`Onbekend argument: ${entry}`);
    }

    const [rawKey, inlineValue] = entry.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(rawKey, next);
      index += 1;
      continue;
    }

    args.set(rawKey, true);
  }

  return args;
}

function normalizeRelativePath(rootDir, filePath) {
  const relativePath = relative(rootDir, filePath).split(sep).join("/");

  if (
    !relativePath ||
    relativePath.startsWith("../") ||
    relativePath.includes("/../") ||
    relativePath.startsWith("/") ||
    relativePath.includes("\\") ||
    relativePath.includes("\0")
  ) {
    throw new Error(`Onveilig dist-pad: ${relativePath}`);
  }

  return relativePath;
}

async function walkFiles(rootDir, currentDir = rootDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const entryPath = resolve(currentDir, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlinks horen niet in dist/: ${entryPath}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(rootDir, entryPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function hashFile(filePath) {
  const contents = await readFile(filePath);
  return createHash("sha256").update(contents).digest("hex");
}

function sortedObject(entries) {
  return Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

export async function createDeployManifest(distDir, options = {}) {
  const rootDir = resolve(distDir);
  const files = {};

  if (!existsSync(rootDir)) {
    throw new Error(`dist/ bestaat niet: ${rootDir}`);
  }

  for (const filePath of await walkFiles(rootDir)) {
    const relativePath = normalizeRelativePath(rootDir, filePath);
    const fileStat = await stat(filePath);
    files[relativePath] = {
      size: fileStat.size,
      sha256: await hashFile(filePath),
    };
  }

  return {
    version: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    generator: "src/scripts/sftp-manifest-deploy.mjs",
    files: sortedObject(files),
  };
}

export function parseDeployManifest(rawContents) {
  const manifest = JSON.parse(rawContents);

  if (manifest.version !== 1 || typeof manifest.files !== "object") {
    throw new Error("Ongeldige deploymanifest-versie of files-structuur.");
  }

  for (const [filePath, metadata] of Object.entries(manifest.files)) {
    if (
      !filePath ||
      filePath.startsWith("/") ||
      filePath.startsWith("../") ||
      filePath.includes("/../") ||
      filePath.includes("\\") ||
      typeof metadata?.sha256 !== "string" ||
      typeof metadata?.size !== "number"
    ) {
      throw new Error(`Ongeldige deploymanifest-entry: ${filePath}`);
    }
  }

  return manifest;
}

export async function readDeployManifest(manifestPath) {
  return parseDeployManifest(await readFile(manifestPath, "utf8"));
}

async function readOptionalDeployManifest(manifestPath) {
  if (!manifestPath || !existsSync(manifestPath)) {
    return null;
  }

  try {
    return await readDeployManifest(manifestPath);
  } catch (error) {
    console.warn(
      `Remote deploymanifest kon niet gelezen worden; volledige upload volgt. ${error.message}`,
    );
    return null;
  }
}

function uploadRank(filePath) {
  if (filePath.startsWith("assets/") || filePath.startsWith("_astro/")) {
    return 0;
  }
  if (filePath === ".htaccess") {
    return 1;
  }
  if (
    /\.(css|js|json|png|jpe?g|svg|webp|avif|ico|woff2?|xml|txt)$/u.test(
      filePath,
    )
  ) {
    return 2;
  }
  if (filePath.endsWith(".html")) {
    return 3;
  }
  return 4;
}

function sortUploads(paths) {
  return [...paths].sort((left, right) => {
    const rankDifference = uploadRank(left) - uploadRank(right);
    return rankDifference === 0 ? left.localeCompare(right) : rankDifference;
  });
}

export function createDeployPlan(localManifest, remoteManifest, options = {}) {
  const fullDeploy = options.fullDeploy ?? false;
  const localFiles = localManifest.files;
  const remoteFiles = remoteManifest?.files ?? {};
  const remoteManifestFound = Boolean(remoteManifest);

  const upload = sortUploads(
    Object.entries(localFiles)
      .filter(([filePath, metadata]) => {
        const remoteMetadata = remoteFiles[filePath];
        return (
          fullDeploy ||
          !remoteMetadata ||
          remoteMetadata.sha256 !== metadata.sha256 ||
          remoteMetadata.size !== metadata.size
        );
      })
      .map(([filePath]) => filePath),
  );

  const uploadSet = new Set(upload);
  const unchanged = Object.keys(localFiles)
    .filter((filePath) => !uploadSet.has(filePath))
    .sort((left, right) => left.localeCompare(right));

  // Alleen bestanden uit het vorige manifest worden verwijderd. Handmatige
  // remote bestanden blijven daarmee met rust.
  const deletePaths = remoteManifestFound
    ? Object.keys(remoteFiles)
        .filter((filePath) => !localFiles[filePath])
        .sort((left, right) => right.localeCompare(left))
    : [];

  const uploadBytes = upload.reduce(
    (total, filePath) => total + localFiles[filePath].size,
    0,
  );

  return {
    version: 1,
    fullDeploy,
    remoteManifestFound,
    upload,
    delete: deletePaths,
    unchanged,
    summary: {
      localFiles: Object.keys(localFiles).length,
      remoteFiles: Object.keys(remoteFiles).length,
      uploadCount: upload.length,
      deleteCount: deletePaths.length,
      unchangedCount: unchanged.length,
      uploadBytes,
    },
  };
}

function quoteLftp(value) {
  return `"${value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("$", "\\$")
    .replaceAll("`", "\\`")}"`;
}

function normalizeRemoteDir(remoteDir) {
  if (!remoteDir || remoteDir === "/" || remoteDir === ".") {
    throw new Error(`Onveilige remote webroot: ${remoteDir}`);
  }
  return remoteDir.replace(/\/+$/u, "");
}

function joinRemote(remoteDir, relativePath) {
  const normalizedRemoteDir = normalizeRemoteDir(remoteDir);
  return relativePath
    ? `${normalizedRemoteDir}/${relativePath}`
    : normalizedRemoteDir;
}

function localDistPath(distPrefix, filePath) {
  return `./${posixPath.join(distPrefix.replace(/^\.?\//u, ""), filePath)}`;
}

function uploadCommand(remoteDir, distPrefix, filePath) {
  const remoteDirectory = joinRemote(remoteDir, posixPath.dirname(filePath));
  return `put -O ${quoteLftp(remoteDirectory)} ${quoteLftp(
    localDistPath(distPrefix, filePath),
  )}`;
}

export function renderLftpCommands(plan, options) {
  const remoteDir = normalizeRemoteDir(options.remoteDir);
  const distPrefix = options.distPrefix ?? "dist";
  const localManifestPath =
    options.localManifestPath ?? `.deploy/${DEPLOY_MANIFEST_FILE}`;
  const commands = [
    "set cmd:fail-exit yes",
    "set net:max-retries 3",
    "set net:timeout 30",
    "set sftp:auto-confirm yes",
    `mkdir -p ${quoteLftp(remoteDir)}`,
  ];

  const directories = new Set();
  for (const filePath of plan.upload) {
    const directory = posixPath.dirname(filePath);
    if (directory !== ".") {
      directories.add(directory);
    }
  }

  for (const directory of [...directories].sort((left, right) => {
    const depthDifference = left.split("/").length - right.split("/").length;
    return depthDifference === 0 ? left.localeCompare(right) : depthDifference;
  })) {
    commands.push(`mkdir -p ${quoteLftp(joinRemote(remoteDir, directory))}`);
  }

  for (const filePath of plan.upload) {
    commands.push(uploadCommand(remoteDir, distPrefix, filePath));
  }

  for (const filePath of plan.delete) {
    commands.push(`rm -f ${quoteLftp(joinRemote(remoteDir, filePath))}`);
  }

  commands.push(
    `put -O ${quoteLftp(remoteDir)} ${quoteLftp(localManifestPath)}`,
    "bye",
  );

  return `${commands.join("\n")}\n`;
}

function renderSummary(plan) {
  const lines = [
    "## SFTP manifestdeploy",
    "",
    `- Full deploy: \`${plan.fullDeploy ? "ja" : "nee"}\``,
    `- Remote manifest gevonden: \`${plan.remoteManifestFound ? "ja" : "nee"}\``,
    `- Lokale bestanden: \`${plan.summary.localFiles}\``,
    `- Uploads: \`${plan.summary.uploadCount}\``,
    `- Verwijderen: \`${plan.summary.deleteCount}\``,
    `- Ongewijzigd: \`${plan.summary.unchangedCount}\``,
    `- Uploadvolume: \`${plan.summary.uploadBytes}\` bytes`,
  ];

  if (plan.upload.length > 0) {
    lines.push("", "### Upload", "");
    lines.push(
      ...plan.upload.slice(0, 25).map((filePath) => `- \`${filePath}\``),
    );
    if (plan.upload.length > 25) {
      lines.push(`- ... plus ${plan.upload.length - 25} meer`);
    }
  }

  if (plan.delete.length > 0) {
    lines.push("", "### Verwijderen", "");
    lines.push(
      ...plan.delete.slice(0, 25).map((filePath) => `- \`${filePath}\``),
    );
    if (plan.delete.length > 25) {
      lines.push(`- ... plus ${plan.delete.length - 25} meer`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (args.has("help")) {
    console.log(`Gebruik: node src/scripts/sftp-manifest-deploy.mjs \\
  --dist dist \\
  --remote-manifest .deploy/remote-manifest.json \\
  --output-dir .deploy \\
  --remote-dir "$SFTP_REMOTE_DIR" [--full]`);
    return;
  }

  const distDir = args.get("dist") ?? "dist";
  const remoteManifestPath = args.get("remote-manifest");
  const outputDir = args.get("output-dir") ?? ".deploy";
  const remoteDir = args.get("remote-dir");
  const fullDeploy = args.has("full") || process.env.FULL_DEPLOY === "true";

  if (!remoteDir) {
    throw new Error("--remote-dir is verplicht.");
  }

  await mkdir(outputDir, { recursive: true });
  const localManifest = await createDeployManifest(distDir);
  const remoteManifest = await readOptionalDeployManifest(remoteManifestPath);
  const plan = createDeployPlan(localManifest, remoteManifest, { fullDeploy });
  const localManifestPath = posixPath.join(outputDir, DEPLOY_MANIFEST_FILE);
  const planPath = posixPath.join(outputDir, DEPLOY_PLAN_FILE);
  const lftpPath = posixPath.join(outputDir, LFTP_COMMAND_FILE);

  await writeFile(
    localManifestPath,
    `${JSON.stringify(localManifest, null, 2)}\n`,
  );
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  await writeFile(
    lftpPath,
    renderLftpCommands(plan, {
      remoteDir,
      distPrefix: distDir,
      localManifestPath,
    }),
  );

  const summary = renderSummary(plan);
  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

if (process.argv[1] === scriptPath) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
