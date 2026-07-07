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

type ParsedArgs = Map<string, string | true>;

export type DeployFileMetadata = {
  size: number;
  sha256: string;
};

export type DeployManifest = {
  version: 1;
  generatedAt: string;
  generator: string;
  files: Record<string, DeployFileMetadata>;
};

type CreateDeployManifestOptions = {
  generatedAt?: string;
};

type DeployPlanOptions = {
  fullDeploy?: boolean;
};

export type DeployPlan = {
  version: 1;
  fullDeploy: boolean;
  remoteManifestFound: boolean;
  upload: string[];
  delete: string[];
  unchanged: string[];
  summary: {
    localFiles: number;
    remoteFiles: number;
    uploadCount: number;
    deleteCount: number;
    unchangedCount: number;
    uploadBytes: number;
  };
};

type RenderLftpOptions = {
  remoteDir: string;
  distPrefix?: string;
  localManifestPath?: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = new Map();

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

function stringArg(
  args: ParsedArgs,
  key: string,
  fallback?: string,
): string | undefined {
  const value = args.get(key);
  return typeof value === "string" ? value : fallback;
}

function isDeployFileMetadata(value: unknown): value is DeployFileMetadata {
  return (
    typeof value === "object" &&
    value !== null &&
    "sha256" in value &&
    typeof value.sha256 === "string" &&
    "size" in value &&
    typeof value.size === "number"
  );
}

function normalizeRelativePath(rootDir: string, filePath: string): string {
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

async function walkFiles(
  rootDir: string,
  currentDir = rootDir,
): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

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

async function hashFile(filePath: string): Promise<string> {
  const contents = await readFile(filePath);
  return createHash("sha256").update(contents).digest("hex");
}

function sortedObject<T>(entries: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

export async function createDeployManifest(
  distDir: string,
  options: CreateDeployManifestOptions = {},
): Promise<DeployManifest> {
  const rootDir = resolve(distDir);
  const files: Record<string, DeployFileMetadata> = {};

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
    generator: "src/scripts/sftp-manifest-deploy.ts",
    files: sortedObject(files),
  };
}

export function parseDeployManifest(rawContents: string): DeployManifest {
  const manifest = JSON.parse(rawContents) as Partial<DeployManifest>;

  if (
    manifest.version !== 1 ||
    typeof manifest.generatedAt !== "string" ||
    typeof manifest.generator !== "string" ||
    typeof manifest.files !== "object" ||
    manifest.files === null
  ) {
    throw new Error("Ongeldige deploymanifest-versie of files-structuur.");
  }

  const files = manifest.files as Record<string, unknown>;

  for (const [filePath, metadata] of Object.entries(files)) {
    if (
      !filePath ||
      filePath.startsWith("/") ||
      filePath.startsWith("../") ||
      filePath.includes("/../") ||
      filePath.includes("\\") ||
      !isDeployFileMetadata(metadata)
    ) {
      throw new Error(`Ongeldige deploymanifest-entry: ${filePath}`);
    }
  }

  return {
    version: 1,
    generatedAt: manifest.generatedAt,
    generator: manifest.generator,
    files: sortedObject(files as Record<string, DeployFileMetadata>),
  };
}

export async function readDeployManifest(
  manifestPath: string,
): Promise<DeployManifest> {
  return parseDeployManifest(await readFile(manifestPath, "utf8"));
}

async function readOptionalDeployManifest(
  manifestPath?: string,
): Promise<DeployManifest | null> {
  if (!manifestPath || !existsSync(manifestPath)) {
    return null;
  }

  try {
    return await readDeployManifest(manifestPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Remote deploymanifest kon niet gelezen worden; volledige upload volgt. ${message}`,
    );
    return null;
  }
}

function uploadRank(filePath: string): number {
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

function sortUploads(paths: string[]): string[] {
  return [...paths].sort((left, right) => {
    const rankDifference = uploadRank(left) - uploadRank(right);
    return rankDifference === 0 ? left.localeCompare(right) : rankDifference;
  });
}

export function createDeployPlan(
  localManifest: DeployManifest,
  remoteManifest: DeployManifest | null,
  options: DeployPlanOptions = {},
): DeployPlan {
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

function quoteLftp(value: string): string {
  return `"${value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("$", "\\$")
    .replaceAll("`", "\\`")}"`;
}

function normalizeRemoteDir(remoteDir: string): string {
  if (!remoteDir || remoteDir === "/" || remoteDir === ".") {
    throw new Error(`Onveilige remote webroot: ${remoteDir}`);
  }
  return remoteDir.replace(/\/+$/u, "");
}

function localDistPath(distPrefix: string, filePath: string): string {
  return `./${posixPath.join(distPrefix.replace(/^\.?\//u, ""), filePath)}`;
}

function uploadCommand(distPrefix: string, filePath: string): string {
  const remoteDirectory = posixPath.dirname(filePath);
  return `put -O ${quoteLftp(remoteDirectory)} ${quoteLftp(
    localDistPath(distPrefix, filePath),
  )}`;
}

export function renderLftpCommands(
  plan: DeployPlan,
  options: RenderLftpOptions,
): string {
  const remoteDir = normalizeRemoteDir(options.remoteDir);
  const distPrefix = options.distPrefix ?? "dist";
  const localManifestPath =
    options.localManifestPath ?? `.deploy/${DEPLOY_MANIFEST_FILE}`;
  const commands = [
    "set cmd:fail-exit yes",
    "set net:max-retries 3",
    "set net:timeout 30",
    "set sftp:auto-confirm yes",
    `cd ${quoteLftp(remoteDir)}`,
  ];

  const directories = new Set<string>();
  for (const filePath of plan.upload) {
    const directory = posixPath.dirname(filePath);
    if (directory !== ".") {
      directories.add(directory);
    }
  }

  const sortedDirectories = [...directories].sort((left, right) => {
    const depthDifference = left.split("/").length - right.split("/").length;
    return depthDifference === 0 ? left.localeCompare(right) : depthDifference;
  });

  if (sortedDirectories.length > 0) {
    // TransIP SFTP geeft soms een generieke Failure wanneer een map al bestaat.
    // We negeren mkdir-fouten hier bewust; de daaropvolgende uploads blijven
    // fail-fast en bewijzen of de doelmap echt bruikbaar is.
    commands.push("set cmd:fail-exit no");
    for (const directory of sortedDirectories) {
      commands.push(`mkdir -p ${quoteLftp(directory)}`);
    }
    commands.push("set cmd:fail-exit yes");
  }

  for (const filePath of plan.upload) {
    commands.push(uploadCommand(distPrefix, filePath));
  }

  for (const filePath of plan.delete) {
    commands.push(`rm -f ${quoteLftp(filePath)}`);
  }

  commands.push(
    `put -O ${quoteLftp(".")} ${quoteLftp(localManifestPath)}`,
    "bye",
  );

  return `${commands.join("\n")}\n`;
}

function renderSummary(plan: DeployPlan): string {
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
    console.log(`Gebruik: node src/scripts/sftp-manifest-deploy.ts \\
  --dist dist \\
  --remote-manifest .deploy/remote-manifest.json \\
  --output-dir .deploy \\
  --remote-dir "$SFTP_REMOTE_DIR" [--full]`);
    return;
  }

  const distDir = stringArg(args, "dist", "dist") ?? "dist";
  const remoteManifestPath = stringArg(args, "remote-manifest");
  const outputDir = stringArg(args, "output-dir", ".deploy") ?? ".deploy";
  const remoteDir = stringArg(args, "remote-dir");
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
