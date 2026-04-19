/**
 * DataGenerator — Simulates realistic raw crowd and queue data.
 */
import Utils from '../js/utils.js';

export const DataGenerator = {
  startTime: Date.now(),
  pipelineRun: 0,
  currentDensities: {},

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
    { id: 'food-w-q',     zoneId: 'food-w',     label: 'Food West Stalls',   counters: 4 },
    { id: 'food-e-q',     zoneId: 'food-e',     label: 'Food East Stalls',   counters: 4 },
    { id: 'restroom-w-q', zoneId: 'restroom-w', label: 'Restroom West',      counters: 6 },
    { id: 'restroom-e-q', zoneId: 'restroom-e', label: 'Restroom East',      counters: 6 },
  ],

  init() {
    this.ZONES.forEach(z => { this.currentDensities[z.id] = 0; });
  },

  getCurrentPhase() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    let acc = 0;
    const totalCycle = this.PHASES.reduce((s, p) => s + p.durationSec, 0);
    const cyclePos = elapsed % totalCycle;
    for (const phase of this.PHASES) {
      acc += phase.durationSec;
      if (cyclePos < acc) {
        return { name: phase.name, progress: (cyclePos - (acc - phase.durationSec)) / phase.durationSec };
      }
    }
    return { name: this.PHASES[0].name, progress: 0 };
  },

  generateRawData() {
    this.pipelineRun++;
    const phase = this.getCurrentPhase();
    const targets = this.PHASE_TARGETS[phase.name];

    // Generate Zones
    const zones = this.ZONES.map(zone => {
      const target = targets[zone.type] * zone.capacity;
      const current = this.currentDensities[zone.id] || 0;
      const noise = (Math.random() - 0.5) * zone.capacity * 0.08;
      const newDensity = Math.max(0, Math.min(zone.capacity, current + (target - current) * 0.15 + noise));
      this.currentDensities[zone.id] = Math.round(newDensity);
      
      const ratio = newDensity / zone.capacity;
      let status = 'green';
      if (ratio > 0.75) status = 'red';
      else if (ratio > 0.5) status = 'yellow';

      let trend = 'stable';
      const delta = newDensity - current;
      if (delta > zone.capacity * 0.02) trend = 'rising';
      else if (delta < -zone.capacity * 0.02) trend = 'falling';

      return {
        id: zone.id, label: zone.label, type: zone.type, row: zone.row, col: zone.col,
        capacity: zone.capacity, currentCount: Math.round(newDensity),
        density: parseFloat(ratio.toFixed(3)), status, trend
      };
    });

    const totalPeople = zones.reduce((s, z) => s + z.currentCount, 0);

    // Generate Queues
    const queues = this.QUEUE_POINTS.map(qp => {
      const zone = this.ZONES.find(z => z.id === qp.zoneId);
      const demandRatio = targets[zone.type];
      const queueLength = Math.max(0, Math.round(demandRatio * 40 + (Math.random() - 0.3) * 15));
      const avgServiceTime = 45 + Math.random() * 30; // seconds
      const activeCounters = Math.max(1, Math.min(qp.counters, Math.ceil(queueLength / 6)));
      const waitTimeSec = Math.round((queueLength * avgServiceTime) / activeCounters);
      
      return {
        id: qp.id, zoneId: qp.zoneId, label: qp.label,
        queueLength, activeCounters, totalCounters: qp.counters,
        estimatedWaitSec: waitTimeSec,
        estimatedWaitMin: parseFloat((waitTimeSec / 60).toFixed(1))
      };
    });

    return {
      pipelineRun: this.pipelineRun,
      phase: phase.name,
      phaseProgress: phase.progress,
      totalPeople,
      zones,
      queues
    };
  }
};
