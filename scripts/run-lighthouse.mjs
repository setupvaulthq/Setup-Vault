/**
 * Lighthouse + chrome-launcher on Windows mishandles non-ASCII project paths (e.g. "İnternet Sayfası"),
 * which shows up as mangled paths (Ýnternet Sayfasý) and EPERM on rmSync.
 * Use an ASCII-only temp directory outside the repo — %LOCALAPPDATA%\SetupVaultLighthouse on Windows.
 *
 * When chrome-launcher creates a random temp profile it tries to rmSync it after kill(); on Windows that
 * often raises EPERM (handles still open). Passing an explicit userDataDir skips that cleanup.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch as launchChrome } from "chrome-launcher";
import lighthouse from "lighthouse";
import { saveResults } from "lighthouse/cli/run.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const tmpDir =
  process.platform === "win32"
    ? path.join(process.env.LOCALAPPDATA || os.homedir(), "SetupVaultLighthouse")
    : path.join(os.tmpdir(), "setup-vault-lighthouse");

const userDataDir = path.join(tmpDir, "chrome-profile");
const reportPath = path.join(root, "lighthouse-report.json");

fs.mkdirSync(userDataDir, { recursive: true });

const url = "https://setupvaulthq.com/";
const flags = {
  logLevel: "silent",
  onlyCategories: ["performance", "accessibility", "seo"],
  output: ["json"],
  outputPath: reportPath,
  channel: "cli",
};

let chrome;
try {
  chrome = await launchChrome({
    userDataDir,
    chromeFlags: ["--headless=new"],
    logLevel: "silent",
  });
  flags.port = chrome.port;

  const runnerResult = await lighthouse(url, flags);
  if (runnerResult) {
    await saveResults(runnerResult, flags);
  }

  if (runnerResult?.lhr.runtimeError) {
    const { runtimeError } = runnerResult.lhr;
    console.error("Runtime error encountered:", runtimeError.message);
    process.exit(1);
  }
} catch (err) {
  console.error("Runtime error encountered:", err.friendlyMessage || err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
} finally {
  chrome?.kill();
}
