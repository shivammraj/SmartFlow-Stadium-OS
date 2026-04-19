/**
 * DecisionEngine — Multi-Agent AI system simulation
 * Predicts congestion, optimizes routes, and makes operational decisions.
 */
import Utils from '../js/utils.js';
import { DataGenerator } from '../simulation/DataGenerator.js';

export const DecisionEngine = {
  adjacency: {},

  init() {
    this._buildAdjacency();
  },

  _buildAdjacency() {
    const zones = DataGenerator.ZONES;
    zones.forEach(z => {
      this.adjacency[z.id] = zones
        .filter(n => Math.abs(n.row - z.row) + Math.abs(n.col - z.col) === 1)
        .map(n => n.id);
    });
  },

  process(rawData) {
    const start = performance.now();
    
    // 1. Predictions Agent
    const predictionData = this.predictCongestion(rawData.zones);
    
    // 2. Queue Optimization Agent
    const queueData = this.optimizeQueues(rawData.queues);
    
    // 3. Operational Decisions Agent
    const decisions = this.generateDecisions(rawData, predictionData, queueData);

    const pipelineMs = Math.round(performance.now() - start);

    return {
      pipelineRun: rawData.pipelineRun,
      pipelineMs,
      timestamp: new Date().toISOString(),
      monitoring: {
        zones: rawData.zones,
        summary: {
          phase: rawData.phase,
          phaseProgress: rawData.phaseProgress,
          totalPeople: rawData.totalPeople,
          redZones: rawData.zones.filter(z => z.status === 'red').map(z => z.id),
          yellowZones: rawData.zones.filter(z => z.status === 'yellow').map(z => z.id)
        }
      },
      predictions: predictionData,
      queues: queueData,
      decisions,
      feedback: {
        systemHealth: predictionData.overallRisk === 'high' ? 'needs-tuning' : 'excellent'
      }
    };
  },

  predictCongestion(zones) {
    const predictions = zones.map(zone => {
      const currentDensity = zone.density;
      const trendFactor = zone.trend === 'rising' ? 0.08 : zone.trend === 'falling' ? -0.06 : 0;
      const noise = (Math.random() - 0.5) * 0.05;
      const predictedDensity = Math.max(0, Math.min(1, currentDensity + trendFactor + noise));

      let riskLevel = 'low';
      if (predictedDensity > 0.85) riskLevel = 'critical';
      else if (predictedDensity > 0.7) riskLevel = 'high';
      else if (predictedDensity > 0.5) riskLevel = 'medium';

      return { zoneId: zone.id, predictedDensity: parseFloat(predictedDensity.toFixed(3)), riskLevel };
    });

    const congestingZones = predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
    const overallRisk = congestingZones.length > 4 ? 'high' : congestingZones.length > 1 ? 'medium' : 'low';

    return { zones: predictions, congestingZones, overallRisk };
  },

  optimizeQueues(queues) {
    // Find recommendations and fastest queue
    let minWait = Infinity;
    let fastestQueueId = null;

    const optimized = queues.map(q => {
      const optimalCounters = Math.min(q.totalCounters, Math.ceil(q.queueLength / 3));
      const optimizedWait = optimalCounters > q.activeCounters
        ? parseFloat(((q.queueLength * 45) / optimalCounters / 60).toFixed(1))
        : null;

      let urgency = 'normal';
      if (q.estimatedWaitMin > 15) urgency = 'critical';
      else if (q.estimatedWaitMin > 8) urgency = 'high';

      if (q.estimatedWaitMin < minWait && q.id.includes('food')) {
        minWait = q.estimatedWaitMin;
        fastestQueueId = q.id;
      }

      return {
        ...q,
        optimalCounters,
        optimizedWaitMin: optimizedWait,
        urgency,
        recommendation: optimalCounters > q.activeCounters
          ? `Deploy ${optimalCounters - q.activeCounters} more staff`
          : 'Staffing optimal'
      };
    });
    
    // Highlight the absolute fastest
    if (fastestQueueId) {
      const fq = optimized.find(q => q.id === fastestQueueId);
      fq.isRecommended = true; // highlight flag
    }

    return { queues: optimized };
  },

  generateDecisions(rawData, predictionData, queueData) {
    const actions = [];
    const redZones = rawData.zones.filter(z => z.status === 'red');

    // 1. Resolve active crises
    redZones.forEach(zone => {
      actions.push({
        category: '🚦 Crowd Control',
        priority: 'critical',
        action: `Redirecting users away from ${zone.label}`,
        reason: `Zone capacity breached (${Math.round(zone.density * 100)}%)`,
        impact: 'Reducing localized pressure'
      });
    });

    // 2. Proactive forecasting
    predictionData.congestingZones.slice(0, 2).forEach(pred => {
      const zone = rawData.zones.find(z => z.id === pred.zoneId);
      if (zone && zone.status !== 'red') {
        actions.push({
          category: '🔮 AI Prediction',
          priority: 'warning',
          action: `Pre-position security at ${zone.label}`,
          reason: `Congestion predicted in 5 mins (${Math.round(pred.predictedDensity * 100)}%)`,
          impact: 'Prevent overcrowding'
        });
      }
    });

    // 3. Queue Optimization
    queueData.queues.filter(q => q.optimalCounters > q.activeCounters && q.urgency === 'critical').forEach(q => {
      actions.push({
        category: '⚡ Queue Agent',
        priority: 'critical',
        action: q.recommendation + ` at ${q.label}`,
        reason: `Wait time unacceptable: ${q.estimatedWaitMin} min`,
        impact: 'Reduce bottleneck'
      });
    });

    return { actions };
  },

  // Smart Routing Engine
  computeRoute(from, to, zones) {
    const zoneDensities = {};
    zones.forEach(z => { zoneDensities[z.id] = z.density; });

    const dist = {};
    const prev = {};
    const visited = new Set();
    const allIds = DataGenerator.ZONES.map(z => z.id);

    allIds.forEach(id => { dist[id] = Infinity; prev[id] = null; });
    dist[from] = 0;

    while (true) {
      let u = null;
      let minDist = Infinity;
      for (const id of allIds) {
        if (!visited.has(id) && dist[id] < minDist) {
          minDist = dist[id];
          u = id;
        }
      }
      if (u === null || u === to) break;
      visited.add(u);

      for (const neighbor of (this.adjacency[u] || [])) {
        if (visited.has(neighbor)) continue;
        const density = zoneDensities[neighbor] || 0;
        
        // AI Penalty logic: Exponential penalty for dense zones to FORCE alternative routes
        let penalty = 1;
        if (density > 0.8) penalty = 20; // avoid red
        else if (density > 0.5) penalty = 5; // avoid yellow

        const weight = 1 + penalty; 
        const alt = dist[u] + weight;
        if (alt < dist[neighbor]) {
          dist[neighbor] = alt;
          prev[neighbor] = u;
        }
      }
    }

    const path = [];
    let cur = to;
    while (cur) {
      path.unshift(cur);
      cur = prev[cur];
    }

    if (path[0] !== from) return null;

    const congestionScore = parseFloat((path.reduce((s, id) => s + (zoneDensities[id] || 0), 0) / path.length).toFixed(2));
    
    // Generate AI Reason
    let reason = "Direct route.";
    if (congestionScore < 0.4 && path.length > 2) reason = "Slightly longer, but avoids crowded zones.";
    if (congestionScore > 0.7) reason = "Only available route. Proceed with caution.";

    return {
      path,
      steps: path.length,
      estimatedTimeMin: parseFloat((path.length * 1.5 + congestionScore * 2).toFixed(1)),
      congestionScore,
      reason
    };
  }
};
