#!/usr/bin/env node

/**
 * Release Script
 *
 * Usage:
 *   npm run release patch   → 1.0.0 → 1.0.1 (Bugfixes)
 *   npm run release minor   → 1.0.0 → 1.1.0 (Features)
 *   npm run release major   → 1.0.0 → 2.0.0 (Breaking Changes)
 *
 * This script:
 * 1. Bumps the version in package.json
 * 2. Updates CACHE_NAME in sw.js
 * 3. Stages both files for commit
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const bumpType = process.argv[2];

if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error("Usage: npm run release [patch|minor|major]");
  console.error("");
  console.error("  patch  → Bugfixes (1.0.0 → 1.0.1)");
  console.error("  minor  → Features (1.0.0 → 1.1.0)");
  console.error("  major  → Breaking Changes (1.0.0 → 2.0.0)");
  process.exit(1);
}

// 1. Bump version in package.json (without git commit)
console.log(`\n📦 Bumping version (${bumpType})...`);
execSync(`npm version ${bumpType} --no-git-tag-version`, { cwd: rootDir, stdio: "inherit" });

// 2. Read new version
const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));
const newVersion = packageJson.version;

// 3. Update sw.js
console.log(`\n🔄 Updating sw.js to v${newVersion}...`);
const swPath = join(rootDir, "public", "sw.js");
let swContent = readFileSync(swPath, "utf-8");

// Replace CACHE_NAME with new version
swContent = swContent.replace(
  /const CACHE_NAME = "todu-cache-v[^"]+";/,
  `const CACHE_NAME = "todu-cache-v${newVersion}";`
);

writeFileSync(swPath, swContent);

// 4. Stage files
console.log("\n📝 Staging files...");
execSync("git add package.json package-lock.json public/sw.js", { cwd: rootDir, stdio: "inherit" });

// 5. Create commit and tag
console.log(`\n✅ Creating commit and tag v${newVersion}...`);
execSync(`git commit -m "Release v${newVersion}"`, { cwd: rootDir, stdio: "inherit" });
execSync(`git tag v${newVersion}`, { cwd: rootDir, stdio: "inherit" });

console.log(`
🎉 Release v${newVersion} ready!

Next steps:
  git push && git push --tags
`);
