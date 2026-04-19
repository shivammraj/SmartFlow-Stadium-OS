<![CDATA[<div align="center">

# 🏟️ SmartFlow Stadium OS

### Multi-Agent AI System for Real-Time Stadium Event Management

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-blue?logo=websocket)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SmartFlow Stadium OS** is an intelligent, real-time stadium management platform powered by **7 specialized AI agents** working in a coordinated pipeline. It monitors crowd density, predicts congestion, optimizes queues, generates dynamic routes, and delivers actionable operational insights — all within a **5-second decision cycle**.

[Getting Started](#-getting-started) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Dashboard](#-live-dashboard)

</div>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔴 **Live Crowd Monitoring** | Real-time density tracking across 12 stadium zones with color-coded risk levels (Green → Yellow → Red) |
| 🔮 **Predictive Analytics** | Forecasts congestion 5–15 minutes ahead using trend analysis and phase-aware modeling |
| 🗺️ **Dynamic Routing** | Dijkstra-based shortest-path routing that avoids congested zones in real time |
| ⏱️ **Queue Optimization** | Monitors concession, entry, and restroom queues with wait-time predictions and staff rebalancing suggestions |
| 🔔 **Smart Notifications** | Priority-tiered alerts (critical / warning / info) for fans, staff, and operations teams |
| 🎛️ **Operations Control** | Automated action recommendations: gate control, staff deployment, capacity management |
| 🧠 **Feedback Learning** | Self-improving prediction accuracy via rolling error tracking and weight adjustments |
| 📊 **Real-Time Dashboard** | Premium dark-mode UI with live stadium heatmap, charts, and admin controls via WebSocket |

---

## 🏗️ Architecture

```
                        ┌──────────────────────────────────┐
                        │         SmartFlow Server         │
                        │     Express + WebSocket (ws)     │
                        └──────────────┬───────────────────┘
                                       │
                          Every 5 seconds (Pipeline Loop)
                                       │
                 ┌─────────────────────▼─────────────────────┐
                 │          🧪 Mock Data Generator            │
                 │   (Simulates sensors, queues, phases)      │
                 └─────────────────────┬─────────────────────┘
                                       │
                 ┌─────────────────────▼─────────────────────┐
            ①    │     👁️ Crowd Monitoring Agent              │
                 │   Aggregates zone densities & risk levels  │
                 └─────────────────────┬─────────────────────┘
                                       │
                 ┌─────────────────────▼─────────────────────┐
            ②    │     🔮 Prediction Agent                    │
                 │   Forecasts future congestion per zone     │
                 └─────────────────────┬─────────────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │ (Parallel Execution)        │
            ③    ┌──────▼──────┐             ┌────────▼─────┐
                 │ 🗺️ Routing  │             │ ⏱️ Queue     │
                 │   Agent     │             │   Optimizer  │
                 └──────┬──────┘             └────────┬─────┘
                        └──────────────┬──────────────┘
                                       │
                 ┌─────────────────────▼─────────────────────┐
            ④    │     🔔 Notification Agent                  │
                 │   Generates prioritized alerts             │
                 └─────────────────────┬─────────────────────┘
                                       │
                 ┌─────────────────────▼─────────────────────┐
            ⑤    │     🎛️ Operations Control Agent            │
                 │   Recommends admin actions                 │
                 └─────────────────────┬─────────────────────┘
                                       │
                 ┌─────────────────────▼─────────────────────┐
            ⑥    │     🧠 Feedback Learning Agent             │
                 │   Adjusts prediction weights               │
                 └─────────────────────┬─────────────────────┘
                                       │
                              ▼ Broadcast via WebSocket
                         ┌──────────────────────┐
                         │  📊 Live Dashboard   │
                         │  (Browser Clients)   │
                         └──────────────────────┘
```

### Event Phases

The system simulates a realistic event lifecycle:

| Phase | Description |
|-------|-------------|
| `pre-event` | Gates open, crowds begin arriving |
| `ingress` | Peak entry flow, high density at gates |
| `event-active` | Match/event in progress, seated crowd |
| `halftime` | Intermission — surge at concessions & restrooms |
| `egress` | Event ends, mass exit flow |
| `post-event` | Venue clearing, wind-down operations |

---

## 📂 Project Structure

```
smartflow-stadium-os/
├── server.js                     # Express + WebSocket entry point
├── package.json                  # Dependencies & scripts
│
├── agents/                       # AI Agent modules
│   ├── BaseAgent.js              # Abstract base class (timing, error handling)
│   ├── CrowdMonitoringAgent.js   # Zone density analysis & risk classification
│   ├── PredictionAgent.js        # Trend-based congestion forecasting
│   ├── RoutingAgent.js           # Dijkstra shortest-path with congestion avoidance
│   ├── QueueOptimizationAgent.js # Queue wait-time analysis & staff suggestions
│   ├── NotificationAgent.js      # Priority alert generation
│   ├── OperationsControlAgent.js # Automated operational recommendations
│   └── FeedbackLearningAgent.js  # Self-tuning prediction weights
│
├── pipeline/
│   └── AgentPipeline.js          # Orchestrator — runs all agents in sequence
│
├── simulation/
│   └── MockDataGenerator.js      # Realistic stadium sensor data simulation
│
├── routes/
│   └── api.js                    # REST API endpoints
│
└── public/                       # Frontend dashboard
    ├── index.html                # Main HTML shell
    ├── css/
    │   └── styles.css            # Premium dark-mode stylesheet
    └── js/
        ├── app.js                # Main app logic & WebSocket client
        ├── stadiumMap.js         # Interactive stadium heatmap renderer
        ├── adminDashboard.js     # Admin control panel
        ├── userPanel.js          # Fan-facing information panel
        └── utils.js              # Shared utility functions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/shivammraj/SmartFlow-Stadium-OS.git
cd SmartFlow-Stadium-OS

# Install dependencies
npm install
```

### Running the Application

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

The server will start and display:

```
╔══════════════════════════════════════════════════╗
║        🏟️  SmartFlow Stadium OS  🏟️             ║
║   Multi-Agent AI Stadium Management System      ║
╠══════════════════════════════════════════════════╣
║   Dashboard:  http://localhost:3000              ║
║   API:        http://localhost:3000/api/state    ║
║   WebSocket:  ws://localhost:3000                ║
║   Pipeline:   Every 5 seconds                   ║
╚══════════════════════════════════════════════════╝
```

Open **http://localhost:3000** in your browser to access the live dashboard.

---

## 📡 API Reference

All endpoints return JSON. Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/state` | Full system state (all agents combined) |
| `GET` | `/api/crowd-data` | Current zone densities, risk levels, and phase info |
| `GET` | `/api/predict` | Predicted congestion zones and overall risk |
| `GET` | `/api/queue` | Queue wait times and optimization suggestions |
| `GET` | `/api/notify` | Active notifications (critical, warning, info) |
| `GET` | `/api/operations` | Operations control actions and recommendations |
| `GET` | `/api/zones` | Zone definitions and adjacency map |
| `POST` | `/api/route` | Compute optimal route between two zones |

### Example: Route Request

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"from": "gate-north", "to": "concessions-west"}'
```

### WebSocket

Connect to `ws://localhost:3000` to receive real-time state updates every 5 seconds.

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'state-update') {
    console.log('Pipeline run:', data.pipelineRun);
    console.log('Phase:', data.phase);
    console.log('Zones:', data.monitoring.zones);
  }
};

// Request a route over WebSocket
ws.send(JSON.stringify({
  type: 'route-request',
  from: 'gate-south',
  to: 'section-A'
}));
```

---

## 🤖 Agent Details

### 1. Crowd Monitoring Agent
Processes raw sensor data from 12 stadium zones. Computes real-time density percentages and classifies each zone into risk levels: **green** (< 60%), **yellow** (60–80%), or **red** (> 80%).

### 2. Prediction Agent
Uses weighted trend analysis and phase-aware modeling to forecast zone densities 5–15 minutes ahead. Identifies zones likely to congest and flags upcoming phase transitions.

### 3. Routing Agent
Implements Dijkstra's algorithm with congestion-weighted edges. Dynamically recalculates optimal paths based on current and predicted crowd densities.

### 4. Queue Optimization Agent
Monitors concession stands, entry gates, and restroom queues. Estimates wait times and suggests counter openings or staff rebalancing to minimize patron waiting.

### 5. Notification Agent
Generates prioritized alerts across three tiers — **critical** (evacuations, capacity breaches), **warning** (congestion building), and **info** (phase changes, suggestions). Routes notifications to the appropriate audience (fans, staff, or admin).

### 6. Operations Control Agent
Analyzes the combined system state and recommends operational actions: opening/closing gates, deploying security, adjusting signage, or triggering crowd control protocols.

### 7. Feedback Learning Agent
Compares previous predictions against actual outcomes to compute rolling accuracy metrics. Adjusts prediction weights to improve forecasting over time — a self-improving feedback loop.

---

## 📊 Live Dashboard

The browser-based dashboard provides:

- **Stadium Heatmap** — Interactive zone map with live color-coded density overlays
- **Crowd Metrics** — Total occupancy, red zone count, and phase progress
- **Queue Status** — Real-time wait times across all service points
- **Notification Feed** — Scrolling alert stream with priority badges
- **Admin Panel** — Operations recommendations and system controls
- **Agent Performance** — Execution times and run counts for each agent

---

## ⚙️ Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `3000` | HTTP/WebSocket server port |

Pipeline interval is set to **5 seconds** in `server.js` (`PIPELINE_INTERVAL`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js |
| **Server** | Express 4.x |
| **Real-Time** | WebSocket (`ws` library) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript |
| **Routing Algorithm** | Dijkstra's Shortest Path |
| **Data Simulation** | Custom MockDataGenerator |
| **Architecture** | Multi-Agent Pipeline (sequential + parallel) |

---

## 🗺️ Roadmap

- [ ] Integration with real IoT sensors (LIDAR, camera-based crowd counting)
- [ ] Database persistence (MongoDB / PostgreSQL) for historical analytics
- [ ] Mobile companion app for fans (React Native)
- [ ] ML-based prediction models (replacing heuristic weights)
- [ ] Multi-venue support with centralized control
- [ ] Authentication & role-based access for admin dashboard

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Shivam Raj](https://github.com/shivammraj)**

*SmartFlow Stadium OS — Making stadiums smarter, safer, and smoother.*

</div>
]]>
