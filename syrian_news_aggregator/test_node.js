const Database = require('better-sqlite3');
const db = new Database(':memory:');
console.log('better-sqlite3 loads successfully!');

const cheerio = require('cheerio');
const $ = cheerio.load('<h1 class="title">Hello</h1>');
console.log($('.title').text() + ' cheerio works!');
