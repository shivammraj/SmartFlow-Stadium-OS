/**
 * Utils — Shared helpers for the SmartFlow frontend.
 */
const Utils = {
  /** Zone type to icon mapping */
  zoneIcons: {
    gate: '🚪',
    concourse: '🏛️',
    food: '🍔',
    restroom: '🚻',
    seating: '💺'
  },

  /** Get zone icon by type */
  getZoneIcon(type) {
    return this.zoneIcons[type] || '📍';
  },

  /** Format time ago */
  timeAgo(isoString) {
    const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  },

  /** Format a phase name for display */
  formatPhase(phase) {
    const map = {
      'pre-event': '🎫 Pre-Event',
      'active': '⚽ Active',
      'halftime': '☕ Halftime',
      'second-half': '⚽ Second Half',
      'post-event': '🚶 Post-Event'
    };
    return map[phase] || phase;
  },

  /** Get trend arrow */
  getTrendArrow(trend) {
    if (trend === 'rising') return '↗️';
    if (trend === 'falling') return '↘️';
    return '→';
  },

  /** Severity to color class mapping */
  severityColor(severity) {
    const map = { critical: 'red', warning: 'yellow', info: 'blue' };
    return map[severity] || 'blue';
  },

  /** Debounce helper */
  debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  /** Safe DOM element getter */
  $(id) {
    return document.getElementById(id);
  },

  /** Create element with optional classes and text */
  el(tag, className, text) {
    const elem = document.createElement(tag);
    if (className) elem.className = className;
    if (text !== undefined) elem.textContent = text;
    return elem;
  },

  /** Set inner HTML safely */
  setHTML(id, html) {
    const elem = document.getElementById(id);
    if (elem) elem.innerHTML = html;
  }
};

// Make globally available
window.Utils = Utils;
