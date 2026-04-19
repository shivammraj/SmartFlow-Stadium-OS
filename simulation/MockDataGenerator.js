/**
 * MockDataGenerator — Simulates realistic stadium crowd data.
 *
 * Stadium layout (4x4 grid):
 *   Row 0: Gate-N | Concourse-NW | Concourse-NE | Gate-E
 *   Row 1: Food-W | Seating-NW   | Seating-NE   | Restroom-E
 *   Row 2: Restroom-W | Seating-SW | Seating-SE  | Food-E
 *   Row 3: Gate-W | Concourse-SW | Concourse-SE | Gate-S
 *
 * Phases cycle automatically for demo purposes.
 */

const ZONES = [
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
];

// Adjacency map — each zone connects to its grid neighbors
const ADJACENCY = {};
ZONES.forEach(z => {
  ADJACENCY[z.id] = ZONES
    .filter(n => Math.abs(n.row - z.row) + Math.abs(n.col - z.col) === 1)
    .map(n => n.id);
});

const PHASES = [
  { name: 'pre-event',    durationSec: 30 },
  { name: 'active',       durationSec: 60 },
  { name: 'halftime',     durationSec: 30 },
  { name: 'second-half',  durationSec: 60 },
  { name: 'post-event',   durationSec: 30 },
];

// Target density ratios per zone type per phase (fraction of capacity)
const PHASE_TARGETS = {
  'pre-event':   { gate: 0.85, concourse: 0.6,  seating: 0.15, food: 0.2,  restroom: 0.15 },
  'active':      { gate: 0.1,  concourse: 0.2,  seating: 0.9,  food: 0.15, restroom: 0.1  },
  'halftime':    { gate: 0.1,  concourse: 0.5,  seating: 0.5,  food: 0.9,  restroom: 0.85 },
  'second-half': { gate: 0.08, concourse: 0.15, seating: 0.88, food: 0.12, restroom: 0.08 },
  'post-event':  { gate: 0.9,  concourse: 0.7,  seating: 0.2,  food: 0.05, restroom: 0.05 },
};

// Queue service points
const QUEUE_POINTS = [
  { id: 'food-w-q',     zoneId: 'food-w',     label: 'Food West Counter',    counters: 4 },
  { id: 'food-e-q',     zoneId: 'food-e',     label: 'Food East Counter',    counters: 4 },
  { id: 'restroom-w-q', zoneId: 'restroom-w', label: 'Restroom West',        counters: 6 },
  { id: 'restroom-e-q', zoneId: 'restroom-e', label: 'Restroom East',        counters: 6 },
];

class MockDataGenerator {
  constructor() {
    this.startTime = Date.now();
    this.zones = JSON.parse(JSON.stringify(ZONES));
    this.currentDensities = {};
    this.zones.forEach(z => { this.currentDensities[z.id] = 0; });
  }

  /** Get current event phase based on elapsed time */
  getCurrentPhase() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    let acc = 0;
    const totalCycle = PHASES.reduce((s, p) => s + p.durationSec, 0);
    const cyclePos = elapsed % totalCycle;
    for (const phase of PHASES) {
      acc += phase.durationSec;
      if (cyclePos < acc) {
        const phaseElapsed = cyclePos - (acc - phase.durationSec);
        const phaseProgress = phaseElapsed / phase.durationSec;
        return { name: phase.name, progress: phaseProgress, elapsed, cycle: Math.floor(elapsed / totalCycle) };
      }
    }
    return { name: PHASES[0].name, progress: 0, elapsed, cycle: 0 };
  }

  /** Generate crowd density snapshot */
  generateCrowdData() {
    const phase = this.getCurrentPhase();
    const targets = PHASE_TARGETS[phase.name];
    const zoneData = this.zones.map(zone => {
      const target = targets[zone.type] * zone.capacity;
      // Smoothly move current density toward target with some noise
      const current = this.currentDensities[zone.id] || 0;
      const noise = (Math.random() - 0.5) * zone.capacity * 0.08;
      const lerp = 0.15; // smoothing factor
      const newDensity = Math.max(0, Math.min(zone.capacity,
        current + (target - current) * lerp + noise
      ));
      this.currentDensities[zone.id] = Math.round(newDensity);
      const ratio = newDensity / zone.capacity;
      let status = 'green';
      if (ratio > 0.75) status = 'red';
      else if (ratio > 0.5) status = 'yellow';
      return {
        id: zone.id,
        label: zone.label,
        type: zone.type,
        row: zone.row,
        col: zone.col,
        capacity: zone.capacity,
        currentCount: Math.round(newDensity),
        density: parseFloat(ratio.toFixed(3)),
        status
      };
    });
    return { phase, zones: zoneData, timestamp: new Date().toISOString() };
  }

  /** Generate queue data */
  generateQueueData() {
    const phase = this.getCurrentPhase();
    const targets = PHASE_TARGETS[phase.name];
    return QUEUE_POINTS.map(qp => {
      const zone = this.zones.find(z => z.id === qp.zoneId);
      const demandRatio = targets[zone.type];
      const queueLength = Math.round(demandRatio * 40 + (Math.random() - 0.3) * 15);
      const avgServiceTime = 45 + Math.random() * 30; // seconds per person
      const activeCounters = Math.max(1, Math.min(qp.counters,
        Math.ceil(queueLength / 5)
      ));
      const waitTime = Math.round((Math.max(0, queueLength) * avgServiceTime) / activeCounters);
      return {
        id: qp.id,
        zoneId: qp.zoneId,
        label: qp.label,
        queueLength: Math.max(0, queueLength),
        activeCounters,
        totalCounters: qp.counters,
        estimatedWaitSec: waitTime,
        estimatedWaitMin: parseFloat((waitTime / 60).toFixed(1))
      };
    });
  }

  /** Get zone adjacency map */
  getAdjacency() { return ADJACENCY; }

  /** Get all zone definitions */
  getZones() { return ZONES; }
}

module.exports = MockDataGenerator;
