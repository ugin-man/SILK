const assert = require('assert');
const path = require('path');
const { semanticPolicyForZoom } = require(path.resolve(__dirname, '../src/world-sphere.js'));

const data = { label_policy: {
  zoom: { medium_end: 1.35, near_end: 1.7, detail_start: 1.7 },
  far: { max_country_labels: 10, settlement_marker_importance: 95, settlement_name_importance: 101, settlement_label_budget: 0 },
  medium: { max_country_labels: 18, settlement_marker_importance: 75, settlement_name_importance: 95, settlement_label_budget: 10 },
  near: { max_country_labels: 18, settlement_marker_importance: 45, settlement_name_importance: 60, settlement_label_budget: 22 },
  detail: { max_country_labels: 18, settlement_marker_importance: 0, settlement_name_importance: 0, settlement_label_budget: 48 }
} };

assert.deepStrictEqual(semanticPolicyForZoom(data, 1), { level: 'far', maxCountries: 10, markerImportance: 95, labelImportance: 101, labelBudget: 0 });
assert.strictEqual(semanticPolicyForZoom(data, 1.4).level, 'near');
assert.deepStrictEqual(semanticPolicyForZoom(data, 2), { level: 'detail', maxCountries: 18, markerImportance: 0, labelImportance: 0, labelBudget: 48 });
console.log('semantic_zoom_contract: ok');
