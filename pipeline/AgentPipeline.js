/**
 * AgentPipeline — Orchestrates the full agent workflow.
 *
 * Flow: Monitoring → Prediction → (Routing + Queue) → Notification → Operations → Feedback
 */
const CrowdMonitoringAgent = require('../agents/CrowdMonitoringAgent');
const PredictionAgent = require('../agents/PredictionAgent');
const RoutingAgent = require('../agents/RoutingAgent');
const QueueOptimizationAgent = require('../agents/QueueOptimizationAgent');
const NotificationAgent = require('../agents/NotificationAgent');
const OperationsControlAgent = require('../agents/OperationsControlAgent');
const FeedbackLearningAgent = require('../agents/FeedbackLearningAgent');
const MockDataGenerator = require('../simulation/MockDataGenerator');

class AgentPipeline {
  constructor() {
    // Initialize all agents
    this.crowdAgent = new CrowdMonitoringAgent();
    this.predictionAgent = new PredictionAgent();
    this.routingAgent = new RoutingAgent();
    this.queueAgent = new QueueOptimizationAgent();
    this.notificationAgent = new NotificationAgent();
    this.operationsAgent = new OperationsControlAgent();
    this.feedbackAgent = new FeedbackLearningAgent();

    // Initialize data generator
    this.dataGenerator = new MockDataGenerator();

    // Set adjacency for routing agent
    this.routingAgent.setAdjacency(this.dataGenerator.getAdjacency());

    // Latest pipeline state
    this.latestState = null;
    this.pipelineRunCount = 0;
  }

  /**
   * Execute full pipeline once.
   * @returns {Object} Complete system state snapshot
   */
  async runPipeline() {
    this.pipelineRunCount++;
    const pipelineStart = Date.now();

    // 1. Generate mock data
    const rawCrowdData = this.dataGenerator.generateCrowdData();
    const rawQueueData = this.dataGenerator.generateQueueData();

    // 2. Crowd Monitoring Agent
    const monitoringResult = await this.crowdAgent.run(rawCrowdData);
    const monitoringData = monitoringResult.data;

    // 3. Prediction Agent
    const predictionResult = await this.predictionAgent.run(monitoringData);
    const predictionData = predictionResult.data;

    // 4. Routing + Queue (parallel)
    const [routingResult, queueResult] = await Promise.all([
      this.routingAgent.run({
        zones: monitoringData.zones,
        predictions: predictionData.predictions
      }),
      this.queueAgent.run({
        queues: rawQueueData,
        crowdZones: monitoringData.zones
      })
    ]);
    const routingData = routingResult.data;
    const queueData = queueResult.data;

    // 5. Notification Agent
    const notificationResult = await this.notificationAgent.run({
      predictionData,
      queueData,
      monitoringData
    });
    const notificationData = notificationResult.data;

    // 6. Operations Control Agent
    const operationsResult = await this.operationsAgent.run({
      monitoringData,
      predictionData,
      queueData,
      notificationData
    });
    const operationsData = operationsResult.data;

    // 7. Feedback Learning Agent
    const feedbackResult = await this.feedbackAgent.run({
      monitoringData,
      predictionData
    });
    const feedbackData = feedbackResult.data;

    // Apply weight adjustments from feedback
    if (feedbackData.weightAdjustments) {
      this.predictionAgent.adjustWeights(feedbackData.weightAdjustments);
    }

    const pipelineMs = Date.now() - pipelineStart;

    // Compose complete state
    this.latestState = {
      pipelineRun: this.pipelineRunCount,
      pipelineMs,
      timestamp: new Date().toISOString(),
      phase: monitoringData.summary.phase,
      phaseProgress: monitoringData.summary.phaseProgress,
      monitoring: {
        zones: monitoringData.zones,
        summary: monitoringData.summary
      },
      predictions: {
        zones: predictionData.predictions,
        congestingZones: predictionData.congestingZones,
        overallRisk: predictionData.overallRisk,
        nextPhase: predictionData.nextPhase,
        phaseTransitionSoon: predictionData.phaseTransitionSoon
      },
      routing: routingData,
      queues: queueData,
      notifications: notificationData,
      operations: operationsData,
      feedback: {
        systemHealth: feedbackData.systemHealth,
        rollingAccuracy: feedbackData.rollingAccuracy,
        samplesCollected: feedbackData.samplesCollected,
        currentAccuracy: feedbackData.currentAccuracy
          ? {
              avgError: feedbackData.currentAccuracy.avgError,
              accuracyRate: feedbackData.currentAccuracy.accuracyRate
            }
          : null
      },
      agentPerformance: [
        monitoringResult,
        predictionResult,
        routingResult,
        queueResult,
        notificationResult,
        operationsResult,
        feedbackResult
      ].map(r => ({
        agent: r.agent,
        executionMs: r.executionMs,
        runCount: r.runCount,
        hasError: !!r.error
      }))
    };

    return this.latestState;
  }

  /** Get latest state without running pipeline */
  getLatestState() {
    return this.latestState;
  }

  /** Compute route on demand */
  async computeRoute(from, to) {
    if (!this.latestState) return null;
    const result = await this.routingAgent.run({
      zones: this.latestState.monitoring.zones,
      predictions: this.latestState.predictions.zones,
      routeRequest: { from, to }
    });
    return result.data.route;
  }

  /** Get zone definitions */
  getZones() {
    return this.dataGenerator.getZones();
  }

  /** Get adjacency map */
  getAdjacency() {
    return this.dataGenerator.getAdjacency();
  }
}

module.exports = AgentPipeline;
