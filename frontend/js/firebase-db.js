/**
 * TruthLens — Cloud Firestore Database Service Layer
 * 
 * Provides unified CRUD operations, real-time snapshot listeners,
 * local fallback storage when offline/unconfigured, and 1-click database seeding.
 */

(function () {
  'use strict';

  // =========================================================================
  // INITIAL SEED DATASET (Used for Initial Database Seeding & Fallback Mode)
  // =========================================================================
  const DEFAULT_INVESTIGATIONS = [
    {
      id: 'TL-8429',
      title: 'Full Software Engineer Replacement by Autonomous Code Agents',
      claim: 'Generative AI autonomous coding models will completely eliminate the demand for software engineering positions within three years.',
      category: 'Artificial Intelligence',
      status: 'Active',
      priority: 'Critical',
      evidenceCount: 14,
      confidence: 82,
      lastUpdated: '2026-09-08',
      displayUpdated: '2 days ago',
      tags: ['viral-claim', 'fact-check', 'developer-market', 'generative-ai'],
      description: 'Systematic evaluation of virally circulating assertions regarding imminent elimination of human programming jobs against macroeconomic BLS datasets and multi-file code benchmarks.',
      verdict: 'Mostly Unsupported',
      leadInvestigator: 'Abinash Panigrahy'
    },
    {
      id: 'TL-8411',
      title: 'Viral Alkaline Solution Neutralization of Respiratory Pathogens',
      claim: 'Drinking concentrated alkaline water with pH above 9.0 inactivates human viral respiratory infections.',
      category: 'Public Health',
      status: 'Completed',
      priority: 'High',
      evidenceCount: 21,
      confidence: 95,
      lastUpdated: '2026-09-09',
      displayUpdated: 'Yesterday',
      tags: ['health-misinfo', 'respiratory', 'biochemistry'],
      description: 'Medical and biochemical evaluation of home alkaline water remedies against gastrointestinal gastric acid buffering dynamics.',
      verdict: 'Unsupported',
      leadInvestigator: 'Abinash Panigrahy'
    },
    {
      id: 'TL-8390',
      title: 'Immediate Catastrophic Metro Coast Submersion Forecast',
      claim: 'Major low-lying Pacific rim metropolitan areas will become completely submerged before end of fiscal year.',
      category: 'Climate Science',
      status: 'Active',
      priority: 'High',
      evidenceCount: 8,
      confidence: 45,
      lastUpdated: '2026-09-05',
      displayUpdated: '5 days ago',
      tags: ['climate-models', 'sea-level', 'oceanography'],
      description: 'Geospatial satellite telemetry verification analyzing low-lying coastal tidal records versus apocalyptic social media threads.',
      verdict: 'Inconclusive',
      leadInvestigator: 'Abinash Panigrahy'
    },
    {
      id: 'TL-8365',
      title: 'Central Bank Emergency Domestic Cash Withdrawal Caps',
      claim: 'Leaked central banking memoranda allegedly schedule immediate $200 weekly caps on domestic retail ATM withdrawals.',
      category: 'Economic Policy',
      status: 'Draft',
      priority: 'Medium',
      evidenceCount: 3,
      confidence: 20,
      lastUpdated: '2026-08-28',
      displayUpdated: '2 weeks ago',
      tags: ['banking', 'monetary-policy', 'telegram-leaks'],
      description: 'Investigation into unsourced social media document scans purporting to mandate strict daily and weekly cash liquidity ceilings.',
      verdict: 'Inconclusive',
      leadInvestigator: 'Abinash Panigrahy'
    },
    {
      id: 'TL-8342',
      title: 'Algorithmic Voter Disenfranchisement Protocol Rumors',
      claim: 'State electronic ballot machines deliberately drop ballots cast with blue felt-tip ballpoint pens.',
      category: 'Electoral Integrity',
      status: 'Completed',
      priority: 'Critical',
      evidenceCount: 34,
      confidence: 98,
      lastUpdated: '2026-08-20',
      displayUpdated: '3 weeks ago',
      tags: ['electoral-audit', 'optical-scanners', 'ballots'],
      description: 'Forensic inspection of county optical ballot tabulation machines verifying wavelength sensitivity to dark and blue dye pigments.',
      verdict: 'Unsupported',
      leadInvestigator: 'Abinash Panigrahy'
    },
    {
      id: 'TL-8319',
      title: 'Genetically Engineered Supercrops and Soil Microbial Extinction',
      claim: 'Synthetic drought-resistant corn roots emit toxins that permanently sterilize endemic soil bacteria.',
      category: 'Climate Science',
      status: 'Archived',
      priority: 'Low',
      evidenceCount: 12,
      confidence: 60,
      lastUpdated: '2026-07-15',
      displayUpdated: '2 months ago',
      tags: ['agriculture', 'soil-biology', 'biotech'],
      description: 'Longitudinal soil ecology studies inspecting rhizospheric bacteria viability in synthetic crop trials.',
      verdict: 'Mostly Unsupported',
      leadInvestigator: 'Abinash Panigrahy'
    }
  ];

  const DEFAULT_EVIDENCE = [
    {
      id: 'EV-1092',
      caseId: 'TL-8429',
      caseTitle: 'Autonomous Agent Labor Replacement for Developers',
      title: 'ACM Empirical Software Engineering: Limits of Autonomous Code Refactoring',
      type: 'Research Paper',
      publisher: 'Association for Computing Machinery (ACM)',
      author: 'Dr. Saumya Jit Mohanty, Prof. M. Tanaka',
      publicationDate: '2026-08-14',
      url: 'https://dl.acm.org/doi/10.1145/3611643',
      classification: 'Against',
      credibility: 5,
      summary: 'Empirical benchmark of 1,200 repositories showed autonomous models fail to resolve distributed concurrency bugs without introducing subtle race conditions in 68% of pull requests.',
      description: 'Testing across large-scale C++ and Go distributed microservices demonstrated that while code generation speed improved for isolated unit tests, architectural invariants and multithreading safety degraded significantly.',
      notes: 'Independent academic peer review with zero commercial generative AI vendor sponsorship.'
    },
    {
      id: 'EV-1088',
      caseId: 'TL-8429',
      caseTitle: 'Autonomous Agent Labor Replacement for Developers',
      title: 'Global Tech Summit: CEO Keynote Declaration on Autonomous Engineering',
      type: 'Video',
      publisher: 'Tech Summit Media Archive',
      author: 'Marcus Sterling (CEO, DevAuto Inc.)',
      publicationDate: '2026-08-20',
      url: 'https://youtube.com/watch?v=techsummit2026',
      classification: 'Supporting',
      credibility: 2,
      summary: 'Commercial AI tooling vendor asserted that entry-level software programming will become fully autonomous within 36 months, rendering degree credentials obsolete.',
      description: 'Keynote presentation showcasing DevAuto synthetic pipeline solving isolated LeetCode medium problems in under 12 seconds with no human assistance.',
      notes: 'Commercial promotional speech; methodology was closed and undisclosed to independent benchmark researchers.'
    },
    {
      id: 'EV-1084',
      caseId: 'TL-8429',
      caseTitle: 'Autonomous Agent Labor Replacement for Developers',
      title: 'U.S. Bureau of Labor Statistics: 2024–2034 Computer Systems Analyst Outlook',
      type: 'Government Report',
      publisher: 'U.S. Department of Labor (BLS)',
      author: 'Office of Occupational Statistics',
      publicationDate: '2026-06-30',
      url: 'https://bls.gov/ooh/computer-and-information-technology/software-developers.htm',
      classification: 'Against',
      credibility: 5,
      summary: 'Official 10-year macroeconomic model projects a 17% expansion in computer systems analyst and developer roles through 2034, far outstripping the national occupational average.',
      description: 'The report projects over 410,000 net new vacancies created by enterprise modernization, legacy refactoring, and AI systems maintenance.',
      notes: 'Authoritative government employment data contradiction of rapid developer extinction.'
    }
  ];

  const DEFAULT_NOTES = [
    {
      id: 'NOTE-301',
      title: 'HumanEval pass@1 Synthetic Flaws vs Multi-File Repositories',
      category: 'Observation',
      caseId: 'TL-8429',
      caseTitle: 'Autonomous Agent Labor Replacement for Developers',
      content: 'The keynote presentation cites 84% pass rates on isolated coding prompts. However, HumanEval consists of standalone functions with no legacy dependencies, build constraints, or external state. Real-world commercial codebases require systems comprehension that modern transformer models do not sustain without human verification.',
      isPinned: true,
      createdDate: '2026-08-25 11:30',
      updatedDate: '2026-09-08 14:10'
    },
    {
      id: 'NOTE-302',
      title: 'Interview Lead: Prof. Ramesh (Carnegie Mellon SE Dept)',
      category: 'Follow-up',
      caseId: 'TL-8429',
      caseTitle: 'Autonomous Agent Labor Replacement for Developers',
      content: 'Scheduled video interview for Tuesday 10:00 EST. Preparing three targeted inquiries regarding the hidden cognitive overhead of code reviews on AI-generated commits and maintenance debt.',
      isPinned: true,
      createdDate: '2026-08-29 09:15',
      updatedDate: '2026-09-09 16:45'
    },
    {
      id: 'NOTE-303',
      title: 'Contradiction Mapped: BLS 10-Year Projections vs Viral Tech Claims',
      category: 'Important',
      caseId: 'TL-8429',
      caseTitle: 'Autonomous Agent Labor Replacement for Developers',
      content: 'Critical discrepancy: Bureau of Labor Statistics projects a 17% expansion in computer systems analyst and developer roles through 2034. The viral claim that the career path is eliminated by 2027 contradicts all macroeconomic labor forecasts.',
      isPinned: false,
      createdDate: '2026-09-01 15:20',
      updatedDate: '2026-09-01 15:20'
    },
    {
      id: 'NOTE-304',
      title: 'Does Gastric Acid Neutralize Oral Alkaline Solutions Instantly?',
      category: 'Question',
      caseId: 'TL-8411',
      caseTitle: 'Viral Alkaline Solution Neutralization of Respiratory Pathogens',
      content: 'Need to cross-reference human gastrointestinal physiology literature regarding buffer capacity. Specifically verify if drinking pH 9.5 water can alter systemic blood pH or upper mucosal tissue pH.',
      isPinned: false,
      createdDate: '2026-08-18 13:40',
      updatedDate: '2026-08-20 10:15'
    }
  ];

  const DEFAULT_REPORTS = [
    {
      id: 'RPT-8429',
      caseId: 'TL-8429',
      title: 'Autonomous Agent Labor Replacement for Entry & Senior Software Developers',
      claim: 'Generative AI autonomous coding models will completely eliminate the demand for software engineering positions within three years.',
      date: '2026-09-11',
      displayDate: 'Sep 11, 2026',
      caseStatus: 'Active',
      confidence: 82,
      verdict: 'Mostly Unsupported',
      category: 'Artificial Intelligence',
      summary: 'Investigation evaluating viral assertions of imminent developer obsolescence against empirical code maintainability benchmarks and national macroeconomic labor datasets.',
      supportCount: 3,
      againstCount: 8,
      neutralCount: 3,
      conclusionText: 'The claim that generative AI models will completely eliminate the demand for software engineering positions within three years is Mostly Unsupported by empirical research and contradicted by authoritative economic and employment data.'
    },
    {
      id: 'RPT-8411',
      caseId: 'TL-8411',
      title: 'Viral Alkaline Solution Neutralization of Respiratory Pathogens',
      claim: 'Drinking concentrated alkaline water with pH above 9.0 inactivates human viral respiratory infections.',
      date: '2026-09-09',
      displayDate: 'Sep 09, 2026',
      caseStatus: 'Completed',
      confidence: 95,
      verdict: 'Unsupported',
      category: 'Public Health',
      summary: 'Clinical analysis of viral health assertions regarding home alkaline water remedies versus established human gastrointestinal biochemistry.',
      supportCount: 1,
      againstCount: 18,
      neutralCount: 2,
      conclusionText: 'The claim is completely Unsupported. Ingested alkaline liquids are neutralized immediately by gastric hydrochloric acid in the stomach, exerting zero physiological effect on systemic or pulmonary viral pathogens.'
    }
  ];

  const DEFAULT_USERS = [
    {
      id: 'usr-admin-1',
      name: 'Puja Mohapatra',
      email: 'admin@truthlens.org',
      role: 'admin',
      title: 'Chief Editor & Administrator',
      department: 'Editorial Oversight',
      avatar: 'PM',
      status: 'Active',
      joinedDate: '2026-01-10',
      assignedCasesCount: 14
    },
    {
      id: 'usr-investigator-1',
      name: 'Abinash Panigrahy',
      email: 'investigator@truthlens.org',
      role: 'investigator',
      title: 'Senior Forensic Analyst',
      department: 'Digital Forensics & AI',
      avatar: 'AP',
      status: 'Active',
      joinedDate: '2026-02-15',
      assignedCasesCount: 6
    },
    {
      id: 'usr-user-1',
      name: 'Saumya Jit Mohanty',
      email: 'user@truthlens.org',
      role: 'user',
      title: 'Community Fact-Checker',
      department: 'Public Contributor',
      avatar: 'SM',
      status: 'Active',
      joinedDate: '2026-03-20',
      submittedClaimsCount: 3
    }
  ];

  const DEFAULT_SUBMITTED_CLAIMS = [
    {
      id: 'CLM-501',
      claimText: 'New European Union regulations mandate 100% microchip tracking on all domestic pets starting November.',
      sourceUrl: 'https://socialpost.example/viral-pet-microchip-claim',
      category: 'Public Policy',
      submittedBy: 'user@truthlens.org',
      submittedByName: 'Saumya Jit Mohanty',
      submittedDate: '2026-10-08',
      status: 'Under Review', // 'Under Review', 'Approved', 'Rejected', 'Investigating', 'Completed'
      notes: 'Viral TikTok with 2.4M views alleging €500 fines for unregistered pets.',
      priority: 'High',
      assignedCaseId: null,
      fakeProbability: 84,
      mlVerdict: 'High Probability Fake News',
      mlConfidence: 89
    },
    {
      id: 'CLM-502',
      claimText: 'Drinking concentrated lemon and baking soda mixture cures seasonal viral influenza in 24 hours.',
      sourceUrl: 'https://healthforum.example/lemon-baking-soda-cure',
      category: 'Public Health',
      submittedBy: 'marcus.t@example.com',
      submittedByName: 'Marcus Tanaka',
      submittedDate: '2026-10-07',
      status: 'Investigating',
      notes: 'Circulated widely across messaging group chats without clinical citations.',
      priority: 'Critical',
      assignedCaseId: 'TL-8411',
      fakeProbability: 95,
      mlVerdict: 'High Probability Fake News',
      mlConfidence: 96
    },
    {
      id: 'CLM-503',
      claimText: 'Major airline completely replaces co-pilots with AI neural flight systems on commercial routes.',
      sourceUrl: 'https://aviation-leaks.example/ai-cockpit-rumor',
      category: 'Artificial Intelligence',
      submittedBy: 'sarah.k@example.com',
      submittedByName: 'Sarah Keller',
      submittedDate: '2026-10-05',
      status: 'Approved',
      notes: 'Misconstrued press release on flight management software update.',
      priority: 'Medium',
      assignedCaseId: 'TL-8429',
      fakeProbability: 79,
      mlVerdict: 'High Probability Fake News',
      mlConfidence: 82
    }
  ];

  const DEFAULT_TIMELINE = [
    {
      id: 'EVT-101',
      caseId: 'TL-8429',
      caseTitle: 'AI Developer Replacement',
      type: 'Evidence Classified',
      icon: 'bi-file-earmark-check',
      color: 'danger',
      title: 'ACM Empirical Maintainability Study Verified',
      description: 'Peer-reviewed dataset analyzing 12,000 multi-file pull requests classified as Refuting (Against) with 5/5 credibility index.',
      user: 'Abinash Panigrahy',
      timestamp: '2026-09-08 14:15:00',
      relativeTime: '2 hours ago'
    },
    {
      id: 'EVT-102',
      caseId: 'TL-8429',
      caseTitle: 'AI Developer Replacement',
      type: 'Note Added',
      icon: 'bi-journal-text',
      color: 'primary',
      title: 'Contextual Methodology Note Appended',
      description: 'Documented interview observations with Stanford Software Engineering faculty regarding benchmark task generalization.',
      user: 'Abinash Panigrahy',
      timestamp: '2026-09-08 11:30:00',
      relativeTime: '5 hours ago'
    },
    {
      id: 'EVT-103',
      caseId: 'TL-8429',
      caseTitle: 'AI Developer Replacement',
      type: 'Evidence Added',
      icon: 'bi-plus-circle',
      color: 'success',
      title: 'US BLS 10-Year Labor Projections Attached',
      description: 'Official employment outlook projecting 25% growth in specialized systems engineering roles cataloged.',
      user: 'Abinash Panigrahy',
      timestamp: '2026-09-07 16:45:00',
      relativeTime: 'Yesterday'
    },
    {
      id: 'EVT-104',
      caseId: 'TL-8411',
      caseTitle: 'Alkaline Water Inactivation',
      type: 'Conclusion Updated',
      icon: 'bi-patch-check-fill',
      color: 'success',
      title: 'Final Inquest Verdict Published: Unsupported',
      description: 'Editorial sign-off completed by Chief Editor Puja Mohapatra. Physiological biochemistry shows gastric HCl neutralization.',
      user: 'Puja Mohapatra',
      timestamp: '2026-09-07 10:00:00',
      relativeTime: 'Yesterday'
    },
    {
      id: 'EVT-105',
      caseId: 'TL-8429',
      caseTitle: 'AI Developer Replacement',
      type: 'Investigation Created',
      icon: 'bi-folder-plus',
      color: 'info',
      title: 'Dossier Formulated from Community Claim #CLM-503',
      description: 'Converted from public claim queue submitted by community member. Lead analyst Abinash Panigrahy assigned.',
      user: 'Puja Mohapatra',
      timestamp: '2026-09-06 09:15:00',
      relativeTime: '2 days ago'
    },
    {
      id: 'EVT-106',
      caseId: 'TL-8411',
      caseTitle: 'Alkaline Water Inactivation',
      type: 'Evidence Classified',
      icon: 'bi-shield-x',
      color: 'danger',
      title: 'Biochemical Clinical Evaluation Added',
      description: 'CDC and WHO guidelines indexed demonstrating zero systemic virucidal efficacy.',
      user: 'Abinash Panigrahy',
      timestamp: '2026-09-05 15:20:00',
      relativeTime: '3 days ago'
    },
    {
      id: 'EVT-107',
      caseId: 'TL-8390',
      caseTitle: 'Metro Coast Submersion',
      type: 'Investigation Created',
      icon: 'bi-folder-plus',
      color: 'info',
      title: 'Geospatial Coastal Inquest Initiated',
      description: 'Target claim: "Major Pacific rim metro will submerge entirely within fiscal year". Scope and tidal telemetry rubric established.',
      user: 'Abinash Panigrahy',
      timestamp: '2026-09-05 08:30:00',
      relativeTime: '3 days ago'
    }
  ];

  // =========================================================================
  // LOCAL STORAGE FALLBACK CONTROLLER (For Local Demo Mode)
  // =========================================================================
  const LOCAL_KEYS = {
    INVESTIGATIONS: 'truthlens_db_investigations',
    EVIDENCE: 'truthlens_db_evidence',
    NOTES: 'truthlens_db_notes',
    REPORTS: 'truthlens_db_reports',
    USERS: 'truthlens_db_users',
    SUBMITTED_CLAIMS: 'truthlens_db_submitted_claims',
    TIMELINE: 'truthlens_db_timeline',
    SESSION: 'truthlens_session'
  };

  const sanitizeLegacyNames = (val) => {
    if (!val) return val;
    try {
      let str = JSON.stringify(val);
      let changed = false;
      if (str.includes('Morgan Vance')) {
        str = str.replace(/Morgan Vance/g, 'Puja Mohapatra');
        changed = true;
      }
      if (str.includes('Abinash Panigrahi')) {
        str = str.replace(/Abinash Panigrahi/g, 'Abinash Panigrahy');
        changed = true;
      }
      if (str.includes('Dr. Alex Vance, Ph.D.')) {
        str = str.replace(/Dr\. Alex Vance, Ph\.D\./g, 'Abinash Panigrahy');
        changed = true;
      }
      if (str.includes('Dr. Alex Vance')) {
        str = str.replace(/Dr\. Alex Vance/g, 'Abinash Panigrahy');
        changed = true;
      }
      if (str.includes('Alex Vance')) {
        str = str.replace(/Alex Vance/g, 'Abinash Panigrahy');
        changed = true;
      }
      if (str.includes('Dr. Vance')) {
        str = str.replace(/Dr\. Vance/g, 'Abinash Panigrahy');
        changed = true;
      }
      if (str.includes('Elena Rostova')) {
        str = str.replace(/Elena Rostova/g, 'Saumya Jit Mohanty');
        changed = true;
      }
      return changed ? JSON.parse(str) : val;
    } catch (_) {
      return val;
    }
  };

  const getLocalData = (key, defaultVal) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sanitized = sanitizeLegacyNames(parsed);
        if (sanitized !== parsed) {
          setLocalData(key, sanitized);
        }
        return sanitized;
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }
    setLocalData(key, defaultVal);
    return defaultVal;
  };

  const setLocalData = (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  };

  // =========================================================================
  // CLOUD FIRESTORE SERVICE IMPLEMENTATION
  // =========================================================================
  const getFirestoreDb = () => {
    return window.TruthLensFirebase && window.TruthLensFirebase.isConfigured
      ? window.TruthLensFirebase.db
      : null;
  };

  const isConfigured = () => {
    return !!(window.TruthLensFirebase && window.TruthLensFirebase.isConfigured);
  };

  const getProjectId = () => {
    return (window.TruthLensFirebase && window.TruthLensFirebase.projectId) || 'local-demo';
  };

  // -------------------------------------------------------------------------
  // 1. INVESTIGATIONS COLLECTION (db: 'investigations')
  // -------------------------------------------------------------------------
  const getInvestigations = async () => {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snapshot = await db.collection('investigations').get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ id: doc.id, ...data });
          });
          return items;
        } else {
          // If Firestore is empty, auto-seed with default cases!
          console.info('[TruthLens Firebase] Firestore collection "investigations" is empty. Auto-seeding initial cases...');
          await seedDatabase();
          return DEFAULT_INVESTIGATIONS;
        }
      } catch (err) {
        console.error('[TruthLens Firebase] Error fetching investigations from Firestore:', err);
      }
    }
    // Fallback to local storage
    return getLocalData(LOCAL_KEYS.INVESTIGATIONS, DEFAULT_INVESTIGATIONS);
  };

  const getInvestigation = async (id) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        const docRef = await db.collection('investigations').doc(id).get();
        if (docRef.exists) {
          return { id: docRef.id, ...docRef.data() };
        }
      } catch (err) {
        console.error(`[TruthLens Firebase] Error fetching investigation ${id}:`, err);
      }
    }
    const all = await getInvestigations();
    return all.find(item => item.id === id) || null;
  };

  const createInvestigation = async (data) => {
    const caseId = data.id || `TL-${Math.floor(8000 + Math.random() * 1999)}`;
    const nowIso = new Date().toISOString().slice(0, 10);
    const newCase = {
      id: caseId,
      title: data.title || 'Untitled Investigation',
      claim: data.claim || '',
      category: data.category || 'General',
      status: data.status || 'Active',
      priority: data.priority || 'Medium',
      evidenceCount: data.evidenceCount || 0,
      confidence: data.confidence !== undefined ? data.confidence : 50,
      lastUpdated: nowIso,
      displayUpdated: 'Just now',
      tags: data.tags || ['fact-check'],
      description: data.description || '',
      leadInvestigator: data.leadInvestigator || 'Abinash Panigrahy',
      verdict: data.verdict || 'Under Investigation',
      createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('investigations').doc(caseId).set(newCase);
        console.log(`[TruthLens Firebase] Case ${caseId} created in Firestore.`);
      } catch (err) {
        console.error('[TruthLens Firebase] Error saving investigation to Firestore:', err);
      }
    }

    // Always update local storage mirror
    const localCases = getLocalData(LOCAL_KEYS.INVESTIGATIONS, DEFAULT_INVESTIGATIONS);
    localCases.unshift(newCase);
    setLocalData(LOCAL_KEYS.INVESTIGATIONS, localCases);

    return newCase;
  };

  const updateInvestigation = async (id, updateFields) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('investigations').doc(id).update({
          ...updateFields,
          lastUpdated: new Date().toISOString().slice(0, 10),
          updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        });
        console.log(`[TruthLens Firebase] Case ${id} updated in Firestore.`);
      } catch (err) {
        console.error(`[TruthLens Firebase] Error updating case ${id} in Firestore:`, err);
      }
    }

    const localCases = getLocalData(LOCAL_KEYS.INVESTIGATIONS, DEFAULT_INVESTIGATIONS);
    const index = localCases.findIndex(c => c.id === id);
    if (index !== -1) {
      localCases[index] = { ...localCases[index], ...updateFields, lastUpdated: new Date().toISOString().slice(0, 10) };
      setLocalData(LOCAL_KEYS.INVESTIGATIONS, localCases);
    }
  };

  const deleteInvestigation = async (id) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('investigations').doc(id).delete();
        console.log(`[TruthLens Firebase] Case ${id} deleted from Firestore.`);
      } catch (err) {
        console.error(`[TruthLens Firebase] Error deleting case ${id} from Firestore:`, err);
      }
    }

    let localCases = getLocalData(LOCAL_KEYS.INVESTIGATIONS, DEFAULT_INVESTIGATIONS);
    localCases = localCases.filter(c => c.id !== id);
    setLocalData(LOCAL_KEYS.INVESTIGATIONS, localCases);
  };

  const listenInvestigations = (callback) => {
    const db = getFirestoreDb();
    if (db) {
      return db.collection('investigations').onSnapshot((snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
      }, (err) => {
        console.warn('[TruthLens Firebase] Live snapshot listener error:', err);
      });
    }
    return null;
  };

  // -------------------------------------------------------------------------
  // 2. EVIDENCE COLLECTION (db: 'evidence')
  // -------------------------------------------------------------------------
  const getEvidence = async (caseId = null) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        let query = db.collection('evidence');
        if (caseId) {
          query = query.where('caseId', '==', caseId);
        }
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          return items;
        }
      } catch (err) {
        console.error('[TruthLens Firebase] Error fetching evidence:', err);
      }
    }

    const local = getLocalData(LOCAL_KEYS.EVIDENCE, DEFAULT_EVIDENCE);
    return caseId ? local.filter(e => e.caseId === caseId) : local;
  };

  const createEvidence = async (data) => {
    const evidenceId = data.id || `EV-${Math.floor(1000 + Math.random() * 8999)}`;
    const newEvidence = {
      id: evidenceId,
      caseId: data.caseId || 'TL-8429',
      caseTitle: data.caseTitle || 'Case Dossier',
      title: data.title || 'Untitled Evidence',
      type: data.type || 'Document',
      publisher: data.publisher || 'Independent Source',
      author: data.author || 'Anonymous',
      publicationDate: data.publicationDate || new Date().toISOString().slice(0, 10),
      url: data.url || '',
      classification: data.classification || 'Neutral',
      credibility: Number(data.credibility) || 3,
      summary: data.summary || '',
      description: data.description || '',
      notes: data.notes || '',
      createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('evidence').doc(evidenceId).set(newEvidence);
        // Increment evidenceCount on the corresponding investigation
        if (data.caseId) {
          const caseRef = db.collection('investigations').doc(data.caseId);
          await caseRef.update({
            evidenceCount: firebase.firestore.FieldValue.increment(1),
            lastUpdated: new Date().toISOString().slice(0, 10)
          }).catch(() => {});
        }
        console.log(`[TruthLens Firebase] Evidence ${evidenceId} saved to Firestore.`);
      } catch (err) {
        console.error('[TruthLens Firebase] Error saving evidence:', err);
      }
    }

    const localList = getLocalData(LOCAL_KEYS.EVIDENCE, DEFAULT_EVIDENCE);
    localList.unshift(newEvidence);
    setLocalData(LOCAL_KEYS.EVIDENCE, localList);

    return newEvidence;
  };

  const deleteEvidence = async (id, caseId = null) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('evidence').doc(id).delete();
        if (caseId) {
          const caseRef = db.collection('investigations').doc(caseId);
          await caseRef.update({
            evidenceCount: firebase.firestore.FieldValue.increment(-1)
          }).catch(() => {});
        }
      } catch (err) {
        console.error(`[TruthLens Firebase] Error deleting evidence ${id}:`, err);
      }
    }

    let localList = getLocalData(LOCAL_KEYS.EVIDENCE, DEFAULT_EVIDENCE);
    localList = localList.filter(e => e.id !== id);
    setLocalData(LOCAL_KEYS.EVIDENCE, localList);
  };

  // -------------------------------------------------------------------------
  // 3. FIELD NOTES COLLECTION (db: 'notes')
  // -------------------------------------------------------------------------
  const getNotes = async (caseId = null) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        let query = db.collection('notes');
        if (caseId) {
          query = query.where('caseId', '==', caseId);
        }
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          return items;
        }
      } catch (err) {
        console.error('[TruthLens Firebase] Error fetching notes:', err);
      }
    }

    const local = getLocalData(LOCAL_KEYS.NOTES, DEFAULT_NOTES);
    return caseId ? local.filter(n => n.caseId === caseId) : local;
  };

  const createNote = async (data) => {
    const noteId = data.id || `NOTE-${Math.floor(300 + Math.random() * 699)}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newNote = {
      id: noteId,
      title: data.title || 'Untitled Field Note',
      category: data.category || 'Observation',
      caseId: data.caseId || 'TL-8429',
      caseTitle: data.caseTitle || 'Active Investigation',
      content: data.content || '',
      isPinned: !!data.isPinned,
      createdDate: nowStr,
      updatedDate: nowStr
    };

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('notes').doc(noteId).set(newNote);
        console.log(`[TruthLens Firebase] Field Note ${noteId} saved to Firestore.`);
      } catch (err) {
        console.error('[TruthLens Firebase] Error saving note to Firestore:', err);
      }
    }

    const localNotes = getLocalData(LOCAL_KEYS.NOTES, DEFAULT_NOTES);
    localNotes.unshift(newNote);
    setLocalData(LOCAL_KEYS.NOTES, localNotes);

    return newNote;
  };

  const updateNote = async (id, updateFields) => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('notes').doc(id).update({
          ...updateFields,
          updatedDate: nowStr
        });
      } catch (err) {
        console.error(`[TruthLens Firebase] Error updating note ${id}:`, err);
      }
    }

    const localNotes = getLocalData(LOCAL_KEYS.NOTES, DEFAULT_NOTES);
    const index = localNotes.findIndex(n => n.id === id);
    if (index !== -1) {
      localNotes[index] = { ...localNotes[index], ...updateFields, updatedDate: nowStr };
      setLocalData(LOCAL_KEYS.NOTES, localNotes);
    }
  };

  const togglePinNote = async (id, isPinned) => {
    return updateNote(id, { isPinned: isPinned });
  };

  const deleteNote = async (id) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('notes').doc(id).delete();
      } catch (err) {
        console.error(`[TruthLens Firebase] Error deleting note ${id}:`, err);
      }
    }

    let localNotes = getLocalData(LOCAL_KEYS.NOTES, DEFAULT_NOTES);
    localNotes = localNotes.filter(n => n.id !== id);
    setLocalData(LOCAL_KEYS.NOTES, localNotes);
  };

  // -------------------------------------------------------------------------
  // 4. REPORTS & CONCLUSIONS (db: 'reports')
  // -------------------------------------------------------------------------
  const getReports = async () => {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snapshot = await db.collection('reports').get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          return items;
        }
      } catch (err) {
        console.error('[TruthLens Firebase] Error fetching reports:', err);
      }
    }
    return getLocalData(LOCAL_KEYS.REPORTS, DEFAULT_REPORTS);
  };

  const saveConclusion = async (caseId, conclusionData) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('investigations').doc(caseId).update({
          verdict: conclusionData.verdict,
          confidence: conclusionData.confidence,
          conclusionText: conclusionData.conclusionText,
          status: conclusionData.status || 'Completed',
          finalizedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`[TruthLens Firebase] Error saving conclusion for ${caseId}:`, err);
      }
    }

    await updateInvestigation(caseId, {
      verdict: conclusionData.verdict,
      confidence: conclusionData.confidence,
      conclusionText: conclusionData.conclusionText,
      status: conclusionData.status || 'Completed'
    });
  };

  const getConclusion = async (caseId) => {
    const inv = await getInvestigation(caseId);
    if (inv) {
      return {
        caseId: inv.id,
        verdict: inv.verdict || 'Inconclusive',
        confidence: inv.confidence || 50,
        conclusionText: inv.conclusionText || inv.summary || '',
        status: inv.status || 'Active',
        finalizedAt: inv.finalizedAt || inv.lastUpdated
      };
    }
    return null;
  };

  // -------------------------------------------------------------------------
  // 5. USER & ROLE MANAGEMENT (db: 'users')
  // -------------------------------------------------------------------------
  const createUser = async (userData) => {
    const id = userData.id || userData.uid || `usr-${Date.now()}`;
    const cleanEmail = (userData.email || '').toLowerCase().trim();
    const cleanUser = {
      id: id,
      uid: userData.uid || id,
      name: userData.name || userData.fullName || 'TruthLens User',
      email: cleanEmail,
      role: userData.role || 'user',
      title: userData.title || (userData.role === 'admin' ? 'Editorial Administrator' : userData.role === 'investigator' ? 'Forensic Analyst' : 'Community Fact-Checker'),
      department: userData.department || (userData.role === 'admin' ? 'Editorial Oversight' : userData.role === 'investigator' ? 'Digital Forensics & AI' : 'Public Contributor'),
      avatar: userData.avatar || (userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TL'),
      status: userData.status || 'Active',
      joinedDate: userData.joinedDate || new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString(),
      bio: userData.bio || '',
      phone: userData.phone || '',
      location: userData.location || '',
      organization: userData.organization || 'TruthLens Investigative Bureau'
    };

    const db = getFirestoreDb();
    if (db) {
      try {
        const batch = db.batch();
        batch.set(db.collection('users').doc(id), cleanUser, { merge: true });
        if (cleanEmail) {
          batch.set(db.collection('users').doc(cleanEmail), cleanUser, { merge: true });
        }
        await batch.commit();
        console.log(`[TruthLens Firebase] User ${cleanUser.email} (${id}) persisted to Cloud Firestore.`);
      } catch (err) {
        console.error('[TruthLens Firebase] Error persisting user to Firestore:', err);
      }
    }

    // Always mirror to localStorage
    const localUsers = getLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
    const existingIndex = localUsers.findIndex(u => u.id === id || (u.email && u.email.toLowerCase() === cleanUser.email.toLowerCase()));
    if (existingIndex !== -1) {
      localUsers[existingIndex] = { ...localUsers[existingIndex], ...cleanUser };
    } else {
      localUsers.push(cleanUser);
    }
    setLocalData(LOCAL_KEYS.USERS, localUsers);

    return cleanUser;
  };

  const getUsers = async () => {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snapshot = await db.collection('users').get();
        if (!snapshot.empty) {
          const itemsMap = new Map();
          snapshot.forEach((doc) => {
            const data = doc.data();
            const key = data.email || doc.id;
            if (!itemsMap.has(key)) {
              itemsMap.set(key, { id: doc.id, ...data });
            }
          });
          const items = Array.from(itemsMap.values());
          setLocalData(LOCAL_KEYS.USERS, items);
          return items;
        } else {
          console.info('[TruthLens Firebase] Cloud Firestore "users" is empty. Auto-uploading default user profiles...');
          const localUsers = getLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
          const batch = db.batch();
          for (const u of localUsers) {
            batch.set(db.collection('users').doc(u.id), u, { merge: true });
            if (u.email) batch.set(db.collection('users').doc(u.email.toLowerCase()), u, { merge: true });
          }
          await batch.commit();
          return localUsers;
        }
      } catch (err) {
        console.error('[TruthLens Firebase] Error fetching users from Firestore:', err);
      }
    }
    return getLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
  };

  const getUser = async (idOrEmail) => {
    if (!idOrEmail) return null;
    const db = getFirestoreDb();
    const queryTerm = String(idOrEmail).toLowerCase().trim();

    if (db) {
      try {
        // Direct doc lookup by email or by ID
        const docRef = await db.collection('users').doc(queryTerm).get();
        if (docRef.exists) {
          return { id: docRef.id, ...docRef.data() };
        }
        if (idOrEmail !== queryTerm) {
          const docRefOrig = await db.collection('users').doc(idOrEmail).get();
          if (docRefOrig.exists) return { id: docRefOrig.id, ...docRefOrig.data() };
        }
        // Query by email field
        const snapshot = await db.collection('users').where('email', '==', queryTerm).limit(1).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn('[TruthLens Firebase] Firestore single user lookup note:', err);
      }
    }

    const all = await getUsers();
    return all.find(u => u.id === idOrEmail || (u.email && u.email.toLowerCase() === queryTerm)) || null;
  };

  const updateUserRole = async (userId, newRole) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('users').doc(userId).set({ role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.error(`[TruthLens Firebase] Error updating user role:`, err);
      }
    }

    const localUsers = getLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
    const index = localUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      localUsers[index].role = newRole;
      setLocalData(LOCAL_KEYS.USERS, localUsers);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('users').doc(userId).set({ status: newStatus, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.error(`[TruthLens Firebase] Error updating user status:`, err);
      }
    }

    const localUsers = getLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
    const index = localUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      localUsers[index].status = newStatus;
      setLocalData(LOCAL_KEYS.USERS, localUsers);
    }
  };

  const updateUserProfile = async (userId, data) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('users').doc(userId).set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
        console.log(`[TruthLens Firebase] User profile for ${userId} updated in Cloud Firestore.`);
      } catch (err) {
        console.error(`[TruthLens Firebase] Error updating user profile in Firestore:`, err);
      }
    }

    const localUsers = getLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
    const index = localUsers.findIndex(u => u.id === userId || (data.email && u.email && u.email.toLowerCase() === data.email.toLowerCase()));
    if (index !== -1) {
      localUsers[index] = { ...localUsers[index], ...data };
      setLocalData(LOCAL_KEYS.USERS, localUsers);

      const session = getCurrentSession();
      if (session && (session.id === userId || (data.email && session.email && session.email.toLowerCase() === data.email.toLowerCase()))) {
        setCurrentSession(localUsers[index]);
      }
      return localUsers[index];
    } else {
      const newUser = { id: userId, ...data };
      localUsers.push(newUser);
      setLocalData(LOCAL_KEYS.USERS, localUsers);
      return newUser;
    }
  };

  // -------------------------------------------------------------------------
  // 6. PUBLIC SUBMITTED CLAIMS INGESTION (db: 'submitted_claims')
  // -------------------------------------------------------------------------
  const getSubmittedClaims = async (userEmail = null) => {
    const db = getFirestoreDb();
    const queryEmail = userEmail ? userEmail.toLowerCase().trim() : null;

    if (db) {
      try {
        let query = db.collection('submitted_claims');
        if (queryEmail) {
          query = query.where('submittedBy', '==', queryEmail);
        }
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          return items;
        } else if (queryEmail) {
          // If Firestore is connected and this specific user has no claims yet, return empty list (no dummy fallback!)
          return [];
        }
      } catch (err) {
        console.error('[TruthLens Firebase] Error fetching submitted claims:', err);
      }
    }

    const local = getLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, DEFAULT_SUBMITTED_CLAIMS);
    if (queryEmail) {
      return local.filter(c => (c.submittedBy || '').toLowerCase() === queryEmail);
    }
    return local;
  };

  const submitUserClaim = async (claimData) => {
    const claimId = claimData.id || `CLM-${Math.floor(500 + Math.random() * 499)}`;
    const nowIso = new Date().toISOString().slice(0, 10);

    // Run ML Fake News Prediction Engine
    let mlPrediction = claimData.mlPrediction || null;
    if (!mlPrediction && window.TruthLensML && typeof window.TruthLensML.predict === 'function') {
      try {
        mlPrediction = window.TruthLensML.predict(claimData.claimText || '', claimData.sourceUrl || '');
      } catch (err) {
        console.warn('[TruthLens ML] Prediction note:', err);
      }
    }

    const fakeProbability = mlPrediction ? mlPrediction.fakeProbability : (claimData.fakeProbability || 50);
    const mlVerdict = mlPrediction ? mlPrediction.verdict : (claimData.mlVerdict || 'Pending ML Triage');
    const mlConfidence = mlPrediction ? mlPrediction.credibilityScore : 50;

    const newClaim = {
      id: claimId,
      claimText: claimData.claimText || '',
      sourceUrl: claimData.sourceUrl || '',
      category: claimData.category || 'General',
      submittedBy: claimData.submittedBy || 'anonymous@truthlens.org',
      submittedByName: claimData.submittedByName || 'Community Reader',
      submittedDate: nowIso,
      status: 'Under Review',
      notes: claimData.notes || '',
      priority: claimData.priority || 'Medium',
      assignedCaseId: null,
      fakeProbability: fakeProbability,
      mlVerdict: mlVerdict,
      mlConfidence: mlConfidence,
      mlPrediction: mlPrediction
    };

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('submitted_claims').doc(claimId).set(newClaim);
        console.log(`[TruthLens Firebase] Submitted claim ${claimId} with ML Fake Probability ${fakeProbability}% saved to Firestore.`);
      } catch (err) {
        console.error('[TruthLens Firebase] Error saving submitted claim:', err);
      }
    }

    const localClaims = getLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, DEFAULT_SUBMITTED_CLAIMS);
    localClaims.unshift(newClaim);
    setLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, localClaims);

    return newClaim;
  };

  const updateClaimStatus = async (claimId, newStatus, assignedCaseId = null) => {
    const updatePayload = { status: newStatus };
    if (assignedCaseId) updatePayload.assignedCaseId = assignedCaseId;

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('submitted_claims').doc(claimId).update(updatePayload);
      } catch (err) {
        console.error(`[TruthLens Firebase] Error updating claim ${claimId}:`, err);
      }
    }

    const localClaims = getLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, DEFAULT_SUBMITTED_CLAIMS);
    const index = localClaims.findIndex(c => c.id === claimId);
    if (index !== -1) {
      Object.assign(localClaims[index], updatePayload);
      setLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, localClaims);
    }
  };

  const deleteSubmittedClaim = async (claimId) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('submitted_claims').doc(claimId).delete();
      } catch (err) {
        console.error(`[TruthLens Firebase] Error deleting claim ${claimId}:`, err);
      }
    }

    let localClaims = getLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, DEFAULT_SUBMITTED_CLAIMS);
    localClaims = localClaims.filter(c => c.id !== claimId);
    setLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, localClaims);
  };

  // -------------------------------------------------------------------------
  // 7. AUDIT TIMELINE LOGGING (db: 'timeline')
  // -------------------------------------------------------------------------
  const getTimeline = async (caseId = null) => {
    const db = getFirestoreDb();
    if (db) {
      try {
        let query = db.collection('timeline');
        if (caseId && caseId !== 'all') {
          query = query.where('caseId', '==', caseId);
        }
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
          // sort descending by timestamp
          items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          return items;
        }
      } catch (err) {
        console.warn('[TruthLens Firebase] Timeline Firestore read note:', err);
      }
    }

    let localTimeline = getLocalData(LOCAL_KEYS.TIMELINE, DEFAULT_TIMELINE);
    if (caseId && caseId !== 'all') {
      return localTimeline.filter(e => e.caseId === caseId);
    }
    return localTimeline;
  };

  const createTimelineEvent = async (eventData) => {
    const id = eventData.id || `EVT-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const timestamp = eventData.timestamp || now.toISOString().slice(0, 19).replace('T', ' ');
    const relativeTime = eventData.relativeTime || 'Just now';

    const newEvent = {
      id,
      caseId: eventData.caseId || 'TL-Workspace',
      caseTitle: eventData.caseTitle || 'General',
      type: eventData.type || 'Activity Logged',
      icon: eventData.icon || 'bi-clock-history',
      color: eventData.color || 'primary',
      title: eventData.title,
      description: eventData.description || '',
      user: eventData.user || (getCurrentSession() ? getCurrentSession().name : 'Abinash Panigrahy'),
      timestamp,
      relativeTime
    };

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('timeline').doc(id).set(newEvent);
      } catch (err) {
        console.error('[TruthLens Firebase] Error logging timeline event:', err);
      }
    }

    const localTimeline = getLocalData(LOCAL_KEYS.TIMELINE, DEFAULT_TIMELINE);
    localTimeline.unshift(newEvent);
    setLocalData(LOCAL_KEYS.TIMELINE, localTimeline);
    return newEvent;
  };

  // -------------------------------------------------------------------------
  // 8. SESSION & ACTIVE PERSONA MANAGEMENT
  // -------------------------------------------------------------------------
  const getCurrentSession = () => {
    try {
      const stored = localStorage.getItem(LOCAL_KEYS.SESSION);
      if (stored) {
        let user = JSON.parse(stored);
        user = sanitizeLegacyNames(user);
        if (user && (user.id || user.email)) {
          if (user.role === 'admin') {
            user.name = 'Puja Mohapatra';
            user.avatar = 'PM';
          } else if (user.role === 'investigator' && (user.name === 'Investigator' || !user.name)) {
            user.name = 'Abinash Panigrahy';
            user.avatar = 'AP';
          } else if (user.role === 'user' && (user.name === 'Citizen User' || !user.name)) {
            user.name = 'Saumya Jit Mohanty';
            user.avatar = 'SM';
          }
          return user;
        }
      }
    } catch (_) {}
    return null;
  };

  const setCurrentSession = (user) => {
    try {
      localStorage.setItem(LOCAL_KEYS.SESSION, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('truthlens-session-change', { detail: user }));
    } catch (e) {
      console.warn('Session write error:', e);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(LOCAL_KEYS.SESSION);
    window.dispatchEvent(new CustomEvent('truthlens-session-change', { detail: null }));
  };

  // -------------------------------------------------------------------------
  // 8. DATABASE SEEDER & VERIFICATION UTILITIES
  // -------------------------------------------------------------------------
  const seedDatabase = async (force = false) => {
    const db = getFirestoreDb();
    if (!db) {
      console.warn('[TruthLens Firebase] Cannot seed: Firebase not configured. Seeding local storage mirror.');
      setLocalData(LOCAL_KEYS.INVESTIGATIONS, DEFAULT_INVESTIGATIONS);
      setLocalData(LOCAL_KEYS.EVIDENCE, DEFAULT_EVIDENCE);
      setLocalData(LOCAL_KEYS.NOTES, DEFAULT_NOTES);
      setLocalData(LOCAL_KEYS.REPORTS, DEFAULT_REPORTS);
      setLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
      setLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, DEFAULT_SUBMITTED_CLAIMS);
      setLocalData(LOCAL_KEYS.TIMELINE, DEFAULT_TIMELINE);
      return { success: true, mode: 'local' };
    }

    try {
      console.log('[TruthLens Firebase] Seeding default records into Firestore...');
      const batch = db.batch();

      // Seed investigations
      for (const item of DEFAULT_INVESTIGATIONS) {
        const ref = db.collection('investigations').doc(item.id);
        batch.set(ref, item, { merge: true });
      }

      // Seed evidence
      for (const item of DEFAULT_EVIDENCE) {
        const ref = db.collection('evidence').doc(item.id);
        batch.set(ref, item, { merge: true });
      }

      // Seed notes
      for (const item of DEFAULT_NOTES) {
        const ref = db.collection('notes').doc(item.id);
        batch.set(ref, item, { merge: true });
      }

      // Seed reports
      for (const item of DEFAULT_REPORTS) {
        const ref = db.collection('reports').doc(item.id);
        batch.set(ref, item, { merge: true });
      }

      // Seed users
      for (const item of DEFAULT_USERS) {
        const ref = db.collection('users').doc(item.id);
        batch.set(ref, item, { merge: true });
      }

      // Seed submitted claims
      for (const item of DEFAULT_SUBMITTED_CLAIMS) {
        const ref = db.collection('submitted_claims').doc(item.id);
        batch.set(ref, item, { merge: true });
      }

      // Seed timeline
      for (const item of DEFAULT_TIMELINE) {
        const ref = db.collection('timeline').doc(item.id);
        batch.set(ref, item, { merge: true });
      }

      await batch.commit();
      console.log('%c[TruthLens Firebase] Database seeding completed successfully!', 'color: #10B981; font-weight: bold;');
      return { 
        success: true, 
        mode: 'firestore', 
        count: DEFAULT_INVESTIGATIONS.length + DEFAULT_EVIDENCE.length + DEFAULT_NOTES.length + DEFAULT_USERS.length + DEFAULT_SUBMITTED_CLAIMS.length + DEFAULT_TIMELINE.length
      };
    } catch (err) {
      console.error('[TruthLens Firebase] Seeding failed:', err);
      throw err;
    }
  };

  const testConnection = async () => {
    const db = getFirestoreDb();
    if (!db) {
      return {
        connected: false,
        message: 'Firebase is running in local demo mode. Add your config in firebase-config.js.'
      };
    }

    try {
      const startTime = performance.now();
      const testDoc = db.collection('_connection_tests').doc('ping');
      await testDoc.set({ timestamp: new Date().toISOString(), ping: 'pong' });
      const readBack = await testDoc.get();
      const latencyMs = Math.round(performance.now() - startTime);

      if (readBack.exists) {
        return {
          connected: true,
          projectId: getProjectId(),
          latencyMs: latencyMs,
          message: `Connected to Cloud Firestore (Latency: ${latencyMs}ms)`
        };
      } else {
        return {
          connected: false,
          message: 'Write succeeded but read failed. Please check Firestore Security Rules.'
        };
      }
    } catch (err) {
      return {
        connected: false,
        error: err.code || err.message,
        message: `Firestore connection test failed: ${err.message}`
      };
    }
  };

  // -------------------------------------------------------------------------
  // 9. LOCALSTORAGE TO FIRESTORE DATA MIGRATION SERVICE
  // -------------------------------------------------------------------------
  const transferLocalStorageToFirestore = async () => {
    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Cloud Firestore is not initialized. Please verify your firebase-config.js credentials.');
    }

    console.log('%c[TruthLens Data Migration] Initiating LocalStorage -> Cloud Firestore transfer...', 'color: #2563EB; font-weight: bold;');

    const investigations = getLocalData(LOCAL_KEYS.INVESTIGATIONS, DEFAULT_INVESTIGATIONS);
    const evidence = getLocalData(LOCAL_KEYS.EVIDENCE, DEFAULT_EVIDENCE);
    const notes = getLocalData(LOCAL_KEYS.NOTES, DEFAULT_NOTES);
    const reports = getLocalData(LOCAL_KEYS.REPORTS, DEFAULT_REPORTS);
    const users = getLocalData(LOCAL_KEYS.USERS, DEFAULT_USERS);
    const submittedClaims = getLocalData(LOCAL_KEYS.SUBMITTED_CLAIMS, DEFAULT_SUBMITTED_CLAIMS);
    const timeline = getLocalData(LOCAL_KEYS.TIMELINE, DEFAULT_TIMELINE);

    // Ensure active session user is included in users list
    const currentSession = getCurrentSession();
    if (currentSession && currentSession.email) {
      const exists = users.some(u => u.email && u.email.toLowerCase() === currentSession.email.toLowerCase());
      if (!exists) {
        users.push(currentSession);
      }
    }

    const counts = {
      users: 0,
      investigations: 0,
      evidence: 0,
      notes: 0,
      reports: 0,
      submittedClaims: 0,
      timeline: 0
    };

    const allOperations = [];

    // 1. Users
    users.forEach(item => {
      const docId = item.id || item.uid || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      allOperations.push({ collection: 'users', id: docId, data: item, type: 'users' });
    });

    // 2. Investigations
    investigations.forEach(item => {
      const docId = item.id || `TL-${Math.floor(8000 + Math.random() * 1999)}`;
      allOperations.push({ collection: 'investigations', id: docId, data: item, type: 'investigations' });
    });

    // 3. Evidence
    evidence.forEach(item => {
      const docId = item.id || `EV-${Math.floor(1000 + Math.random() * 8999)}`;
      allOperations.push({ collection: 'evidence', id: docId, data: item, type: 'evidence' });
    });

    // 4. Notes
    notes.forEach(item => {
      const docId = item.id || `NOTE-${Math.floor(300 + Math.random() * 699)}`;
      allOperations.push({ collection: 'notes', id: docId, data: item, type: 'notes' });
    });

    // 5. Reports
    reports.forEach(item => {
      const docId = item.id || `REP-${Math.floor(100 + Math.random() * 899)}`;
      allOperations.push({ collection: 'reports', id: docId, data: item, type: 'reports' });
    });

    // 6. Submitted Claims
    submittedClaims.forEach(item => {
      const docId = item.id || `CLM-${Math.floor(500 + Math.random() * 499)}`;
      allOperations.push({ collection: 'submitted_claims', id: docId, data: item, type: 'submittedClaims' });
    });

    // 7. Timeline Events
    timeline.forEach(item => {
      const docId = item.id || `EVT-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substr(2, 3)}`;
      allOperations.push({ collection: 'timeline', id: docId, data: item, type: 'timeline' });
    });

    // Write in batches of 400 (Firestore max is 500)
    const BATCH_SIZE = 400;
    for (let i = 0; i < allOperations.length; i += BATCH_SIZE) {
      const chunk = allOperations.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      chunk.forEach(op => {
        const ref = db.collection(op.collection).doc(op.id);
        batch.set(ref, op.data, { merge: true });
        counts[op.type]++;
      });
      await batch.commit();
    }

    // Save migration audit record
    try {
      await db.collection('_metadata').doc('storage_migration').set({
        lastSync: new Date().toISOString(),
        totalTransferred: allOperations.length,
        breakdown: counts,
        source: 'LocalStorage to Cloud Firestore'
      }, { merge: true });
    } catch (_) {}

    const totalTransferred = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(
      `%c[TruthLens Data Migration] Complete! Migrated ${totalTransferred} records into Cloud Firestore:\n` +
      `  • Users: ${counts.users}\n` +
      `  • Investigations: ${counts.investigations}\n` +
      `  • Evidence: ${counts.evidence}\n` +
      `  • Notes: ${counts.notes}\n` +
      `  • Reports: ${counts.reports}\n` +
      `  • Submitted Claims: ${counts.submittedClaims}\n` +
      `  • Timeline Audit Events: ${counts.timeline}`,
      'color: #10B981; font-weight: bold;'
    );

    return {
      success: true,
      mode: 'firestore',
      totalRecords: totalTransferred,
      counts: counts,
      timestamp: new Date().toISOString()
    };
  };

  // Background Auto-Sync: ensure Cloud Firestore has all collections initialized
  const autoSyncOnStartup = async () => {
    const db = getFirestoreDb();
    if (!db) return;
    try {
      const [invSnap, claimSnap, userSnap] = await Promise.all([
        db.collection('investigations').limit(1).get().catch(() => ({ empty: true })),
        db.collection('submitted_claims').limit(1).get().catch(() => ({ empty: true })),
        db.collection('users').limit(1).get().catch(() => ({ empty: true }))
      ]);

      if (invSnap.empty || claimSnap.empty || userSnap.empty) {
        console.info('[TruthLens Firebase] Cloud Firestore missing core collections. Auto-syncing full dataset to Cloud Firestore...');
        await seedDatabase(false);
      }
    } catch (err) {
      console.warn('[TruthLens Firebase] Auto-sync check note:', err.message);
    }
  };

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(autoSyncOnStartup, 800));
    } else {
      setTimeout(autoSyncOnStartup, 800);
    }
  }

  // =========================================================================
  // PUBLIC API EXPORT
  // =========================================================================
  window.TruthLensDB = {
    isConfigured,
    getProjectId,
    getDb: getFirestoreDb,

    // ML Fake News Predictor
    predictClaim: (text, url) => (window.TruthLensML && typeof window.TruthLensML.predict === 'function' ? window.TruthLensML.predict(text, url) : null),

    // Investigations
    getInvestigations,
    getInvestigation,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation,
    listenInvestigations,

    // Evidence
    getEvidence,
    createEvidence,
    deleteEvidence,

    // Notes
    getNotes,
    createNote,
    updateNote,
    togglePinNote,
    deleteNote,

    // Reports & Conclusions
    getReports,
    getConclusion,
    saveConclusion,

    // Timeline
    getTimeline,
    createTimelineEvent,

    // Users & Roles
    getUsers,
    getUser,
    createUser,
    updateUserRole,
    updateUserStatus,
    updateUserProfile,

    // Public Claims Ingestion
    getSubmittedClaims,
    submitUserClaim,
    updateClaimStatus,
    deleteSubmittedClaim,

    // Session Management
    getCurrentSession,
    setCurrentSession,
    clearSession,

    // Seeding & Admin Migration
    seedDatabase,
    transferLocalStorageToFirestore,
    testConnection,

    // Default Raw Datasets (Reference)
    DEFAULT_INVESTIGATIONS,
    DEFAULT_EVIDENCE,
    DEFAULT_NOTES,
    DEFAULT_REPORTS,
    DEFAULT_USERS,
    DEFAULT_SUBMITTED_CLAIMS,
    DEFAULT_TIMELINE
  };

})();
