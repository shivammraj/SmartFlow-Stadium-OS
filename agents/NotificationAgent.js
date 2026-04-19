/**
 * NotificationAgent — Generates prioritized alerts based on predictions,
 * routing analysis, and queue data.
 */
const BaseAgent = require('./BaseAgent');
const { v4: uuidv4 } = require('uuid');

class NotificationAgent extends BaseAgent {
  constructor() {
    super('NotificationAgent');
    this.activeNotifications = [];
    this.maxNotifications = 20;
  }

  async process(input) {
    const { predictionData, queueData, monitoringData } = input;
    const newNotifications = [];

    // 1. Congestion alerts from prediction agent
    if (predictionData && predictionData.predictions) {
      predictionData.predictions
        .filter(p => p.riskLevel === 'critical')
        .forEach(p => {
          newNotifications.push({
            id: uuidv4(),
            type: 'congestion',
            severity: 'critical',
            title: `Critical congestion: ${p.label}`,
            message: `${p.label} is at ${Math.round(p.currentDensity * 100)}% capacity and rising. Predicted to reach ${Math.round(p.predictedDensity * 100)}%.`,
            zoneId: p.zoneId,
            timestamp: new Date().toISOString(),
            actionable: true
          });
        });

      predictionData.predictions
        .filter(p => p.riskLevel === 'high' && p.trend === 'rising')
        .forEach(p => {
          newNotifications.push({
            id: uuidv4(),
            type: 'warning',
            severity: 'warning',
            title: `Rising crowd: ${p.label}`,
            message: `${p.label} density trending up — currently ${Math.round(p.currentDensity * 100)}%.`,
            zoneId: p.zoneId,
            timestamp: new Date().toISOString(),
            actionable: false
          });
        });
    }

    // 2. Phase transition alerts
    if (predictionData && predictionData.phaseTransitionSoon) {
      newNotifications.push({
        id: uuidv4(),
        type: 'phase',
        severity: 'info',
        title: `Phase changing soon → ${predictionData.nextPhase}`,
        message: `Prepare for ${predictionData.nextPhase} phase. Adjust staffing and open relevant service points.`,
        zoneId: null,
        timestamp: new Date().toISOString(),
        actionable: true
      });
    }

    // 3. Queue alerts
    if (queueData && queueData.queues) {
      queueData.queues
        .filter(q => q.urgency === 'critical')
        .forEach(q => {
          newNotifications.push({
            id: uuidv4(),
            type: 'queue',
            severity: 'critical',
            title: `Long queue: ${q.label}`,
            message: `Wait time ${q.estimatedWaitMin} min (${q.queueLength} people). ${q.recommendation}.`,
            zoneId: q.zoneId,
            timestamp: new Date().toISOString(),
            actionable: true
          });
        });

      // Redirect suggestions
      if (queueData.redirectSuggestions) {
        queueData.redirectSuggestions.forEach(r => {
          newNotifications.push({
            id: uuidv4(),
            type: 'redirect',
            severity: 'info',
            title: `Redirect ${r.type} traffic`,
            message: `Move visitors from ${r.from} to ${r.to}. Could save ~${r.timeSavedMin} min per person.`,
            zoneId: null,
            timestamp: new Date().toISOString(),
            actionable: true
          });
        });
      }
    }

    // 4. Overall risk alert
    if (predictionData && predictionData.overallRisk === 'high') {
      newNotifications.push({
        id: uuidv4(),
        type: 'system',
        severity: 'critical',
        title: 'High overall congestion risk',
        message: `${predictionData.congestingZones.length} zones predicted to congest. Consider emergency crowd control measures.`,
        zoneId: null,
        timestamp: new Date().toISOString(),
        actionable: true
      });
    }

    // Merge and trim
    this.activeNotifications = [...newNotifications, ...this.activeNotifications]
      .slice(0, this.maxNotifications);

    return {
      newNotifications,
      allNotifications: this.activeNotifications,
      counts: {
        critical: this.activeNotifications.filter(n => n.severity === 'critical').length,
        warning: this.activeNotifications.filter(n => n.severity === 'warning').length,
        info: this.activeNotifications.filter(n => n.severity === 'info').length,
        total: this.activeNotifications.length
      }
    };
  }
}

module.exports = NotificationAgent;
