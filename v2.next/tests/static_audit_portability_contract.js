'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const next = path.resolve(__dirname, '..');
const audit = spawnSync(process.execPath, [path.join(next, 'scripts', 'static_audit.js')], {
  cwd: path.resolve(next, '..'),
  encoding: 'utf8'
});

assert.strictEqual(audit.status, 0, audit.stderr || audit.stdout);
const report = JSON.parse(fs.readFileSync(path.join(next, 'STATIC_AUDIT.json'), 'utf8'));
assert.strictEqual(report.candidate, 'v2.next/SILK-V2.html');
assert(!JSON.stringify(report).includes(path.resolve(next, '..')), 'audit report leaks an absolute checkout path');

const firstReport = fs.readFileSync(path.join(next, 'STATIC_AUDIT.json'), 'utf8');
const repeatedAudit = spawnSync(process.execPath, [path.join(next, 'scripts', 'static_audit.js')], {
  cwd: path.resolve(next, '..'),
  encoding: 'utf8'
});
assert.strictEqual(repeatedAudit.status, 0, repeatedAudit.stderr || repeatedAudit.stdout);
assert.strictEqual(fs.readFileSync(path.join(next, 'STATIC_AUDIT.json'), 'utf8'), firstReport, 'unchanged evidence should produce a stable audit artifact');

console.log('static_audit_portability_contract: ok');
