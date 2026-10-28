/**
 * TruthLens — Investigation & Reports Unified Controller
 * Handles:
 * 1. Reports Master Table, Filtering, PDF Preview & Print Engine (`reports.html`)
 * 2. Final Conclusion Synthesis & Locking (`conclusion.html`)
 * 3. Investigation Creation & Tags (`create-investigation.html`)
 * 4. Case Repository Table & Filters (`investigations.html`)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================================================
  // 1. REPORTS DIRECTORY & PDF PREVIEW CONTROLLER (`reports.html`)
  // ==========================================================================
  const reportsTableBody = document.getElementById('reportsTableBody');
  if (reportsTableBody) {
    let reportsData = [];

    // DOM Elements
    const searchInput = document.getElementById('reportSearchInput');
    const verdictFilter = document.getElementById('reportVerdictFilter');
    const statusFilter = document.getElementById('reportStatusFilter');
    const sortSelect = document.getElementById('reportSortOrder');
    const displayedCount = document.getElementById('reportsDisplayedCount');
    const totalCount = document.getElementById('reportsTotalCount');
    const resetFiltersBtn = document.getElementById('resetReportFiltersBtn');
    const emptyResetFiltersBtn = document.getElementById('emptyResetReportFiltersBtn');
    const reportsTableCard = document.getElementById('reportsTableCard');
    const emptyState = document.getElementById('noReportsEmptyState');

    // Modals
    const previewModalEl = document.getElementById('reportPreviewModal');
    const bsPreviewModal = new bootstrap.Modal(previewModalEl);
    const deleteModalEl = document.getElementById('deleteReportModal');
    const bsDeleteModal = new bootstrap.Modal(deleteModalEl);
    const deletePreviewTitle = document.getElementById('deleteReportTitlePreview');
    const confirmDeleteBtn = document.getElementById('confirmDeleteReportBtn');
    let reportIdPendingDelete = null;

    let filteredReports = [...reportsData];

    // UI Helper: Verdict Badge
    const getVerdictBadge = (verdict) => {
      switch (verdict) {
        case 'Mostly Unsupported':
          return `<span class="tl-badge tl-badge-against"><i class="bi bi-shield-x me-1"></i>Mostly Unsupported</span>`;
        case 'Unsupported':
          return `<span class="tl-badge tl-badge-against"><i class="bi bi-x-circle-fill me-1"></i>Unsupported</span>`;
        case 'Partially Supported':
          return `<span class="tl-badge tl-badge-verify"><i class="bi bi-question-circle me-1"></i>Partially Supported</span>`;
        case 'Mostly Supported':
          return `<span class="tl-badge tl-badge-support"><i class="bi bi-shield-check me-1"></i>Mostly Supported</span>`;
        case 'Inconclusive':
          return `<span class="tl-badge tl-badge-neutral"><i class="bi bi-dash-circle me-1"></i>Inconclusive</span>`;
        default:
          return `<span class="tl-badge">${verdict}</span>`;
      }
    };

    // UI Helper: Case Status Badge
    const getCaseStatusBadge = (status) => {
      switch (status) {
        case 'Active': return `<span class="tl-badge tl-badge-active">Active</span>`;
        case 'Completed': return `<span class="tl-badge tl-badge-completed">Completed</span>`;
        case 'Draft': return `<span class="tl-badge tl-badge-draft">Draft</span>`;
        default: return `<span class="tl-badge">${status}</span>`;
      }
    };

    // UI Helper: Confidence Bar
    const getConfidenceBar = (score) => {
      let colorClass = 'bg-secondary';
      if (score >= 75) colorClass = 'bg-success';
      else if (score >= 40) colorClass = 'bg-warning';
      else if (score > 0) colorClass = 'bg-danger';

      return `
        <div class="d-flex align-items-center gap-2">
          <div class="progress flex-grow-1 tl-progress-sm" style="height: 6px;">
            <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${score}%;" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <span class="tl-micro fw-semibold" style="width: 32px;">${score}%</span>
        </div>
      `;
    };

    // Render Table
    const renderReportsTable = () => {
      reportsTableBody.innerHTML = '';
      const total = filteredReports.length;
      totalCount.textContent = reportsData.length;
      displayedCount.textContent = total;

      if (total === 0) {
        reportsTableCard.classList.add('d-none');
        emptyState.classList.remove('d-none');
        return;
      }

      reportsTableCard.classList.remove('d-none');
      emptyState.classList.add('d-none');

      filteredReports.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div class="fw-semibold text-dark text-truncate" style="max-width: 360px;">
              <a href="#" class="text-dark text-decoration-none btn-view-report" data-id="${item.id}">
                ${item.title}
              </a>
            </div>
            <div class="tl-claim-preview-text text-muted" title="${item.claim}">
              "${item.claim}"
            </div>
            <div class="tl-micro text-muted mt-1">
              <span>Report ID: <strong>#${item.id}</strong></span> &bull;
              <span>Case: <strong>#${item.caseId}</strong></span>
            </div>
          </td>
          <td>
            <div class="tl-small text-dark fw-medium">${item.displayDate}</div>
            <div class="tl-micro text-muted">${item.date}</div>
          </td>
          <td>${getCaseStatusBadge(item.caseStatus)}</td>
          <td>${getConfidenceBar(item.confidence)}</td>
          <td>${getVerdictBadge(item.verdict)}</td>
          <td class="text-end">
            <div class="d-inline-flex gap-1">
              <button type="button" class="tl-table-action-btn btn-view-report" data-id="${item.id}" title="Inspect Dossier">
                <i class="bi bi-eye"></i>
              </button>
              <button type="button" class="tl-table-action-btn btn-download-pdf text-primary" data-id="${item.id}" title="Print / Download PDF">
                <i class="bi bi-filetype-pdf"></i>
              </button>
              <button type="button" class="tl-table-action-btn btn-delete btn-delete-report text-danger" data-id="${item.id}" data-title="${item.title}" title="Delete Report">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </td>
        `;
        reportsTableBody.appendChild(row);
      });
    };

    // Filter and Sort Engine
    const applyReportFilters = () => {
      const q = searchInput.value.trim().toLowerCase();
      const verdict = verdictFilter.value;
      const status = statusFilter.value;
      const sort = sortSelect.value;

      filteredReports = reportsData.filter((item) => {
        const matchesSearch = 
          item.title.toLowerCase().includes(q) ||
          item.claim.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.caseId.toLowerCase().includes(q);

        const matchesVerdict = verdict === 'all' || item.verdict === verdict;
        const matchesStatus = status === 'all' || item.caseStatus === status;

        return matchesSearch && matchesVerdict && matchesStatus;
      });

      filteredReports.sort((a, b) => {
        switch (sort) {
          case 'date-desc': return new Date(b.date) - new Date(a.date);
          case 'date-asc': return new Date(a.date) - new Date(b.date);
          case 'confidence-desc': return b.confidence - a.confidence;
          default: return 0;
        }
      });

      const hasFilters = q !== '' || verdict !== 'all' || status !== 'all';
      resetFiltersBtn.classList.toggle('d-none', !hasFilters);

      renderReportsTable();
    };

    const resetReportFilters = () => {
      searchInput.value = '';
      verdictFilter.value = 'all';
      statusFilter.value = 'all';
      sortSelect.value = 'date-desc';
      applyReportFilters();
    };

    searchInput.addEventListener('input', applyReportFilters);
    verdictFilter.addEventListener('change', applyReportFilters);
    statusFilter.addEventListener('change', applyReportFilters);
    sortSelect.addEventListener('change', applyReportFilters);
    resetFiltersBtn.addEventListener('click', resetReportFilters);
    emptyResetFiltersBtn.addEventListener('click', resetReportFilters);

    // Open Dossier Preview
    const openDossierPreview = (reportId) => {
      const report = reportsData.find(r => r.id === reportId);
      if (!report) return;

      document.getElementById('previewReportId').textContent = `#${report.id}`;
      document.getElementById('repDocId').textContent = `TL-${report.id}`;
      document.getElementById('repDocDate').textContent = report.displayDate;
      document.getElementById('repDocStatus').textContent = `${report.caseStatus} Case`;
      document.getElementById('repDocCategory').textContent = report.category;
      document.getElementById('repDocTitle').textContent = report.title;
      document.getElementById('repDocClaim').textContent = `"${report.claim}"`;
      document.getElementById('repDocConfidenceScore').textContent = `${report.confidence}%`;
      document.getElementById('repDocConfidenceBar').style.width = `${report.confidence}%`;
      document.getElementById('repDocCountSupport').textContent = report.supportCount;
      document.getElementById('repDocCountAgainst').textContent = report.againstCount;
      document.getElementById('repDocCountNeutral').textContent = report.neutralCount;
      document.getElementById('repDocSummary').textContent = report.summary;
      document.getElementById('repDocVerdictBadge').textContent = report.verdict;
      document.getElementById('repDocConclusionText').textContent = report.conclusionText;

      bsPreviewModal.show();
    };

    // Table Actions Delegation
    reportsTableBody.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.btn-view-report');
      if (viewBtn) {
        e.preventDefault();
        openDossierPreview(viewBtn.getAttribute('data-id'));
        return;
      }

      const pdfBtn = e.target.closest('.btn-download-pdf');
      if (pdfBtn) {
        e.preventDefault();
        openDossierPreview(pdfBtn.getAttribute('data-id'));
        setTimeout(() => { window.print(); }, 400);
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-report');
      if (deleteBtn) {
        reportIdPendingDelete = deleteBtn.getAttribute('data-id');
        const title = deleteBtn.getAttribute('data-title');
        deletePreviewTitle.textContent = `${reportIdPendingDelete}: ${title}`;
        bsDeleteModal.show();
        return;
      }
    });

    // Delete Confirmation
    confirmDeleteBtn.addEventListener('click', () => {
      if (reportIdPendingDelete) {
        reportsData = reportsData.filter(r => r.id !== reportIdPendingDelete);
        bsDeleteModal.hide();
        reportIdPendingDelete = null;
        applyReportFilters();
      }
    });

    // Print Triggers
    const triggerPrint = () => { window.print(); };
    document.getElementById('btnPrintPdf').addEventListener('click', triggerPrint);
    document.getElementById('btnPrintPdfFooter').addEventListener('click', triggerPrint);

    // Initial render from Cloud Firestore
    const initReportsView = async () => {
      if (window.TruthLensDB) {
        try {
          reportsData = await window.TruthLensDB.getReports();
        } catch (err) {
          console.error('Failed loading reports from DB:', err);
        }
      }
      applyReportFilters();

      // Deep link support for ?id=... or ?generate=...
      const urlParams = new URLSearchParams(window.location.search);
      const targetRepId = urlParams.get('id') || urlParams.get('generate');
      if (targetRepId && reportsData.length > 0) {
        const matched = reportsData.find(r => r.id === targetRepId || r.caseId === targetRepId);
        if (matched) {
          openDossierPreview(matched.id);
        }
      }
    };
    initReportsView();
  }

  // ==========================================================================
  // 2. FINAL CONCLUSION WORKSPACE CONTROLLER (`conclusion.html`)
  // ==========================================================================
  const conclusionForm = document.getElementById('conclusionForm');
  if (conclusionForm) {
    const statusSelect = document.getElementById('conclusionStatusSelect');
    const statusBadge = document.getElementById('conclusionStatusBadge');
    const textarea = document.getElementById('conclusionTextarea');
    const charCounter = document.getElementById('conclusionCharCounter');
    const btnSaveDraft = document.getElementById('btnSaveDraft');
    const btnUnlockEdit = document.getElementById('btnUnlockEdit');
    const btnFinalizeModalTrigger = document.getElementById('btnFinalizeModalTrigger');
    const btnConfirmFinalize = document.getElementById('btnConfirmFinalize');
    const modalVerdictPreview = document.getElementById('modalVerdictPreview');
    const finalizeModalEl = document.getElementById('finalizeModal');
    const bsFinalizeModal = new bootstrap.Modal(finalizeModalEl);
    const successAlert = document.getElementById('conclusionSuccessAlert');
    const successMessage = document.getElementById('conclusionSuccessMessage');
    const lastSavedTimestamp = document.getElementById('lastSavedTimestamp');

    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id') || urlParams.get('case') || 'TL-8429';

    const maxChars = 2500;
    const updateCounter = () => {
      const len = textarea.value.length;
      charCounter.textContent = `${len} / ${maxChars}`;
      if (len >= maxChars) {
        charCounter.classList.add('text-danger', 'counter-limit');
      } else {
        charCounter.classList.remove('text-danger', 'counter-limit');
      }
    };
    textarea.addEventListener('input', updateCounter);

    const initConclusionPage = async () => {
      if (!window.TruthLensDB) return;
      const caseItem = await window.TruthLensDB.getInvestigation(caseId);
      if (!caseItem) return;

      const breadcrumbLink = document.getElementById('conclusionBreadcrumbLink');
      if (breadcrumbLink) {
        breadcrumbLink.textContent = `Case #${caseItem.id}`;
        breadcrumbLink.setAttribute('href', `investigation-details.html?id=${caseItem.id}`);
      }
      const backBtn = document.getElementById('conclusionBackBtn');
      if (backBtn) backBtn.setAttribute('href', `investigation-details.html?id=${caseItem.id}`);

      const reportBtn = document.getElementById('conclusionViewReportBtn');
      if (reportBtn) reportBtn.setAttribute('href', `reports.html?id=${caseItem.id}`);

      const caseBadge = document.getElementById('conclusionCaseBadge');
      if (caseBadge) caseBadge.textContent = `Inquest #${caseItem.id}`;

      const catBadge = document.getElementById('conclusionCategoryBadge');
      if (catBadge) catBadge.textContent = caseItem.category || 'General';

      const dateSpan = document.getElementById('conclusionDateSpan');
      if (dateSpan) dateSpan.innerHTML = `<i class="bi bi-calendar3 me-1"></i>Initiated: ${caseItem.startDate || caseItem.createdDate || 'Aug 24, 2026'}`;

      const claimBox = document.getElementById('conclusionClaimBox');
      if (claimBox) claimBox.textContent = `"${caseItem.claim}"`;

      if (caseItem.verdict) {
        statusSelect.value = caseItem.verdict;
        updateStatusBadge(caseItem.verdict);
      }
      if (caseItem.conclusionText) {
        textarea.value = caseItem.conclusionText;
      }
      updateCounter();
    };

    const updateStatusBadge = (status) => {
      statusBadge.className = 'tl-badge';
      switch (status) {
        case 'Mostly Unsupported':
          statusBadge.classList.add('tl-badge-against');
          statusBadge.innerHTML = '<i class="bi bi-shield-x me-1"></i>Mostly Unsupported';
          break;
        case 'Unsupported':
          statusBadge.classList.add('tl-badge-against');
          statusBadge.innerHTML = '<i class="bi bi-x-circle-fill me-1"></i>Unsupported';
          break;
        case 'Partially Supported':
          statusBadge.classList.add('tl-badge-verify');
          statusBadge.innerHTML = '<i class="bi bi-question-circle me-1"></i>Partially Supported';
          break;
        case 'Mostly Supported':
          statusBadge.classList.add('tl-badge-support');
          statusBadge.innerHTML = '<i class="bi bi-shield-check me-1"></i>Mostly Supported';
          break;
        case 'Inconclusive':
          statusBadge.classList.add('tl-badge-neutral');
          statusBadge.innerHTML = '<i class="bi bi-dash-circle me-1"></i>Inconclusive';
          break;
        default:
          statusBadge.textContent = status;
      }
    };

    statusSelect.addEventListener('change', () => {
      updateStatusBadge(statusSelect.value);
      if (modalVerdictPreview) {
        modalVerdictPreview.textContent = statusSelect.value;
      }
    });

    btnSaveDraft.addEventListener('click', async () => {
      const textVal = textarea.value.trim();
      if (textVal.length < 50) {
        textarea.classList.add('is-invalid');
        return;
      }
      textarea.classList.remove('is-invalid');

      const now = new Date().toLocaleString();
      lastSavedTimestamp.textContent = now;

      const urlParams = new URLSearchParams(window.location.search);
      const caseId = urlParams.get('id') || urlParams.get('case') || 'TL-8429';
      if (window.TruthLensDB) {
        await window.TruthLensDB.saveConclusion(caseId, {
          verdict: statusSelect.value,
          confidence: 82,
          conclusionText: textVal,
          status: 'Active'
        });
      }

      successMessage.textContent = 'Draft conclusion saved to Firestore & workspace session.';
      successAlert.classList.remove('d-none');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        successAlert.classList.add('d-none');
      }, 3500);
    });

    btnConfirmFinalize.addEventListener('click', async () => {
      bsFinalizeModal.hide();

      textarea.setAttribute('readonly', 'true');
      textarea.classList.add('bg-light');
      statusSelect.setAttribute('disabled', 'true');
      btnFinalizeModalTrigger.classList.add('d-none');
      btnSaveDraft.classList.add('d-none');
      btnUnlockEdit.classList.remove('d-none');

      const now = new Date().toLocaleString();
      lastSavedTimestamp.textContent = `${now} (Locked & Finalized)`;

      const urlParams = new URLSearchParams(window.location.search);
      const caseId = urlParams.get('id') || urlParams.get('case') || 'TL-8429';
      if (window.TruthLensDB) {
        await window.TruthLensDB.saveConclusion(caseId, {
          verdict: statusSelect.value,
          confidence: 85,
          conclusionText: textarea.value.trim(),
          status: 'Completed'
        });
      }

      successMessage.textContent = 'Case conclusion locked and published to Firestore audit record.';
      successAlert.classList.remove('d-none');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    btnUnlockEdit.addEventListener('click', () => {
      textarea.removeAttribute('readonly');
      textarea.classList.remove('bg-light');
      statusSelect.removeAttribute('disabled');
      btnFinalizeModalTrigger.classList.remove('d-none');
      btnSaveDraft.classList.remove('d-none');
      btnUnlockEdit.classList.add('d-none');
      textarea.focus();
    });

    initConclusionPage();
  }

  // ==========================================================================
  // 3. CREATE INVESTIGATION CONTROLLER (`create-investigation.html`)
  // ==========================================================================
  const createForm = document.getElementById('createInvestigationForm');
  if (createForm) {
    const titleInput = document.getElementById('investigationTitle');
    const claimInput = document.getElementById('claimText');
    const descInput = document.getElementById('investigationDescription');
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const statusSelect = document.getElementById('statusSelect');

    const titleCounter = document.getElementById('titleCounter');
    const claimCounter = document.getElementById('claimCounter');
    const descCounter = document.getElementById('descCounter');

    const tagInput = document.getElementById('tagInput');
    const btnAddTag = document.getElementById('btnAddTag');
    const tagsContainer = document.getElementById('tagsContainer');
    const hiddenTagsInput = document.getElementById('hiddenTagsInput');

    const btnSaveDraft = document.getElementById('btnSaveDraft');
    const btnSubmitForm = document.getElementById('btnSubmitForm');
    const submitSpinner = document.getElementById('submitSpinner');
    const submitBtnText = document.getElementById('submitBtnText');

    const successAlert = document.getElementById('formSuccessAlert');
    const errorAlert = document.getElementById('formErrorAlert');
    const successMessage = document.getElementById('formSuccessMessage');
    const errorMessage = document.getElementById('formErrorMessage');

    const bindCounter = (inputEl, counterEl, maxLimit) => {
      if (!inputEl || !counterEl) return;
      const update = () => {
        const len = inputEl.value.length;
        counterEl.textContent = `${len} / ${maxLimit}`;
        if (len >= maxLimit) {
          counterEl.classList.add('text-danger', 'counter-limit');
        } else {
          counterEl.classList.remove('text-danger', 'counter-limit');
        }
      };
      inputEl.addEventListener('input', update);
      update();
    };

    bindCounter(titleInput, titleCounter, 120);
    bindCounter(claimInput, claimCounter, 300);
    bindCounter(descInput, descCounter, 1000);

    let activeTags = ['viral-claim', 'fact-check'];

    const syncHiddenTags = () => {
      if (hiddenTagsInput) hiddenTagsInput.value = activeTags.join(',');
    };

    const renderTags = () => {
      if (!tagsContainer) return;
      tagsContainer.innerHTML = '';
      activeTags.forEach((tag, index) => {
        const chip = document.createElement('span');
        chip.className = 'tl-tag-chip';
        chip.setAttribute('data-tag', tag);
        chip.innerHTML = `
          ${tag}
          <button type="button" class="btn-close tl-tag-close" data-index="${index}" aria-label="Remove tag"></button>
        `;
        tagsContainer.appendChild(chip);
      });
      syncHiddenTags();
    };

    const addTag = (text) => {
      const clean = text.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (clean && !activeTags.includes(clean)) {
        activeTags.push(clean);
        renderTags();
      }
      if (tagInput) tagInput.value = '';
    };

    if (tagInput && btnAddTag) {
      btnAddTag.addEventListener('click', () => addTag(tagInput.value));
      tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addTag(tagInput.value);
        }
      });
      tagsContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.tl-tag-close');
        if (removeBtn) {
          const index = parseInt(removeBtn.getAttribute('data-index'), 10);
          activeTags.splice(index, 1);
          renderTags();
        }
      });
    }

    const setFieldState = (field, isValid) => {
      if (!field) return;
      if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
      } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
      }
    };

    [titleInput, claimInput, categorySelect].forEach((input) => {
      if (input) {
        input.addEventListener('input', () => {
          if (input.classList.contains('is-invalid')) input.classList.remove('is-invalid');
        });
      }
    });

    // ML Model Real-time Predictor Integration
    const btnRunMLPredict = document.getElementById('btnRunMLPredict');
    const mlPredictIndicator = document.getElementById('mlPredictIndicator');
    const mlPredictionBox = document.getElementById('mlPredictionBox');
    let lastMLPrediction = null;

    if (btnRunMLPredict && claimInput) {
      btnRunMLPredict.addEventListener('click', () => {
        const text = claimInput.value.trim();
        if (text.length < 15) {
          if (mlPredictIndicator) {
            mlPredictIndicator.textContent = 'Please enter at least 15 characters to run ML analysis.';
            mlPredictIndicator.className = 'tl-micro text-danger';
          }
          claimInput.focus();
          return;
        }

        if (!window.TruthLensML) {
          alert('TruthLens ML engine is loading, please try again.');
          return;
        }

        const pred = window.TruthLensML.predict(text);
        lastMLPrediction = pred;

        if (mlPredictionBox) {
          mlPredictionBox.classList.remove('d-none');
          const badge = document.getElementById('mlBoxVerdictBadge');
          if (badge) {
            badge.textContent = `${pred.fakeProbability}% Fake Probability (${pred.verdict})`;
            badge.className = `badge ${pred.fakeProbability >= 70 ? 'bg-danger' : (pred.fakeProbability <= 35 ? 'bg-success' : 'bg-warning text-dark')}`;
          }
          const summary = document.getElementById('mlBoxSummary');
          if (summary) summary.textContent = pred.summary;

          const sensationalism = document.getElementById('mlBoxSensationalism');
          if (sensationalism) sensationalism.textContent = `${pred.metrics.sensationalism}%`;

          const bias = document.getElementById('mlBoxBias');
          if (bias) bias.textContent = `${pred.metrics.linguisticBias}%`;

          const credibility = document.getElementById('mlBoxCredibility');
          if (credibility) credibility.textContent = `${pred.metrics.sourceCredibility}%`;

          const fakePct = document.getElementById('mlBoxFakePct');
          if (fakePct) fakePct.textContent = `${pred.fakeProbability}%`;

          const signalsBox = document.getElementById('mlBoxSignals');
          if (signalsBox && pred.signals && pred.signals.length > 0) {
            signalsBox.innerHTML = `<strong>Detected ML Signals:</strong> ` + pred.signals.map(s => `<span class="badge bg-secondary-subtle text-secondary me-1">${s}</span>`).join('');
          }

          if (mlPredictIndicator) {
            mlPredictIndicator.textContent = `Scored: ${pred.fakeProbability}% Fake News Probability`;
            mlPredictIndicator.className = 'tl-micro text-success fw-semibold';
          }

          // Suggest priority automatically if high risk
          if (prioritySelect) {
            if (pred.fakeProbability >= 85) prioritySelect.value = 'Critical';
            else if (pred.fakeProbability >= 65) prioritySelect.value = 'High';
          }
        }
      });
    }

    const handleFormSubmit = async (isDraft = false) => {
      if (errorAlert) errorAlert.classList.add('d-none');
      if (successAlert) successAlert.classList.add('d-none');

      const titleVal = titleInput.value.trim();
      const claimVal = claimInput.value.trim();
      const categoryVal = categorySelect.value;

      const isTitleValid = titleVal.length >= 10;
      const isClaimValid = claimVal.length >= 20;
      const isCategoryValid = categoryVal !== '';

      setFieldState(titleInput, isTitleValid);
      setFieldState(claimInput, isClaimValid);
      setFieldState(categorySelect, isCategoryValid);

      if (!isTitleValid || !isClaimValid || !isCategoryValid) {
        if (errorAlert && errorMessage) {
          errorMessage.textContent = 'Please provide a valid title (min 10 chars), a specific claim (min 20 chars), and select a category.';
          errorAlert.classList.remove('d-none');
          errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      if (isDraft && statusSelect) statusSelect.value = 'Draft';

      btnSubmitForm.disabled = true;
      btnSaveDraft.disabled = true;
      submitSpinner.classList.remove('d-none');
      submitBtnText.textContent = isDraft ? 'Saving Draft to Database...' : 'Creating Case in Firestore...';

      // Run ML Prediction if not cached
      let mlPred = lastMLPrediction;
      if (!mlPred && window.TruthLensML) {
        mlPred = window.TruthLensML.predict(claimVal);
      }

      let newCase = null;
      try {
        const payload = {
          title: titleVal,
          claim: claimVal,
          category: categoryVal,
          priority: prioritySelect ? prioritySelect.value : 'Medium',
          status: isDraft ? 'Draft' : (statusSelect ? statusSelect.value : 'Active'),
          description: descInput ? descInput.value.trim() : '',
          tags: activeTags,
          verdict: mlPred ? mlPred.verdict : 'Under Investigation',
          fakeProbability: mlPred ? mlPred.fakeProbability : 50,
          mlVerdict: mlPred ? mlPred.verdict : 'Under Investigation',
          mlPrediction: mlPred,
          confidence: mlPred ? mlPred.credibilityScore : 50,
          confidenceScore: mlPred ? mlPred.credibilityScore : 50,
          evidenceCount: 0
        };

        if (window.TruthLensDB) {
          newCase = await window.TruthLensDB.createInvestigation(payload);
        }
      } catch (err) {
        console.error('Failed saving investigation to Firestore:', err);
      }

      submitSpinner.classList.add('d-none');
      if (successAlert && successMessage) {
        successMessage.textContent = isDraft 
          ? 'Investigation draft saved to Firebase! Redirecting to case repository...' 
          : `Investigation case formulated & saved to Firebase! ML Fake Score: ${mlPred ? mlPred.fakeProbability : 50}%. Redirecting...`;
        successAlert.classList.remove('d-none');
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setTimeout(() => {
        window.location.href = isDraft ? 'investigations.html' : `add-evidence.html?case=${newCase ? newCase.id : ''}`;
      }, 1000);
    };

    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit(false);
    });

    btnSaveDraft.addEventListener('click', () => {
      handleFormSubmit(true);
    });

    renderTags();
  }

  // ==========================================================================
  // 4. INVESTIGATION TABLE CONTROLLER (`investigations.html`)
  // ==========================================================================
  const tableBody = document.getElementById('investigationsTableBody');
  if (tableBody) {
    let investigationsData = [];

    const tableCard = document.getElementById('investigationsTableCard');
    const emptyState = document.getElementById('noResultsEmptyState');
    const displayedCount = document.getElementById('displayedCount');
    const totalCount = document.getElementById('totalCount');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const emptyStateResetBtn = document.getElementById('emptyStateResetBtn');

    const filterSearchInput = document.getElementById('filterSearchInput');
    const filterCategorySelect = document.getElementById('filterCategorySelect');
    const filterStatusSelect = document.getElementById('filterStatusSelect');
    const filterPrioritySelect = document.getElementById('filterPrioritySelect');
    const sortOrderSelect = document.getElementById('sortOrderSelect');

    const paginationWrapper = document.getElementById('paginationWrapper');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationList = document.getElementById('paginationList');

    const deleteModalEl = document.getElementById('deleteCaseModal');
    const deleteModalTitlePreview = document.getElementById('deleteCaseTitlePreview');
    const confirmDeleteCaseBtn = document.getElementById('confirmDeleteCaseBtn');
    let caseIdPendingDelete = null;

    const rowsPerPage = 5;
    let currentPage = 1;
    let filteredData = [...investigationsData];

    const getStatusBadge = (status) => {
      switch (status) {
        case 'Active':
          return `<span class="tl-badge tl-badge-active"><i class="bi bi-clock-history me-1"></i>Active</span>`;
        case 'Completed':
          return `<span class="tl-badge tl-badge-completed"><i class="bi bi-check2-circle me-1"></i>Completed</span>`;
        case 'Draft':
          return `<span class="tl-badge tl-badge-draft"><i class="bi bi-pencil me-1"></i>Draft</span>`;
        case 'Archived':
          return `<span class="tl-badge tl-badge-archived"><i class="bi bi-archive me-1"></i>Archived</span>`;
        default:
          return `<span class="tl-badge">${status}</span>`;
      }
    };

    const getPriorityBadge = (priority) => {
      switch (priority) {
        case 'Critical':
          return `<span class="tl-badge tl-priority-critical"><i class="bi bi-exclamation-circle-fill me-1"></i>Critical</span>`;
        case 'High':
          return `<span class="tl-badge tl-priority-high"><i class="bi bi-arrow-up-circle me-1"></i>High</span>`;
        case 'Medium':
          return `<span class="tl-badge tl-priority-medium">Medium</span>`;
        case 'Low':
          return `<span class="tl-badge tl-priority-low">Low</span>`;
        default:
          return `<span class="tl-badge">${priority}</span>`;
      }
    };

    const getConfidenceBar = (score) => {
      let colorClass = 'bg-secondary';
      if (score >= 75) colorClass = 'bg-success';
      else if (score >= 40) colorClass = 'bg-warning';
      else if (score > 0) colorClass = 'bg-danger';

      return `
        <div class="d-flex align-items-center gap-2">
          <div class="progress flex-grow-1 tl-progress-sm" style="height: 6px;">
            <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${score}%;" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <span class="tl-micro fw-semibold" style="width: 32px;">${score}%</span>
        </div>
      `;
    };

    const renderTable = () => {
      tableBody.innerHTML = '';
      const totalItems = filteredData.length;
      if (totalCount) totalCount.textContent = investigationsData.length;
      if (displayedCount) displayedCount.textContent = totalItems;

      if (totalItems === 0) {
        tableCard.classList.add('d-none');
        emptyState.classList.remove('d-none');
        paginationWrapper.classList.add('d-none');
        return;
      }

      tableCard.classList.remove('d-none');
      emptyState.classList.add('d-none');
      paginationWrapper.classList.remove('d-none');

      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
      const paginatedItems = filteredData.slice(startIndex, endIndex);

      paginatedItems.forEach((item) => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);
        row.innerHTML = `
          <td>
            <div class="fw-semibold text-dark text-truncate" style="max-width: 380px;">
              <a href="investigation-details.html?id=${item.id}" class="text-dark text-decoration-none hover-primary">
                ${item.title}
              </a>
            </div>
            <div class="tl-claim-preview-text text-muted" title="${item.claim}">
              "${item.claim}"
            </div>
            <div class="tl-micro text-muted mt-1 d-flex align-items-center gap-2">
              <span class="fw-semibold text-primary">#${item.id}</span>
              ${typeof item.fakeProbability === 'number' ? `
                <span class="badge ${item.fakeProbability >= 70 ? 'bg-danger-subtle text-danger border border-danger-subtle' : (item.fakeProbability <= 35 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle')} font-monospace py-0 px-1">
                  <i class="bi bi-robot"></i> ${item.fakeProbability}% Fake
                </span>
              ` : ''}
            </div>
          </td>
          <td>
            <span class="badge bg-light text-dark border fw-normal tl-small">${item.category}</span>
          </td>
          <td>${getStatusBadge(item.status)}</td>
          <td>${getPriorityBadge(item.priority)}</td>
          <td>
            <span class="fw-semibold text-dark tl-small">${item.evidenceCount}</span>
            <span class="text-muted tl-micro"> sources</span>
          </td>
          <td>${getConfidenceBar(item.confidence)}</td>
          <td>
            <div class="tl-small text-dark">${item.displayUpdated}</div>
            <div class="tl-micro text-muted">${item.lastUpdated}</div>
          </td>
          <td class="text-end">
            <div class="d-inline-flex gap-1">
              <a href="investigation-details.html?id=${item.id}" class="tl-table-action-btn" title="Inspect Case">
                <i class="bi bi-eye"></i>
              </a>
              <a href="create-investigation.html?edit=${item.id}" class="tl-table-action-btn" title="Edit Metadata">
                <i class="bi bi-pencil"></i>
              </a>
              <button type="button" class="tl-table-action-btn btn-delete text-danger" title="Delete Case" data-case-id="${item.id}" data-case-title="${item.title}">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </td>
        `;
        tableBody.appendChild(row);
      });

      renderPagination(totalItems);
    };

    const renderPagination = (totalItems) => {
      paginationList.innerHTML = '';
      const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
      paginationInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} total)`;

      if (totalPages <= 1) {
        paginationWrapper.classList.add('d-none');
        return;
      }
      paginationWrapper.classList.remove('d-none');

      const prevLi = document.createElement('li');
      prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
      prevLi.innerHTML = `<button class="page-link" aria-label="Previous">&laquo;</button>`;
      prevLi.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
      paginationList.appendChild(prevLi);

      for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<button class="page-link">${i}</button>`;
        pageLi.addEventListener('click', () => {
          currentPage = i;
          renderTable();
        });
        paginationList.appendChild(pageLi);
      }

      const nextLi = document.createElement('li');
      nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
      nextLi.innerHTML = `<button class="page-link" aria-label="Next">&raquo;</button>`;
      nextLi.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable();
        }
      });
      paginationList.appendChild(nextLi);
    };

    const applyFiltersAndSort = () => {
      const searchTerm = filterSearchInput.value.trim().toLowerCase();
      const selectedCategory = filterCategorySelect.value;
      const selectedStatus = filterStatusSelect.value;
      const selectedPriority = filterPrioritySelect.value;
      const sortOrder = sortOrderSelect.value;

      filteredData = investigationsData.filter((item) => {
        const matchesSearch = 
          item.title.toLowerCase().includes(searchTerm) ||
          item.claim.toLowerCase().includes(searchTerm) ||
          item.id.toLowerCase().includes(searchTerm);

        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
        const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;

        return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
      });

      filteredData.sort((a, b) => {
        switch (sortOrder) {
          case 'date-desc':
            return new Date(b.lastUpdated) - new Date(a.lastUpdated);
          case 'date-asc':
            return new Date(a.lastUpdated) - new Date(b.lastUpdated);
          case 'confidence-desc':
            return b.confidence - a.confidence;
          case 'confidence-asc':
            return a.confidence - b.confidence;
          case 'evidence-desc':
            return b.evidenceCount - a.evidenceCount;
          default:
            return 0;
        }
      });

      const hasActiveFilters = 
        searchTerm !== '' || 
        selectedCategory !== 'all' || 
        selectedStatus !== 'all' || 
        selectedPriority !== 'all';

      if (hasActiveFilters) {
        resetFiltersBtn.classList.remove('d-none');
      } else {
        resetFiltersBtn.classList.add('d-none');
      }

      currentPage = 1;
      renderTable();
    };

    const resetFilters = () => {
      filterSearchInput.value = '';
      filterCategorySelect.value = 'all';
      filterStatusSelect.value = 'all';
      filterPrioritySelect.value = 'all';
      sortOrderSelect.value = 'date-desc';
      applyFiltersAndSort();
    };

    filterSearchInput.addEventListener('input', applyFiltersAndSort);
    filterCategorySelect.addEventListener('change', applyFiltersAndSort);
    filterStatusSelect.addEventListener('change', applyFiltersAndSort);
    filterPrioritySelect.addEventListener('change', applyFiltersAndSort);
    sortOrderSelect.addEventListener('change', applyFiltersAndSort);
    resetFiltersBtn.addEventListener('click', resetFilters);
    emptyStateResetBtn.addEventListener('click', resetFilters);

    const bsDeleteModal = new bootstrap.Modal(deleteModalEl);

    tableBody.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) {
        caseIdPendingDelete = deleteBtn.getAttribute('data-case-id');
        const title = deleteBtn.getAttribute('data-case-title');
        deleteModalTitlePreview.textContent = `${caseIdPendingDelete}: ${title}`;
        bsDeleteModal.show();
      }
    });

    confirmDeleteCaseBtn.addEventListener('click', async () => {
      if (caseIdPendingDelete) {
        if (window.TruthLensDB) {
          try {
            await window.TruthLensDB.deleteInvestigation(caseIdPendingDelete);
            if (window.showToast) window.showToast(`Dossier #${caseIdPendingDelete} deleted from Firestore.`, 'danger');
          } catch (err) {
            console.error('Error deleting investigation:', err);
          }
        }
        investigationsData = investigationsData.filter(item => item.id !== caseIdPendingDelete);
        bsDeleteModal.hide();
        caseIdPendingDelete = null;
        applyFiltersAndSort();
      }
    });

    // Initialize cases from Cloud Firestore
    const initCaseRepository = async () => {
      if (window.TruthLensDB) {
        try {
          investigationsData = await window.TruthLensDB.getInvestigations();
        } catch (err) {
          console.error('Failed loading investigations:', err);
        }
      }
      applyFiltersAndSort();

      // Listen for real-time Firestore updates
      if (window.TruthLensDB && window.TruthLensDB.listenInvestigations) {
        window.TruthLensDB.listenInvestigations((liveCases) => {
          if (liveCases && liveCases.length) {
            investigationsData = liveCases;
            applyFiltersAndSort();
          }
        });
      }
    };

    initCaseRepository();
  }

  // ==========================================================================
  // 5. INVESTIGATION DOSSIER DETAILS CONTROLLER (`investigation-details.html`)
  // ==========================================================================
  const detailsCaseTitleEl = document.getElementById('detailsCaseTitle') || document.querySelector('.tl-main-content .tl-h1');
  if (detailsCaseTitleEl && window.location.pathname.includes('investigation-details.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get('id') || urlParams.get('case') || 'TL-8429';

    const getClassificationBadge = (classification) => {
      const cls = (classification || '').toLowerCase();
      if (cls === 'against' || cls === 'refuting') {
        return `<span class="tl-badge tl-badge-against"><i class="bi bi-shield-x me-1"></i>Against</span>`;
      } else if (cls === 'supporting' || cls === 'support') {
        return `<span class="tl-badge tl-badge-support"><i class="bi bi-shield-check me-1"></i>Supporting</span>`;
      } else if (cls === 'neutral') {
        return `<span class="tl-badge tl-badge-neutral"><i class="bi bi-dash-circle me-1"></i>Neutral</span>`;
      } else {
        return `<span class="tl-badge tl-badge-verify"><i class="bi bi-question-circle me-1"></i>Unverified</span>`;
      }
    };

    const getCredibilityBadge = (credibility) => {
      const cred = parseInt(credibility, 10) || 3;
      if (cred >= 4) {
        return `<span class="badge bg-success-subtle text-success border border-success-subtle">${cred}/5 High</span>`;
      } else if (cred === 3) {
        return `<span class="badge bg-warning-subtle text-warning border border-warning-subtle">${cred}/5 Moderate</span>`;
      } else {
        return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">${cred}/5 Low</span>`;
      }
    };

    const loadDossier = async () => {
      if (!window.TruthLensDB) return;

      // 1. Fetch case
      let caseItem = await window.TruthLensDB.getInvestigation(requestedId);
      if (!caseItem) {
        const allCases = await window.TruthLensDB.getInvestigations();
        caseItem = allCases && allCases.length > 0 ? allCases[0] : null;
      }
      if (!caseItem) return;

      const caseId = caseItem.id;

      // 2. Populate Hero & Metadata
      if (detailsCaseTitleEl) detailsCaseTitleEl.textContent = caseItem.title;
      const claimTextEl = document.getElementById('detailsClaimText') || document.querySelector('.tl-claim-box .fw-semibold');
      if (claimTextEl) claimTextEl.textContent = `"${caseItem.claim}"`;

      const caseIdBadgeEl = document.getElementById('detailsCaseIdBadge');
      if (caseIdBadgeEl) caseIdBadgeEl.textContent = `#${caseId}`;

      const statusBadgeEl = document.getElementById('detailsStatusBadge');
      if (statusBadgeEl) {
        const st = caseItem.status || 'Active';
        statusBadgeEl.className = `tl-badge ${st.toLowerCase() === 'active' ? 'tl-badge-active' : 'tl-badge-completed'}`;
        statusBadgeEl.innerHTML = `<i class="bi bi-${st.toLowerCase() === 'active' ? 'clock-history' : 'check-circle'} me-1"></i>${st} Investigation`;
      }

      const priorityBadgeEl = document.getElementById('detailsPriorityBadge');
      if (priorityBadgeEl) {
        const pr = (caseItem.priority || 'medium').toLowerCase();
        priorityBadgeEl.className = `tl-badge tl-priority-${pr}`;
        priorityBadgeEl.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i>${caseItem.priority || 'Medium'} Priority`;
      }

      const categoryBadgeEl = document.getElementById('detailsCategoryBadge');
      if (categoryBadgeEl) categoryBadgeEl.textContent = caseItem.category || 'Artificial Intelligence';

      // ML Fake News Probability Badge
      let fakePct = typeof caseItem.fakeProbability === 'number' ? caseItem.fakeProbability : null;
      let mlVerdict = caseItem.mlVerdict || null;
      if (fakePct === null && window.TruthLensML && caseItem.claim) {
        const mlRes = window.TruthLensML.predict(caseItem.claim);
        fakePct = mlRes.fakeProbability;
        mlVerdict = mlRes.verdict;
      }

      const mlBadgeEl = document.getElementById('detailsMlBadge');
      const mlPctEl = document.getElementById('detailsMlPct');
      if (mlBadgeEl && fakePct !== null) {
        mlBadgeEl.classList.remove('d-none');
        if (mlPctEl) mlPctEl.textContent = `${fakePct}%`;
        mlBadgeEl.className = `badge ${fakePct >= 70 ? 'bg-danger-subtle text-danger border border-danger-subtle' : (fakePct <= 35 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle')} font-monospace`;
        mlBadgeEl.title = `Automated ML Model Assessment: ${mlVerdict || 'Evaluated'}`;
      }

      const initiatedDateEl = document.getElementById('detailsInitiatedDate');
      if (initiatedDateEl) initiatedDateEl.textContent = caseItem.startDate || caseItem.createdDate || 'Aug 24, 2026';

      const lastAuditDateEl = document.getElementById('detailsLastAuditDate');
      if (lastAuditDateEl) lastAuditDateEl.textContent = caseItem.lastUpdated || caseItem.displayUpdated || 'Today';

      const leadInvestigatorEl = document.getElementById('detailsLeadInvestigator');
      if (leadInvestigatorEl) leadInvestigatorEl.textContent = caseItem.leadInvestigator || 'Abinash Panigrahy';

      // Action Buttons URLs
      const setBtnHref = (id, href) => {
        const btn = document.getElementById(id);
        if (btn) btn.setAttribute('href', href);
      };
      setBtnHref('detailsHeaderAddEvidenceBtn', `add-evidence.html?case=${caseId}`);
      setBtnHref('detailsHeaderUpdateCaseBtn', `create-investigation.html?edit=${caseId}`);
      setBtnHref('detailsHeaderGenerateReportBtn', `reports.html?generate=${caseId}`);
      setBtnHref('detailsIngestRecordBtn', `add-evidence.html?case=${caseId}`);
      setBtnHref('detailsEvidenceTabIngestBtn', `add-evidence.html?case=${caseId}`);
      setBtnHref('detailsConclusionReportBtn', `reports.html?id=${caseId}`);

      // 3. Context, Hypotheses & Tags
      const contextEl = document.getElementById('detailsContextBackground');
      if (contextEl) {
        contextEl.textContent = caseItem.description || caseItem.claim || 'Primary forensic dossier formulated under scientific falsification rubric.';
      }

      const tagsWrapperEl = document.getElementById('detailsTagsWrapper');
      if (tagsWrapperEl) {
        const tags = Array.isArray(caseItem.tags) ? caseItem.tags : (caseItem.tags ? caseItem.tags.split(',') : ['fact-check', 'verification']);
        tagsWrapperEl.innerHTML = tags.map(t => `<span class="tl-tag-chip me-1">${t.trim()}</span>`).join('');
      }

      // 4. Fetch Evidence for this Case
      const allEvidence = await window.TruthLensDB.getEvidence();
      let caseEvidence = allEvidence.filter(e => e.caseId === caseId);

      // Fallback for default case if none specifically tagged
      if (caseEvidence.length === 0 && caseId === 'TL-8429') {
        caseEvidence = allEvidence;
      }

      const totalEv = caseEvidence.length;
      const suppCount = caseEvidence.filter(e => (e.classification || '').toLowerCase().includes('support')).length;
      const againstCount = caseEvidence.filter(e => (e.classification || '').toLowerCase().includes('against') || (e.classification || '').toLowerCase().includes('refut')).length;
      const neutralCount = caseEvidence.filter(e => (e.classification || '').toLowerCase().includes('neutral')).length;
      const unverifiedCount = Math.max(0, totalEv - (suppCount + againstCount + neutralCount));

      const suppPct = totalEv ? Math.round((suppCount / totalEv) * 100) : 0;
      const againstPct = totalEv ? Math.round((againstCount / totalEv) * 100) : 0;
      const neutralPct = totalEv ? Math.round((neutralCount / totalEv) * 100) : 0;
      const unverifiedPct = totalEv ? Math.max(0, 100 - (suppPct + againstPct + neutralPct)) : 0;

      // Update counters & badges
      const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };
      setText('detailsEvidenceTabBadge', totalEv);
      setText('detailsTotalRecordsBadge', `${totalEv} Primary Records`);
      setText('detailsSupportCount', suppCount);
      setText('detailsSupportPercent', `${suppPct}%`);
      setText('detailsAgainstCount', againstCount);
      setText('detailsAgainstPercent', `${againstPct}%`);
      setText('detailsNeutralCount', neutralCount);
      setText('detailsNeutralPercent', `${neutralPct}%`);
      setText('detailsUnverifiedCount', unverifiedCount);
      setText('detailsUnverifiedPercent', `${unverifiedPct}%`);

      // Update Spectrum Bar
      const spectrumBarEl = document.getElementById('detailsSpectrumBar');
      if (spectrumBarEl) {
        spectrumBarEl.innerHTML = `
          <div class="bg-success" style="width: ${suppPct}%;" title="Supporting: ${suppPct}%"></div>
          <div class="bg-danger" style="width: ${againstPct}%;" title="Against: ${againstPct}%"></div>
          <div class="bg-secondary" style="width: ${neutralPct}%;" title="Neutral: ${neutralPct}%"></div>
          <div class="bg-warning" style="width: ${unverifiedPct}%;" title="Unverified: ${unverifiedPct}%"></div>
        `;
      }

      // Confidence Score
      const confidenceScore = caseItem.confidence !== undefined ? caseItem.confidence : (totalEv ? Math.min(95, Math.round(50 + totalEv * 7)) : 50);
      setText('detailsConfidenceScore', `${confidenceScore}%`);
      const progressBarEl = document.getElementById('detailsConfidenceProgressBar');
      if (progressBarEl) {
        progressBarEl.style.width = `${confidenceScore}%`;
        progressBarEl.setAttribute('aria-valuenow', confidenceScore);
      }

      // Render Spotlight (Overview Tab)
      const spotlightEl = document.getElementById('detailsRecentEvidenceSpotlight');
      if (spotlightEl) {
        if (caseEvidence.length === 0) {
          spotlightEl.innerHTML = `
            <div class="p-4 text-center border rounded bg-light text-muted tl-small">
              <i class="bi bi-folder-symlink fs-3 d-block mb-2 text-secondary"></i>
              No primary evidence records attached yet.
              <div class="mt-2">
                <a href="add-evidence.html?case=${caseId}" class="btn btn-sm btn-tl-primary">+ Ingest First Source</a>
              </div>
            </div>
          `;
        } else {
          spotlightEl.innerHTML = caseEvidence.slice(0, 3).map(ev => {
            const cls = (ev.classification || '').toLowerCase();
            const borderClass = cls.includes('against') ? 'border-start-against' : (cls.includes('support') ? 'border-start-support' : 'border-start-neutral');
            return `
              <div class="tl-card p-3 ${borderClass}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="d-flex gap-1 align-items-center">
                    ${getClassificationBadge(ev.classification)}
                    <span class="badge bg-light text-dark border tl-micro">${ev.type || 'Source Document'}</span>
                  </div>
                  <span class="tl-micro text-muted">${ev.publicationDate || 'Indexed'}</span>
                </div>
                <h4 class="tl-h4 mb-1">
                  <a href="evidence.html?id=${ev.id}" class="text-dark text-decoration-none">
                    ${ev.title}
                  </a>
                </h4>
                <p class="tl-small text-secondary mb-2">
                  ${ev.summary || ev.description || 'Primary source data points extracted for forensic inquiry.'}
                </p>
                <div class="d-flex justify-content-between align-items-center tl-micro text-muted border-top pt-2">
                  <span>Source: <strong>${ev.publisher || (ev.url ? new URL(ev.url).hostname : 'Archive')}</strong></span>
                  ${getCredibilityBadge(ev.credibility)}
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // Render Evidence Table (Evidence Tab)
      const evidenceTableBodyEl = document.getElementById('detailsEvidenceTableBody');
      if (evidenceTableBodyEl) {
        if (caseEvidence.length === 0) {
          evidenceTableBodyEl.innerHTML = `
            <tr>
              <td colspan="6" class="text-center py-4 text-muted tl-small">
                No evidence items attached. <a href="add-evidence.html?case=${caseId}">Ingest first record</a>.
              </td>
            </tr>
          `;
        } else {
          evidenceTableBodyEl.innerHTML = caseEvidence.map(ev => `
            <tr>
              <td>${getClassificationBadge(ev.classification)}</td>
              <td>
                <div class="fw-semibold text-dark tl-small">${ev.title}</div>
                <div class="tl-micro text-muted">${ev.publisher || 'Verified Publisher'} &bull; ${ev.type || 'Primary'}</div>
              </td>
              <td><span class="badge bg-light text-dark border">${ev.type || 'Document'}</span></td>
              <td>${getCredibilityBadge(ev.credibility)}</td>
              <td class="tl-small text-muted">${ev.publicationDate || 'Recent'}</td>
              <td class="text-end">
                <a href="evidence.html?id=${ev.id}" class="btn btn-sm btn-light border py-1 px-2" title="View Source"><i class="bi bi-eye"></i></a>
              </td>
            </tr>
          `).join('');
        }
      }

      // 5. Fetch Field Notes
      const allNotes = await window.TruthLensDB.getNotes();
      let caseNotes = allNotes.filter(n => n.caseId === caseId);
      if (caseNotes.length === 0 && caseId === 'TL-8429') {
        caseNotes = allNotes.filter(n => n.caseId === 'TL-8429');
      }

      setText('detailsNotesTabBadge', caseNotes.length);
      const notesContainerEl = document.getElementById('detailsNotesCardsContainer');
      if (notesContainerEl) {
        if (caseNotes.length === 0) {
          notesContainerEl.innerHTML = `
            <div class="col-12">
              <div class="p-4 text-center border rounded bg-light text-muted tl-small">
                <i class="bi bi-journal-text fs-3 d-block mb-2 text-secondary"></i>
                No field notes recorded for this investigation yet.
                <div class="mt-2">
                  <button type="button" class="btn btn-sm btn-tl-primary" data-bs-toggle="modal" data-bs-target="#addNoteModal">
                    <i class="bi bi-plus-lg me-1"></i> Add First Note
                  </button>
                </div>
              </div>
            </div>
          `;
        } else {
          notesContainerEl.innerHTML = caseNotes.map(n => `
            <div class="col-md-6">
              <div class="p-3 bg-light rounded-2 border h-100 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-semibold text-dark tl-small">${n.title}</span>
                    <span class="tl-micro text-muted">${n.createdDate || 'Recent'}</span>
                  </div>
                  <p class="tl-small text-secondary mb-2">
                    ${n.content}
                  </p>
                </div>
                <div class="tl-micro text-primary border-top pt-2 mt-2">
                  <i class="bi bi-person me-1"></i>${n.author || 'Abinash Panigrahy'}
                </div>
              </div>
            </div>
          `).join('');
        }
      }

      // 6. Fetch Timeline
      const caseTimeline = await window.TruthLensDB.getTimeline(caseId);
      setText('detailsTimelineTabBadge', caseTimeline.length);

      const timelineContainerEl = document.getElementById('detailsTimelineNodeContainer');
      if (timelineContainerEl) {
        if (caseTimeline.length === 0) {
          timelineContainerEl.innerHTML = `
            <div class="text-center py-4 text-muted tl-small">
              No audit milestones recorded yet for #${caseId}.
            </div>
          `;
        } else {
          timelineContainerEl.innerHTML = caseTimeline.map(evt => `
            <div class="position-relative">
              <div class="tl-timeline-node bg-${evt.color || 'primary'} text-white">
                <i class="bi ${evt.icon || 'bi-clock-history'}"></i>
              </div>
              <div class="ms-4">
                <div class="fw-semibold text-dark tl-small">${evt.title}</div>
                <p class="tl-small text-secondary mb-1">${evt.description}</p>
                <div class="tl-micro text-muted">${evt.timestamp || evt.relativeTime || 'Recent'} &bull; ${evt.user || 'Abinash Panigrahy'}</div>
              </div>
            </div>
          `).join('');
        }
      }

      // Overview Activity Feed (Top 3 timeline items)
      const activityFeedEl = document.getElementById('detailsRecentActivityFeed');
      if (activityFeedEl) {
        if (caseTimeline.length === 0) {
          activityFeedEl.innerHTML = `<div class="tl-small text-muted">No recent activity recorded.</div>`;
        } else {
          activityFeedEl.innerHTML = caseTimeline.slice(0, 3).map(evt => `
            <div class="d-flex align-items-start gap-2">
              <span class="badge bg-${evt.color || 'primary'}-subtle text-${evt.color || 'primary'} p-1 rounded-circle mt-1">
                <i class="bi ${evt.icon || 'bi-circle-fill'} fs-6"></i>
              </span>
              <div>
                <div class="tl-small fw-medium text-dark">${evt.title}</div>
                <div class="tl-micro text-muted">${evt.relativeTime || evt.timestamp || 'Recent'} &bull; ${evt.user || 'System'}</div>
              </div>
            </div>
          `).join('');
        }
      }

      // 7. Case Conclusion Tab
      const conclusion = await window.TruthLensDB.getConclusion(caseId);
      const verdictBadgeEl = document.getElementById('detailsConclusionVerdictBadge');
      if (verdictBadgeEl && conclusion) {
        verdictBadgeEl.textContent = conclusion.verdict || caseItem.verdict || 'Under Investigation';
        const v = (conclusion.verdict || caseItem.verdict || '').toLowerCase();
        if (v.includes('refut') || v.includes('against') || v.includes('unsupport')) {
          verdictBadgeEl.className = 'tl-badge tl-badge-against';
        } else if (v.includes('support')) {
          verdictBadgeEl.className = 'tl-badge tl-badge-support';
        } else {
          verdictBadgeEl.className = 'tl-badge tl-badge-neutral';
        }
      }

      const conclusionTextEl = document.getElementById('detailsConclusionText');
      if (conclusionTextEl && conclusion) {
        conclusionTextEl.textContent = conclusion.conclusionText || caseItem.conclusionText || caseItem.description || 'Synthesized analytical findings based on the corpus of empirical literature.';
      }
    };

    // 8. Wire Save Note in Modal
    const btnSaveNewNote = document.getElementById('btnSaveNewNote');
    if (btnSaveNewNote) {
      btnSaveNewNote.addEventListener('click', async () => {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentInput ? contentInput.value.trim() : '';

        if (!title || !content) {
          alert('Please enter both a note heading and observation details.');
          return;
        }

        const session = window.TruthLensDB.getCurrentSession();
        const authorName = session ? (session.name || session.displayName) : 'Abinash Panigrahy';

        await window.TruthLensDB.createNote({
          caseId: requestedId,
          title: title,
          content: content,
          author: authorName,
          category: 'Observation'
        });

        await window.TruthLensDB.createTimelineEvent({
          caseId: requestedId,
          caseTitle: detailsCaseTitleEl ? detailsCaseTitleEl.textContent : 'Investigation Dossier',
          type: 'Note Added',
          icon: 'bi-journal-text',
          color: 'primary',
          title: 'Field Note Logged: ' + title,
          description: content.substring(0, 90) + (content.length > 90 ? '...' : ''),
          user: authorName
        });

        // Clear form
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';

        // Close modal
        const modalEl = document.getElementById('addNoteModal');
        if (modalEl && window.bootstrap) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
        }

        // Reload data
        loadDossier();
      });
    }

    loadDossier();
  }
});