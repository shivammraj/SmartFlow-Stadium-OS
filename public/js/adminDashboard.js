/**
 * AdminDashboard — Renders operations actions, queue status, and notifications.
 */
const AdminDashboard = {

  /** Update queue panel */
  updateQueues(queueData) {
    if (!queueData || !queueData.queues) return;
    const container = Utils.$('queueList');
    if (!container) return;

    container.innerHTML = queueData.queues.map(q => {
      const urgencyClass = q.urgency || 'normal';
      let waitClass = 'low';
      if (q.estimatedWaitMin > 15) waitClass = 'critical';
      else if (q.estimatedWaitMin > 8) waitClass = 'high';
      else if (q.estimatedWaitMin > 4) waitClass = 'moderate';

      const hasOpt = q.optimalCounters && q.optimalCounters > q.activeCounters;

      return `
        <div class="queue-item">
          <div class="queue-info">
            <div class="queue-name">${q.label}</div>
            <div class="queue-detail">${q.queueLength} in line · ${q.activeCounters}/${q.totalCounters} counters</div>
            ${hasOpt ? `<span class="queue-opt-badge">💡 ${q.recommendation}</span>` : ''}
          </div>
          <div class="queue-wait">
            <div class="queue-wait-time ${waitClass}">${q.estimatedWaitMin}m</div>
            <div class="queue-wait-label">est. wait</div>
            ${q.optimizedWaitMin != null && q.optimizedWaitMin < q.estimatedWaitMin
              ? `<div class="queue-wait-label" style="color: var(--green);">→ ${q.optimizedWaitMin}m opt.</div>`
              : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /** Update operations actions panel */
  updateOperations(opsData) {
    if (!opsData || !opsData.actions) return;
    const container = Utils.$('adminActions');
    const badge = Utils.$('actionsBadge');
    if (!container) return;

    if (badge) {
      badge.textContent = opsData.summary.totalActions;
      badge.className = 'badge' + (opsData.summary.critical > 0 ? ' critical' : '');
    }

    if (opsData.actions.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>All systems optimal</p></div>';
      return;
    }

    container.innerHTML = opsData.actions.map(action => `
      <div class="action-item ${action.priority}">
        <span class="action-category">${action.category}</span>
        <div class="action-title">${action.action}</div>
        <div class="action-reason">${action.reason}</div>
        <div class="action-impact">↗ ${action.impact}</div>
      </div>
    `).join('');
  },

  /** Update notifications panel */
  updateNotifications(notifData) {
    if (!notifData) return;
    const container = Utils.$('notificationsList');
    const badge = Utils.$('alertsBadge');
    if (!container) return;

    if (badge) {
      badge.textContent = notifData.counts.total;
      badge.className = 'badge' + (notifData.counts.critical > 0 ? ' critical' : '');
    }

    if (notifData.allNotifications.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔕</div><p>No active alerts</p></div>';
      return;
    }

    container.innerHTML = notifData.allNotifications.slice(0, 12).map(n => `
      <div class="notification-item">
        <div class="notification-header">
          <div class="notification-title">
            <span class="severity-badge ${n.severity}"></span>
            ${n.title}
          </div>
          <span class="notification-time">${Utils.timeAgo(n.timestamp)}</span>
        </div>
        <div class="notification-message">${n.message}</div>
      </div>
    `).join('');
  }
};

window.AdminDashboard = AdminDashboard;
