/**
 * UserPanel — Route finder form and results display.
 * Supports both live server mode and demo (client-side) mode.
 */
const UserPanel = {
  zones: [],
  ws: null,
  demoSim: null,
  latestZones: [],

  /** Initialize with live server */
  init(ws) {
    this.ws = ws;
    this._loadZones();
    this._bindEvents();
  },

  /** Initialize in demo mode (no server) */
  initDemo(simulator) {
    this.demoSim = simulator;
    this.zones = simulator.ZONES;
    this._populateDropdowns();
    this._bindEvents();
  },

  /** Bind click event (only once) */
  _bindEvents() {
    const btn = Utils.$('findRouteBtn');
    if (btn && !btn._bound) {
      btn.addEventListener('click', () => this.findRoute());
      btn._bound = true;
    }
  },

  /** Store latest zone data for demo routing */
  updateZones(zones) {
    this.latestZones = zones;
  },

  /** Load zones into dropdowns from API */
  async _loadZones() {
    try {
      const res = await fetch('/api/zones');
      const data = await res.json();
      this.zones = data.zones;
      this._populateDropdowns();
    } catch (err) {
      console.warn('Failed to load zones from API, using demo data:', err.message);
      // Fallback: if DemoSimulator is available, use its zones
      if (window.DemoSimulator) {
        this.demoSim = window.DemoSimulator;
        this.zones = DemoSimulator.ZONES;
        this._populateDropdowns();
      }
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

    // Demo mode: compute client-side
    if (this.demoSim) {
      const zones = this.demoSim.generateCrowdData().zones;
      const route = this.demoSim.computeRoute(from, to, zones);
      if (route) {
        this._showRoute(route);
        StadiumMap.setRoute(route.path);
      } else {
        this._showNoRoute();
      }
      return;
    }

    // Live server mode
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
      // Fallback to demo routing
      if (window.DemoSimulator) {
        const zones = DemoSimulator.generateCrowdData().zones;
        const route = DemoSimulator.computeRoute(from, to, zones);
        if (route) {
          this._showRoute(route);
          StadiumMap.setRoute(route.path);
        } else {
          this._showNoRoute();
        }
      }
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
