/**
 * StadiumMap — Renders the 4x4 zone grid heatmap with live updates.
 */
const StadiumMap = {
  zones: [],
  predictions: [],
  showPredictions: true,
  tooltip: null,
  highlightedRoute: [],

  /** Initialize the map */
  init() {
    this._createTooltip();
    const toggleBtn = Utils.$('togglePredictions');
    if (toggleBtn) {
      toggleBtn.classList.add('active');
      toggleBtn.addEventListener('click', () => {
        this.showPredictions = !this.showPredictions;
        toggleBtn.classList.toggle('active', this.showPredictions);
        this.render();
      });
    }
  },

  /** Update zone data and re-render */
  update(state) {
    if (state.monitoring && state.monitoring.zones) {
      this.zones = state.monitoring.zones;
    }
    if (state.predictions && state.predictions.zones) {
      this.predictions = state.predictions.zones;
    }
    this.render();
  },

  /** Render the grid */
  render() {
    const container = Utils.$('stadiumMapContainer');
    if (!container) return;

    // Build or update cells
    if (container.children.length !== 16) {
      container.innerHTML = '';
      this.zones.forEach(zone => {
        const cell = this._createCell(zone);
        container.appendChild(cell);
      });
    } else {
      this.zones.forEach((zone, i) => {
        this._updateCell(container.children[i], zone);
      });
    }
  },

  /** Create a zone cell element */
  _createCell(zone) {
    const cell = document.createElement('div');
    cell.className = `zone-cell ${zone.status}`;
    cell.id = `zone-${zone.id}`;
    cell.dataset.zoneId = zone.id;

    // Find prediction
    const pred = this.predictions.find(p => p.zoneId === zone.id);
    const predLabel = pred && this.showPredictions
      ? `<div class="zone-prediction-overlay ${pred.riskLevel}">${pred.riskLevel === 'critical' ? '⚠ CRITICAL' : pred.riskLevel === 'high' ? '⚡ HIGH' : ''}</div>`
      : '';

    const trendArrow = Utils.getTrendArrow(zone.trend);
    const isRoute = this.highlightedRoute.includes(zone.id);
    const routeClass = isRoute
      ? (zone.id === this.highlightedRoute[0] ? 'route-start'
        : zone.id === this.highlightedRoute[this.highlightedRoute.length - 1] ? 'route-end'
        : 'route-highlight')
      : '';

    if (routeClass) cell.classList.add(routeClass);

    cell.innerHTML = `
      ${predLabel}
      <span class="zone-trend">${trendArrow}</span>
      <div>
        <span class="zone-icon">${Utils.getZoneIcon(zone.type)}</span>
        <div class="zone-name">${zone.label}</div>
        <div class="zone-type">${zone.type}</div>
      </div>
      <div>
        <div class="zone-density-bar">
          <div class="zone-density-fill ${zone.status}" style="width: ${Math.round(zone.density * 100)}%"></div>
        </div>
        <div class="zone-count">${zone.currentCount}/${zone.capacity} · ${Math.round(zone.density * 100)}%</div>
      </div>
    `;

    // Tooltip events
    cell.addEventListener('mouseenter', (e) => this._showTooltip(e, zone));
    cell.addEventListener('mousemove', (e) => this._moveTooltip(e));
    cell.addEventListener('mouseleave', () => this._hideTooltip());

    return cell;
  },

  /** Update an existing cell */
  _updateCell(cell, zone) {
    const prevStatus = cell.className.match(/green|yellow|red/)?.[0];
    const pred = this.predictions.find(p => p.zoneId === zone.id);

    // Update status class
    cell.className = 'zone-cell ' + zone.status;

    // Route highlight
    if (this.highlightedRoute.includes(zone.id)) {
      if (zone.id === this.highlightedRoute[0]) cell.classList.add('route-start');
      else if (zone.id === this.highlightedRoute[this.highlightedRoute.length - 1]) cell.classList.add('route-end');
      else cell.classList.add('route-highlight');
    }

    // Update prediction overlay
    const predOverlay = cell.querySelector('.zone-prediction-overlay');
    if (predOverlay) {
      if (pred && this.showPredictions && (pred.riskLevel === 'critical' || pred.riskLevel === 'high')) {
        predOverlay.className = `zone-prediction-overlay ${pred.riskLevel}`;
        predOverlay.textContent = pred.riskLevel === 'critical' ? '⚠ CRITICAL' : '⚡ HIGH';
        predOverlay.style.display = 'block';
      } else {
        predOverlay.style.display = 'none';
      }
    }

    // Update trend
    const trendEl = cell.querySelector('.zone-trend');
    if (trendEl) trendEl.textContent = Utils.getTrendArrow(zone.trend);

    // Update density bar
    const fill = cell.querySelector('.zone-density-fill');
    if (fill) {
      fill.style.width = `${Math.round(zone.density * 100)}%`;
      fill.className = `zone-density-fill ${zone.status}`;
    }

    // Update count
    const countEl = cell.querySelector('.zone-count');
    if (countEl) {
      countEl.textContent = `${zone.currentCount}/${zone.capacity} · ${Math.round(zone.density * 100)}%`;
    }

    // Flash on status change
    if (prevStatus && prevStatus !== zone.status) {
      cell.style.transition = 'none';
      cell.style.transform = 'scale(1.05)';
      requestAnimationFrame(() => {
        cell.style.transition = 'all 0.4s ease';
        cell.style.transform = 'scale(1)';
      });
    }
  },

  /** Highlight a route on the map */
  setRoute(pathArray) {
    this.highlightedRoute = pathArray || [];
    this.render();
  },

  /** Create tooltip element */
  _createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'zone-tooltip';
    document.body.appendChild(this.tooltip);
  },

  /** Show tooltip */
  _showTooltip(e, zone) {
    const pred = this.predictions.find(p => p.zoneId === zone.id);
    this.tooltip.innerHTML = `
      <h4>${Utils.getZoneIcon(zone.type)} ${zone.label}</h4>
      <div class="tt-stat"><span>Status</span><span style="color: var(--${zone.status})">${zone.status.toUpperCase()}</span></div>
      <div class="tt-stat"><span>Density</span><span>${Math.round(zone.density * 100)}%</span></div>
      <div class="tt-stat"><span>Count</span><span>${zone.currentCount} / ${zone.capacity}</span></div>
      <div class="tt-stat"><span>Trend</span><span>${zone.trend || 'stable'} ${Utils.getTrendArrow(zone.trend)}</span></div>
      ${pred ? `<div class="tt-stat"><span>Predicted</span><span style="color: var(--${pred.riskLevel === 'critical' ? 'red' : pred.riskLevel === 'high' ? 'orange' : 'green'})">${Math.round(pred.predictedDensity * 100)}% (${pred.riskLevel})</span></div>` : ''}
    `;
    this.tooltip.classList.add('visible');
    this._moveTooltip(e);
  },

  _moveTooltip(e) {
    const x = e.clientX + 16;
    const y = e.clientY + 16;
    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
  },

  _hideTooltip() {
    this.tooltip.classList.remove('visible');
  }
};

window.StadiumMap = StadiumMap;
