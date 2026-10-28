# TruthLens — Firebase Cloud Database Integration Guide

This guide walks you through connecting **Google Firebase (Cloud Firestore & Authentication)** to your TruthLens Investigation & Evidence Management project.

---

## 🚀 Quick Overview

TruthLens is fully equipped with a modern **Firebase Cloud Firestore Data Layer** (`js/firebase-db.js` and `js/firebase-config.js`), a cleaned-up file structure, and **3 distinct, dedicated role-based dashboards**.

---

## 🔑 Login Credentials Cheat-Sheet

You can log in to test any role using either the **1-Click Fast Sign-In buttons** on [`login.html`](login.html) or by manually entering these credentials:

| Role | Name & Title | Email | Password | Dedicated Dashboard |
|---|---|---|---|---|
| **Administrator** | Morgan Vance (Chief Editor) | `admin@truthlens.org` | `Admin@12345` | [`admin-dashboard.html`](admin-dashboard.html) |
| **Investigator** | Abinash Panigrahy (Senior Analyst) | `investigator@truthlens.org` | `Investigator@12345` | [`dashboard.html`](dashboard.html) |
| **Citizen User** | Elena Rostova (Community Fact-Checker) | `user@truthlens.org` | `User@12345` | [`user-dashboard.html`](user-dashboard.html) |

---

## 🖥️ The 3 Dedicated Dashboards

1. **Administrator Console (`admin-dashboard.html`)**:
   - Oversee public claims ingestion queue.
   - Approve citizen claims and convert them into active forensic inquests assigned to investigators.
   - Promote/demote user roles (`Admin`, `Investigator`, `Citizen User`) and toggle active/suspended status.
   - Run 1-Click Database Seeder / Reset and export JSON backups.

2. **Investigator Forensic Lab (`dashboard.html`)**:
   - Active inquest case tracking and source classification charts.
   - Ingest and verify primary evidence, document contradictory claims, and publish transparent verdicts.
   - Direct links to Field Notes (`notes.html`), Timeline Audit (`timeline.html`), and Reports (`reports.html`).

3. **Citizen Fact-Checking Portal (`user-dashboard.html`)**:
   - Submit viral rumors or online claims for verification with source links.
   - Track personal submitted claims across `Under Review`, `Approved`, and `Completed` stages.
   - Browse published peer-reviewed fact-checks and verdicts.
   - View Community Trust and Accuracy metrics.

---

## 🛠️ Step-by-Step Setup Instructions

### Step 1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g. `truthlens-investigations`).
4. (Optional) Enable or disable Google Analytics, then click **Create project**.

---

### Step 2: Register your Web App
1. On the project overview page, click the **Web icon** (`</>`) to add a Web App.
2. Enter an app nickname (e.g. `truthlens-web`).
3. (Optional) Leave "Firebase Hosting" unchecked for now.
4. Click **Register app**.
5. Firebase will present your `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyB...",
     authDomain: "truthlens-investigations.firebaseapp.com",
     projectId: "truthlens-investigations",
     storageBucket: "truthlens-investigations.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

---

### Step 3: Enable Cloud Firestore
1. In the Firebase Console left sidebar, click **Build** ➜ **Firestore Database**.
2. Click **Create database**.
3. Choose a Firestore location closest to you (e.g., `nam5 (us-central)` or `asia-south1`).
4. **Security Rules mode**:
   - For initial local development and testing, choose **Start in test mode** (allows read/write access for 30 days).
   - Click **Next** ➜ **Create**.

---

### Step 4: Configure `firebase-config.js`
Open the file [`firebase-config.js`](firebase-config.js) in your project root and replace the placeholder values with your keys from Step 2:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
Save the file. Once saved, TruthLens will automatically connect to your Firestore database upon page reload.

---

### Step 5 (Optional): Enable Firebase Authentication
To allow analysts to sign up and log in:
1. In the Firebase Console, go to **Build** ➜ **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, enable **Email/Password**.
4. Now `login.html` and `register.html` will authenticate directly with Firebase Auth!

---

## 🔒 Recommended Firestore Security Rules

When you are ready to secure your database, go to **Firestore Database** ➜ **Rules** and apply:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Investigations collection
    match /investigations/{caseId} {
      allow read, write: if true; // Or: if request.auth != null;
    }

    // Evidence collection
    match /evidence/{evidenceId} {
      allow read, write: if true;
    }

    // Field notes collection
    match /notes/{noteId} {
      allow read, write: if true;
    }

    // Reports collection
    match /reports/{reportId} {
      allow read, write: if true;
    }

    // User profiles & credentials collection
    match /users/{userId} {
      allow read, write: if true;
    }

    // Public submitted claims queue
    match /submitted_claims/{claimId} {
      allow read, write: if true;
    }

    // Chronological audit timeline logs
    match /timeline/{eventId} {
      allow read, write: if true;
    }

    // Internal metadata & ping collection
    match /{path=**}/_connection_tests/{testId} {
      allow read, write: if true;
    }
    match /_metadata/{docId} {
      allow read, write: if true;
    }
  }
}
```

---

## 🧪 Testing & Seeding Your Database

1. **Launch a local server**:
   In PowerShell, run:
   ```powershell
   python -m http.server 8000
   ```
2. Open your browser to `http://localhost:8000/dashboard.html`.
3. Look at the top navigation bar:
   - When connected: Displays a green **Firestore Connected** badge.
   - When in demo mode: Displays a yellow **Firebase Demo Mode** badge.
4. **Seed sample data**:
   - Navigate to **Settings** (`settings.html#firebase-section`).
   - Click **Test Firestore Connection** to verify read/write access.
   - Click **Seed Default Dataset to Firestore** to automatically create standard investigations, evidence items, notes, and report templates in your Firestore instance!

---

## 📂 Firestore Collections Schema Reference

### 1. `investigations`
| Field | Type | Description |
|---|---|---|
| `id` | string | Case identifier (e.g. `TL-8429`) |
| `title` | string | Full investigation topic title |
| `claim` | string | Viral proposition under inquest |
| `category` | string | `Artificial Intelligence`, `Public Health`, etc. |
| `status` | string | `Active`, `Completed`, `Draft`, `Archived` |
| `priority` | string | `Critical`, `High`, `Medium`, `Low` |
| `evidenceCount` | number | Total linked evidence documents |
| `confidence` | number | Truth confidence percentage (0–100%) |
| `verdict` | string | `Mostly Unsupported`, `Unsupported`, etc. |
| `tags` | array | Tag strings (`fact-check`, `viral-claim`) |
| `description` | string | Case narrative background |
| `lastUpdated` | string | ISO date string (`2026-09-08`) |

### 2. `evidence`
| Field | Type | Description |
|---|---|---|
| `id` | string | Evidence identifier (e.g. `EV-1092`) |
| `caseId` | string | Associated investigation ID (`TL-8429`) |
| `title` | string | Source or document headline |
| `type` | string | `Research Paper`, `Government Report`, `Video` |
| `publisher` | string | Publishing institution |
| `author` | string | Author name(s) |
| `url` | string | Primary source URL |
| `classification` | string | `Supporting`, `Against`, `Neutral`, `Needs Verification` |
| `credibility` | number | Scale 1 to 5 |
| `summary` | string | Primary finding synopsis |
| `description` | string | Technical analysis |
| `notes` | string | Internal analyst commentary |

### 3. `notes`
| Field | Type | Description |
|---|---|---|
| `id` | string | Note identifier (e.g. `NOTE-301`) |
| `caseId` | string | Associated case ID |
| `title` | string | Field note title |
| `category` | string | `Observation`, `Follow-up`, `Important`, `Question` |
| `content` | string | Detailed field notes body |
| `isPinned` | boolean | Whether note is pinned to top |
| `updatedDate` | string | Timestamp string |

---

## 💻 Programmatic API (`window.TruthLensDB`)

Any script or component can interact directly with the database:

```javascript
// Fetch all cases
const cases = await window.TruthLensDB.getInvestigations();

// Create a new user profile
const newUser = await window.TruthLensDB.createUser({
  name: "Dr. Elena Rostova",
  email: "elena@truthlens.org",
  role: "investigator",
  title: "Forensic Analyst"
});

// Transfer all LocalStorage items directly to Cloud Firestore
const syncReport = await window.TruthLensDB.transferLocalStorageToFirestore();
console.log("Migration complete:", syncReport);

// Create a new case
const newCase = await window.TruthLensDB.createInvestigation({
  title: "New Fact-Check Case",
  claim: "Claim text under verification...",
  category: "Climate Science",
  priority: "High"
});

// Add an evidence piece
await window.TruthLensDB.createEvidence({
  caseId: newCase.id,
  title: "Independent Peer Review Benchmark",
  classification: "Against",
  credibility: 5,
  summary: "Key benchmark findings..."
});

// Create a research note
await window.TruthLensDB.createNote({
  caseId: newCase.id,
  title: "Interview Scheduled with Dr. Lin",
  category: "Follow-up",
  content: "Contacted lead author for clarification on sample size."
});

// Real-time listener
window.TruthLensDB.listenInvestigations((liveCases) => {
  console.log("Real-time cases update:", liveCases);
});
```

---

## 🔄 Dual-Layer Storage & 1-Click Migration

TruthLens uses a **Cloud-First Dual-Layer Architecture**:
1. **Real Cloud Firestore**: All records (users, inquests, evidence, field notes, verdicts, audit logs, and citizen claims) are written directly to Google Cloud Firestore collections.
2. **LocalStorage Cache & Offline Mirror**: Crucial data is kept in `localStorage` for offline resilience and zero-latency UI rendering.
3. **1-Click LocalStorage ➜ Firestore Migration**:
   - Available in **Settings** (`settings.html`) via the **"Transfer All LocalStorage to Firestore"** button.
   - Available programmatically via `window.TruthLensDB.transferLocalStorageToFirestore()`.
   - Automatically checks on startup and pushes all local dossiers, users, and evidence to Firestore if the cloud collections are uninitialized.

