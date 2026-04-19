/**
 * SmartFlow Stadium OS — Server Entry Point
 *
 * Express + WebSocket server with real-time agent pipeline.
 */
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
const AgentPipeline = require('./pipeline/AgentPipeline');
const createApiRoutes = require('./routes/api');

const PORT = process.env.PORT || 3000;
const PIPELINE_INTERVAL = 5000; // 5 seconds

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Initialize pipeline
const pipeline = new AgentPipeline();

// Mount API routes
app.use('/api', createApiRoutes(pipeline));

// Create HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected (${clients.size} total)`);

  // Send latest state immediately on connection
  const state = pipeline.getLatestState();
  if (state) {
    ws.send(JSON.stringify({ type: 'state-update', data: state }));
  }

  // Handle route requests over WebSocket
  ws.on('message', async (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === 'route-request') {
        const route = await pipeline.computeRoute(parsed.from, parsed.to);
        ws.send(JSON.stringify({ type: 'route-response', data: route }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected (${clients.size} total)`);
  });
});

/** Broadcast state to all connected WebSocket clients */
function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  }
}

/** Main pipeline loop */
async function pipelineLoop() {
  try {
    const state = await pipeline.runPipeline();
    broadcast({ type: 'state-update', data: state });

    // Log summary
    const s = state.monitoring.summary;
    console.log(
      `[Pipeline #${state.pipelineRun}] Phase: ${s.phase} (${Math.round(s.phaseProgress * 100)}%) | ` +
      `People: ${s.totalPeople} | Red: ${s.redZones.length} | ` +
      `Alerts: ${state.notifications.counts.total} | ` +
      `Actions: ${state.operations.summary.totalActions} | ` +
      `${state.pipelineMs}ms`
    );
  } catch (err) {
    console.error('[Pipeline Error]', err.message);
  }
}

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        🏟️  SmartFlow Stadium OS  🏟️             ║');
  console.log('║   Multi-Agent AI Stadium Management System      ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║   Dashboard:  http://localhost:${PORT}              ║`);
  console.log(`║   API:        http://localhost:${PORT}/api/state    ║`);
  console.log(`║   WebSocket:  ws://localhost:${PORT}                ║`);
  console.log('║   Pipeline:   Every 5 seconds                   ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // Run first pipeline immediately, then every 5 seconds
  pipelineLoop();
  setInterval(pipelineLoop, PIPELINE_INTERVAL);
});
