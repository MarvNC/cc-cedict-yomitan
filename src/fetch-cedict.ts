import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { basename, join } from 'path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ReadableStream as WebReadableStream } from 'node:stream/web';
import unzipper from 'unzipper';
import {
  CC_CANTO_FILE_NAME,
  CC_CEDICT_CANTO_READINGS_FILE_NAME,
  CC_CEDICT_FILE_NAME,
  DATA_DIR,
} from './config';

const CEDICT_URL =
  'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
const CANTO_URL = 'https://cccanto.org/cccedict-canto-readings-150923.zip';
const CCCANTO_URL = 'https://cccanto.org/cccanto-170202.zip';

async function ensureDataDir(dataDir: string) {
  await mkdir(dataDir, { recursive: true });
}

async function downloadToBuffer(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function downloadGzipToFile(url: string, destPath: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error(`No response body for ${url}`);
  }

  const decompressed = response.body.pipeThrough(new DecompressionStream('gzip'));
  await pipeline(
    Readable.fromWeb(decompressed as unknown as WebReadableStream),
    createWriteStream(destPath)
  );
}

async function extractZipEntries(
  zipBuffer: Uint8Array,
  outputDir: string,
  expectedFiles: string[]
) {
  const zip = await unzipper.Open.buffer(Buffer.from(zipBuffer));
  const expectedSet = new Set(expectedFiles);
  const found = new Set<string>();

  for (const entry of zip.files) {
    if (entry.type !== 'File') {
      continue;
    }
    const fileName = basename(entry.path);
    if (!expectedSet.has(fileName)) {
      continue;
    }
    const destPath = join(outputDir, fileName);
    await pipeline(entry.stream(), createWriteStream(destPath));
    found.add(fileName);
  }

  const missing = expectedFiles.filter((name) => !found.has(name));
  if (missing.length > 0) {
    throw new Error(`Missing files in zip: ${missing.join(', ')}`);
  }
}

async function main() {
  const dataDir = join(process.cwd(), DATA_DIR);
  await ensureDataDir(dataDir);

  console.log('Downloading CC-CEDICT...');
  const cedictPath = join(dataDir, CC_CEDICT_FILE_NAME);
  await downloadGzipToFile(CEDICT_URL, cedictPath);
  console.log(`Saved ${CC_CEDICT_FILE_NAME}.`);

  console.log('Downloading Cantonese readings...');
  const cantoZip = await downloadToBuffer(CANTO_URL);
  await extractZipEntries(cantoZip, dataDir, [CC_CEDICT_CANTO_READINGS_FILE_NAME]);
  console.log(`Extracted ${CC_CEDICT_CANTO_READINGS_FILE_NAME}.`);

  console.log('Downloading CCCanto...');
  const ccCantoZip = await downloadToBuffer(CCCANTO_URL);
  await extractZipEntries(ccCantoZip, dataDir, [CC_CANTO_FILE_NAME]);
  console.log(`Extracted ${CC_CANTO_FILE_NAME}.`);
}

main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
