/**
 * API Routes — REST endpoints for SmartFlow Stadium OS
 */
const express = require('express');
const router = express.Router();

module.exports = function(pipeline) {

  // GET /api/crowd-data — Current zone densities
  router.get('/crowd-data', (req, res) => {
    const state = pipeline.getLatestState();
    if (!state) return res.json({ message: 'Pipeline warming up...', data: null });
    res.json({
      timestamp: state.timestamp,
      phase: state.phase,
      zones: state.monitoring.zones,
      summary: state.monitoring.summary
    });
  });

  // GET /api/predict — Predicted congestion
  router.get('/predict', (req, res) => {
    const state = pipeline.getLatestState();
    if (!state) return res.json({ message: 'Pipeline warming up...', data: null });
    res.json({
      timestamp: state.timestamp,
      predictions: state.predictions
    });
  });

  // POST /api/route — Route recommendation
  router.post('/route', async (req, res) => {
    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing "from" and "to" fields' });
    }
    const route = await pipeline.computeRoute(from, to);
    if (!route) {
      return res.status(404).json({ error: 'No route found or pipeline not ready' });
    }
    res.json({ route });
  });

  // GET /api/queue — Queue wait times
  router.get('/queue', (req, res) => {
    const state = pipeline.getLatestState();
    if (!state) return res.json({ message: 'Pipeline warming up...', data: null });
    res.json({
      timestamp: state.timestamp,
      queues: state.queues
    });
  });

  // GET /api/notify — Active notifications
  router.get('/notify', (req, res) => {
    const state = pipeline.getLatestState();
    if (!state) return res.json({ message: 'Pipeline warming up...', data: null });
    res.json({
      timestamp: state.timestamp,
      notifications: state.notifications
    });
  });

  // GET /api/operations — Admin action suggestions
  router.get('/operations', (req, res) => {
    const state = pipeline.getLatestState();
    if (!state) return res.json({ message: 'Pipeline warming up...', data: null });
    res.json({
      timestamp: state.timestamp,
      operations: state.operations
    });
  });

  // GET /api/state — Full system state
  router.get('/state', (req, res) => {
    const state = pipeline.getLatestState();
    if (!state) return res.json({ message: 'Pipeline warming up...', data: null });
    res.json(state);
  });

  // GET /api/zones — Zone definitions and adjacency
  router.get('/zones', (req, res) => {
    res.json({
      zones: pipeline.getZones(),
      adjacency: pipeline.getAdjacency()
    });
  });

  return router;
};
