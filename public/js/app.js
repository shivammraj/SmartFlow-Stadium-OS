/**
 * App — Main application entry point.
 * Manages WebSocket connection and dispatches state updates to UI modules.
 * Falls back to DemoSimulator when no backend is available (e.g. GitHub Pages).
 */
(function () {
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_DELAY = 10000;
  const MAX_RECONNECT_TRIES = 3;
  let usingDemoMode = false;

  /** Initialize the application */
  function init() {
    StadiumMap.init();
    connectWebSocket();
  }

  /** Connect to WebSocket server */
  function connectWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${location.host}`;

    try {
      ws = new WebSocket(url);
    } catch (e) {
      console.warn('[WS] WebSocket creation failed, starting demo mode');
      startDemoMode();
      return;
    }

    ws.addEventListener('open', () => {
      reconnectAttempts = 0;
      usingDemoMode = false;
      setConnectionStatus(true, false);
      console.log('[WS] Connected to live server');
      UserPanel.init(ws);
    });

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    });

    ws.addEventListener('close', () => {
      setConnectionStatus(false, usingDemoMode);
      console.log('[WS] Disconnected');
      scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      ws.close();
    });
  }

  /** Handle incoming WebSocket messages */
  function handleMessage(msg) {
    if (msg.type === 'state-update' && msg.data) {
      updateUI(msg.data);
    }
  }

  /** Start client-side demo simulation */
  function startDemoMode() {
    if (usingDemoMode) return;
    usingDemoMode = true;
    setConnectionStatus(true, true);
    console.log('[Demo] Starting client-side simulation...');

    // Init UserPanel in demo mode
    UserPanel.initDemo(DemoSimulator);

    // Start simulator
    DemoSimulator.start((state) => {
      updateUI(state);
    });
  }

  /** Dispatch state to all UI modules */
  function updateUI(state) {
    // Header stats
    if (state.monitoring && state.monitoring.summary) {
      const s = state.monitoring.summary;
      Utils.$('totalPeople').textContent = s.totalPeople.toLocaleString();
      Utils.$('totalAlerts').textContent = state.notifications ? state.notifications.counts.total : 0;

      // Phase indicator
      Utils.$('phaseLabel').textContent = Utils.formatPhase(s.phase);
      Utils.$('phaseProgressFill').style.width = `${Math.round(s.phaseProgress * 100)}%`;

      // Phase dot color
      const phaseDot = document.querySelector('.phase-dot');
      if (phaseDot) {
        if (s.redZones.length > 3) {
          phaseDot.style.background = 'var(--red)';
          phaseDot.style.boxShadow = '0 0 8px var(--red-glow)';
        } else if (s.redZones.length > 0) {
          phaseDot.style.background = 'var(--yellow)';
          phaseDot.style.boxShadow = '0 0 8px var(--yellow-glow)';
        } else {
          phaseDot.style.background = 'var(--green)';
          phaseDot.style.boxShadow = '0 0 8px var(--green-glow)';
        }
      }
    }

    // AI health
    if (state.feedback) {
      const health = state.feedback.systemHealth;
      const healthEl = Utils.$('systemHealth');
      const healthIcon = Utils.$('statHealth')?.querySelector('.stat-icon');
      if (healthEl) healthEl.textContent = health;
      if (healthIcon) {
        if (health === 'excellent') healthIcon.textContent = '💚';
        else if (health === 'good') healthIcon.textContent = '💛';
        else if (health === 'needs-tuning') healthIcon.textContent = '🔴';
        else healthIcon.textContent = '⏳';
      }
    }

    // Pipeline counter
    if (state.pipelineRun) {
      Utils.$('pipelineCounter').textContent = `Run #${state.pipelineRun} · ${state.pipelineMs}ms`;
    }

    // Stadium Map
    StadiumMap.update(state);

    // Queue Panel
    if (state.queues) {
      AdminDashboard.updateQueues(state.queues);
    }

    // Operations Panel
    if (state.operations) {
      AdminDashboard.updateOperations(state.operations);
    }

    // Notifications Panel
    if (state.notifications) {
      AdminDashboard.updateNotifications(state.notifications);
    }
  }

  /** Update connection status indicator */
  function setConnectionStatus(connected, isDemo) {
    const dot = document.querySelector('.conn-dot');
    const label = document.querySelector('.conn-label');
    if (dot) {
      if (connected && isDemo) {
        dot.className = 'conn-dot demo';
      } else {
        dot.className = `conn-dot ${connected ? 'connected' : 'disconnected'}`;
      }
    }
    if (label) {
      if (connected && isDemo) {
        label.textContent = 'Demo';
      } else {
        label.textContent = connected ? 'Live' : 'Offline';
      }
    }
  }

  /** Reconnect with exponential backoff */
  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    if (reconnectAttempts >= MAX_RECONNECT_TRIES) {
      console.log(`[WS] Max reconnect attempts (${MAX_RECONNECT_TRIES}) reached. Switching to demo mode.`);
      startDemoMode();
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    reconnectAttempts++;
    reconnectTimer = setTimeout(connectWebSocket, delay);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
