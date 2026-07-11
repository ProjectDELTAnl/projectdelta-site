import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("the static build contains the Apache cache policy", async () => {
  const policy = await readFile("dist/.htaccess", "utf8");

  expect(policy).toContain(
    'Header always set Cache-Control "public, max-age=0, must-revalidate"',
  );
  expect(policy).toContain(
    'Header set Cache-Control "public, max-age=604800, stale-while-revalidate=86400"',
  );
  expect(policy).toContain("m#^/_astro/#");
  expect(policy).toContain(
    'Header set Cache-Control "public, max-age=31536000, immutable"',
  );
});
