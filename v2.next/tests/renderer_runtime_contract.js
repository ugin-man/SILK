const assert = require('assert');
const path = require('path');
const { createSphere } = require(path.resolve(__dirname, '../src/world-sphere.js'));

class ClassList {
  constructor() { this.values = new Set(); }
  toggle(value, force) { if (force === false) this.values.delete(value); else if (force === true || !this.values.has(value)) this.values.add(value); else this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}

function context2d() {
  return {
    setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
    fillRect() {}, strokeRect() {}, fillText() {}, arc() {},
    measureText(text) { return { width: String(text).length * 7 }; },
    set lineJoin(_) {}, set lineCap(_) {}, set strokeStyle(_) {}, set fillStyle(_) {}, set lineWidth(_) {},
    set font(_) {}, set textAlign(_) {}, set textBaseline(_) {}
  };
}

function fakeGl(draws) {
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, STATIC_DRAW: 6,
    FLOAT: 7, COLOR_BUFFER_BIT: 8, DEPTH_BUFFER_BIT: 16, DEPTH_TEST: 17, LEQUAL: 18, TRIANGLES: 19, LINES: 20,
    createShader: () => ({}), shaderSource() {}, compileShader() {}, getShaderParameter: () => true, getShaderInfoLog: () => '',
    createProgram: () => ({}), attachShader() {}, linkProgram() {}, getProgramParameter: () => true, getProgramInfoLog: () => '',
    createBuffer: () => ({}), bindBuffer() {}, bufferData() {}, getAttribLocation: () => 0, enableVertexAttribArray() {}, vertexAttribPointer() {},
    useProgram() {}, createVertexArray: () => ({}), bindVertexArray() {}, viewport() {}, clearColor() {}, clear() {}, enable() {}, depthFunc() {},
    getUniformLocation: () => ({}), uniform1f() {}, drawArrays(mode, start, count) { draws.push({ mode, start, count }); }
  };
  return gl;
}

function installDom(useWebGl) {
  const draws = [];
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.dataset = {}; this.classList = new ClassList(); this.hidden = false; this.listeners = {}; this.parent = null; this.width = 0; this.height = 0; }
    append(...nodes) { nodes.forEach((node) => { node.parent = this; this.children.push(node); }); }
    prepend(node) { node.parent = this; this.children.unshift(node); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((node) => node !== this); }
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 700 }; }
    setPointerCapture() {} releasePointerCapture() {}
    getContext(type) { if (this.tagName !== 'CANVAS') return null; if (type === 'webgl2') return useWebGl ? fakeGl(draws) : null; if (type === '2d') return context2d(); return null; }
  }
  const frames = [];
  global.document = { createElement: (tag) => new Element(tag) };
  global.window = { devicePixelRatio: 1 };
  global.ResizeObserver = class { constructor(callback) { this.callback = callback; } observe() { this.callback(); } disconnect() {} };
  global.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  global.cancelAnimationFrame = () => {};
  return { Element, draws, frames };
}

const grid = {
  cells: [
    { center: [-.12, 0, .99], faces: [0, 1, 2] },
    { center: [.12, 0, .99], faces: [1, 3, 2] }
  ],
  faceCenters: [[-.2,-.1,.97],[0,.14,.99],[0,-.14,.99],[.2,-.1,.97]],
  dualEdges: [{ cells: [0, 1], faces: [1, 2] }]
};
const data = {
  terrain: [2, 2], terrain_legend: { 2: 'grassland' }, owners: [0, 1],
  countries: [{ id: 'west', name: 'West', point: [-.12,0,.99], cells: 1 }, { id: 'east', name: 'East', point: [.12,0,.99], cells: 1 }],
  country_label_layout: [], borders: [{ a: grid.faceCenters[1], b: grid.faceCenters[2], left: 0, right: 1, kind: 'frontier', elevation: 0 }],
  settlements: [{ id: 'city', name: 'City', point: [0,0,1], importance: 100 }],
  label_policy: { zoom: {}, far: { max_country_labels: 2, settlement_marker_importance: 95, settlement_name_importance: 95, settlement_label_budget: 1 } },
  relief: { height_scale: .025, elevation: [0, 1] }
};

function run(useWebGl) {
  const env = installDom(useWebGl);
  const container = new env.Element('section');
  const sphere = createSphere({ container, data: JSON.parse(JSON.stringify(data)), grid, onSelect() {} });
  sphere.setVisible(true); sphere.setAutoRotate(false);
  while (env.frames.length) env.frames.shift()(40);
  sphere.setStyle('white');
  while (env.frames.length) env.frames.shift()(80);
  sphere.zoomBy(1.2); sphere.reset();
  while (env.frames.length) env.frames.shift()(120);
  const diagnostics = sphere.getDiagnostics();
  assert.strictEqual(diagnostics.renderer, useWebGl ? 'webgl2' : 'canvas2d');
  assert.strictEqual(diagnostics.cells, 2);
  sphere.destroy();
  assert.strictEqual(container.children.length, 0);
  return env.draws;
}

run(false);
const draws = run(true);
assert.ok(draws.some((draw) => draw.mode === 19), 'WebGL must draw terrain triangles');
assert.ok(draws.some((draw) => draw.mode === 20), 'WHITE mode must draw GPU cell lines');
console.log('renderer_runtime_contract: ok');
