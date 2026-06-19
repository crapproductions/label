const SHEET_NAME = 'Reservations';

function doPost(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Event / Item',
      'Name',
      'Email',
      'Phone',
      'Quantity',
      'Note',
      'Source'
    ]);
  }

  const data = e.parameter || {};

  if (data.website) {
    return ContentService.createTextOutput('OK');
  }

  sheet.appendRow([
    new Date(),
    data.event || '',
    data.name || '',
    data.email || '',
    data.phone || '',
    data.quantity || '',
    data.note || '',
    data.source || ''
  ]);

  return ContentService.createTextOutput('OK');
}
