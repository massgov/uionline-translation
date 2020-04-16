const fetch = require('node-fetch');
const fs = require('fs');
var browserify = require('browserify')

require('dotenv').config()

/**
 * ID of the actual Google Sheet from the URL
 * https://docs.google.com/spreadsheets/d/152Q0BrbNYdxL7ZJiWGaXUI3qjtPlT9dAl52wkvwmmM0/
 */
const sheetsId = process.env.SHEETS_ID;

/**
 * API Key associated with luke@lastcallmedia.com google account, just for this purpose
 */
const sheetsApiKey = process.env.SHEETS_API_KEY;

/**
 * Sheets API Base Url used to retrieve the JSON
 * https://sheets.googleapis.com/v4/spreadsheets/[sheetsId]/values/[sheetsPageName]?key=[sheetsApiKey]
 */
const sheetsApiUrl = 'https://sheets.googleapis.com/v4/spreadsheets/';

/**
 * Sheet page names for each translation
 */
const sheetsPageNames = new Map([
    ['es', 'Spanish'],
    ['pt', 'Portuguese'],
    ['zh-CN', 'Chinese'],
    ['ht', 'HaitianCreole'],
    ['vi', 'Vietnamese']
]);

sheetsPageNames.forEach((pageName, languageCode) => {
    let sheetsPageApiUrl = `${sheetsApiUrl}${sheetsId}/values/${pageName}?key=${sheetsApiKey}`;

    fetch(sheetsPageApiUrl)
        .then(res => res.json())
        .then(body => {
            let languageMap = new Map;
            body.values.forEach(value => {
                // no point translating to the same thing, let's save some space
                if (value[1] !== undefined && value[0] != value[1]) {
                    languageMap.set(value[0], value[1]);
                }
            });

            let data = JSON.stringify([...languageMap], null, 2);
            fs.writeFileSync(`./dist/dictionaries/${languageCode}.json`, data);
        });
});
