const fs = require('fs');
const fetch = require('node-fetch');
const { parse } = require('node-html-parser');

const outputFolder = './output';
const initialFileName = 'tsok-disctionary';
const fileExtension = 'txt';
let fileVersion;
// Url goes here
const webPage = 'https://mlwangbooks.com/glossary-main/';

let dictionaryContent = '';
const dictionaryContentPlaceholder = '__DICTIONARY_CONTENT__';

function getFileNameWithExtension(fileName, type, skipVersion) {
    return `${fileName}${!skipVersion ? ` - v${fileVersion.version}` : ''}.${type}`;
}

function updateFileVersion() {
    fs.writeFile('file-version.json', JSON.stringify(fileVersion), (err) => {
        if (err) throw err;
    });
}

function saveData(data, fileName = initialFileName, type = fileExtension, skipVersion = false) {
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    const outputPath = `${outputFolder}/${getFileNameWithExtension(fileName, type, skipVersion)}`;
    fs.access(outputPath, fs.constants.F_OK, (err) => {
        fs.writeFile(outputPath, data, (err) => {
            if (err) throw err;
            console.log(`${fileName} was saved!`);
            updateFileVersion();
        });
    });
}

function clean(string) {
    return string
        .replace(/&nbsp;/g, ' ') // replace non-breakable whitespace with a whitespace
        .replace(/&#8216;|&#8217;|‘|’/g, '\'') // replace magic apostrophes with '
        .replace(/,\'/g, '\',') // fix commas in listed quoted groups ('this,' to 'this',)
        .replace(/.\'$/g, '\'.') // fix full stops at the end of definitions ('end.' to 'end'.)
        .replace(/Ms'.$/g, 'Ms.\'.') // fix broken (^) 'Ms'. to 'Ms.'.
        .trim(); // remove extra whitespaces
}

function createDictionaryBlock(word, definition) {
    return `
        <idx:entry name="default" scriptable="yes" spell="yes">
            <h5><dt><idx:orth>${word}</idx:orth></dt></h5>
            <dd>${definition}</dd>
        </idx:entry>
        <hr/>
    `
}

function saveContent(dictionaryData) {
    let content = '';
    dictionaryData.forEach(data => {
        content += createDictionaryBlock(data.word, data.definition);
    });

    const built = dictionaryContent.replace(dictionaryContentPlaceholder, content);
    saveData(built, 'content', 'html', true);
}

function parsePage() {
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
                    word: key,
                    definition: value
                });
            });
            saveData(JSON.stringify(dictionary));
            saveContent(dictionary);
        });
}

function getDefaultContent() {
    fs.readFile('./assets/default_content.html', (err, data) => {
        if (err) throw err;
        dictionaryContent = data.toString();

        parsePage();
    });
}

function getVersion() {
    fs.readFile('./file-version.json', (err, data) => {
        if (err) fileVersion = 0;
        fileVersion = JSON.parse(data);
        fileVersion.version++;

        getDefaultContent();
    });
}

getVersion();