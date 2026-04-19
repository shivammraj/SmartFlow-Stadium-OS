/**
 * CrowdMonitoringAgent — Processes raw simulation data into zone-level density metrics.
 * Tracks historical data for trend analysis.
 */
const BaseAgent = require('./BaseAgent');

class CrowdMonitoringAgent extends BaseAgent {
  constructor() {
    super('CrowdMonitoringAgent');
    this.history = []; // rolling window of snapshots
    this.maxHistory = 30; // keep last 30 snapshots (~2.5 min at 5s intervals)
  }

  async process(input) {
    const { zones, phase } = input;

    // Store history
    this.history.push({
      timestamp: Date.now(),
      phase: phase.name,
      densities: zones.reduce((acc, z) => { acc[z.id] = z.density; return acc; }, {})
    });
    if (this.history.length > this.maxHistory) this.history.shift();

    // Calculate trends (rising/stable/falling) for each zone
    const trends = {};
    zones.forEach(zone => {
      if (this.history.length < 3) {
        trends[zone.id] = 'stable';
        return;
      }
      const recent = this.history.slice(-5).map(h => h.densities[zone.id] || 0);
      const avgRecent = recent.reduce((s, v) => s + v, 0) / recent.length;
      const older = this.history.slice(-10, -5).map(h => h.densities[zone.id] || 0);
      if (older.length === 0) { trends[zone.id] = 'stable'; return; }
      const avgOlder = older.reduce((s, v) => s + v, 0) / older.length;
      const diff = avgRecent - avgOlder;
      if (diff > 0.05) trends[zone.id] = 'rising';
      else if (diff < -0.05) trends[zone.id] = 'falling';
      else trends[zone.id] = 'stable';
    });

    // Compute summary stats
    const densities = zones.map(z => z.density);
    const avgDensity = densities.reduce((s, v) => s + v, 0) / densities.length;
    const redZones = zones.filter(z => z.status === 'red').map(z => z.id);
    const yellowZones = zones.filter(z => z.status === 'yellow').map(z => z.id);
    const totalPeople = zones.reduce((s, z) => s + z.currentCount, 0);

    return {
      zones: zones.map(z => ({
        ...z,
        trend: trends[z.id]
      })),
      summary: {
        totalPeople,
        avgDensity: parseFloat(avgDensity.toFixed(3)),
        redZones,
        yellowZones,
        greenZoneCount: zones.length - redZones.length - yellowZones.length,
        phase: phase.name,
        phaseProgress: parseFloat(phase.progress.toFixed(2))
      },
      historyLength: this.history.length
    };
  }
}

module.exports = CrowdMonitoringAgent;
