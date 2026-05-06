import { describe, expect, it } from 'vitest';
import { CsvImportParser, SpreadsheetImportParser } from '../../src/index.js';

describe('ImportParsers', () => {
  it('should parse CSV rows with quoted fields and source row numbers', async () => {
    const parser = new CsvImportParser();
    const csv = Buffer.from(
      'name,email,age\n"Ada, Lovelace",ada@example.test,42\nGrace,grace@example.test,39\n',
      'utf8',
    );

    const result = await parser.parse(csv);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([
      {
        rowNumber: 2,
        data: {
          name: 'Ada, Lovelace',
          email: 'ada@example.test',
          age: '42',
        },
      },
      {
        rowNumber: 3,
        data: {
          name: 'Grace',
          email: 'grace@example.test',
          age: '39',
        },
      },
    ]);
  });

  it('should parse spreadsheet rows into the same normalized row contract', async () => {
    const parser = new SpreadsheetImportParser();
    const spreadsheet = await createSpreadsheetFixture();

    const result = await parser.parse(spreadsheet);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([
      {
        rowNumber: 2,
        data: {
          name: 'Ada',
          email: 'ada@example.test',
          age: '42',
        },
      },
    ]);
  });
});

async function createSpreadsheetFixture(): Promise<Buffer> {
  return createStoredZip([
    {
      path: 'xl/worksheets/sheet1.xml',
      content:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetViews><sheetView workbookViewId="0" rightToLeft="0"/></sheetViews>' +
        '<sheetData>' +
        '<row r="1">' +
        '<c r="A1" t="inlineStr"><is><t>name</t></is></c>' +
        '<c r="B1" t="inlineStr"><is><t>email</t></is></c>' +
        '<c r="C1" t="inlineStr"><is><t>age</t></is></c>' +
        '</row>' +
        '<row r="2">' +
        '<c r="A2" t="inlineStr"><is><t>Ada</t></is></c>' +
        '<c r="B2" t="inlineStr"><is><t>ada@example.test</t></is></c>' +
        '<c r="C2" t="inlineStr"><is><t>42</t></is></c>' +
        '</row>' +
        '</sheetData>' +
        '</worksheet>',
    },
  ]);
}

function createStoredZip(files: ReadonlyArray<{ path: string; content: string }>): Buffer {
  return Buffer.concat(
    files.flatMap((file) => {
      const name = Buffer.from(file.path, 'utf8');
      const content = Buffer.from(file.content, 'utf8');
      const header = Buffer.alloc(30);
      header.writeUInt32LE(0x04034b50, 0);
      header.writeUInt16LE(20, 4);
      header.writeUInt16LE(0, 6);
      header.writeUInt16LE(0, 8);
      header.writeUInt32LE(content.byteLength, 18);
      header.writeUInt32LE(content.byteLength, 22);
      header.writeUInt16LE(name.byteLength, 26);
      return [header, name, content];
    }),
  );
}
