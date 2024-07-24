export function parseComments(lines: string[]): { creationDateClean: string } {
  const comments: string[] = [];
  while (lines[0].startsWith('#')) {
    comments.push(lines.shift()!);
  }

  const creationDateLine = comments.find((c) => c?.startsWith('#! date'));
  const creationDateText = creationDateLine?.split('=')[1]?.trim();
  if (!creationDateText) {
    throw new Error(
      `Could not find creation date in comments: ${creationDateLine}`,
    );
  }
  const creationDate = new Date(creationDateText);
  const creationDateClean = creationDate.toISOString().split('T')[0];

  return { creationDateClean };
}
