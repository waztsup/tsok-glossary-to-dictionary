const fs = require('fs');
const fetch = require('node-fetch');
const { parse } = require('node-html-parser');

const outputFolder = './output';
const initialFileName = 'tsok-disctionary';
const fileExtension = 'txt';
let fileVersion;
// Url goes here
const webPage = 'https://mlwangbooks.com/glossary-main/';

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

function clean(string) {
    return string.replace(/&nbsp;/g, ' ').trim();
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
        let definitions = Array.from(root.querySelectorAll('.entry-content.clearfix p')).slice(1, -1);
        const dictionary = [];
        definitions.forEach(definition => {
            const key = clean(definition.querySelector('strong').innerText);
            const value = clean(definition.innerText).substr(definition.innerText.indexOf(key) + key.length).trim();
            dictionary.push({
                key, value
            });
        });
        saveData(JSON.stringify(dictionary));
    });