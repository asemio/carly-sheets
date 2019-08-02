const fs = require('fs')
const path = require('path')
const os = require('os')
const readline = require('readline');
const { google } = require('googleapis');
const authorizeOAuth2Client = require('./authorizeOAuth2Client');
const yargs = require('yargs');
const promptForInputLine = require('./promptForInputLine');
const sheetsApi = require('./sheetsApi');
const random = require('random');

const argv = yargs
  .scriptName('carly-sheets')
  .usage('$0 [args]')
  .alias('sheet', 'sheetId')
  .alias('est', 'estimatesRange')
  .alias('stddev', 'standardDeviationsRange')
  .argv;

async function runProgram() {
  const auth = await authorizeOAuth2Client();

  while(argv.sheet == null) {
    const prompt = `Please specify the Google Sheet ID
\t(hint: you can also specify this with something like 'carly-sheets --sheet abc4veasdfv4255'
Sheet ID: `;
    argv.sheet = await promptForInputLine(prompt);
  }

  while(argv.est == null) {
    const prompt = `Please specify the range of cells with your estimates
\t(hint: you can also specify this with something like 'carly-sheets --est \"Sheet1!a2:a74\"'
Range of cells containing estimates: `;
    argv.est = await promptForInputLine(prompt);
  }

  while(argv.stddev == null) {
    console.log("Please specify the range of cells containing standard deviation values");
    console.log("\t(hint: you can also specify this with something like 'carly-sheets --stddev \"Sheet1!c2:c74\")'");
    argv.stddev = await promptForInputLine('Range of cells containing standard deviations: ');
  }

  await runSimulations(auth);
}

async function runSimulations(auth) {
  const sheets = google.sheets({version: 'v4', auth});

  const sheetObjects = await sheetsApi.getSheetsAsync(sheets, argv.sheet);

  const oldSheet = sheetObjects.find(x => x.properties.title === 'Simulations');

  if(oldSheet != null) {
    console.log("Found sheet named 'Simulations', deleting...");
    await sheetsApi.deleteSheetAsync(sheets, argv.sheet, oldSheet.properties.sheetId);
  }

  const targetSheet = await sheetsApi.createSheetAsync(sheets, argv.sheet, 'Simulations');

  const estimateValues = (await sheetsApi.getCellsAsync(sheets, argv.sheet, argv.est))
    .map(x => x[0]);
  const stdDevValues = (await sheetsApi.getCellsAsync(sheets, argv.sheet, argv.stddev))
    .map(x => x[0]);


  if(estimateValues.length !== stdDevValues.length) {
    console.log(`Ranges '${argv.est}' and '${argv.stddev}' should contain the same number of rows`);
    return;
  }

  console.log("Generating simulations...");

  const outputRows = estimateValues.map((estimate, idx) => {
    const stdDev = stdDevValues[idx] / estimate;
    const distribution = random.logNormal(0, stdDev);

    return [...Array(1000)].map(() => estimate * distribution());
  });

  console.log("Writing data...");

  await sheetsApi.writeCellsAsync(sheets, argv.sheet, 'Simulations', outputRows);

  console.log("Done!");
}

runProgram().catch(e => {
  console.log(e);
});

