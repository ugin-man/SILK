require('./atlas_reader_tree_contract');
require('./camera_navigation_contract');
const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  'package_guard_contract.js',
  'release_hardening_contract.js',
  'plain_release_contract.js',
  'v2_reintegration_contract.js',
  'world_sphere_contract.js',
  'map_api_compatibility_contract.js',
  'selection_sync_contract.js',
  'render_lifecycle_contract.js',
  'dynamic_world_contract.js',
  'cell_registry_contract.js',
  'performance_contract.js',
  'semantic_zoom_contract.js',
  'renderer_runtime_contract.js',
  'legacy_initialization_contract.js',
  'grid_pack_contract.js',
  'payload_budget_contract.js',
  'self_test_contract.js',
  'static_audit_portability_contract.js',
  'cross_platform_build_contract.js',
  'browser_evidence_contract.js'
];

let failures = 0;
for (const test of tests) {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, test)], {
    stdio: 'inherit'
  });
  if (result.status !== 0) failures += 1;
}

if (failures) {
  console.error(`v2.next contracts: ${failures} failed`);
  process.exit(1);
}

console.log('v2.next contracts: all ok');
