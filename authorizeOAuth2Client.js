const fs = require('fs')
const path = require('path')
const os = require('os')
const readline = require('readline');
const { google } = require('googleapis');
const promptForInputLine = require('./promptForInputLine');

const oauthClientCredentialsPath = path.join(os.homedir(), 'carly-sheets-credentials.json');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(os.homedir(), 'carly-sheets-user-token.json');

async function getAuthClientAsync() {
  const credentials = await checkAndPromptForClientCredentials();

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  await checkAndPromptForUserToken(oAuth2Client);

  return oAuth2Client;
}

async function checkAndPromptForClientCredentials() {
  let clientCredentialsJson; 
  while((clientCredentialsJson = await tryReadAsJson(oauthClientCredentialsPath)) == null) {
    console.log("First-time run: OAuth2 client credentials needed");
    console.log("Please visit https://console.developers.google.com/apis/credentials?project=carly-sheets&organizationId=1071176536768 and look for the row named 'carly-sheets CLI'.");
    console.log(`Click the 'Download JSON' button at the far right, and save this file at ${oauthClientCredentialsPath}. YOU ONLY HAVE TO DO THIS ONCE.`);
    await promptForInputLine("When you've finished this, press enter.");
  }

  return clientCredentialsJson;
}

async function tryReadAsJson(filePath) {
  if(!fs.existsSync(filePath)) {
    return null;
  }

  var fileContentsPromise = new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, content) => {
      if(err) {
        reject(err);
      }
      else {
        resolve(content);
      }
    });
  });

  const fileContents = await fileContentsPromise.then(null, () => null);

  if(fileContents == null) {
    return null;
  }

  return JSON.parse(fileContents);
}

async function checkAndPromptForUserToken(oAuth2Client) {
  let tokenJson; 

  while((tokenJson = await tryReadAsJson(TOKEN_PATH)) == null) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    console.log('NOTE: you will only need to do this once every few days');
    const code = await promptForInputLine('Enter the code from that page here: ');
    const token = await new Promise((resolve, reject) => {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject(err);
        resolve(token);
      });
    });
    
    // Store the token to disk for later program executions
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  }

  oAuth2Client.setCredentials(tokenJson);
}

module.exports = getAuthClientAsync;
