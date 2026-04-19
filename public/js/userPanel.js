/**
 * UserPanel — Route finder form and results display.
 */
const UserPanel = {
  zones: [],
  ws: null,

  /** Initialize with zone list */
  init(ws) {
    this.ws = ws;
    this._loadZones();

    Utils.$('findRouteBtn').addEventListener('click', () => this.findRoute());
  },

  /** Load zones into dropdowns */
  async _loadZones() {
    try {
      const res = await fetch('/api/zones');
      const data = await res.json();
      this.zones = data.zones;
      this._populateDropdowns();
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
  },

  /** Fill the from/to selects */
  _populateDropdowns() {
    const fromSelect = Utils.$('routeFrom');
    const toSelect = Utils.$('routeTo');

    const optionHTML = this.zones.map(z =>
      `<option value="${z.id}">${Utils.getZoneIcon(z.type)} ${z.label}</option>`
    ).join('');

    fromSelect.innerHTML = '<option value="">Select starting zone...</option>' + optionHTML;
    toSelect.innerHTML = '<option value="">Select destination...</option>' + optionHTML;
  },

  /** Request a route */
  async findRoute() {
    const from = Utils.$('routeFrom').value;
    const to = Utils.$('routeTo').value;

    if (!from || !to) {
      alert('Please select both a starting zone and destination.');
      return;
    }
    if (from === to) {
      alert('Start and destination cannot be the same zone.');
      return;
    }

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      });
      const data = await res.json();

      if (data.route) {
        this._showRoute(data.route);
        StadiumMap.setRoute(data.route.path);
      } else {
        this._showNoRoute();
      }
    } catch (err) {
      console.error('Route request failed:', err);
    }
  },

  /** Display route result */
  _showRoute(route) {
    const resultDiv = Utils.$('routeResult');
    resultDiv.style.display = 'block';

    // Stats
    Utils.setHTML('routeStats', `
      <div class="route-stat-card">
        <div class="route-stat-value">${route.estimatedTimeMin}</div>
        <div class="route-stat-label">Minutes</div>
      </div>
      <div class="route-stat-card">
        <div class="route-stat-value">${route.steps}</div>
        <div class="route-stat-label">Zones</div>
      </div>
      <div class="route-stat-card">
        <div class="route-stat-value">${route.congestionScore}</div>
        <div class="route-stat-label">Congestion</div>
      </div>
    `);

    // Path visualization
    const pathHTML = route.path.map((zoneId, i) => {
      const zone = this.zones.find(z => z.id === zoneId);
      const label = zone ? zone.label : zoneId;
      const cls = i === 0 ? 'start' : i === route.path.length - 1 ? 'end' : 'mid';
      const arrow = i < route.path.length - 1 ? '<span class="route-arrow">→</span>' : '';
      return `<span class="route-step ${cls}">${Utils.getZoneIcon(zone?.type || '')} ${label}</span>${arrow}`;
    }).join('');

    Utils.setHTML('routePath', pathHTML);
  },

  _showNoRoute() {
    const resultDiv = Utils.$('routeResult');
    resultDiv.style.display = 'block';
    Utils.setHTML('routeStats', '');
    Utils.setHTML('routePath', '<div class="empty-state"><p>No route found between these zones.</p></div>');
    StadiumMap.setRoute([]);
  }
};

window.UserPanel = UserPanel;
