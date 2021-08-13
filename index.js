const fs = require('fs');
const fetch = require('node-fetch');
const { parse } = require('node-html-parser');

const outputFolder = './output';
const initialFileName = 'The Wandering Inn';
const fileExtension = 'txt';
let fileVersion;
// Url goes here
const webPage = 'https://duckduckgo.com/';

function getFileNameWithExtension(fileName = initialFileName, extension = fileExtension, version = fileVersion.version) {
    return `${fileName} - v${version}.${extension}`;
}

function updateFileVersion() {
    fs.writeFile('file-version.json', JSON.stringify(fileVersion), (err) => {
        if (err) throw err;
    });
}

function saveData(data) {
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    const outputPath = `${outputFolder}/${getFileNameWithExtension()}`;
    fs.access(outputPath, fs.constants.F_OK, (err) => {
        if (err) {
            fs.writeFile(outputPath, '', (err) => {
                if (err) throw err;
                console.log(`${initialFileName} file not found. It will be created.`);
            });
        }

        fs.appendFile(outputPath, `${data}`, (err) => {
            if (err) throw err;
            console.log('Data was saved!');
            updateFileVersion();
        });
    });
}

fs.readFile('file-version.json', (err, data) => {
    if (err) fileVersion = 0;
    fileVersion = JSON.parse(data);
    fileVersion.version++;
});

fetch(webPage)
    .then(result => result.text())
    .then(body => {
        const root = parse(body);
        // Parsing/filtering goes here, if it's messy, a new function can be created
        const data = root.querySelector('title').innerText;
        saveData(data);
    });