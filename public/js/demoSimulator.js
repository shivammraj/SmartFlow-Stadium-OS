/**
 * DemoSimulator — Client-side simulation for GitHub Pages (no backend needed).
 * Mirrors the server-side MockDataGenerator + Agent Pipeline to produce
 * realistic live data entirely in the browser.
 */
const DemoSimulator = {
  startTime: Date.now(),
  pipelineRun: 0,
  currentDensities: {},
  intervalId: null,

  // ── Zone Definitions ──────────────────────────────────
  ZONES: [
    { id: 'gate-n',        row: 0, col: 0, type: 'gate',      label: 'Gate North',       capacity: 500 },
    { id: 'concourse-nw',  row: 0, col: 1, type: 'concourse', label: 'Concourse NW',     capacity: 400 },
    { id: 'concourse-ne',  row: 0, col: 2, type: 'concourse', label: 'Concourse NE',     capacity: 400 },
    { id: 'gate-e',        row: 0, col: 3, type: 'gate',      label: 'Gate East',        capacity: 500 },
    { id: 'food-w',        row: 1, col: 0, type: 'food',      label: 'Food Court West',  capacity: 300 },
    { id: 'seating-nw',    row: 1, col: 1, type: 'seating',   label: 'Seating NW',       capacity: 800 },
    { id: 'seating-ne',    row: 1, col: 2, type: 'seating',   label: 'Seating NE',       capacity: 800 },
    { id: 'restroom-e',    row: 1, col: 3, type: 'restroom',  label: 'Restroom East',    capacity: 200 },
    { id: 'restroom-w',    row: 2, col: 0, type: 'restroom',  label: 'Restroom West',    capacity: 200 },
    { id: 'seating-sw',    row: 2, col: 1, type: 'seating',   label: 'Seating SW',       capacity: 800 },
    { id: 'seating-se',    row: 2, col: 2, type: 'seating',   label: 'Seating SE',       capacity: 800 },
    { id: 'food-e',        row: 2, col: 3, type: 'food',      label: 'Food Court East',  capacity: 300 },
    { id: 'gate-w',        row: 3, col: 0, type: 'gate',      label: 'Gate West',        capacity: 500 },
    { id: 'concourse-sw',  row: 3, col: 1, type: 'concourse', label: 'Concourse SW',     capacity: 400 },
    { id: 'concourse-se',  row: 3, col: 2, type: 'concourse', label: 'Concourse SE',     capacity: 400 },
    { id: 'gate-s',        row: 3, col: 3, type: 'gate',      label: 'Gate South',       capacity: 500 },
  ],

  PHASES: [
    { name: 'pre-event',    durationSec: 30 },
    { name: 'active',       durationSec: 60 },
    { name: 'halftime',     durationSec: 30 },
    { name: 'second-half',  durationSec: 60 },
    { name: 'post-event',   durationSec: 30 },
  ],

  PHASE_TARGETS: {
    'pre-event':   { gate: 0.85, concourse: 0.6,  seating: 0.15, food: 0.2,  restroom: 0.15 },
    'active':      { gate: 0.1,  concourse: 0.2,  seating: 0.9,  food: 0.15, restroom: 0.1  },
    'halftime':    { gate: 0.1,  concourse: 0.5,  seating: 0.5,  food: 0.9,  restroom: 0.85 },
    'second-half': { gate: 0.08, concourse: 0.15, seating: 0.88, food: 0.12, restroom: 0.08 },
    'post-event':  { gate: 0.9,  concourse: 0.7,  seating: 0.2,  food: 0.05, restroom: 0.05 },
  },

  QUEUE_POINTS: [
    { id: 'food-w-q',     zoneId: 'food-w',     label: 'Food West Counter',  counters: 4 },
    { id: 'food-e-q',     zoneId: 'food-e',     label: 'Food East Counter',  counters: 4 },
    { id: 'restroom-w-q', zoneId: 'restroom-w', label: 'Restroom West',      counters: 6 },
    { id: 'restroom-e-q', zoneId: 'restroom-e', label: 'Restroom East',      counters: 6 },
  ],

  // ── Init ──────────────────────────────────────────────
  init() {
    this.ZONES.forEach(z => { this.currentDensities[z.id] = 0; });
    this._buildAdjacency();
  },

  _buildAdjacency() {
    this.adjacency = {};
    this.ZONES.forEach(z => {
      this.adjacency[z.id] = this.ZONES
        .filter(n => Math.abs(n.row - z.row) + Math.abs(n.col - z.col) === 1)
        .map(n => n.id);
    });
  },

  // ── Phase ─────────────────────────────────────────────
  getCurrentPhase() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    let acc = 0;
    const totalCycle = this.PHASES.reduce((s, p) => s + p.durationSec, 0);
    const cyclePos = elapsed % totalCycle;
    for (const phase of this.PHASES) {
      acc += phase.durationSec;
      if (cyclePos < acc) {
        const phaseElapsed = cyclePos - (acc - phase.durationSec);
        return { name: phase.name, progress: phaseElapsed / phase.durationSec };
      }
    }
    return { name: this.PHASES[0].name, progress: 0 };
  },

  // ── Crowd Data ────────────────────────────────────────
  generateCrowdData() {
    const phase = this.getCurrentPhase();
    const targets = this.PHASE_TARGETS[phase.name];

    const zones = this.ZONES.map(zone => {
      const target = targets[zone.type] * zone.capacity;
      const current = this.currentDensities[zone.id] || 0;
      const noise = (Math.random() - 0.5) * zone.capacity * 0.08;
      const newDensity = Math.max(0, Math.min(zone.capacity,
        current + (target - current) * 0.15 + noise
      ));
      this.currentDensities[zone.id] = Math.round(newDensity);
      const ratio = newDensity / zone.capacity;
      let status = 'green';
      if (ratio > 0.75) status = 'red';
      else if (ratio > 0.5) status = 'yellow';

      // Compute trend from previous
      let trend = 'stable';
      const delta = newDensity - current;
      if (delta > zone.capacity * 0.02) trend = 'rising';
      else if (delta < -zone.capacity * 0.02) trend = 'falling';

      return {
        id: zone.id, label: zone.label, type: zone.type,
        row: zone.row, col: zone.col,
        capacity: zone.capacity,
        currentCount: Math.round(newDensity),
        density: parseFloat(ratio.toFixed(3)),
        status, trend
      };
    });

    const totalPeople = zones.reduce((s, z) => s + z.currentCount, 0);
    const redZones = zones.filter(z => z.status === 'red').map(z => z.id);
    const yellowZones = zones.filter(z => z.status === 'yellow').map(z => z.id);

    return {
      zones,
      summary: {
        phase: phase.name,
        phaseProgress: phase.progress,
        totalPeople,
        totalCapacity: this.ZONES.reduce((s, z) => s + z.capacity, 0),
        redZones,
        yellowZones,
        greenZones: zones.filter(z => z.status === 'green').map(z => z.id)
      }
    };
  },

  // ── Predictions ───────────────────────────────────────
  generatePredictions(monitoringZones) {
    const predictions = monitoringZones.map(zone => {
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

    return { predictions, congestingZones, overallRisk };
  },

  // ── Queue Data ────────────────────────────────────────
  generateQueueData(crowdZones) {
    const phase = this.getCurrentPhase();
    const targets = this.PHASE_TARGETS[phase.name];

    const queues = this.QUEUE_POINTS.map(qp => {
      const zone = this.ZONES.find(z => z.id === qp.zoneId);
      const demandRatio = targets[zone.type];
      const queueLength = Math.max(0, Math.round(demandRatio * 40 + (Math.random() - 0.3) * 15));
      const avgServiceTime = 45 + Math.random() * 30;
      const activeCounters = Math.max(1, Math.min(qp.counters, Math.ceil(queueLength / 5)));
      const waitTime = Math.round((queueLength * avgServiceTime) / activeCounters);
      const estWaitMin = parseFloat((waitTime / 60).toFixed(1));

      const optimalCounters = Math.min(qp.counters, Math.ceil(queueLength / 3));
      const optimizedWait = optimalCounters > activeCounters
        ? parseFloat(((queueLength * avgServiceTime) / optimalCounters / 60).toFixed(1))
        : null;

      let urgency = 'normal';
      if (estWaitMin > 15) urgency = 'critical';
      else if (estWaitMin > 8) urgency = 'high';

      return {
        id: qp.id, zoneId: qp.zoneId, label: qp.label,
        queueLength, activeCounters, totalCounters: qp.counters,
        estimatedWaitSec: waitTime,
        estimatedWaitMin: estWaitMin,
        optimalCounters,
        optimizedWaitMin: optimizedWait,
        urgency,
        recommendation: optimalCounters > activeCounters
          ? `Open ${optimalCounters - activeCounters} more counters`
          : 'Staffing optimal'
      };
    });

    return { queues };
  },

  // ── Notifications ─────────────────────────────────────
  generateNotifications(monitoringData, predictionData, queueData) {
    const notifs = [];
    const now = new Date().toISOString();

    // Red zone alerts
    monitoringData.summary.redZones.forEach(zoneId => {
      const zone = monitoringData.zones.find(z => z.id === zoneId);
      notifs.push({
        id: `crowd-${zoneId}`,
        severity: 'critical',
        title: `High density: ${zone.label}`,
        message: `${zone.label} is at ${Math.round(zone.density * 100)}% capacity. Consider crowd diversion.`,
        timestamp: now,
        audience: 'operations'
      });
    });

    // Prediction warnings
    predictionData.congestingZones.slice(0, 3).forEach(pred => {
      const zone = monitoringData.zones.find(z => z.id === pred.zoneId);
      if (zone && zone.status !== 'red') {
        notifs.push({
          id: `pred-${pred.zoneId}`,
          severity: 'warning',
          title: `Congestion predicted: ${zone.label}`,
          message: `Forecast shows ${Math.round(pred.predictedDensity * 100)}% density in 5-10 minutes.`,
          timestamp: now,
          audience: 'operations'
        });
      }
    });

    // Queue alerts
    queueData.queues.filter(q => q.urgency === 'critical').forEach(q => {
      notifs.push({
        id: `queue-${q.id}`,
        severity: 'warning',
        title: `Long wait: ${q.label}`,
        message: `Estimated wait time is ${q.estimatedWaitMin} minutes. ${q.recommendation}.`,
        timestamp: now,
        audience: 'staff'
      });
    });

    // Phase info
    const phase = this.getCurrentPhase();
    if (phase.progress < 0.1 || phase.progress > 0.9) {
      notifs.push({
        id: `phase-${phase.name}`,
        severity: 'info',
        title: phase.progress < 0.1 ? `Phase started: ${Utils.formatPhase(phase.name)}` : `Phase ending: ${Utils.formatPhase(phase.name)}`,
        message: phase.progress < 0.1 ? 'New event phase has begun. Adjusting monitoring parameters.' : 'Current phase is about to transition.',
        timestamp: now,
        audience: 'all'
      });
    }

    const counts = {
      critical: notifs.filter(n => n.severity === 'critical').length,
      warning: notifs.filter(n => n.severity === 'warning').length,
      info: notifs.filter(n => n.severity === 'info').length,
      total: notifs.length
    };

    return { allNotifications: notifs, counts };
  },

  // ── Operations ────────────────────────────────────────
  generateOperations(monitoringData, predictionData, queueData) {
    const actions = [];

    // Crowd control actions for red zones
    monitoringData.summary.redZones.forEach(zoneId => {
      const zone = monitoringData.zones.find(z => z.id === zoneId);
      actions.push({
        category: '🚦 Crowd Control',
        priority: 'critical',
        action: `Divert crowd from ${zone.label}`,
        reason: `Zone at ${Math.round(zone.density * 100)}% capacity`,
        impact: 'Reduce density by redirecting to adjacent zones'
      });
    });

    // Gate actions
    if (monitoringData.summary.redZones.some(id => id.startsWith('gate'))) {
      actions.push({
        category: '🚪 Gate Management',
        priority: 'critical',
        action: 'Open overflow gates',
        reason: 'Gate zones at critical capacity',
        impact: 'Distribute entry load across multiple gates'
      });
    }

    // Staff deployment for queues
    queueData.queues.filter(q => q.optimalCounters > q.activeCounters).forEach(q => {
      actions.push({
        category: '👷 Staff Deployment',
        priority: q.urgency === 'critical' ? 'critical' : 'warning',
        action: `${q.recommendation} at ${q.label}`,
        reason: `Wait time: ${q.estimatedWaitMin} min`,
        impact: q.optimizedWaitMin ? `Reduce wait to ~${q.optimizedWaitMin} min` : 'Improve throughput'
      });
    });

    // Prediction-based proactive action
    predictionData.congestingZones.slice(0, 2).forEach(pred => {
      const zone = monitoringData.zones.find(z => z.id === pred.zoneId);
      if (zone && zone.status !== 'red') {
        actions.push({
          category: '🔮 Proactive',
          priority: 'warning',
          action: `Pre-position staff near ${zone.label}`,
          reason: `Predicted ${pred.riskLevel} risk (${Math.round(pred.predictedDensity * 100)}%)`,
          impact: 'Early intervention prevents overcrowding'
        });
      }
    });

    const summary = {
      totalActions: actions.length,
      critical: actions.filter(a => a.priority === 'critical').length,
      warning: actions.filter(a => a.priority === 'warning').length
    };

    return { actions, summary };
  },

  // ── Route (Dijkstra) ──────────────────────────────────
  computeRoute(from, to, zones) {
    const zoneDensities = {};
    zones.forEach(z => { zoneDensities[z.id] = z.density; });

    // Dijkstra's algorithm with congestion weights
    const dist = {};
    const prev = {};
    const visited = new Set();
    const allIds = this.ZONES.map(z => z.id);

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
        const weight = 1 + density * 3; // Higher density = higher cost
        const alt = dist[u] + weight;
        if (alt < dist[neighbor]) {
          dist[neighbor] = alt;
          prev[neighbor] = u;
        }
      }
    }

    // Reconstruct path
    const path = [];
    let cur = to;
    while (cur) {
      path.unshift(cur);
      cur = prev[cur];
    }

    if (path[0] !== from) return null;

    const congestionScore = parseFloat((path.reduce((s, id) => s + (zoneDensities[id] || 0), 0) / path.length).toFixed(2));

    return {
      path,
      steps: path.length,
      estimatedTimeMin: parseFloat((path.length * 1.5 + congestionScore * 2).toFixed(1)),
      congestionScore
    };
  },

  // ── Full Pipeline Run ─────────────────────────────────
  runPipeline() {
    this.pipelineRun++;
    const start = performance.now();

    // 1. Crowd Monitoring
    const monitoringData = this.generateCrowdData();
    // 2. Predictions
    const predictionData = this.generatePredictions(monitoringData.zones);
    // 3. Queues
    const queueData = this.generateQueueData(monitoringData.zones);
    // 4. Notifications
    const notificationData = this.generateNotifications(monitoringData, predictionData, queueData);
    // 5. Operations
    const operationsData = this.generateOperations(monitoringData, predictionData, queueData);

    const pipelineMs = Math.round(performance.now() - start);

    // Feedback (simulated)
    const systemHealth = predictionData.overallRisk === 'high' ? 'needs-tuning' : predictionData.overallRisk === 'medium' ? 'good' : 'excellent';

    return {
      pipelineRun: this.pipelineRun,
      pipelineMs,
      timestamp: new Date().toISOString(),
      phase: monitoringData.summary.phase,
      phaseProgress: monitoringData.summary.phaseProgress,
      monitoring: {
        zones: monitoringData.zones,
        summary: monitoringData.summary
      },
      predictions: {
        zones: predictionData.predictions,
        congestingZones: predictionData.congestingZones,
        overallRisk: predictionData.overallRisk
      },
      routing: {},
      queues: queueData,
      notifications: notificationData,
      operations: operationsData,
      feedback: {
        systemHealth,
        rollingAccuracy: 0.87 + Math.random() * 0.08,
        samplesCollected: this.pipelineRun * 16,
        currentAccuracy: { avgError: parseFloat((0.05 + Math.random() * 0.08).toFixed(3)), accuracyRate: parseFloat((0.85 + Math.random() * 0.1).toFixed(3)) }
      },
      agentPerformance: [
        { agent: 'CrowdMonitoringAgent', executionMs: 1 + Math.random() * 2, runCount: this.pipelineRun, hasError: false },
        { agent: 'PredictionAgent',      executionMs: 1 + Math.random() * 2, runCount: this.pipelineRun, hasError: false },
        { agent: 'RoutingAgent',         executionMs: 1 + Math.random() * 3, runCount: this.pipelineRun, hasError: false },
        { agent: 'QueueOptAgent',        executionMs: 1 + Math.random() * 2, runCount: this.pipelineRun, hasError: false },
        { agent: 'NotificationAgent',    executionMs: 1 + Math.random() * 2, runCount: this.pipelineRun, hasError: false },
        { agent: 'OperationsAgent',      executionMs: 1 + Math.random() * 2, runCount: this.pipelineRun, hasError: false },
        { agent: 'FeedbackAgent',        executionMs: 1 + Math.random() * 2, runCount: this.pipelineRun, hasError: false }
      ]
    };
  },

  // ── Start/Stop ────────────────────────────────────────
  start(callback) {
    this.init();
    // Run immediately, then every 5 seconds
    callback(this.runPipeline());
    this.intervalId = setInterval(() => callback(this.runPipeline()), 5000);
  },

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
};

window.DemoSimulator = DemoSimulator;
