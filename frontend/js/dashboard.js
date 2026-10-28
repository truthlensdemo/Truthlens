/**
 * TruthLens — Dashboard View Controller
 * Initializes Chart.js analytics, handles responsive sidebar drawer toggle,
 * and controls live demo empty/populated state toggling.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. DOM Element Cache
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  const toggleDemoStateBtn = document.getElementById('toggleDemoStateBtn');
  const toggleDemoStateText = document.getElementById('toggleDemoStateText');
  const dashboardDataContainer = document.getElementById('dashboardDataContainer');
  const dashboardEmptyState = document.getElementById('dashboardEmptyState');

  // 2. Responsive Sidebar Drawer Toggle (Tablet & Mobile)
  const openSidebar = () => {
    if (appSidebar && sidebarBackdrop) {
      appSidebar.classList.add('open');
      sidebarBackdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeSidebar = () => {
    if (appSidebar && sidebarBackdrop) {
      appSidebar.classList.remove('open');
      sidebarBackdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  // 3. Initialize Chart.js Instances
  let statusChartInstance = null;
  let evidenceChartInstance = null;

  const initDashboardCharts = () => {
    // Chart 1: Investigation Case Status (Doughnut)
    const ctxStatus = document.getElementById('investigationStatusChart');
    if (ctxStatus) {
      statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Active Cases', 'Completed Dossiers', 'Draft Cases', 'Archived'],
          datasets: [{
            data: [12, 16, 3, 2],
            backgroundColor: [
              '#1E3A5F', // Deep Navy (Active)
              '#15803D', // Forest Green (Completed)
              '#64748B', // Muted Slate (Draft)
              '#E2E8F0'  // Border Slate (Archived)
            ],
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                padding: 16,
                font: {
                  family: "'Inter', sans-serif",
                  size: 12
                },
                color: '#475569'
              }
            },
            tooltip: {
              backgroundColor: '#0F172A',
              padding: 10,
              cornerRadius: 6,
              titleFont: { family: "'Inter', sans-serif", size: 12 },
              bodyFont: { family: "'Inter', sans-serif", size: 12 }
            }
          },
          cutout: '68%'
        }
      });
    }

    // Chart 2: Evidence Classification Breakdown (Bar Chart)
    const ctxEvidence = document.getElementById('evidenceClassificationChart');
    if (ctxEvidence) {
      evidenceChartInstance = new Chart(ctxEvidence, {
        type: 'bar',
        data: {
          labels: ['Supporting', 'Against / Refuting', 'Neutral Context', 'Needs Verification'],
          datasets: [{
            label: 'Indexed Sources',
            data: [42, 68, 18, 14],
            backgroundColor: [
              '#15803D', // Green Supporting
              '#B91C1C', // Red Against
              '#475569', // Neutral Slate
              '#B45309'  // Amber Needs Verification
            ],
            borderRadius: 4,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { family: "'Inter', sans-serif", size: 11 },
                color: '#64748B'
              }
            },
            y: {
              beginAtZero: true,
              grid: { color: '#F1F5F9' },
              ticks: {
                stepSize: 20,
                font: { family: "'Inter', sans-serif", size: 11 },
                color: '#64748B'
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0F172A',
              padding: 10,
              cornerRadius: 6,
              titleFont: { family: "'Inter', sans-serif", size: 12 },
              bodyFont: { family: "'Inter', sans-serif", size: 12 }
            }
          }
        }
      });
    }
  };

  // Initialize charts on startup
  initDashboardCharts();

  // Dynamic Chart Theme Adaptation (Dark Mode & Light Mode)
  const syncChartsWithTheme = (isDark) => {
    const textMuted = isDark ? '#9CA3AF' : '#475569';
    const gridColor = isDark ? '#374151' : '#F1F5F9';
    const donutBorder = isDark ? '#111827' : '#FFFFFF';
    const activeCaseBg = isDark ? '#38BDF8' : '#1E3A5F';
    const archivedBg = isDark ? '#374151' : '#E2E8F0';

    if (statusChartInstance) {
      statusChartInstance.data.datasets[0].borderColor = donutBorder;
      if (statusChartInstance.data.datasets[0].backgroundColor) {
        statusChartInstance.data.datasets[0].backgroundColor[0] = activeCaseBg;
        statusChartInstance.data.datasets[0].backgroundColor[3] = archivedBg;
      }
      if (statusChartInstance.options.plugins && statusChartInstance.options.plugins.legend) {
        statusChartInstance.options.plugins.legend.labels.color = textMuted;
      }
      statusChartInstance.update();
    }

    if (evidenceChartInstance) {
      if (evidenceChartInstance.options.scales) {
        if (evidenceChartInstance.options.scales.x && evidenceChartInstance.options.scales.x.ticks) {
          evidenceChartInstance.options.scales.x.ticks.color = textMuted;
        }
        if (evidenceChartInstance.options.scales.y) {
          if (evidenceChartInstance.options.scales.y.ticks) {
            evidenceChartInstance.options.scales.y.ticks.color = textMuted;
          }
          if (evidenceChartInstance.options.scales.y.grid) {
            evidenceChartInstance.options.scales.y.grid.color = gridColor;
          }
        }
      }
      evidenceChartInstance.update();
    }
  };

  // Listen for real-time theme switch events
  window.addEventListener('truthlens-theme-change', (e) => {
    syncChartsWithTheme(e.detail.isDark);
  });

  // Initial synchronization if page loaded in dark mode
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    syncChartsWithTheme(true);
  }

  // 4. Interactive Simulation: Toggle Empty vs. Populated States
  if (toggleDemoStateBtn && dashboardDataContainer && dashboardEmptyState) {
    let isEmpty = false;

    toggleDemoStateBtn.addEventListener('click', () => {
      isEmpty = !isEmpty;

      if (isEmpty) {
        dashboardDataContainer.classList.add('d-none');
        dashboardEmptyState.classList.remove('d-none');
        toggleDemoStateText.textContent = 'Simulate Populated State';
      } else {
        dashboardEmptyState.classList.add('d-none');
        dashboardDataContainer.classList.remove('d-none');
        toggleDemoStateText.textContent = 'Simulate Empty State';

        // Trigger chart resize recalculation
        if (statusChartInstance) statusChartInstance.resize();
        if (evidenceChartInstance) evidenceChartInstance.resize();
      }
    });
  }

  // 5. Global Search Filter Handler (Console Demo)
  const globalSearchInput = document.getElementById('globalSearchInput');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = globalSearchInput.value.trim();
        if (query) {
          console.info(`[TruthLens] Executing global search across workspace: "${query}"`);
        }
      }
    });
  }

  // 6. Real-Time Cloud Firestore Dashboard Metrics Sync
  const syncDashboardMetricsWithFirestore = async () => {
    if (!window.TruthLensDB) return;
    try {
      const [cases, evidenceList] = await Promise.all([
        window.TruthLensDB.getInvestigations(),
        window.TruthLensDB.getEvidence()
      ]);

      if (cases && cases.length) {
        const totalEl = document.getElementById('statTotalInquests');
        const activeEl = document.getElementById('statActiveInquests');
        const compEl = document.getElementById('statCompletedInquests');
        const evidEl = document.getElementById('statTotalEvidence');

        if (totalEl) totalEl.textContent = cases.length;
        if (activeEl) activeEl.textContent = cases.filter(c => c.status === 'Active' || c.status === 'In Progress').length;
        if (compEl) compEl.textContent = cases.filter(c => c.status === 'Completed').length;
        if (evidEl && evidenceList) evidEl.textContent = evidenceList.length;

        if (statusChartInstance) {
          const activeCount = cases.filter(c => c.status === 'Active' || c.status === 'In Progress').length;
          const completedCount = cases.filter(c => c.status === 'Completed').length;
          const draftCount = cases.filter(c => c.status === 'Draft' || c.status === 'Under Review').length;
          const archivedCount = cases.filter(c => c.status === 'Archived').length;

          statusChartInstance.data.datasets[0].data = [activeCount, completedCount, draftCount, archivedCount];
          statusChartInstance.update();
        }
      }

      if (evidenceList && evidenceList.length && evidenceChartInstance) {
        const supporting = evidenceList.filter(e => e.classification === 'Supporting').length;
        const against = evidenceList.filter(e => e.classification === 'Against').length;
        const neutral = evidenceList.filter(e => e.classification === 'Neutral').length;
        const needsVerif = evidenceList.filter(e => e.classification === 'Needs Verification').length;

        evidenceChartInstance.data.datasets[0].data = [supporting, against, neutral, needsVerif];
        evidenceChartInstance.update();
      }

      // Render Dynamic Recent Investigations Table with ML Veracity Metrics
      const recentTbody = document.getElementById('recentInvestigationsTableBody');
      if (recentTbody && cases && cases.length) {
        const topCases = cases.slice(0, 5);
        recentTbody.innerHTML = topCases.map(c => {
          const statusClass = c.status === 'Completed' ? 'tl-badge-completed' : (c.status === 'Draft' ? 'tl-badge-draft' : 'tl-badge-active');
          const conf = c.confidence || 50;
          const confColor = conf >= 75 ? 'bg-success' : (conf >= 50 ? 'bg-primary' : 'bg-warning');

          const fakeScore = c.fakeProbability !== undefined 
            ? c.fakeProbability 
            : (c.verdict === 'Unsupported' ? 92 : (c.verdict === 'Mostly Unsupported' ? 82 : 35));
          
          let mlBadgeClass = 'bg-danger text-white';
          let mlIcon = 'bi-exclamation-octagon-fill';
          if (fakeScore < 40) {
            mlBadgeClass = 'bg-success-subtle text-success border border-success-subtle';
            mlIcon = 'bi-shield-check';
          } else if (fakeScore < 70) {
            mlBadgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
            mlIcon = 'bi-exclamation-triangle-fill';
          }

          return `
            <tr>
              <td>
                <div class="fw-semibold text-dark text-truncate" style="max-width: 320px;" title="${c.claim || c.title}">
                  ${c.title}
                </div>
                <div class="tl-micro text-muted">ID: #${c.id} &bull; ${c.category || 'General'}</div>
              </td>
              <td>
                <span class="badge ${mlBadgeClass} d-inline-flex align-items-center gap-1">
                  <i class="bi ${mlIcon}"></i>
                  <strong>${fakeScore}%</strong> Fake
                </span>
                <div class="tl-micro text-muted mt-1">${c.verdict || 'ML Evaluated'}</div>
              </td>
              <td>
                <span class="tl-badge ${statusClass}">${c.status}</span>
              </td>
              <td>
                <span class="tl-small fw-medium">${c.evidenceCount || 0} Sources</span>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1 tl-progress-sm" style="height: 6px;">
                    <div class="progress-bar ${confColor}" role="progressbar" style="width: ${conf}%" aria-valuenow="${conf}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <span class="tl-micro fw-semibold">${conf}%</span>
                </div>
              </td>
              <td class="text-end">
                <a href="investigation-details.html?id=${c.id}" class="btn btn-sm btn-light border py-1 px-2" title="Inspect Case">
                  <i class="bi bi-arrow-right"></i>
                </a>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Render Dynamic Recent Evidence Feed
      const recentEvContainer = document.getElementById('recentEvidenceContainer');
      if (recentEvContainer && evidenceList && evidenceList.length) {
        const topEvidence = evidenceList.slice(0, 3);
        recentEvContainer.innerHTML = topEvidence.map(ev => {
          let badgeClass = 'tl-badge-neutral';
          let badgeIcon = 'bi-dash-circle';
          if (ev.classification === 'Supporting') {
            badgeClass = 'tl-badge-support';
            badgeIcon = 'bi-shield-check';
          } else if (ev.classification === 'Against') {
            badgeClass = 'tl-badge-against';
            badgeIcon = 'bi-shield-x';
          } else if (ev.classification === 'Needs Verification') {
            badgeClass = 'tl-badge-verify';
            badgeIcon = 'bi-question-circle';
          }

          return `
            <div class="p-3 bg-light rounded-2 border tl-evidence-widget-card">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <span class="tl-badge ${badgeClass}">
                  <i class="bi ${badgeIcon} me-1"></i> ${ev.classification}
                </span>
                <span class="tl-micro text-muted">${ev.ingestedDate || 'Recent'}</span>
              </div>
              <div class="fw-semibold text-dark tl-small mb-1 text-truncate" title="${ev.title}">
                ${ev.title}
              </div>
              <p class="tl-micro text-secondary mb-2 line-clamp-2">
                Source: ${ev.publisher || ev.sourceUrl || 'Document'} &bull; Credibility: ${ev.credibility || 4}/5
              </p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="tl-micro text-muted">Case #${ev.caseId || 'TL-General'}</span>
                <a href="evidence.html?id=${ev.id}" class="tl-small text-primary text-decoration-none fw-medium">Inspect Record &rarr;</a>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Dashboard Firestore metrics sync:', err);
    }
  };

  // 7. Interactive ML Prediction Workbench Handler
  const labClaimInput = document.getElementById('labClaimInput');
  const labUrlInput = document.getElementById('labUrlInput');
  const labCategorySelect = document.getElementById('labCategorySelect');
  const btnRunLabPredict = document.getElementById('btnRunLabPredict');
  const btnClearLabPredict = document.getElementById('btnClearLabPredict');
  const btnSaveLabAsCase = document.getElementById('btnSaveLabAsCase');

  const labMlPercentDisplay = document.getElementById('labMlPercentDisplay');
  const labMlProgressBar = document.getElementById('labMlProgressBar');
  const labMlVerdictBadge = document.getElementById('labMlVerdictBadge');
  const labMetricSensational = document.getElementById('labMetricSensational');
  const labBarSensational = document.getElementById('labBarSensational');
  const labMetricBias = document.getElementById('labMetricBias');
  const labBarBias = document.getElementById('labBarBias');
  const labMetricSource = document.getElementById('labMetricSource');
  const labBarSource = document.getElementById('labBarSource');
  const labMlSignalsText = document.getElementById('labMlSignalsText');

  let currentLabPrediction = null;

  const executeLabPrediction = () => {
    if (!labClaimInput) return;
    const claim = labClaimInput.value.trim();
    const url = labUrlInput ? labUrlInput.value.trim() : '';

    if (!claim) {
      alert('Please enter a claim statement or headline to run the ML veracity model.');
      return;
    }

    if (!window.TruthLensML) {
      console.warn('TruthLens ML model not initialized.');
      return;
    }

    const res = window.TruthLensML.predict(claim, url);
    currentLabPrediction = res;

    if (labMlPercentDisplay) labMlPercentDisplay.textContent = `${res.fakeProbability}%`;
    if (labMlProgressBar) {
      labMlProgressBar.style.width = `${res.fakeProbability}%`;
      labMlProgressBar.className = `progress-bar ${res.fakeProbability >= 70 ? 'bg-danger' : (res.fakeProbability >= 45 ? 'bg-warning' : 'bg-success')}`;
    }
    if (labMlVerdictBadge) {
      labMlVerdictBadge.className = `badge ${res.badgeClass}`;
      labMlVerdictBadge.textContent = res.verdict;
    }

    if (labMetricSensational) labMetricSensational.textContent = `${res.metrics.sensationalism}%`;
    if (labBarSensational) labBarSensational.style.width = `${res.metrics.sensationalism}%`;

    if (labMetricBias) labMetricBias.textContent = `${res.metrics.linguisticBias}%`;
    if (labBarBias) labBarBias.style.width = `${res.metrics.linguisticBias}%`;

    if (labMetricSource) labMetricSource.textContent = `${res.metrics.sourceCredibility}%`;
    if (labBarSource) labBarSource.style.width = `${res.metrics.sourceCredibility}%`;

    if (labMlSignalsText) {
      if (res.signals && res.signals.length) {
        labMlSignalsText.innerHTML = `<ul class="mb-0 ps-3">${res.signals.map(s => `<li>${s}</li>`).join('')}</ul>`;
      } else {
        labMlSignalsText.textContent = res.explanation;
      }
    }

    if (btnSaveLabAsCase) btnSaveLabAsCase.disabled = false;
  };

  if (btnRunLabPredict) btnRunLabPredict.addEventListener('click', executeLabPrediction);

  if (btnClearLabPredict) {
    btnClearLabPredict.addEventListener('click', () => {
      if (labClaimInput) labClaimInput.value = '';
      if (labUrlInput) labUrlInput.value = '';
      if (labMlPercentDisplay) labMlPercentDisplay.textContent = '--%';
      if (labMlProgressBar) labMlProgressBar.style.width = '0%';
      if (labMlVerdictBadge) {
        labMlVerdictBadge.className = 'badge bg-secondary-subtle text-secondary';
        labMlVerdictBadge.textContent = 'Awaiting Input';
      }
      if (labMlSignalsText) {
        labMlSignalsText.textContent = 'Run the model on the left to inspect extracted linguistic patterns and probability weighting.';
      }
      if (btnSaveLabAsCase) btnSaveLabAsCase.disabled = true;
      currentLabPrediction = null;
    });
  }

  // Preset buttons
  document.querySelectorAll('.lab-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (labClaimInput) labClaimInput.value = btn.getAttribute('data-claim');
      if (labUrlInput) labUrlInput.value = btn.getAttribute('data-url');
      if (labCategorySelect && btn.getAttribute('data-cat')) {
        labCategorySelect.value = btn.getAttribute('data-cat');
      }
      executeLabPrediction();
    });
  });

  // Save as Investigation Dossier in Cloud Firestore
  if (btnSaveLabAsCase) {
    btnSaveLabAsCase.addEventListener('click', async () => {
      if (!currentLabPrediction || !labClaimInput) return;
      const claim = labClaimInput.value.trim();
      const cat = labCategorySelect ? labCategorySelect.value : 'General';

      btnSaveLabAsCase.disabled = true;
      btnSaveLabAsCase.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving to Cloud Firestore...';

      try {
        const newCase = await window.TruthLensDB.createInvestigation({
          title: `Inquest: ${claim.length > 55 ? claim.substring(0, 55) + '...' : claim}`,
          claim: claim,
          category: cat,
          status: 'Active',
          priority: currentLabPrediction.fakeProbability >= 70 ? 'Critical' : 'Medium',
          verdict: currentLabPrediction.verdict,
          fakeProbability: currentLabPrediction.fakeProbability,
          confidence: currentLabPrediction.credibilityScore,
          description: currentLabPrediction.explanation,
          evidenceCount: 1,
          leadInvestigator: 'TruthLens AI Forensic Engine'
        });

        if (window.showToast) {
          window.showToast(`Dossier #${newCase.id} created with ML Fake Probability ${currentLabPrediction.fakeProbability}%!`, 'success');
        }

        await syncDashboardMetricsWithFirestore();
      } catch (err) {
        alert('Error saving dossier to Firestore: ' + err.message);
      } finally {
        btnSaveLabAsCase.disabled = false;
        btnSaveLabAsCase.innerHTML = '<i class="bi bi-folder-plus"></i> Save as Investigation Dossier in Firestore';
      }
    });
  }

  setTimeout(syncDashboardMetricsWithFirestore, 200);
});