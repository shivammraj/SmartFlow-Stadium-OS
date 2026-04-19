/**
 * FeedbackLearningAgent — Evaluates prediction accuracy and adjusts weights.
 * Compares previous predictions against actual measured outcomes.
 */
const BaseAgent = require('./BaseAgent');

class FeedbackLearningAgent extends BaseAgent {
  constructor() {
    super('FeedbackLearningAgent');
    this.previousPredictions = null;
    this.accuracyHistory = [];
    this.maxHistory = 50;
  }

  async process(input) {
    const { monitoringData, predictionData } = input;
    let accuracy = null;
    let adjustments = null;

    // Compare previous predictions with current actuals
    if (this.previousPredictions && monitoringData && monitoringData.zones) {
      const errors = [];
      this.previousPredictions.forEach(pred => {
        const actual = monitoringData.zones.find(z => z.id === pred.zoneId);
        if (actual) {
          const error = Math.abs(pred.predictedDensity - actual.density);
          errors.push({
            zoneId: pred.zoneId,
            predicted: pred.predictedDensity,
            actual: actual.density,
            error: parseFloat(error.toFixed(3)),
            accurate: error < 0.15 // within 15% is "accurate"
          });
        }
      });

      const avgError = errors.length > 0
        ? errors.reduce((s, e) => s + e.error, 0) / errors.length
        : 0;
      const accurateCount = errors.filter(e => e.accurate).length;
      const accuracyRate = errors.length > 0 ? accurateCount / errors.length : 0;

      accuracy = {
        avgError: parseFloat(avgError.toFixed(3)),
        accuracyRate: parseFloat(accuracyRate.toFixed(3)),
        accurateCount,
        totalZones: errors.length,
        details: errors
      };

      this.accuracyHistory.push({
        timestamp: Date.now(),
        avgError,
        accuracyRate
      });
      if (this.accuracyHistory.length > this.maxHistory) {
        this.accuracyHistory.shift();
      }

      // Suggest weight adjustments based on accuracy
      if (accuracyRate < 0.5) {
        adjustments = {
          trend: 0.3,       // reduce trend reliance
          phaseBias: 0.4,   // lean more on phase patterns
          current: 0.3
        };
      } else if (accuracyRate < 0.7) {
        adjustments = {
          trend: 0.35,
          phaseBias: 0.35,
          current: 0.3
        };
      }
      // else keep current weights (null means no change)
    }

    // Store current predictions for next comparison
    if (predictionData && predictionData.predictions) {
      this.previousPredictions = predictionData.predictions;
    }

    // Calculate rolling accuracy
    const rollingAccuracy = this.accuracyHistory.length > 0
      ? parseFloat((this.accuracyHistory.reduce((s, h) => s + h.accuracyRate, 0) / this.accuracyHistory.length).toFixed(3))
      : null;

    return {
      currentAccuracy: accuracy,
      weightAdjustments: adjustments,
      rollingAccuracy,
      samplesCollected: this.accuracyHistory.length,
      systemHealth: rollingAccuracy === null ? 'warming-up'
        : rollingAccuracy > 0.7 ? 'excellent'
        : rollingAccuracy > 0.5 ? 'good'
        : 'needs-tuning'
    };
  }
}

module.exports = FeedbackLearningAgent;
