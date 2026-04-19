/**
 * PredictionAgent — Forecasts congestion zones for the next 5-15 minutes.
 * Uses weighted moving average + event-phase awareness.
 */
const BaseAgent = require('./BaseAgent');

// Phase transition map: what comes next
const NEXT_PHASE = {
  'pre-event':   'active',
  'active':      'halftime',
  'halftime':    'second-half',
  'second-half': 'post-event',
  'post-event':  'pre-event'
};

// Which zone types get hit hardest in each phase
const PHASE_HOTSPOTS = {
  'pre-event':   ['gate'],
  'active':      ['seating'],
  'halftime':    ['food', 'restroom', 'concourse'],
  'second-half': ['seating'],
  'post-event':  ['gate', 'concourse']
};

class PredictionAgent extends BaseAgent {
  constructor() {
    super('PredictionAgent');
    this.weights = { trend: 0.4, phaseBias: 0.35, current: 0.25 };
  }

  async process(input) {
    const { zones, summary } = input;
    const currentPhase = summary.phase;
    const phaseProgress = summary.phaseProgress;
    const nextPhase = NEXT_PHASE[currentPhase];
    const upcomingHotspotTypes = PHASE_HOTSPOTS[nextPhase] || [];

    const predictions = zones.map(zone => {
      // Current density score
      const currentScore = zone.density;

      // Trend score: rising zones get +, falling get -
      let trendScore = 0;
      if (zone.trend === 'rising') trendScore = 0.2;
      else if (zone.trend === 'falling') trendScore = -0.15;

      // Phase transition bias: if approaching next phase and zone type is a hotspot
      let phaseBias = 0;
      if (phaseProgress > 0.6 && upcomingHotspotTypes.includes(zone.type)) {
        phaseBias = 0.3 * (phaseProgress - 0.6) / 0.4; // ramp up in last 40% of phase
      }

      // Composite predicted density (clamped 0-1)
      const predicted = Math.min(1, Math.max(0,
        this.weights.current * currentScore +
        this.weights.trend * (currentScore + trendScore) +
        this.weights.phaseBias * (currentScore + phaseBias)
      ));

      let riskLevel = 'low';
      if (predicted > 0.75) riskLevel = 'critical';
      else if (predicted > 0.55) riskLevel = 'high';
      else if (predicted > 0.35) riskLevel = 'moderate';

      return {
        zoneId: zone.id,
        label: zone.label,
        type: zone.type,
        currentDensity: zone.density,
        predictedDensity: parseFloat(predicted.toFixed(3)),
        trend: zone.trend,
        riskLevel,
        willCongest: predicted > 0.7,
        confidence: parseFloat((0.6 + Math.random() * 0.35).toFixed(2))
      };
    });

    const congestingZones = predictions.filter(p => p.willCongest);

    return {
      predictions,
      congestingZones: congestingZones.map(z => z.zoneId),
      nextPhase,
      phaseTransitionSoon: phaseProgress > 0.7,
      overallRisk: congestingZones.length > 4 ? 'high' : congestingZones.length > 2 ? 'moderate' : 'low'
    };
  }

  /** Update weights from feedback agent */
  adjustWeights(newWeights) {
    if (newWeights) {
      Object.assign(this.weights, newWeights);
    }
  }
}

module.exports = PredictionAgent;
