import { Readable } from 'node:stream';
import ExcelJS from 'exceljs';
import { FLAT_COLUMNS } from './rows';

export async function buildWorkbookBuffer(rows: Record<string, string | number>[], format: 'csv' | 'xlsx'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Questions');
  sheet.columns = FLAT_COLUMNS.map((key) => ({ header: key, key, width: 18 }));
  rows.forEach((row) => sheet.addRow(row));

  if (format === 'csv') {
    const buffer = await workbook.csv.writeBuffer();
    return Buffer.from(buffer);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function parseWorkbookBuffer(buffer: Buffer, format: 'csv' | 'xlsx'): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  if (format === 'csv') {
    await workbook.csv.read(bufferToStream(buffer));
  } else {
    await workbook.xlsx.load(buffer as any);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '').trim();
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      record[header] = cell.value === null || cell.value === undefined ? '' : String(cell.value);
    });
    if (Object.values(record).some((v) => v.trim() !== '')) rows.push(record);
  });

  return rows;
}

function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer);
}
