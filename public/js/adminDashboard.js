/**
 * AdminDashboard — Visualizes AI Decision Engine output and Queue recommendations.
 */
import Utils from './utils.js';

export const AdminDashboard = {

  updateQueues(queueData) {
    if (!queueData || !queueData.queues) return;
    const container = Utils.$('queueList');
    if (!container) return;

    if (queueData.queues.length === 0) {
      container.innerHTML = '<div class="idle-state">System idle.</div>';
      return;
    }

    container.innerHTML = queueData.queues.map(q => {
      let waitClass = 'low';
      if (q.estimatedWaitMin > 15) waitClass = 'critical';
      else if (q.estimatedWaitMin > 8) waitClass = 'high';
      else if (q.estimatedWaitMin > 4) waitClass = 'moderate';

      const isRec = q.isRecommended ? 'recommended' : '';
      const recBadge = q.isRecommended ? `<span class="queue-opt-badge" style="background:var(--green);color:#fff;">⚡ Fastest Stall</span>` : '';

      return `
        <div class="queue-item ${isRec}">
          <div class="queue-info">
            <div class="queue-name">${q.label}</div>
            <div class="queue-detail">${q.queueLength} in line · ${q.activeCounters}/${q.totalCounters} counters open</div>
            ${recBadge}
          </div>
          <div class="queue-wait">
            <div class="queue-wait-time ${waitClass}">${q.estimatedWaitMin}m</div>
            <div class="queue-wait-label">est. wait</div>
          </div>
        </div>
      `;
    }).join('');
  },

  updateOperations(opsData) {
    if (!opsData || !opsData.actions) return;
    const container = Utils.$('aiDecisionsList');
    const badge = Utils.$('aiDecisionsBadge');
    if (!container) return;

    if (badge) {
      badge.textContent = `${opsData.actions.length} Active`;
    }

    if (opsData.actions.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>AI Engine Monitoring... No active alerts.</p></div>';
      return;
    }

    container.innerHTML = opsData.actions.map(action => `
      <div class="action-item ${action.priority}">
        <span class="action-category">${action.category}</span>
        <div class="action-title">${action.action}</div>
        <div class="action-reason">${action.reason}</div>
        <div class="action-impact">⚡ ${action.impact}</div>
      </div>
    `).join('');
  }
};
