/**
 * QueueOptimizationAgent — Analyzes queue lengths and suggests counter reallocation.
 * Balances load across service points to minimize overall wait time.
 */
const BaseAgent = require('./BaseAgent');

class QueueOptimizationAgent extends BaseAgent {
  constructor() {
    super('QueueOptimizationAgent');
  }

  async process(input) {
    const { queues, crowdZones } = input;

    const optimized = queues.map(q => {
      // Find matching zone density
      const zone = crowdZones ? crowdZones.find(z => z.id === q.zoneId) : null;
      const zoneDensity = zone ? zone.density : 0.5;

      // Optimal counter allocation based on queue length and zone density
      const demandScore = (q.queueLength / 30) * 0.6 + zoneDensity * 0.4;
      const optimalCounters = Math.max(1, Math.min(q.totalCounters,
        Math.ceil(demandScore * q.totalCounters)
      ));

      // Recalculate wait time with optimal counters
      const avgServiceTime = q.estimatedWaitSec * q.activeCounters / Math.max(1, q.queueLength);
      const optimizedWaitSec = Math.round(
        (q.queueLength * (isFinite(avgServiceTime) ? avgServiceTime : 50)) / optimalCounters
      );

      const timeSaved = Math.max(0, q.estimatedWaitSec - optimizedWaitSec);

      let urgency = 'normal';
      if (q.estimatedWaitMin > 15) urgency = 'critical';
      else if (q.estimatedWaitMin > 8) urgency = 'high';
      else if (q.estimatedWaitMin > 4) urgency = 'moderate';

      return {
        ...q,
        optimalCounters,
        optimizedWaitSec,
        optimizedWaitMin: parseFloat((optimizedWaitSec / 60).toFixed(1)),
        timeSavedSec: timeSaved,
        urgency,
        recommendation: optimalCounters > q.activeCounters
          ? `Open ${optimalCounters - q.activeCounters} more counter(s)`
          : optimalCounters < q.activeCounters
          ? `Can close ${q.activeCounters - optimalCounters} counter(s)`
          : 'Current allocation is optimal'
      };
    });

    // Cross-queue load balancing: suggest redirect from long to short queues
    const redirectSuggestions = [];
    const foodQueues = optimized.filter(q => q.zoneId.startsWith('food'));
    const restroomQueues = optimized.filter(q => q.zoneId.startsWith('restroom'));

    [foodQueues, restroomQueues].forEach(group => {
      if (group.length < 2) return;
      const sorted = [...group].sort((a, b) => a.queueLength - b.queueLength);
      const shortest = sorted[0];
      const longest = sorted[sorted.length - 1];
      if (longest.queueLength - shortest.queueLength > 8) {
        redirectSuggestions.push({
          type: longest.zoneId.startsWith('food') ? 'food' : 'restroom',
          from: longest.label,
          to: shortest.label,
          peopleDiff: longest.queueLength - shortest.queueLength,
          timeSavedMin: parseFloat(((longest.estimatedWaitMin - shortest.estimatedWaitMin) / 2).toFixed(1))
        });
      }
    });

    return {
      queues: optimized,
      redirectSuggestions,
      totalCurrentWaitMin: parseFloat(optimized.reduce((s, q) => s + q.estimatedWaitMin, 0).toFixed(1)),
      totalOptimizedWaitMin: parseFloat(optimized.reduce((s, q) => s + q.optimizedWaitMin, 0).toFixed(1))
    };
  }
}

module.exports = QueueOptimizationAgent;
