/**
 * Firebase Integration Simulation.
 * Provides initialization and a mock "sendData" function.
 */
// Initialize Firebase dynamically to prevent adblockers/network issues from crashing the app
let app;
const firebaseConfig = {
  apiKey: "AIzaSyMockKeyForHackathonDemo123456",
  authDomain: "smartflow-stadium.firebaseapp.com",
  projectId: "smartflow-stadium",
  storageBucket: "smartflow-stadium.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
try {
  import("https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js").then((module) => {
    app = module.initializeApp(firebaseConfig);
    console.log("🔥 Firebase Initialized successfully.");
  }).catch((e) => {
    console.warn("Firebase init blocked or failed (expected if no backend or adblocker): ", e);
  });
} catch (e) {
  console.warn("Firebase Dynamic Import Failed: ", e);
}

export const FirebaseManager = {
  logState(state) {
    if (!state) return;
    // Simulate sending data to Firebase Realtime / Firestore
    // This is for demonstration in the hackathon UI
    if (state.pipelineRun % 5 === 0) {
      console.log(`[Firebase Sync] ☁ Uploaded state Snapshot #${state.pipelineRun} to Cloud.`);
    }
  }
};
