'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { validateWorld } = require('../skills/silk-worldbuilder/scripts/validate_world.js');

const requiredFiles = [
  'README.md', 'README.en.md', 'CONTRIBUTING.md', 'LICENSE', 'CHANGELOG.md',
  'docs/releases/v0.1.0.md', 'examples/worlds/glass-tide/HUMAN_EVALUATION.md',
  'v2.next/RELEASE_READINESS.md', 'v2.next/BROWSER_VALIDATION.json',
  'v2.next/SILK-V2.html'
];

function checkReleaseConsistency(root) {
  const repoRoot = path.resolve(root);
  const failures = [];
  const exists = relative => fs.existsSync(path.join(repoRoot, relative));
  const read = relative => exists(relative) ? fs.readFileSync(path.join(repoRoot, relative), 'utf8') : '';

  for (const relative of requiredFiles) {
    if (!exists(relative)) failures.push(`missing required release file: ${relative}`);
  }

  if (exists('package.json')) {
    try {
      const packageJson = JSON.parse(read('package.json'));
      if (packageJson.version !== '0.1.0') failures.push(`package.json version must be 0.1.0, found ${packageJson.version || 'missing'}`);
    } catch (error) {
      failures.push(`package.json is invalid JSON: ${error.message}`);
    }
  } else failures.push('missing required release file: package.json');

  if (exists('LICENSE') && !/MIT License/i.test(read('LICENSE'))) failures.push('LICENSE does not identify the MIT License');

  const demoRoot = path.join(repoRoot, 'examples', 'worlds', 'glass-tide');
  if (fs.existsSync(demoRoot)) {
    const result = validateWorld(demoRoot);
    for (const item of result.findings) failures.push(`Glass Tide validation: ${item.code} ${item.file || ''} ${item.message}`.trim());
  }

  if (exists('v2.next/SILK-V2.html') && exists('v2.next/BROWSER_VALIDATION.json')) {
    try {
      const bytes = fs.readFileSync(path.join(repoRoot, 'v2.next', 'SILK-V2.html'));
      const expected = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
      const evidence = JSON.parse(read('v2.next/BROWSER_VALIDATION.json'));
      if (evidence.status !== 'PASS') failures.push(`V2 browser evidence status must be PASS, found ${evidence.status || 'missing'}`);
      if (evidence.candidate_sha256 !== expected) failures.push(`V2 browser evidence SHA is stale: expected ${expected}, found ${evidence.candidate_sha256 || 'missing'}`);
    } catch (error) {
      failures.push(`V2 browser evidence is invalid: ${error.message}`);
    }
  }

  const readmes = [
    ['README.md', /検証済み範囲|validation limits/i],
    ['README.en.md', /validation limits/i]
  ];
  for (const [relative, limitPattern] of readmes) {
    if (!exists(relative)) continue;
    const text = read(relative);
    for (const marker of ['examples/worlds/glass-tide', 'CONTRIBUTING.md', 'LICENSE', 'v0.1.0']) {
      if (!text.includes(marker)) failures.push(`${relative} must link or refer to ${marker}`);
    }
    if (!limitPattern.test(text)) failures.push(`${relative} must identify validation limits`);
  }

  const staleLicenseWording = 'GitHubで公開する前に、ライセンス';
  if (exists('v2.next/RELEASE_READINESS.md') && read('v2.next/RELEASE_READINESS.md').includes(staleLicenseWording)) {
    failures.push('v2.next/RELEASE_READINESS.md still contains stale pre-publication license wording');
  }

  if (exists('docs/releases/v0.1.0.md')) {
    const notes = read('docs/releases/v0.1.0.md');
    if (!notes.includes('LONG_RUN_VALIDATION_ISSUE_URL')) failures.push('release notes must retain the LONG_RUN_VALIDATION_ISSUE_URL field label');
    const issue = notes.match(/LONG_RUN_VALIDATION_ISSUE_URL:\s*(\S+)/)?.[1];
    if (!issue || issue === 'LONG_RUN_VALIDATION_ISSUE_URL' || !/^https:\/\/github\.com\/ugin-man\/SILK\/issues\/\d+$/.test(issue)) {
      failures.push('LONG_RUN_VALIDATION_ISSUE_URL has not been replaced with the public Issue URL');
    }
  }

  return [...new Set(failures)];
}

module.exports = { checkReleaseConsistency };

if (require.main === module) {
  const failures = checkReleaseConsistency(process.argv[2] || path.resolve(__dirname, '..'));
  if (failures.length === 0) console.log('PASS: release metadata and evidence agree');
  else failures.forEach(message => console.error(`FAIL: ${message}`));
  process.exitCode = failures.length === 0 ? 0 : 1;
}
