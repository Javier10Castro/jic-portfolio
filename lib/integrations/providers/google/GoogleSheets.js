class GoogleSheets {
  constructor(provider) {
    this.provider = provider;
  }

  async create(title, sheets = ['Sheet1']) {
    return {
      success: true,
      data: {
        spreadsheetId: `spreadsheet-${Date.now().toString(36)}`,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/spreadsheet-${Date.now().toString(36)}/edit`,
        title,
        sheets: sheets.map((s, i) => ({ sheetId: i, title: s, rowCount: 1000, columnCount: 26 })),
      },
    };
  }

  async get(spreadsheetId) {
    const sheetData = {
      rowData: [
        { values: [{ userEnteredValue: { stringValue: 'Name' } }, { userEnteredValue: { stringValue: 'Age' } }, { userEnteredValue: { stringValue: 'Email' } }] },
        { values: [{ userEnteredValue: { stringValue: 'John' } }, { userEnteredValue: { numberValue: 30 } }, { userEnteredValue: { stringValue: 'john@example.com' } }] },
        { values: [{ userEnteredValue: { stringValue: 'Jane' } }, { userEnteredValue: { numberValue: 28 } }, { userEnteredValue: { stringValue: 'jane@example.com' } }] }
      ]
    };
    return {
      success: true,
      data: {
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        title: 'My Spreadsheet',
        sheets: [
          { sheetId: 0, title: 'Sheet1', rowCount: 1000, columnCount: 26, data: [sheetData] }
        ],
        namedRanges: [],
      },
    };
  }

  async updateCell(spreadsheetId, range, value) {
    return {
      success: true,
      data: {
        spreadsheetId,
        updatedRange: range,
        updatedRows: 1,
        updatedCells: 1,
        updatedColumns: 1,
      },
    };
  }

  async getSheet(spreadsheetId, range) {
    return {
      success: true,
      data: {
        spreadsheetId,
        range,
        majorDimension: 'ROWS',
        values: [
          ['Name', 'Age', 'Email'],
          ['John', '30', 'john@example.com'],
          ['Jane', '28', 'jane@example.com'],
        ],
      },
    };
  }

  async appendRow(spreadsheetId, range, values) {
    return {
      success: true,
      data: {
        spreadsheetId,
        tableRange: range,
        updates: {
          updatedRange: 'Sheet1!A4:D4',
          updatedRows: 1,
          updatedCells: values.length,
          updatedColumns: values.length,
        },
      },
    };
  }
}

module.exports = { GoogleSheets };
