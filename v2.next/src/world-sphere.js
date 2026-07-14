(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root && root.document) root.SILK_WORLD_SPHERE_FACTORY = exported;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function createLifecycle() {
    const state = { visible: false, autoRotate: true, dirty: true, meshBuilds: 0, style: 'surface' };
    return {
      markMeshBuilt() { state.meshBuilds += 1; state.dirty = true; },
      setStyle(style) { const next = style === 'white' ? 'white' : 'surface'; if (next !== state.style) { state.style = next; state.dirty = true; } },
      setVisible(value) { const next = Boolean(value); if (next !== state.visible) { state.visible = next; state.dirty = next; } },
      setAutoRotate(value) { const next = Boolean(value); if (next !== state.autoRotate) { state.autoRotate = next; state.dirty = state.visible; } },
      noteInteraction() { state.autoRotate = false; state.dirty = true; },
      requestRender() { state.dirty = true; },
      noteRendered() { state.dirty = false; },
      shouldRender() { return state.visible && (state.dirty || state.autoRotate); },
      shouldScheduleNextFrame() { return state.visible && state.autoRotate; },
      getState() { return { ...state }; }
    };
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function easeOutCubic(value) { const t = clamp(value, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function shortestYawDelta(from, to) { return Math.atan2(Math.sin(to - from), Math.cos(to - from)); }
  const DEFAULT_LAYERS = Object.freeze({ borders: true, countryLabels: true, cities: true });
  function normalizeLayers(next) {
    const source = next || {};
    return Object.fromEntries(Object.entries(DEFAULT_LAYERS).map(([key, fallback]) => [key, key in source ? Boolean(source[key]) : fallback]));
  }
  const normalize = (p) => {
    const m = Math.hypot(p[0], p[1], p[2]) || 1;
    return [p[0] / m, p[1] / m, p[2] / m];
  };
  function unpackGrid(payload) {
    if (Array.isArray(payload?.cells)) return payload;
    if (payload?.format !== 'silk-sphere-grid-packed-v1') throw new Error('Unsupported sphere grid format');
    const cells = [];
    for (let index = 0; index < payload.cell_count; index += 1) {
      cells.push({ center: payload.centers.slice(index * 3, index * 3 + 3), faces: payload.faces.slice(payload.face_offsets[index], payload.face_offsets[index + 1]) });
    }
    const faceCenters = [];
    for (let index = 0; index < payload.face_centers.length; index += 3) faceCenters.push(payload.face_centers.slice(index, index + 3));
    const dualEdges = [];
    for (let index = 0; index < payload.dual_cells.length; index += 2) dualEdges.push({ cells: payload.dual_cells.slice(index, index + 2), faces: payload.dual_faces.slice(index, index + 2) });
    const neighbors = Array.from({ length: cells.length }, () => []);
    for (const edge of dualEdges) { neighbors[edge.cells[0]].push(edge.cells[1]); neighbors[edge.cells[1]].push(edge.cells[0]); }
    return { frequency: payload.frequency, cells, faceCenters, dualEdges, neighbors };
  }
  const hex = (value) => {
    const raw = String(value || '#819660');
    const rgb = raw.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgb) return rgb.slice(1).map((channel) => Number(channel) / 255);
    const text = raw.replace('#', '');
    const full = text.length === 3 ? text.split('').map((x) => x + x).join('') : text.padEnd(6, '8').slice(0, 6);
    return [parseInt(full.slice(0, 2), 16) / 255, parseInt(full.slice(2, 4), 16) / 255, parseInt(full.slice(4, 6), 16) / 255];
  };

  function rotate(point, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x = point[0] * cy + point[2] * sy;
    const z0 = -point[0] * sy + point[2] * cy;
    return [x, point[1] * cp - z0 * sp, point[1] * sp + z0 * cp];
  }

  function project(point, state, width, height) {
    const p = rotate(point, state.yaw, state.pitch);
    const radius = Math.min(width, height) * .455 * state.zoom;
    return { x: width / 2 - p[0] * radius, y: height / 2 - p[1] * radius, z: p[2], radius };
  }

  function reliefPoint(point, elevation, scale, style) {
    if (style !== 'surface' || !Number(elevation)) return [...point];
    const p = normalize(point), radius = 1 + Number(elevation) * Number(scale || 0);
    return p.map((value) => value * radius);
  }

  function cameraForData(data, grid) {
    const points = (grid?.cells || []).filter((_, index) => Number(data?.owners?.[index]) >= 0).map((cell) => cell.center);
    if (!points.length) return { yaw: 0, pitch: 0, zoom: 1 };
    const sum = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1], acc[2] + point[2]], [0, 0, 0]);
    const focus = normalize(sum);
    return { yaw: -Math.atan2(focus[0], focus[2]), pitch: Math.atan2(focus[1], Math.hypot(focus[0], focus[2])), zoom: 1 };
  }

  function semanticPolicyForZoom(data, zoom) {
    const policy = data?.label_policy || {}, thresholds = policy.zoom || {};
    const farEnd = Number(thresholds.far_end || 1.08), mediumEnd = Number(thresholds.medium_end || 1.35), detailStart = Number(thresholds.detail_start || thresholds.near_end || 1.7);
    const level = zoom >= detailStart ? 'detail' : zoom >= mediumEnd ? 'near' : zoom >= farEnd ? 'medium' : 'far';
    const cfg = policy[level] || {};
    return {
      level,
      maxCountries: Number(cfg.max_country_labels ?? 18),
      markerImportance: Number(cfg.settlement_marker_importance ?? (level === 'far' ? 95 : level === 'medium' ? 75 : level === 'near' ? 45 : 0)),
      labelImportance: Number(cfg.settlement_name_importance ?? (level === 'far' ? 101 : 0)),
      labelBudget: Number(cfg.settlement_label_budget || 0)
    };
  }

  function terrainColor(code, owner, countries, legend, palette) {
    const named = { ocean: 0, sea: 0, water: 0, grassland: 1, plains: 1, highland: 2, forest: 3, desert: 4, mountain: 5, snow: 6, glacier: 6, wetland: 7, volcanic: 8, tundra: 9 };
    const semantic = legend?.[code] ?? legend?.[String(code)] ?? code;
    let value = typeof semantic === 'string' && Number.isNaN(Number(semantic)) ? (named[semantic.toLowerCase()] ?? 2) : Number(semantic);
    if (!legend && Number(owner) < 0 && [0, 1, 2].includes(value)) value = 1;
    if (!legend && Number(owner) >= 0 && [0, 1, 2].includes(value)) value = 2;
    if (Array.isArray(palette) && palette[value]) return palette[value];
    const fallback = { 0: '#315868', 1: '#879b62', 2: '#9c9368', 3: '#315d45', 4: '#c9aa62', 5: '#8d8778', 6: '#e8e8df', 7: '#557b67', 8: '#59433b', 9: '#9ba49a' };
    return fallback[value] || '#879b62';
  }

  function biomeForCell(data, index) {
    const edited = data.terrain?.[index];
    if (typeof edited === 'string' && Number.isNaN(Number(edited))) return edited;
    return data.relief?.biomes?.[index] ?? edited;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }

  function createWebGLRenderer(canvas, grid, data, lifecycle) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!gl) return null;
    const vertex = `#version 300 es
      in vec3 aPosition; in vec3 aSurface; in float aHeight;
      uniform float uYaw; uniform float uPitch; uniform float uZoom; uniform float uAspect; uniform float uSurface; uniform float uRelief;
      out vec3 vColor; out float vFront;
      void main(){
        float cy=cos(uYaw),sy=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);
        vec3 p=normalize(aPosition)*(1.0+aHeight*uRelief*uSurface);
        p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);
        p=vec3(p.x,p.y*cp-p.z*sp,p.y*sp+p.z*cp);
        vFront=p.z; vColor=mix(vec3(.94,.93,.87),aSurface,uSurface);
        gl_Position=vec4(-p.x*uZoom*uAspect,p.y*uZoom,-p.z*.5,1.0);
      }`;
    const fragment = `#version 300 es
      precision mediump float; in vec3 vColor; in float vFront; out vec4 outColor;
      void main(){ if(vFront<-.02) discard; float light=.82+.18*max(vFront,0.0); outColor=vec4(vColor*light,1.0); }`;
    const lineVertex = `#version 300 es
      in vec3 aPosition; uniform float uYaw; uniform float uPitch; uniform float uZoom; uniform float uAspect; out float vFront;
      void main(){
        float cy=cos(uYaw),sy=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);
        vec3 p=normalize(aPosition)*1.002;
        p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);
        p=vec3(p.x,p.y*cp-p.z*sp,p.y*sp+p.z*cp);
        vFront=p.z; gl_Position=vec4(-p.x*uZoom*uAspect,p.y*uZoom,-p.z*.5,1.0);
      }`;
    const lineFragment = `#version 300 es
      precision mediump float; in float vFront; out vec4 outColor;
      void main(){ if(vFront<0.0) discard; outColor=vec4(.20,.22,.19,.34); }`;
    let program, lineProgram;
    try { program = createProgram(gl, vertex, fragment); lineProgram = createProgram(gl, lineVertex, lineFragment); } catch (_) { return null; }
    const surfaceColorsFor = (source) => {
      const result = [];
      for (let i = 0; i < grid.cells.length; i += 1) {
        const color = hex(terrainColor(biomeForCell(source, i), source.owners[i], source.countries, source.biome_legend || source.terrain_legend, source.relief?.palette));
        for (let j = 0; j < grid.cells[i].faces.length; j += 1) result.push(...color, ...color, ...color);
      }
      for (const edge of grid.dualEdges || []) {
        const first = edge.cells[0], second = edge.cells[1];
        const firstHeight = Number(source.relief?.elevation?.[first] || 0), secondHeight = Number(source.relief?.elevation?.[second] || 0);
        if (firstHeight === secondHeight) continue;
        const high = firstHeight > secondHeight ? first : second;
        const wallColor = hex(terrainColor(biomeForCell(source, high), source.owners[high], source.countries, source.biome_legend || source.terrain_legend, source.relief?.palette)).map((value) => value * .56);
        result.push(...wallColor, ...wallColor, ...wallColor, ...wallColor, ...wallColor, ...wallColor);
      }
      return result;
    };
    let positions = [], colors = [], heights = [];
    for (let i = 0; i < grid.cells.length; i += 1) {
      const cell = grid.cells[i];
      const biome = biomeForCell(data, i);
      const color = hex(terrainColor(biome, data.owners[i], data.countries, data.biome_legend || data.terrain_legend, data.relief?.palette));
      const elevation = Number(data.relief?.elevation?.[i] || 0);
      for (let j = 0; j < cell.faces.length; j += 1) {
        const a = cell.center;
        const b = grid.faceCenters[cell.faces[j]];
        const c = grid.faceCenters[cell.faces[(j + 1) % cell.faces.length]];
        positions.push(...a, ...b, ...c);
        colors.push(...color, ...color, ...color);
        heights.push(elevation, elevation, elevation);
      }
    }
    for (const edge of grid.dualEdges || []) {
      const first = edge.cells[0], second = edge.cells[1];
      const firstHeight = Number(data.relief?.elevation?.[first] || 0), secondHeight = Number(data.relief?.elevation?.[second] || 0);
      if (firstHeight === secondHeight) continue;
      const high = firstHeight > secondHeight ? first : second, highHeight = Math.max(firstHeight, secondHeight), lowHeight = Math.min(firstHeight, secondHeight);
      const a = grid.faceCenters[edge.faces[0]], b = grid.faceCenters[edge.faces[1]];
      const biome = biomeForCell(data, high);
      const wallColor = hex(terrainColor(biome, data.owners[high], data.countries, data.biome_legend || data.terrain_legend, data.relief?.palette)).map((value) => value * .56);
      positions.push(...a, ...b, ...a, ...b, ...b, ...a);
      colors.push(...wallColor, ...wallColor, ...wallColor, ...wallColor, ...wallColor, ...wallColor);
      heights.push(lowHeight, lowHeight, highHeight, lowHeight, highHeight, highHeight);
    }
    const bind = (targetProgram, name, values, size) => {
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      const location = gl.getAttribLocation(targetProgram, name);
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      return buffer;
    };
    const triangleVao = gl.createVertexArray(); gl.bindVertexArray(triangleVao);
    gl.useProgram(program);
    bind(program, 'aPosition', positions, 3); const colorBuffer = bind(program, 'aSurface', colors, 3); bind(program, 'aHeight', heights, 1);
    const triangleVertexCount = positions.length / 3;
    positions = colors = heights = null;
    let linePositions = [];
    for (const edge of grid.dualEdges || []) linePositions.push(...grid.faceCenters[edge.faces[0]], ...grid.faceCenters[edge.faces[1]]);
    const lineVao = gl.createVertexArray(); gl.bindVertexArray(lineVao); gl.useProgram(lineProgram);
    bind(lineProgram, 'aPosition', linePositions, 3); gl.bindVertexArray(null);
    const lineVertexCount = linePositions.length / 3;
    linePositions = null;
    lifecycle.markMeshBuilt();
    return {
      render(state, width, height) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.useProgram(program); gl.bindVertexArray(triangleVao);
        gl.uniform1f(gl.getUniformLocation(program, 'uYaw'), state.yaw);
        gl.uniform1f(gl.getUniformLocation(program, 'uPitch'), state.pitch);
        gl.uniform1f(gl.getUniformLocation(program, 'uZoom'), .92 * state.zoom);
        gl.uniform1f(gl.getUniformLocation(program, 'uAspect'), height / Math.max(1, width));
        gl.uniform1f(gl.getUniformLocation(program, 'uSurface'), state.style === 'surface' ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(program, 'uRelief'), Number(data.relief?.height_scale || 0));
        gl.drawArrays(gl.TRIANGLES, 0, triangleVertexCount);
        if (state.style === 'white' && lineVertexCount) {
          gl.useProgram(lineProgram); gl.bindVertexArray(lineVao);
          gl.uniform1f(gl.getUniformLocation(lineProgram, 'uYaw'), state.yaw);
          gl.uniform1f(gl.getUniformLocation(lineProgram, 'uPitch'), state.pitch);
          gl.uniform1f(gl.getUniformLocation(lineProgram, 'uZoom'), .92 * state.zoom);
          gl.uniform1f(gl.getUniformLocation(lineProgram, 'uAspect'), height / Math.max(1, width));
          gl.drawArrays(gl.LINES, 0, lineVertexCount);
        }
        gl.bindVertexArray(null);
      },
      kind: 'webgl2',
      updateData(nextData) {
        data = nextData;
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceColorsFor(data)), gl.DYNAMIC_DRAW);
        lifecycle.requestRender();
      },
      destroy() {
        gl.bindVertexArray(null);
        gl.useProgram(null);
        gl.deleteVertexArray?.(triangleVao);
        gl.deleteVertexArray?.(lineVao);
        gl.deleteProgram?.(program);
        gl.deleteProgram?.(lineProgram);
        gl.getExtension?.('WEBGL_lose_context')?.loseContext();
      }
    };
  }

  function createCanvasRenderer(canvas, grid, data, lifecycle) {
    const ctx = canvas.getContext('2d'); lifecycle.markMeshBuilt();
    return {
      resize(dpr) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); },
      render(state, width, height) {
        ctx.clearRect(0, 0, width, height);
        const order = grid.cells.map((cell, index) => ({ cell, index, p: project(cell.center, state, width, height) }))
          .filter((item) => item.p.z > -.08).sort((a, b) => a.p.z - b.p.z);
        for (const item of order) {
          const ring = item.cell.faces.map((face) => project(grid.faceCenters[face], state, width, height));
          ctx.beginPath(); ring.forEach((p, index) => index ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
          const biome = biomeForCell(data, item.index);
          ctx.fillStyle = state.style === 'white' ? '#f1efe5' : terrainColor(biome, data.owners[item.index], data.countries, data.biome_legend || data.terrain_legend, data.relief?.palette);
          ctx.fill();
        }
      },
      kind: 'canvas2d',
      updateData(nextData) { data = nextData; lifecycle.requestRender(); }
    };
  }

  function createSphere(options) {
    const container = options.container;
    let data = options.data;
    const grid = options.grid;
    const reliefScale = Number(data.relief?.height_scale || 0);
    const edgeKey = (a, b) => [a, b].map((point) => point.map((value) => Number(value).toFixed(7)).join(',')).sort().join('|');
    const edgeElevation = new Map((grid.dualEdges || []).map((edge) => [edgeKey(grid.faceCenters[edge.faces[0]], grid.faceCenters[edge.faces[1]]), Math.max(Number(data.relief?.elevation?.[edge.cells[0]] || 0), Number(data.relief?.elevation?.[edge.cells[1]] || 0))]));
    for (const border of data.borders || []) if (!Number.isFinite(Number(border.elevation))) border.elevation = edgeElevation.get(edgeKey(border.a, border.b)) || 0;
    const lifecycle = createLifecycle();
    const initialCamera = cameraForData(data, grid);
    const state = { ...initialCamera, style: 'surface', layers: normalizeLayers(), selectedId: null, editor: { tool: 'inspect', terrain: 'grassland', owner: 0, brush: 0, selectedCell: null } };
    const stage = document.createElement('div'); stage.className = 'silk-sphere-stage';
    const canvas = document.createElement('canvas'); canvas.className = 'silk-sphere-canvas'; canvas.id = 'silkSphereCanvas';
    const overlay = document.createElement('canvas'); overlay.className = 'silk-sphere-overlay'; overlay.id = 'silkSphereOverlay';
    const fallback = document.createElement('div'); fallback.className = 'silk-sphere-fallback'; fallback.hidden = true;
    stage.append(canvas, overlay, fallback); container.prepend(stage);
    const renderer = createWebGLRenderer(canvas, grid, data, lifecycle) || createCanvasRenderer(canvas, grid, data, lifecycle);
    if (renderer.kind !== 'webgl2') { fallback.textContent = 'CANVAS FALLBACK'; fallback.hidden = false; }
    const ctx = overlay.getContext('2d');
    let width = 1, height = 1, dpr = 1, raf = 0, dragging = false, last = null, dragDistance = 0, hitboxes = [];
    let cameraTween = null;

    function cancelCameraTween() { cameraTween = null; }
    function startCameraTween(target, duration) {
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion || duration <= 0) {
        cancelCameraTween();
        state.yaw = target.yaw; state.pitch = target.pitch; state.zoom = target.zoom;
        interact();
        return;
      }
      cameraTween = {
        startedAt: null,
        duration,
        from: { yaw: state.yaw, pitch: state.pitch, zoom: state.zoom },
        to: { yaw: state.yaw + shortestYawDelta(state.yaw, target.yaw), pitch: target.pitch, zoom: target.zoom }
      };
      lifecycle.noteInteraction(); lifecycle.requestRender(); schedule();
    }

    function advanceCameraTween(time) {
      if (!cameraTween) return false;
      if (cameraTween.startedAt == null) cameraTween.startedAt = time;
      const progress = clamp((time - cameraTween.startedAt) / cameraTween.duration, 0, 1);
      const eased = easeOutCubic(progress);
      state.yaw = cameraTween.from.yaw + (cameraTween.to.yaw - cameraTween.from.yaw) * eased;
      state.pitch = cameraTween.from.pitch + (cameraTween.to.pitch - cameraTween.from.pitch) * eased;
      state.zoom = cameraTween.from.zoom + (cameraTween.to.zoom - cameraTween.from.zoom) * eased;
      if (progress >= 1) cameraTween = null;
      else lifecycle.requestRender();
      return true;
    }

    function resize() {
      const rect = container.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const node of [canvas, overlay]) { node.width = Math.round(width * dpr); node.height = Math.round(height * dpr); node.style.width = `${width}px`; node.style.height = `${height}px`; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); lifecycle.requestRender(); schedule();
      renderer.resize?.(dpr);
    }

    function labelCandidates() {
      const semantic = semanticPolicyForZoom(data, state.zoom); const result = [];
      const countryLabels = (data.countries || []).map((country) => {
        const layout = (data.country_label_layout || []).find((x) => x.id === country.id);
        return { id: country.id, text: layout?.short_name || country.name, point: layout?.anchor || country.point, priority: 1000 + Number(layout?.priority || country.cells || 0), type: 'country' };
      }).sort((a, b) => b.priority - a.priority).slice(0, semantic.maxCountries);
      if (state.layers.countryLabels) result.push(...countryLabels);
      if (state.layers.cities) (data.settlements || []).filter((x) => Number(x.importance || 0) >= semantic.labelImportance).sort((a, b) => Number(b.importance || 0) - Number(a.importance || 0)).slice(0, semantic.labelBudget)
        .forEach((x) => result.push({ id: x.id, text: x.name, point: x.point, priority: Number(x.importance || 0), type: 'settlement' }));
      return result.sort((a, b) => b.priority - a.priority);
    }

    function drawOverlay() {
      ctx.clearRect(0, 0, width, height); hitboxes = [];
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const border of data.borders || []) {
        if (border.kind !== 'coast' && !state.layers.borders) continue;
        const a = project(reliefPoint(border.a, border.elevation, reliefScale, state.style), state, width, height), b = project(reliefPoint(border.b, border.elevation, reliefScale, state.style), state, width, height);
        if (a.z < 0 || b.z < 0) continue;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = border.kind === 'coast' ? (state.style === 'white' ? '#8d8a7d' : '#ede8d3') : '#1b211b';
        ctx.lineWidth = border.kind === 'coast' ? 1.15 : 2.2; ctx.stroke();
      }
      if (state.style === 'white' && renderer.kind === 'canvas2d') {
        ctx.strokeStyle = 'rgba(50,55,48,.15)'; ctx.lineWidth = .55;
        for (const cell of grid.cells) {
          const center = project(cell.center, state, width, height); if (center.z < .02) continue;
          const ring = cell.faces.map((face) => project(grid.faceCenters[face], state, width, height));
          ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke();
        }
      }
      const occupied = [];
      if (Number.isInteger(state.editor.selectedCell)) {
        const cell = grid.cells[state.editor.selectedCell];
        if (cell) {
          const ring = cell.faces.map((face) => project(reliefPoint(grid.faceCenters[face], Number(data.relief?.elevation?.[state.editor.selectedCell] || 0), reliefScale, state.style), state, width, height));
          if (ring.every((point) => point.z > 0)) { ctx.beginPath(); ring.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.closePath(); ctx.strokeStyle = '#d5ff2c'; ctx.lineWidth = 3; ctx.stroke(); }
        }
      }
      for (const label of labelCandidates()) {
        const p = project(label.point, state, width, height); if (p.z < .08) continue;
        const font = label.type === 'country' ? '600 12px Georgia, serif' : '600 10px ui-monospace, monospace';
        ctx.font = font; const tw = ctx.measureText(label.text).width; const box = { x: p.x - tw / 2 - 6, y: p.y - 10, w: tw + 12, h: 20 };
        if (occupied.some((o) => !(box.x + box.w < o.x || o.x + o.w < box.x || box.y + box.h < o.y || o.y + o.h < box.y))) continue;
        occupied.push(box); ctx.fillStyle = label.id === state.selectedId ? '#d7ff31' : 'rgba(248,246,236,.9)'; ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = label.id === state.selectedId ? '#171d16' : 'rgba(25,31,25,.32)'; ctx.lineWidth = 1; ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.fillStyle = '#141914'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = font; ctx.fillText(label.text, p.x, p.y);
        hitboxes.push({ ...box, id: label.id });
      }
      const semantic = semanticPolicyForZoom(data, state.zoom);
      for (const place of state.layers.cities ? (data.settlements || []).filter((item) => Number(item.importance || 0) >= semantic.markerImportance) : []) {
        const elevation = Number(place.elevation ?? data.relief?.elevation?.[place.cell] ?? 0);
        const p = project(reliefPoint(place.point, elevation, reliefScale, state.style), state, width, height); if (p.z < .05) continue;
        const size = Number(place.importance || 0) >= 95 ? 4.2 : 2.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fillStyle = '#f9f6e8'; ctx.fill(); ctx.strokeStyle = place.id === state.selectedId ? '#b7de1e' : '#111711'; ctx.lineWidth = 1.4; ctx.stroke();
        hitboxes.push({ x: p.x - 7, y: p.y - 7, w: 14, h: 14, id: place.id });
      }
    }

    let lastRender = 0;
    function frame(time) {
      raf = 0; if (!lifecycle.shouldRender() && !cameraTween) return;
      const tweening = Boolean(cameraTween);
      if (!tweening && lifecycle.getState().autoRotate && time - lastRender < 32) { schedule(); return; }
      if (tweening) advanceCameraTween(time);
      else if (lifecycle.getState().autoRotate) state.yaw += .000045 * Math.min(40, time - (frame.last || time));
      frame.last = time; lastRender = time; renderer.render(state, width, height); drawOverlay(); lifecycle.noteRendered();
      if (cameraTween || lifecycle.shouldScheduleNextFrame()) schedule();
    }
    function schedule() { if (!raf && lifecycle.getState().visible) raf = requestAnimationFrame(frame); }
    function interact() { lifecycle.noteInteraction(); stage.classList.toggle('is-dragging', dragging); schedule(); }
    overlay.addEventListener('pointerdown', (event) => { cancelCameraTween(); dragging = true; dragDistance = 0; last = [event.clientX, event.clientY]; overlay.setPointerCapture(event.pointerId); interact(); });
    overlay.addEventListener('pointermove', (event) => { if (!dragging) return; const dx = event.clientX - last[0], dy = event.clientY - last[1]; dragDistance += Math.hypot(dx, dy); state.yaw += dx * .006; state.pitch = clamp(state.pitch + dy * .006, -1.45, 1.45); last = [event.clientX, event.clientY]; lifecycle.requestRender(); schedule(); });
    overlay.addEventListener('pointerup', (event) => { dragging = false; stage.classList.remove('is-dragging'); overlay.releasePointerCapture?.(event.pointerId); });
    overlay.addEventListener('wheel', (event) => { event.preventDefault(); cancelCameraTween(); state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * .001), .66, 2.4); interact(); }, { passive: false });
    function nearestCell(x, y) {
      let best = null, distance = Infinity;
      grid.cells.forEach((cell, index) => { const p = project(cell.center, state, width, height); if (p.z < .05) return; const d = Math.hypot(p.x - x, p.y - y); if (d < distance) { distance = d; best = index; } });
      return distance <= Math.max(12, 18 * state.zoom) ? best : null;
    }
    function brushCells(origin) {
      const result = new Set([origin]), queue = [[origin, 0]], radius = Number(state.editor.brush || 0);
      while (queue.length) { const [cell, depth] = queue.shift(); if (depth >= radius) continue; for (const next of grid.neighbors?.[cell] || []) if (!result.has(next)) { result.add(next); queue.push([next, depth + 1]); } }
      return [...result];
    }
    function selectCell(cell) {
      const next = clamp(Math.round(Number(cell) || 0), 0, grid.cells.length - 1);
      state.editor.selectedCell = next;
      options.onCellInspect?.(next);
      lifecycle.requestRender(); schedule();
      return next;
    }
    function activateSelectedCell() {
      const cell = state.editor.selectedCell;
      if (!Number.isInteger(cell)) return { ok: false, reason: 'no_selected_cell' };
      const cells = brushCells(cell);
      if (state.editor.tool === 'terrain') options.onCellEdit?.({ type: 'set_terrain', cells, terrain: state.editor.terrain });
      if (state.editor.tool === 'owner') options.onCellEdit?.({ type: 'assign_owner', cells, owner: Number(state.editor.owner) });
      if (state.editor.tool === 'erase') options.onCellEdit?.({ type: 'assign_owner', cells, owner: -1 });
      lifecycle.requestRender(); schedule();
      return { ok: true, cell, cells };
    }
    overlay.addEventListener('click', (event) => {
      if (dragDistance > 5) return;
      const rect = overlay.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
      const hit = hitboxes.slice().reverse().find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (hit && state.editor.tool === 'inspect') { state.selectedId = hit.id; options.onSelect?.(hit.id); lifecycle.requestRender(); schedule(); return; }
      const cell = nearestCell(x, y); if (cell == null) return;
      selectCell(cell); activateSelectedCell();
    });
    const observer = new ResizeObserver(resize); observer.observe(container); resize();

    return {
      setStyle(value) { state.style = value === 'white' ? 'white' : 'surface'; lifecycle.setStyle(state.style); container.dataset.sphereStyle = state.style; schedule(); },
      setVisible(value) { lifecycle.setVisible(value); stage.hidden = !value; if (value) schedule(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      setAutoRotate(value) { lifecycle.setAutoRotate(value); schedule(); },
      setEditor(next) { state.editor = { ...state.editor, ...(next || {}) }; lifecycle.noteInteraction(); schedule(); },
      setLayers(next) { state.layers = normalizeLayers({ ...state.layers, ...(next || {}) }); lifecycle.requestRender(); schedule(); return { ...state.layers }; },
      selectSubject(id) { state.selectedId = id || null; lifecycle.requestRender(); schedule(); },
      setCamera(next) {
        cancelCameraTween();
        if (Number.isFinite(Number(next?.yaw))) state.yaw = Number(next.yaw);
        if (Number.isFinite(Number(next?.pitch))) state.pitch = clamp(Number(next.pitch), -1.45, 1.45);
        if (Number.isFinite(Number(next?.zoom))) state.zoom = clamp(Number(next.zoom), .66, 2.4);
        interact();
      },
      reset(options = {}) {
        const duration = Number(options.duration || 650);
        if (options.animate) startCameraTween(initialCamera, duration);
        else { cancelCameraTween(); state.yaw = initialCamera.yaw; state.pitch = initialCamera.pitch; state.zoom = initialCamera.zoom; interact(); }
      },
      zoomBy(factor) { cancelCameraTween(); state.zoom = clamp(state.zoom * factor, .66, 2.4); interact(); },
      selectCell,
      activateSelectedCell,
      refresh(nextData) {
        if (nextData) data = Array.isArray(nextData.terrain) && Array.isArray(nextData.owners) ? nextData : { ...data, ...nextData };
        renderer.updateData?.(data); lifecycle.requestRender(); schedule();
      },
      getState() { return { ...state, ...lifecycle.getState(), renderer: renderer.kind }; },
      getDiagnostics() { return { renderer: renderer.kind, cells: grid.cells.length, borders: data.borders?.length || 0, settlements: data.settlements?.length || 0, meshBuilds: lifecycle.getState().meshBuilds, visible: lifecycle.getState().visible }; },
      destroy() { observer.disconnect(); if (raf) cancelAnimationFrame(raf); renderer.destroy?.(); stage.remove(); }
    };
  }

  return { createLifecycle, createSphere, normalize, normalizeLayers, unpackGrid, terrainColor, biomeForCell, reliefPoint, cameraForData, semanticPolicyForZoom };
});
