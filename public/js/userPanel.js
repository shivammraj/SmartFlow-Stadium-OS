/**
 * UserPanel — Smart Routing System module.
 */
import Utils from './utils.js';
import StadiumMap from './stadiumMap.js';
import { DataGenerator } from '../simulation/DataGenerator.js';
import { DecisionEngine } from '../agents/DecisionEngine.js';

export const UserPanel = {
  zones: [],
  latestZones: [],

  init() {
    this.zones = DataGenerator.ZONES;
    this._populateDropdowns();
    this._bindEvents();
  },

  _bindEvents() {
    const btn = Utils.$('findRouteBtn');
    if (btn && !btn._bound) {
      btn.addEventListener('click', () => this.findRoute());
      btn._bound = true;
    }
  },

  updateZones(zones) {
    this.latestZones = zones;
  },

  _populateDropdowns() {
    const fromSelect = Utils.$('routeFrom');
    const toSelect = Utils.$('routeTo');

    const optionHTML = this.zones.map(z =>
      `<option value="${z.id}">${Utils.getZoneIcon(z.type)} ${z.label}</option>`
    ).join('');

    fromSelect.innerHTML = '<option value="">Select starting zone...</option>' + optionHTML;
    toSelect.innerHTML = '<option value="">Select destination...</option>' + optionHTML;
  },

  findRoute() {
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

    // AI routing calculation
    const route = DecisionEngine.computeRoute(from, to, this.latestZones.length ? this.latestZones : DataGenerator.ZONES);
    if (route) {
      this._showRoute(route);
      StadiumMap.setRoute(route.path);
    } else {
      this._showNoRoute();
    }
  },

  _showRoute(route) {
    const resultDiv = Utils.$('routeResult');
    resultDiv.style.display = 'block';

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

    Utils.$('routeReason').textContent = route.reason;

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
