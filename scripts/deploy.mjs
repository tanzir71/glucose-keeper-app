// Publish dist/ to the gh-pages branch, which GitHub Pages serves as-is. No CI needed.
// Usage: npm run deploy   (builds first, then runs this)
import { execFileSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const git = (args, cwd = root) => execFileSync("git", args, { cwd, encoding: "utf-8" }).trim();

if (!existsSync(resolve(dist, "index.html")) || !existsSync(resolve(dist, "app/index.html"))) {
  console.error("[deploy] dist/ is missing — run npm run build first.");
  process.exit(1);
}

const remote = git(["remote", "get-url", "origin"]);
const sha = git(["rev-parse", "--short", "HEAD"]);
const name = git(["config", "user.name"]);
const email = git(["config", "user.email"]);

// GitHub Pages runs Jekyll by default, which would skip some files; turn it off.
writeFileSync(resolve(dist, ".nojekyll"), "");

// A fresh one-commit history each time: gh-pages only ever holds the latest build.
rmSync(resolve(dist, ".git"), { recursive: true, force: true });
git(["init", "-q", "-b", "gh-pages"], dist);
git(["add", "-A"], dist);
git(["-c", `user.name=${name}`, "-c", `user.email=${email}`, "commit", "-q", "-m", `Deploy ${sha}`], dist);
git(["push", "-q", "--force", remote, "gh-pages"], dist);
rmSync(resolve(dist, ".git"), { recursive: true, force: true });

console.log(`[deploy] Published ${sha} to gh-pages → https://tanzir71.github.io/glucose-keeper-app/`);
