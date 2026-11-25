import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const chunkRoot = join(repoRoot, ".next", "static", "chunks");
const budgetBytes = 300 * 1024;

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const filePath = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(filePath) : [filePath];
    }),
  );
  return nested.flat();
}

let files;
try {
  files = (await listFiles(chunkRoot)).filter((file) => file.endsWith(".js"));
} catch {
  throw new Error(
    "Production client assets are missing. Run npm run build first.",
  );
}

if (files.length === 0) {
  throw new Error("No production client JavaScript assets were found.");
}

let rawBytes = 0;
let compressedBytes = 0;
const assetSizes = [];
for (const file of files) {
  const contents = await readFile(file);
  const compressedSize = gzipSync(contents).byteLength;
  rawBytes += contents.byteLength;
  compressedBytes += compressedSize;
  assetSizes.push({ file: relative(chunkRoot, file), size: compressedSize });
}

const kibibytes = (bytes) => (bytes / 1024).toFixed(1);
console.log(
  `Client JavaScript: ${files.length} assets, ${kibibytes(rawBytes)} KiB raw, ${kibibytes(compressedBytes)} KiB gzip (300 KiB gzip budget).`,
);
console.log(
  `Largest assets: ${assetSizes
    .sort((left, right) => right.size - left.size)
    .slice(0, 3)
    .map((asset) => `${asset.file} ${kibibytes(asset.size)} KiB`)
    .join(", ")}`,
);

if (compressedBytes > budgetBytes) {
  throw new Error(
    "Production client JavaScript exceeds its compressed-size budget.",
  );
}
