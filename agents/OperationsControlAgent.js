/**
 * OperationsControlAgent — Generates admin-level action suggestions
 * based on aggregated agent outputs.
 */
const BaseAgent = require('./BaseAgent');
const { v4: uuidv4 } = require('uuid');

class OperationsControlAgent extends BaseAgent {
  constructor() {
    super('OperationsControlAgent');
  }

  async process(input) {
    const { monitoringData, predictionData, queueData, notificationData } = input;
    const actions = [];

    // 1. Gate management based on density
    if (monitoringData && monitoringData.zones) {
      const gateZones = monitoringData.zones.filter(z => z.type === 'gate');
      gateZones.forEach(gate => {
        if (gate.density > 0.8) {
          actions.push({
            id: uuidv4(),
            category: 'gates',
            priority: 'high',
            action: `Open additional lanes at ${gate.label}`,
            reason: `${gate.label} at ${Math.round(gate.density * 100)}% capacity`,
            impact: 'Reduces entry bottleneck by ~30%',
            zoneId: gate.id
          });
        }
      });
    }

    // 2. Staff deployment suggestions
    if (predictionData && predictionData.congestingZones) {
      predictionData.congestingZones.forEach(zoneId => {
        const zone = monitoringData.zones.find(z => z.id === zoneId);
        if (zone) {
          actions.push({
            id: uuidv4(),
            category: 'staffing',
            priority: zone.density > 0.85 ? 'critical' : 'medium',
            action: `Deploy crowd control staff to ${zone.label}`,
            reason: `Predicted congestion — density heading to ${Math.round((predictionData.predictions.find(p => p.zoneId === zoneId)?.predictedDensity || 0) * 100)}%`,
            impact: 'Improves flow and prevents bottlenecks',
            zoneId
          });
        }
      });
    }

    // 3. Service point adjustments from queue data
    if (queueData && queueData.queues) {
      queueData.queues.forEach(q => {
        if (q.optimalCounters > q.activeCounters) {
          actions.push({
            id: uuidv4(),
            category: 'services',
            priority: q.urgency === 'critical' ? 'critical' : 'medium',
            action: `${q.recommendation} at ${q.label}`,
            reason: `Queue: ${q.queueLength} people, wait: ${q.estimatedWaitMin} min`,
            impact: `Could reduce wait to ${q.optimizedWaitMin} min`,
            zoneId: q.zoneId
          });
        }
      });
    }

    // 4. Phase-based preparedness
    if (predictionData && predictionData.phaseTransitionSoon) {
      const nextPhase = predictionData.nextPhase;
      const phaseActions = {
        'active':      'Ensure all seating ushers are in position',
        'halftime':    'Open all food & restroom counters, deploy concourse staff',
        'second-half': 'Begin closing halftime overflow counters',
        'post-event':  'Open all exit gates, deploy exit traffic controllers',
        'pre-event':   'Reset all zones for next event cycle'
      };
      if (phaseActions[nextPhase]) {
        actions.push({
          id: uuidv4(),
          category: 'phase-prep',
          priority: 'high',
          action: phaseActions[nextPhase],
          reason: `Transitioning to ${nextPhase} phase soon`,
          impact: 'Proactive preparation reduces congestion spikes',
          zoneId: null
        });
      }
    }

    // 5. Emergency action if overall risk is high
    if (predictionData && predictionData.overallRisk === 'high') {
      actions.push({
        id: uuidv4(),
        category: 'emergency',
        priority: 'critical',
        action: 'Activate emergency crowd management protocol',
        reason: `${predictionData.congestingZones.length} zones at risk of congestion`,
        impact: 'Prevents dangerous overcrowding situations',
        zoneId: null
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

    return {
      actions: actions.slice(0, 15),
      summary: {
        totalActions: actions.length,
        critical: actions.filter(a => a.priority === 'critical').length,
        high: actions.filter(a => a.priority === 'high').length,
        medium: actions.filter(a => a.priority === 'medium').length
      }
    };
  }
}

module.exports = OperationsControlAgent;
