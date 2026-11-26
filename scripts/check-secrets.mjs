import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const result = spawnSync("git", ["ls-files", "-z"], { encoding: "buffer" });
if (result.status !== 0 || !result.stdout) {
  throw new Error("Unable to enumerate tracked files for secret scanning.");
}

const files = result.stdout.toString("utf8").split("\0").filter(Boolean);
const patterns = [
  { name: "Google API key", expression: /\bAIza[\w-]{30,}\b/g },
  {
    name: "GitHub access token",
    expression: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  },
  {
    name: "Slack access token",
    expression: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
  },
  {
    name: "private key material",
    expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

const findings = files
  .filter((file) => /^\.env(?:\.|$)/i.test(file) && file !== ".env.example")
  .map((file) => `${file}: tracked environment file`);
for (const file of files) {
  const content = await readFile(file, "utf8").catch(() => "");
  for (const { name, expression } of patterns) {
    if (expression.test(content)) findings.push(`${file}: ${name}`);
    expression.lastIndex = 0;
  }
}

if (findings.length > 0) {
  process.stderr.write(
    `Potential secrets found in tracked files:\n${findings.join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Secret scan passed for ${files.length} tracked files.\n`,
  );
}
