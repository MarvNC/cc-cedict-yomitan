import type { CantoReadings } from './types';

/**
 * Traditional, Simplified, Jyutping
 */
const PARSE_CANTO_REGEX = /^([^ ]+) ([^ ]+) \[[^\]]+\] {([^}]+)}$/;

export async function parseCantoReadings(
  ccCedictCantoReadingsFilePath: string
): Promise<CantoReadings> {
  const ccCedictCantoReadingsFile = Bun.file(ccCedictCantoReadingsFilePath);
  const ccCedictCantoReadingsLines = (
    await ccCedictCantoReadingsFile.text()
  ).split('\n');
  const cantoReadings: CantoReadings = {};
  for (const line of ccCedictCantoReadingsLines) {
    if (line.startsWith('#') || !line.trim()) {
      continue;
    }
    const match = line.match(PARSE_CANTO_REGEX);
    if (match) {
      const [, traditional, simplified, jyutping] = match;
      cantoReadings[traditional] = jyutping;
    }
  }

  return cantoReadings;
}
