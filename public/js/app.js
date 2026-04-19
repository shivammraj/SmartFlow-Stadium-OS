/**
 * App — Main application orchestrator for SmartFlow Simulator
 */
import Utils from './utils.js';
import StadiumMap from './stadiumMap.js';
import { UserPanel } from './userPanel.js';
import { AdminDashboard } from './adminDashboard.js';
import { DataGenerator } from '../simulation/DataGenerator.js';
import { DecisionEngine } from '../agents/DecisionEngine.js';
import { FirebaseManager } from './firebaseConfig.js';

let simulationInterval = null;
let isRunning = false;

function init() {
  UserPanel.init();
  StadiumMap.init();
  DecisionEngine.init();

  const startBtn = Utils.$('startSimulationBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      // scroll to dashboard
      document.querySelector('.app-window').scrollIntoView({ behavior: 'smooth', block: 'start' });
      toggleSimulation(startBtn);
    });
  }

  // Pre-render empty map so it doesn't look broken
  DataGenerator.init();
  const initialZones = DataGenerator.ZONES.map(z => ({
    ...z, currentCount: 0, density: 0, status: 'green', trend: 'stable'
  }));
  StadiumMap.update({ monitoring: { zones: initialZones } });
}

function toggleSimulation(btn) {
  if (isRunning) {
    // Stop
    clearInterval(simulationInterval);
    isRunning = false;
    btn.textContent = '▶ Start Live Simulation';
    btn.classList.remove('active');
    
    // reset UI explicitly if needed, but keeping last state is fine
    updateSystemHealth('Idle', 'gray');
    Utils.$('pipelineCounter').textContent = 'System offline';
  } else {
    // Start
    DataGenerator.init();
    isRunning = true;
    btn.textContent = '⏸ Pause Simulation';
    btn.classList.add('active');
    
    // Run immediately then poll
    runPipeline();
    simulationInterval = setInterval(runPipeline, 4000); // 4 seconds
  }
}

function runPipeline() {
  // 1. Generate Raw Data
  const rawData = DataGenerator.generateRawData();
  
  // 2. Multi-Agent AI Processing
  const state = DecisionEngine.process(rawData);
  
  // 3. Update UI
  updateUI(state);
  
  // 4. Firebase Sync (Simulated)
  FirebaseManager.logState(state);
}

function updateUI(state) {
  // Header
  Utils.$('totalPeople').textContent = state.monitoring.summary.totalPeople.toLocaleString();
  Utils.$('phaseLabel').textContent = Utils.formatPhase(state.monitoring.summary.phase);
  Utils.$('phaseProgressFill').style.width = `${Math.round(state.monitoring.summary.phaseProgress * 100)}%`;
  
  // Phase Dot Color based on Red Zones
  const phaseDot = document.querySelector('.phase-dot');
  if (phaseDot) {
    if (state.monitoring.summary.redZones.length > 3) {
      phaseDot.style.background = 'var(--red)';
      phaseDot.style.boxShadow = '0 0 8px var(--red-glow)';
    } else if (state.monitoring.summary.redZones.length > 0) {
      phaseDot.style.background = 'var(--yellow)';
      phaseDot.style.boxShadow = '0 0 8px var(--yellow-glow)';
    } else {
      phaseDot.style.background = 'var(--green)';
      phaseDot.style.boxShadow = '0 0 8px var(--green-glow)';
    }
  }

  // System Health
  const health = state.feedback.systemHealth;
  updateSystemHealth(health, health === 'excellent' ? 'var(--green)' : 'var(--orange)');

  // Counter
  Utils.$('pipelineCounter').textContent = `Run #${state.pipelineRun} (${state.pipelineMs}ms)`;

  // Map
  StadiumMap.update(state);
  
  // Give latest zones to UserPanel
  UserPanel.updateZones(state.monitoring.zones);

  // Queues, AI Decisions, and Alerts
  AdminDashboard.updateQueues(state.queues);
  AdminDashboard.updateOperations(state.decisions);
  AdminDashboard.updateNotifications(state.decisions);
}

function updateSystemHealth(text, color) {
  const healthEl = Utils.$('systemHealth');
  const healthIcon = document.querySelector('#statHealth .stat-icon');
  if (healthEl) healthEl.textContent = text.toUpperCase();
  if (healthIcon) healthIcon.style.color = color;
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
