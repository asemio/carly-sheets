function batchRequest(spreadsheetId, request) {
  return {
      spreadsheetId,
      resource: {
        requests: [request]
      }
    };
}

function getSheetsAsync(sheets, spreadsheetId) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.get({
      spreadsheetId
    }, (err, res) => {
      if(err) return reject(err);

      resolve(res.data.sheets);
    })
  );
}

function deleteSheetAsync(sheets, spreadsheetId, sheetId) {
  const request = batchRequest(spreadsheetId, {
    deleteSheet: {
      sheetId
    }
  });
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.batchUpdate(request, (err, res) => {
      if(err) return reject(err);

      resolve();
    })
  );
}

function createSheetAsync(sheets, spreadsheetId, title) {
  const request = batchRequest(spreadsheetId, {
    addSheet: {
      properties: { title }
    }
  });
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.batchUpdate(request, (err, res) => {
      if(err) return reject(err);

      resolve(res.data.replies[0].properties);
    })
  );
}

function getCellsAsync(sheets, spreadsheetId, range) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    }, (err, res) => {
      if (err) return reject(err);
      resolve(res.data.values);
    })
  );
}

async function writeCellsAsync(sheets, spreadsheetId, sheetName, columns) {
  const rowCount = columns[0].length;
  const batchSize = 10;
  let rowIdx = 0;

  while(rowIdx < rowCount) {
    const localBatchSize = Math.min(rowCount - rowIdx, batchSize);
    const batch = [...Array(localBatchSize)]
      .map((x, idx) => columns.map(x => x[rowIdx + idx]));
    const range = `${sheetName}!A${rowIdx + 1}`;

    await new Promise((resolve, reject) =>
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        resource: {
          majorDimension: "ROWS",
          values: batch
        }
      }, (err, res) => {
        if (err) return reject(err);
        resolve();
      })
    );

    rowIdx += batchSize;
  }
}

module.exports = {
  getSheetsAsync,
  deleteSheetAsync,
  createSheetAsync,
  getCellsAsync,
  writeCellsAsync
};
