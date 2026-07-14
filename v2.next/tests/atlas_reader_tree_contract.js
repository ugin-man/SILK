const assert = require('assert');
const fs = require('fs');
const path = require('path');

const adapterPath = path.join(__dirname, '..', 'src', 'host-adapter.js');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const integrationCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'integration.css'), 'utf8');

assert.match(
  adapter,
  /atlasRailReaderPanel[\s\S]*addEventListener\(["']click["'][\s\S]*data-reader-collection/,
  'the shared Reader rail must handle category clicks after the category tree is moved'
);

assert.match(
  adapter,
  /reader\.selectCollection\(category\.dataset\.readerCollection\)/,
  'the shared Reader rail must route category selection through SILK_READER.selectCollection'
);

assert.match(
  integrationCss,
  /\.silk-app\[data-mode=["']connections["']\]\s+\.connections-toolbar\s*\{[^}]*left:\s*calc\(var\(--rail\)\s*\+\s*18px\)[^}]*width:\s*auto/s,
  'the ATLAS toolbar must begin to the right of the shared left rail'
);

console.log('atlas_reader_tree_contract: ok');
