import { GoogleSpreadsheet } from 'google-spreadsheet';
import {TokenDetails} from './detailsUpdated';

import fs from 'fs';

function uniqueTokens(details: TokenDetails[]) {
  return [...new Set(details)];
}

// https://www.npmjs.com/package/google-spreadsheet
async function uploadTokens(
  network: string,
  deploys: TokenDetails[],
  credentialsFile: string = './credentials.json',
) {
  const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
  // Production Spreadsheet ID: 1RooLLPTtvFaiiiuJH381fcRRgGTajv7w973xUThy5-4
  // Development Spreadsheet ID: 1AApo2bkGdCRN2w6CJYRF_rIkEnrIt1Ab4C_YZ_FnSn8
  const doc = new GoogleSpreadsheet(
    '1AApo2bkGdCRN2w6CJYRF_rIkEnrIt1Ab4C_YZ_FnSn8',
  );
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();

  const uniques = uniqueTokens(deploys);

  let sheet;
  if (doc.sheetsByTitle.hasOwnProperty(network)) {
    sheet = doc.sheetsByTitle[network];
  } else {
    sheet = await doc.addSheet({
      title: network,
      headerValues: ['name', 'symbol', 'decimals', 'address', 'id', 'domain'],
    });
  }

  let rows = await sheet.getRows();

  for (const token of uniques) {
    const matchedRow = rows.findIndex(
      (element) => element.address === token.address,
    );
    if (matchedRow != -1) {
      let row = rows[matchedRow];
      row.name = token.name ?? 'undefined';
      row.symbol = token.symbol ?? 'undefined';
      row.decimals = token.decimals ?? 'undefined';
      row.save();
    } else {
      await sheet.addRow({
        name: token.name ?? 'undefined',
        symbol: token.symbol ?? 'undefined',
        decimals: token.decimals ?? 'undefined',
        address: token.address,
        id: token.id,
        domain: token.domain,
      });
    }
  }
}

export { uploadTokens };
