import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  createDeployManifest,
  createDeployPlan,
  renderLftpCommands,
} from "../src/scripts/sftp-manifest-deploy.mjs";

let workspace;

async function manifestFor(files) {
  await rm(join(workspace, "dist"), { recursive: true, force: true });
  for (const [filePath, contents] of Object.entries(files)) {
    const fullPath = join(workspace, "dist", filePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, contents);
  }
  return createDeployManifest(join(workspace, "dist"), {
    generatedAt: "2026-07-04T00:00:00.000Z",
  });
}

describe("SFTP manifestdeploy", () => {
  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), "delta-deploy-"));
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it("uploadt alles bij een eerste deploy zonder remote manifest", async () => {
    const local = await manifestFor({
      ".htaccess": "ErrorDocument 404 /404.html\n",
      "assets/site.css": "body{color:red}",
      "index.html": "<h1>Project DELTA</h1>",
    });

    const plan = createDeployPlan(local, null);

    assert.deepEqual(plan.delete, []);
    assert.deepEqual(plan.unchanged, []);
    assert.deepEqual(plan.upload, [
      "assets/site.css",
      ".htaccess",
      "index.html",
    ]);
    assert.equal(plan.summary.uploadCount, 3);
  });

  it("uploadt alleen gewijzigde HTML wanneer assets gelijk blijven", async () => {
    const remote = await manifestFor({
      ".htaccess": "ErrorDocument 404 /404.html\n",
      "assets/site.css": "body{color:red}",
      "index.html": "<h1>Oud</h1>",
    });
    const local = await manifestFor({
      ".htaccess": "ErrorDocument 404 /404.html\n",
      "assets/site.css": "body{color:red}",
      "index.html": "<h1>Nieuw</h1>",
    });

    const plan = createDeployPlan(local, remote);

    assert.deepEqual(plan.upload, ["index.html"]);
    assert.deepEqual(plan.delete, []);
    assert.deepEqual(plan.unchanged, [".htaccess", "assets/site.css"]);
  });

  it("zet assets voor HTML in het deployplan", async () => {
    const remote = await manifestFor({
      "assets/site.css": "body{color:red}",
      "index.html": "<link rel='stylesheet' href='/assets/site.css'>",
    });
    const local = await manifestFor({
      "assets/site.css": "body{color:blue}",
      "index.html": "<link rel='stylesheet' href='/assets/site.css'>nieuw",
    });

    const plan = createDeployPlan(local, remote);

    assert.deepEqual(plan.upload, ["assets/site.css", "index.html"]);
  });

  it("verwijdert alleen bestanden uit het vorige manifest", async () => {
    const remote = await manifestFor({
      "assets/oud.svg": "<svg></svg>",
      "index.html": "<h1>Oud</h1>",
    });
    const local = await manifestFor({
      "index.html": "<h1>Oud</h1>",
    });

    const plan = createDeployPlan(local, remote);

    assert.deepEqual(plan.upload, []);
    assert.deepEqual(plan.delete, ["assets/oud.svg"]);
    assert.deepEqual(plan.unchanged, ["index.html"]);
  });

  it("forceert alle uploads bij een full deploy", async () => {
    const remote = await manifestFor({
      "assets/oud.svg": "<svg></svg>",
      "index.html": "<h1>Gelijk</h1>",
    });
    const local = await manifestFor({
      "index.html": "<h1>Gelijk</h1>",
    });

    const plan = createDeployPlan(local, remote, { fullDeploy: true });

    assert.deepEqual(plan.upload, ["index.html"]);
    assert.deepEqual(plan.delete, ["assets/oud.svg"]);
    assert.deepEqual(plan.unchanged, []);
  });

  it("rendert gerichte lftp-commando's zonder mirror-delete", async () => {
    const local = await manifestFor({
      ".htaccess": "ErrorDocument 404 /404.html\n",
      "assets/site.css": "body{color:red}",
      "index.html": "<h1>Project DELTA</h1>",
    });
    const plan = createDeployPlan(local, null);

    const commands = renderLftpCommands(plan, {
      remoteDir: "/domains/projectdelta.nl/public_html",
      distPrefix: "dist",
      localManifestPath: ".deploy/.projectdelta-deploy-manifest.json",
    });

    assert.match(commands, /put -O .*assets/);
    assert.match(commands, /put -O .*index\.html/);
    assert.match(commands, /put -O .*\.projectdelta-deploy-manifest\.json/);
    assert.doesNotMatch(commands, /mirror --reverse/);
    assert.doesNotMatch(commands, /--delete/);
  });
});
