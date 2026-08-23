import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("..", import.meta.url);
const dist = new URL("./dist/", root);
const packageJson = JSON.parse(await readFile(new URL("./package.json", root)));
const release =
  process.env.SENTRY_RELEASE?.trim() || `scvmrack@${packageJson.version}`;
const monitoringEnabled = Boolean(process.env.VITE_GLITCHTIP_DSN);
const uploadVariables = [
  process.env.SENTRY_AUTH_TOKEN,
  process.env.SENTRY_ORG,
  process.env.SENTRY_PROJECT,
];
const uploadConfigured = uploadVariables.every(Boolean);

if (monitoringEnabled && !uploadConfigured) {
  throw new Error(
    "Frontend monitoring requires SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT so production traces can be source mapped.",
  );
}

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(target) : [target];
    }),
  );
  return files.flat();
}

const files = await filesBelow(fileURLToPath(dist));
const publicSourceMaps = files.filter((file) => file.endsWith(".map"));

if (publicSourceMaps.length > 0) {
  throw new Error(
    `Source maps remain in the public artifact: ${publicSourceMaps.join(", ")}`,
  );
}

if (monitoringEnabled) {
  const javascript = files.filter((file) => file.endsWith(".js"));
  const bundles = await Promise.all(
    javascript.map((file) => readFile(file, "utf8")),
  );

  if (!bundles.some((bundle) => bundle.includes(release))) {
    throw new Error(
      `Release ${release} is not embedded in the frontend bundle.`,
    );
  }

  if (!bundles.some((bundle) => bundle.includes("sentry-dbid-"))) {
    throw new Error("No Sentry debug ID was found in the frontend bundle.");
  }
}

console.log(
  `Monitoring artifact verified: release=${release}, sourceMapsPublic=0, upload=${uploadConfigured ? "configured" : "disabled"}`,
);
