import type { SpreadsheetXmlFile } from './spreadsheet-xml.writer.js';

interface CentralDirectoryEntry {
  path: string;
  crc: number;
  size: number;
  offset: number;
}

export function createStoredZip(files: readonly SpreadsheetXmlFile[]): Buffer {
  const entries: CentralDirectoryEntry[] = [];
  const localParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.path, 'utf8');
    const content = Buffer.from(file.content, 'utf8');
    const crc = crc32(content);
    const header = localHeader(name, content, crc);
    entries.push({ path: file.path, crc, size: content.byteLength, offset });
    localParts.push(header, content);
    offset += header.byteLength + content.byteLength;
  }

  const centralParts = entries.map((entry) => centralHeader(entry));
  const centralSize = centralParts.reduce((total, part) => total + part.byteLength, 0);
  return Buffer.concat([
    ...localParts,
    ...centralParts,
    endOfCentralDirectory(entries.length, centralSize, offset),
  ]);
}

function localHeader(name: Buffer, content: Buffer, crc: number): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(content.byteLength, 18);
  header.writeUInt32LE(content.byteLength, 22);
  header.writeUInt16LE(name.byteLength, 26);
  return Buffer.concat([header, name]);
}

function centralHeader(entry: CentralDirectoryEntry): Buffer {
  const name = Buffer.from(entry.path, 'utf8');
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.size, 20);
  header.writeUInt32LE(entry.size, 24);
  header.writeUInt16LE(name.byteLength, 28);
  header.writeUInt32LE(entry.offset, 42);
  return Buffer.concat([header, name]);
}

function endOfCentralDirectory(
  entryCount: number,
  centralSize: number,
  centralOffset: number,
): Buffer {
  const footer = Buffer.alloc(22);
  footer.writeUInt32LE(0x06054b50, 0);
  footer.writeUInt16LE(entryCount, 8);
  footer.writeUInt16LE(entryCount, 10);
  footer.writeUInt32LE(centralSize, 12);
  footer.writeUInt32LE(centralOffset, 16);
  return footer;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ crc32TableEntry((crc ^ byte) & 0xff);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function crc32TableEntry(index: number): number {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
}
