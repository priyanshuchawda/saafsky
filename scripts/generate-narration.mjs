import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const [, , textPath, outputPath] = process.argv;
if (!textPath || !outputPath) {
  throw new Error(
    "Usage: node --env-file=.env.local scripts/generate-narration.mjs <text-file> <output.mp3>",
  );
}

const text = (await readFile(textPath, "utf8")).trim();
if (!text || text.length > 3000) {
  throw new Error("Narration must contain between 1 and 3000 characters.");
}

const client = new ElevenLabsClient();
const audio = await client.textToSpeech.convert(
  process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
  {
    text,
    modelId: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5",
  },
);
await pipeline(Readable.fromWeb(audio), createWriteStream(outputPath));
console.log(`Narration saved to ${outputPath}`);
