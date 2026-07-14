'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const next = path.resolve(__dirname, '..');
const root = path.resolve(next, '..');
const hostPath = path.join(next, 'src', 'plain-host.html');
const releasePath = path.join(next, 'SILK-V2.html');
const compatibilityPath = path.join(next, 'SILK-V2-NEXT.html');
const buildPath = path.join(next, 'scripts', 'build_v2_next.js');
const preserved = new Map([
  [hostPath, fs.readFileSync(hostPath)],
  [releasePath, fs.readFileSync(releasePath)],
  [compatibilityPath, fs.readFileSync(compatibilityPath)]
]);

try {
  const crlfHost = preserved.get(hostPath).toString('utf8').replace(/\r?\n/g, '\r\n');
  fs.writeFileSync(hostPath, crlfHost, 'utf8');

  const result = spawnSync(process.execPath, [buildPath], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  const release = fs.readFileSync(releasePath, 'utf8');
  const compatibility = fs.readFileSync(compatibilityPath, 'utf8');
  assert.doesNotMatch(release, /\r\n/, 'release output must use LF');
  assert.strictEqual(compatibility, release, 'compatibility output must be byte-identical');
  console.log('cross_platform_build_contract: ok');
} finally {
  for (const [file, content] of preserved) fs.writeFileSync(file, content);
}
