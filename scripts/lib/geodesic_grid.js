'use strict';

const PHI = (1 + Math.sqrt(5)) / 2;
const BASE_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];
const BASE_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

function normalize(point) {
  const length = Math.hypot(...point) || 1;
  return point.map(value => value / length);
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function buildGeodesic(frequency) {
  const base = BASE_VERTICES.map(normalize);
  const vertices = [];
  const vertexLookup = new Map();
  const triangles = [];
  function sharedVertex(point) {
    const normalized = normalize(point);
    const key = normalized.map(value => Math.round(value * 1e8)).join(':');
    if (vertexLookup.has(key)) return vertexLookup.get(key);
    const index = vertices.length;
    vertices.push(normalized);
    vertexLookup.set(key, index);
    return index;
  }
  for (const face of BASE_FACES) {
    const a = base[face[0]], b = base[face[1]], c = base[face[2]];
    const grid = new Map();
    for (let i = 0; i <= frequency; i += 1) {
      for (let j = 0; j <= frequency - i; j += 1) {
        const wb = i / frequency, wc = j / frequency, wa = 1 - wb - wc;
        grid.set(`${i}:${j}`, sharedVertex([
          a[0] * wa + b[0] * wb + c[0] * wc,
          a[1] * wa + b[1] * wb + c[1] * wc,
          a[2] * wa + b[2] * wb + c[2] * wc,
        ]));
      }
    }
    for (let i = 0; i < frequency; i += 1) {
      for (let j = 0; j < frequency - i; j += 1) {
        const v0 = grid.get(`${i}:${j}`), v1 = grid.get(`${i + 1}:${j}`), v2 = grid.get(`${i}:${j + 1}`);
        triangles.push([v0, v1, v2]);
        if (i + j < frequency - 1) triangles.push([v1, grid.get(`${i + 1}:${j + 1}`), v2]);
      }
    }
  }
  const faceCenters = triangles.map(triangle => normalize([
    vertices[triangle[0]][0] + vertices[triangle[1]][0] + vertices[triangle[2]][0],
    vertices[triangle[0]][1] + vertices[triangle[1]][1] + vertices[triangle[2]][1],
    vertices[triangle[0]][2] + vertices[triangle[1]][2] + vertices[triangle[2]][2],
  ]));
  const adjacentFaces = Array.from({ length: vertices.length }, () => []);
  triangles.forEach((triangle, faceIndex) => triangle.forEach(vertexIndex => adjacentFaces[vertexIndex].push(faceIndex)));
  const cells = vertices.map((center, index) => {
    const reference = Math.abs(center[1]) < 0.92 ? [0, 1, 0] : [1, 0, 0];
    const tangentX = normalize(cross(reference, center));
    const tangentY = cross(center, tangentX);
    const faces = adjacentFaces[index].slice().sort((left, right) => {
      const a = faceCenters[left], b = faceCenters[right];
      return Math.atan2(dot(a, tangentY), dot(a, tangentX)) - Math.atan2(dot(b, tangentY), dot(b, tangentX));
    });
    return { id: `cell-${String(index).padStart(5, '0')}`, index, center, faces, sides: faces.length };
  });
  const primalEdges = new Map();
  triangles.forEach((triangle, faceIndex) => {
    for (const [a, b] of [[triangle[0], triangle[1]], [triangle[1], triangle[2]], [triangle[2], triangle[0]]]) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (!primalEdges.has(key)) primalEdges.set(key, { cells: a < b ? [a, b] : [b, a], faces: [] });
      primalEdges.get(key).faces.push(faceIndex);
    }
  });
  const dualEdges = [...primalEdges.values()].filter(edge => edge.faces.length === 2);
  const neighbors = Array.from({ length: cells.length }, () => []);
  for (const edge of dualEdges) {
    neighbors[edge.cells[0]].push(edge.cells[1]);
    neighbors[edge.cells[1]].push(edge.cells[0]);
  }
  return { frequency, cells, faceCenters, dualEdges, neighbors, pentagons: cells.filter(cell => cell.sides === 5).length };
}

function ringFromGeometry(geometry) {
  let coordinates = geometry?.coordinates;
  while (Array.isArray(coordinates) && coordinates.length && Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) coordinates = coordinates[0];
  if (!Array.isArray(coordinates) || !coordinates.every(point => Array.isArray(point) && point.length >= 2)) throw new Error('Polygon ring is unavailable');
  return coordinates.map(point => [Number(point[0]), Number(point[1])]);
}

function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > point[1]) !== (yj > point[1])) && point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || Number.EPSILON) + xi) inside = !inside;
  }
  return inside;
}

function ringCentroid(ring) {
  const points = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
  return points.reduce((sum, point) => [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length], [0, 0]);
}

function sphereToLocal(point, patch) {
  let longitude = Math.atan2(point[2], point[0]) * 180 / Math.PI;
  while (longitude - patch.center[0] > 180) longitude -= 360;
  while (longitude - patch.center[0] < -180) longitude += 360;
  const latitude = Math.asin(Math.max(-1, Math.min(1, point[1]))) * 180 / Math.PI;
  return [0.5 + (longitude - patch.center[0]) / patch.span[0], 0.5 - (latitude - patch.center[1]) / patch.span[1]];
}

function localToSphere(point, patch) {
  const longitude = (patch.center[0] + (point[0] - 0.5) * patch.span[0]) * Math.PI / 180;
  const latitude = (patch.center[1] + (0.5 - point[1]) * patch.span[1]) * Math.PI / 180;
  return [Math.cos(latitude) * Math.cos(longitude), Math.sin(latitude), Math.cos(latitude) * Math.sin(longitude)];
}

module.exports = { buildGeodesic, dot, localToSphere, normalize, pointInRing, ringCentroid, ringFromGeometry, sphereToLocal };
