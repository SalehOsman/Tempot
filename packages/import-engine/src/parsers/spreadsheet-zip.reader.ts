export interface StoredZipEntry {
  path: string;
  content: Buffer;
}

const LOCAL_FILE_HEADER = 0x04034b50;

export function readStoredZip(buffer: Buffer): readonly StoredZipEntry[] {
  const entries: StoredZipEntry[] = [];
  let offset = 0;

  while (offset + 30 <= buffer.byteLength) {
    if (buffer.readUInt32LE(offset) !== LOCAL_FILE_HEADER) break;
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const contentStart = nameStart + fileNameLength + extraLength;
    const contentEnd = contentStart + compressedSize;
    const path = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8');
    entries.push({
      path,
      content: buffer.subarray(contentStart, contentEnd),
    });
    offset = contentEnd;
  }

  return entries;
}
