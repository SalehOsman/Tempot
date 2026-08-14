import type { DocumentGenerationInput, DocumentRow } from '../document-engine.types.js';

export interface SpreadsheetXmlFile {
  path: string;
  content: string;
}

export function createSpreadsheetXmlFiles(
  input: DocumentGenerationInput,
): readonly SpreadsheetXmlFile[] {
  return [
    {
      path: '[Content_Types].xml',
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>',
    },
    {
      path: '_rels/.rels',
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    },
    {
      path: 'xl/workbook.xml',
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="document_engine.export.sheet" sheetId="1" r:id="rId1"/></sheets>' +
        '</workbook>',
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '</Relationships>',
    },
    {
      path: 'xl/worksheets/sheet1.xml',
      content: createWorksheet(input),
    },
  ];
}

function createWorksheet(input: DocumentGenerationInput): string {
  const rows = [
    createRow(
      1,
      input.template.fields.map((field) => field.labelKey),
    ),
    ...input.request.payload.rows.map((row, index) => createRow(index + 2, rowValues(input, row))),
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetViews><sheetView workbookViewId="0" rightToLeft="${input.template.layoutDirection === 'rtl' ? '1' : '0'}"/></sheetViews>` +
    `<sheetData>${rows.join('')}</sheetData>` +
    '</worksheet>'
  );
}

function rowValues(input: DocumentGenerationInput, row: DocumentRow): readonly string[] {
  return input.template.fields.map((field) => String(row[field.key] ?? ''));
}

function createRow(index: number, values: readonly string[]): string {
  const cells = values
    .map((value, columnIndex) => {
      const cellRef = `${columnName(columnIndex)}${index}`;
      return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    })
    .join('');
  return `<row r="${index}">${cells}</row>`;
}

function columnName(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
