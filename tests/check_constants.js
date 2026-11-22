const fs = require('fs');
const path = require('path');

const langs = require('../src/constants/languages.js');
console.log('Languages keys:', Object.keys(langs.LANGUAGES || {}));
