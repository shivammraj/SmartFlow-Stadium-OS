# 🏟️ SmartFlow Stadium OS

> **A real-time Multi-Agent AI system for predicting crowd congestion, optimizing active queues, and dynamically routing attendees during large-scale events.**

---

## 🛑 The Problem

During major stadium events (sports, concerts), sudden shifts in crowd movement create intense bottlenecks. Traditional management systems are **reactive**—they only detect congestion *after* a crush happens. This leads to:
- **Long wait times** at certain food stalls while others sit empty.
- **Unsafe crowd density** at narrow concourses and specific exit gates.
- **Poor fan experience** due to inefficient routing.

## 💡 The Solution

**SmartFlow Stadium OS** is a proactive, AI-driven operating system designed to manage crowd physics in real-time. By simulating data from sensors and applying multi-agent AI logic, it detects congestion patterns *before* they turn critical and dynamically adjusts routing and staffing to balance the entire venue load.

---

## ✨ Features (Hackathon Upgraded)

- **🔮 AI Prediction Engine:** Forecasts crowd density 5–10 minutes into the future based on real-time movement velocity and event phase (Pre-Event, Halftime, etc.).
- **🧭 Smart Routing Engine:** Computes the fastest, safest route using a dynamic pathfinding algorithm that heavily penalizes (avoids) zones with high or critical active density.
- **⚡ Queue Optimization Agent:** Monitors active food stall and restroom wait times, automatically highlighting the fastest queues, and actively recommending counter openings to staff to cut wait times.
- **🧠 Operations Decision Matrix:** Acts as the "Brain", actively pushing real-time mitigation actions (e.g. "Redirecting users away from Gate C", "Pre-position security at Concourse NE") to administrators based on predictive models.
- **📊 Real-Time Simulation Dashboard:** Stunning, dark-mode glassmorphism UI built entirely with Vanilla HTML/JS directly in-browser. Fully responsive and accessible.
- **☁️ Firebase Integration:** Built-in Firebase configuration ready to push state snapshots for cloud synchronization.

---

## 🏗️ Architecture

To maximize hackathon demonstration and ensure complete runtime execution right in your browser, the system runs a localized simulation built on modular ES-6 architecture.

### Directory Structure

```text
/
├── public/                 # Static Frontend Files (GitHub Pages Ready)
│   ├── index.html          # Core Dashboard Layout
│   ├── css/
│   │   ├── styles.css      # Design System (Glassmorphic Dark Theme)
│   │   └── styles-additions.css
│   ├── agents/
│   │   └── DecisionEngine.js  # The Multi-Agent logic core
│   ├── simulation/
│   │   └── DataGenerator.js   # Generates simulated sensor data for the demo
│   └── js/
│       ├── app.js             # UI Orchestrator
│       ├── stadiumMap.js      # Custom heatmap renderer
│       ├── userPanel.js       # User Routing Panel View Controller
│       ├── adminDashboard.js  # AI Operations & Staffing Action View Controller
│       └── firebaseConfig.js  # Connectivity dummy layer
├── tests/
│   ├── prediction.test.js  # Validates AI forecasting logic
│   └── routing.test.js     # Validates intelligent pathfinding algorithm
└── package.json            # Scripts & Jest Configuration
```

---

## 🚀 How to Run

Because the core processing occurs entirely client-side using native modules, **no backend configuration is required** to see the system alive!

### 1. Run the Dashboard locally
- The easiest way is using [Live Server in VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer). Just right click `public/index.html` -> "Open with Live Server".
- Alternatively, use Node's `http-server` or `python -m http.server 8000` inside the `public/` folder.
- **Click "▶ Start Live Simulation"** to trigger the AI engines.

### 2. Run the AI Tests
You must have Node.js installed to run the AI logic validation suite.
```bash
# Install dependencies
npm install

# Run the test suite (uses --experimental-vm-modules for ES6 support)
npm test
```

---

## 📸 Screenshots

*(To be implemented by judges/evaluators)*

| Feature | Screenshot |
|---------|-------------|
| **Live Stadium Heatmap** | `![Heatmap Placeholder](map.png)` |
| **AI Decision Matrix** | `![AI Matrix Placeholder](ai-matrix.png)` |
| **Smart Routing UI** | `![Routing Placeholder](routing.png)` |

---

*Transforming chaos into flow, one stadium at a time. Built to win.*
