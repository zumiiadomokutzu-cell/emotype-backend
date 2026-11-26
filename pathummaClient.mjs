import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const bridge = path.join(rootDir, "pathumma-test", "pathumma_bridge.py");
const defaultPython = path.join(
  rootDir,
  ".venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
);

/**
 * Run the already-working Python SDK in a child process.
 * Does not change the Node API contract; rejects on errors so the server can
 * use the existing S-Sense-only v1 fallback.
 */
export function analyzeWithPathumma(text, { timeoutMs = 25000 } = {}) {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_EXECUTABLE || defaultPython;
    const child = spawn(python, ["-u", bridge], {
      cwd: rootDir,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(new Error("Pathumma timed out"));
    }, timeoutMs);

    child.on("error", (error) => finish(error));
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > 300_000) {
        child.kill();
        finish(new Error("Pathumma output too large"));
      }
    });
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-1000); });
    child.on("close", (code) => {
      if (settled) return;
      try {
        // The bridge writes exactly one JSON line to stdout.
        const result = JSON.parse(stdout.trim());
        if (code !== 0 || result.success !== true || !result.data) {
          throw new Error(`Pathumma bridge failed: ${result.error || code}`);
        }
        finish(null, result.data);
      } catch (error) {
        // Do not leak the prompt or raw response in a client-facing error.
        finish(new Error(`Pathumma unavailable: ${error.message}`));
      }
    });
    child.stdin.on("error", () => {}); // child might exit before input is written
    child.stdin.end(JSON.stringify({ text }));
  });
}
