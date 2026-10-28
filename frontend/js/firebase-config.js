/**
 * TruthLens — Firebase Configuration & Initialization Module
 * 
 * Instructions to connect your own Firebase Database:
 * 1. Visit the Firebase Console: https://console.firebase.google.com/
 * 2. Create a project or select an existing project.
 * 3. In Project Settings -> General -> "Your apps", add a Web app (</>).
 * 4. Copy the `firebaseConfig` object and replace the values below.
 * 5. In Firebase Console -> Build -> Cloud Firestore, create a database
 *    (Start in "test mode" for quick development).
 */

(function () {
  'use strict';

  // =========================================================================
  // REPLACE THE PLACEHOLDERS BELOW WITH YOUR FIREBASE PROJECT CONFIGURATION:
  // =========================================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAb7ue99G2rsNqsWIZGSAAodmFWVNoMvZI",
  authDomain: "truthlens-65573.firebaseapp.com",
  projectId: "truthlens-65573",
  storageBucket: "truthlens-65573.firebasestorage.app",
  messagingSenderId: "363371965708",
  appId: "1:363371965708:web:280e834ecdc031fe92ed29",
  measurementId: "G-M5SZKC0C0D"
};

  // Helper check: determine if credentials have been replaced
  const isDefaultPlaceholder = 
    !firebaseConfig.apiKey || 
    firebaseConfig.apiKey === "YOUR_API_KEY" || 
    firebaseConfig.apiKey.includes("YOUR_") ||
    !firebaseConfig.projectId ||
    firebaseConfig.projectId === "YOUR_PROJECT_ID";

  let initializedApp = null;
  let firestoreDb = null;
  let firebaseAuth = null;
  let isConfigured = false;

  if (typeof firebase !== 'undefined' && !isDefaultPlaceholder) {
    try {
      // Prevent multiple initializations if script loaded multiple times
      if (!firebase.apps.length) {
        initializedApp = firebase.initializeApp(firebaseConfig);
      } else {
        initializedApp = firebase.app();
      }

      firestoreDb = firebase.firestore();

      // Enable offline persistence when supported
      firestoreDb.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('[TruthLens Firebase] Multiple tabs open; offline persistence restricted to first tab.');
        } else if (err.code === 'unimplemented') {
          console.warn('[TruthLens Firebase] Browser does not support offline Firestore persistence.');
        }
      });

      if (typeof firebase.auth === 'function') {
        firebaseAuth = firebase.auth();
      }

      isConfigured = true;
      console.log(`%c[TruthLens Firebase] Cloud Firestore connected successfully (Project: ${firebaseConfig.projectId})`, 'color: #10B981; font-weight: bold;');
    } catch (error) {
      console.error('[TruthLens Firebase] Initialization error:', error);
      isConfigured = false;
    }
  } else {
    console.info(
      '%c[TruthLens Firebase] Running in Local Demo Mode.\n' +
      'To connect your live Cloud Firestore database, edit `firebase-config.js` with your Firebase project keys from https://console.firebase.google.com/',
      'color: #F59E0B; font-weight: bold;'
    );
  }

  // Export globally for the app
  window.TruthLensFirebase = {
    config: firebaseConfig,
    app: initializedApp,
    db: firestoreDb,
    auth: firebaseAuth,
    isConfigured: isConfigured,
    projectId: isConfigured ? firebaseConfig.projectId : 'demo-project'
  };

  // Dispatch event so other components know configuration status
  window.dispatchEvent(new CustomEvent('firebase-status-change', {
    detail: { isConfigured: isConfigured, projectId: firebaseConfig.projectId }
  }));
})();
