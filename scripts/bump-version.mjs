/**
 * Bump Obsidian theme version across manifest.json, package.json, and versions.json.
 *
 * Usage: node scripts/bump-version.mjs [patch|minor|major]
 * Default: patch
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kind = (process.argv[2] || "patch").toLowerCase();

if (!["patch", "minor", "major"].includes(kind)) {
  console.error(`Unknown bump type "${kind}". Use patch, minor, or major.`);
  process.exit(1);
}

function bumpSemver(version, type) {
  const parts = String(version).split(".").map((n) => Number.parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid semver: ${version}`);
  }
  let [major, minor, patch] = parts;
  if (type === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`);
}

const manifest = readJson("manifest.json");
const pkg = readJson("package.json");
const versions = readJson("versions.json");

const previous = manifest.version;
const next = bumpSemver(previous, kind);
const minAppVersion = manifest.minAppVersion || "1.8.0";

manifest.version = next;
pkg.version = next;
versions[next] = minAppVersion;

writeJson("manifest.json", manifest);
writeJson("package.json", pkg);
writeJson("versions.json", versions);

console.log(`Bumped ${previous} → ${next} (${kind})`);
console.log("Updated: manifest.json, package.json, versions.json");
console.log("Next: commit, push to master — CI publishes the GitHub Release.");
