const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Reservations';

function getReservationSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'PASTE_GOOGLE_SHEET_ID_HERE') {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!activeSpreadsheet) {
    throw new Error('Spreadsheet ID is required for standalone Apps Script deployment.');
  }

  return activeSpreadsheet;
}

function doPost(e) {
  const spreadsheet = getReservationSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Event',
      'Name',
      'Phone',
      'Quantity',
      'Ticket Price',
      'Payment Account',
      'Source',
      'Status'
    ]);
  }

  const data = e.parameter || {};

  if (data.website) {
    return ContentService.createTextOutput('OK');
  }

  sheet.appendRow([
    new Date(),
    data.event || 'Night Animal Live - Baked Paint',
    data.name || '',
    data.phone || '',
    data.quantity || '',
    data.ticket_price || '20,000KRW',
    data.payment_account || 'KB 884202-04-112365',
    data.source || 'crap.productions/bakedpaint.show',
    'NEW'
  ]);

  return ContentService.createTextOutput('OK');
}
