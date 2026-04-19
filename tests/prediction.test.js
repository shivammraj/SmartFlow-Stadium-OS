import { DecisionEngine } from '../public/agents/DecisionEngine.js';

describe('AI Decision Engine / Predictions', () => {
  it('should correctly predict congestion trends', () => {
    const mockZones = [
      { id: 'zone-1', density: 0.72, trend: 'rising' }, // 72% + 8% trend = 80% (high risk)
      { id: 'zone-2', density: 0.81, trend: 'rising' }, // 81% + 8% trend = 89% (critical risk)
      { id: 'zone-3', density: 0.40, trend: 'stable' }, // 40% (low risk)
      { id: 'zone-4', density: 0.60, trend: 'falling' } // 60% - 6% = 54% (medium risk)
    ];

    const predictionData = DecisionEngine.predictCongestion(mockZones);

    expect(predictionData.zones).toHaveLength(4);

    const z1 = predictionData.zones.find(z => z.zoneId === 'zone-1');
    const z2 = predictionData.zones.find(z => z.zoneId === 'zone-2');
    
    // Adding minor allowance for Math.random() noise (-0.025 to 0.025)
    expect(z1.predictedDensity).toBeGreaterThanOrEqual(0.70); 
    expect(z1.riskLevel).toBe('high');

    expect(z2.predictedDensity).toBeGreaterThan(0.85);
    expect(z2.riskLevel).toBe('critical');
    
    expect(predictionData.congestingZones).toHaveLength(2); // zone-1 and zone-2
  });

  it('should generate valid queue optimizations', () => {
    const mockQueues = [
      {
        id: 'food-w-q',
        label: 'Food West',
        queueLength: 60,
        totalCounters: 8,
        activeCounters: 2,
        estimatedWaitMin: 22.5 // critical!
      }
    ];

    const result = DecisionEngine.optimizeQueues(mockQueues);
    const q = result.queues[0];

    expect(q.optimalCounters).toBeGreaterThan(q.activeCounters);
    expect(q.urgency).toBe('critical');
    expect(q.recommendation).toContain('Deploy');
  });
});
