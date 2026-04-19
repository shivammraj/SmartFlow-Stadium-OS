/**
 * RoutingAgent — Computes optimal paths through the stadium.
 * Uses Dijkstra's algorithm on the zone adjacency graph,
 * weighted by congestion levels to avoid crowded areas.
 */
const BaseAgent = require('./BaseAgent');

class RoutingAgent extends BaseAgent {
  constructor() {
    super('RoutingAgent');
    this.adjacency = null;
  }

  setAdjacency(adj) {
    this.adjacency = adj;
  }

  async process(input) {
    const { zones, predictions, routeRequest } = input;

    // Build density lookup
    const densityMap = {};
    zones.forEach(z => { densityMap[z.id] = z.density; });

    // Predicted density overlay
    const predictedMap = {};
    if (predictions) {
      predictions.forEach(p => { predictedMap[p.zoneId] = p.predictedDensity; });
    }

    // If a specific route is requested, compute it
    if (routeRequest && routeRequest.from && routeRequest.to) {
      const route = this._dijkstra(routeRequest.from, routeRequest.to, densityMap, predictedMap);
      return { route, allRoutes: null };
    }

    // Otherwise, precompute recommended routes between all gates and key zones
    const gates = zones.filter(z => z.type === 'gate').map(z => z.id);
    const keyDestinations = zones.filter(z => ['food', 'restroom', 'seating'].includes(z.type)).map(z => z.id);
    const recommendedRoutes = [];
    for (const gate of gates) {
      for (const dest of keyDestinations) {
        const route = this._dijkstra(gate, dest, densityMap, predictedMap);
        if (route) recommendedRoutes.push(route);
      }
    }

    return { route: null, allRoutes: recommendedRoutes.slice(0, 20) };
  }

  /**
   * Dijkstra with congestion-weighted edges.
   * Edge weight = 1 + density * 5 + predictedDensity * 2
   */
  _dijkstra(from, to, densityMap, predictedMap) {
    if (!this.adjacency || !this.adjacency[from] || !this.adjacency[to]) {
      return null;
    }

    const dist = {};
    const prev = {};
    const visited = new Set();
    const nodes = Object.keys(this.adjacency);

    nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
    dist[from] = 0;

    while (true) {
      // Pick unvisited node with smallest dist
      let current = null;
      let minDist = Infinity;
      for (const n of nodes) {
        if (!visited.has(n) && dist[n] < minDist) {
          minDist = dist[n];
          current = n;
        }
      }
      if (current === null || current === to) break;
      visited.add(current);

      for (const neighbor of this.adjacency[current]) {
        if (visited.has(neighbor)) continue;
        const d = densityMap[neighbor] || 0;
        const pd = predictedMap[neighbor] || 0;
        const weight = 1 + d * 5 + pd * 2;
        const alt = dist[current] + weight;
        if (alt < dist[neighbor]) {
          dist[neighbor] = alt;
          prev[neighbor] = current;
        }
      }
    }

    // Reconstruct path
    if (dist[to] === Infinity) return null;
    const path = [];
    let node = to;
    while (node) {
      path.unshift(node);
      node = prev[node];
    }

    // Estimate walk time: base 30s per zone + congestion penalty
    const totalTime = path.reduce((sum, zoneId) => {
      const d = densityMap[zoneId] || 0;
      return sum + 30 + d * 60;
    }, 0);

    return {
      from,
      to,
      path,
      steps: path.length,
      estimatedTimeSec: Math.round(totalTime),
      estimatedTimeMin: parseFloat((totalTime / 60).toFixed(1)),
      congestionScore: parseFloat((dist[to] / path.length).toFixed(2))
    };
  }
}

module.exports = RoutingAgent;
