/**
 * TruthLens — Evidence Vault & Ingestion Controller
 * Handles cross-case evidence indexing, dynamic multi-field filtering,
 * modal inspections, card deletion workflows, and Flask POST forms.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================================================
  // 1. EVIDENCE VAULT CARD REPOSITORY (`evidence.html`)
  // ==========================================================================
  const cardsGrid = document.getElementById('evidenceCardsGrid');
  if (cardsGrid) {
    let evidenceData = [];

    // DOM Controls
    const searchInput = document.getElementById('evidenceSearchInput');
    const filterClassSelect = document.getElementById('filterClassification');
    const filterTypeSelect = document.getElementById('filterType');
    const filterCredSelect = document.getElementById('filterCredibility');
    const sortSelect = document.getElementById('sortEvidence');
    const displayedCount = document.getElementById('evidenceDisplayedCount');
    const totalCount = document.getElementById('evidenceTotalCount');
    const resetFiltersBtn = document.getElementById('resetEvidenceFiltersBtn');
    const emptyResetFiltersBtn = document.getElementById('emptyResetFiltersBtn');
    const emptyState = document.getElementById('noEvidenceEmptyState');

    // Modals
    const viewModalEl = document.getElementById('viewEvidenceModal');
    const bsViewModal = new bootstrap.Modal(viewModalEl);
    const deleteModalEl = document.getElementById('deleteEvidenceModal');
    const bsDeleteModal = new bootstrap.Modal(deleteModalEl);
    const deletePreviewTitle = document.getElementById('deleteEvidenceTitlePreview');
    const confirmDeleteBtn = document.getElementById('confirmDeleteEvidenceBtn');
    let evidenceIdPendingDelete = null;

    let filteredEvidence = [...evidenceData];

    // Helper: Badge HTML for classification
    const getClassificationBadge = (classification) => {
      switch (classification) {
        case 'Supporting':
          return `<span class="tl-badge tl-badge-support"><i class="bi bi-shield-check me-1"></i>Supporting</span>`;
        case 'Against':
          return `<span class="tl-badge tl-badge-against"><i class="bi bi-shield-x me-1"></i>Against</span>`;
        case 'Neutral':
          return `<span class="tl-badge tl-badge-neutral"><i class="bi bi-dash-circle me-1"></i>Neutral</span>`;
        case 'Needs Verification':
          return `<span class="tl-badge tl-badge-verify"><i class="bi bi-question-circle me-1"></i>Needs Verification</span>`;
        default:
          return `<span class="tl-badge">${classification}</span>`;
      }
    };

    // Helper: Border class for classification
    const getClassificationBorder = (classification) => {
      switch (classification) {
        case 'Supporting': return 'border-start-support';
        case 'Against': return 'border-start-against';
        case 'Neutral': return 'border-start-neutral';
        case 'Needs Verification': return 'border-start-verify';
        default: return 'border-start-primary';
      }
    };

    // Helper: Format Type Icons
    const getTypeIcon = (type) => {
      switch (type) {
        case 'Research Paper': return '<i class="bi bi-file-earmark-pdf text-danger me-1"></i>';
        case 'Government Report': return '<i class="bi bi-building text-primary me-1"></i>';
        case 'Statistics': return '<i class="bi bi-graph-up text-success me-1"></i>';
        case 'Video': return '<i class="bi bi-camera-video text-primary me-1"></i>';
        case 'Social Media': return '<i class="bi bi-chat-left-quote text-warning me-1"></i>';
        default: return '<i class="bi bi-file-earmark-text text-secondary me-1"></i>';
      }
    };

    // Helper: Star Credibility Meter
    const renderCredibilityMeter = (rating) => {
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          stars += '<i class="bi bi-star-fill text-warning"></i>';
        } else {
          stars += '<i class="bi bi-star text-muted opacity-50"></i>';
        }
      }
      return `<div class="tl-credibility-meter" title="${rating}/5 Credibility Score">${stars}</div>`;
    };

    // Render Cards Grid
    const renderEvidenceCards = () => {
      cardsGrid.innerHTML = '';
      const total = filteredEvidence.length;
      totalCount.textContent = evidenceData.length;
      displayedCount.textContent = total;

      if (total === 0) {
        cardsGrid.classList.add('d-none');
        emptyState.classList.remove('d-none');
        return;
      }

      cardsGrid.classList.remove('d-none');
      emptyState.classList.add('d-none');

      filteredEvidence.forEach((item) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4';
        col.innerHTML = `
          <div class="tl-card tl-evidence-card p-3 h-100 d-flex flex-column justify-content-between ${getClassificationBorder(item.classification)}" data-id="${item.id}">
            
            <div>
              <!-- Header Strip -->
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex flex-wrap gap-1 align-items-center">
                  ${getClassificationBadge(item.classification)}
                  <span class="badge bg-light text-dark border tl-micro">
                    ${getTypeIcon(item.type)}${item.type}
                  </span>
                </div>
                <div class="dropdown">
                  <button class="btn btn-sm btn-light border-0 py-0 px-1 text-muted" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Evidence actions">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm p-1 tl-small">
                    <li><button type="button" class="dropdown-item py-1 btn-view-evidence" data-id="${item.id}"><i class="bi bi-eye me-2"></i>Inspect Details</button></li>
                    <li><a class="dropdown-item py-1" href="add-evidence.html?edit=${item.id}"><i class="bi bi-pencil me-2"></i>Edit Record</a></li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li><button type="button" class="dropdown-item py-1 text-danger btn-delete-evidence" data-id="${item.id}" data-title="${item.title}"><i class="bi bi-trash3 me-2"></i>Delete</button></li>
                  </ul>
                </div>
              </div>

              <!-- Evidence Title -->
              <h3 class="tl-evidence-title-clamp mb-2">
                <a href="#" class="text-dark text-decoration-none btn-view-evidence" data-id="${item.id}">
                  ${item.title}
                </a>
              </h3>

              <!-- Publisher / Source Meta -->
              <div class="d-flex align-items-center gap-1 tl-micro text-muted mb-2 text-truncate">
                <i class="bi bi-building"></i>
                <span class="text-truncate fw-medium text-dark">${item.publisher}</span>
              </div>

              <!-- Short Summary Excerpt -->
              <p class="tl-evidence-summary-clamp mb-3">
                ${item.summary}
              </p>
            </div>

            <!-- Card Footer -->
            <div class="pt-2 border-top">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center gap-1">
                  <span class="tl-micro text-muted">Credibility:</span>
                  ${renderCredibilityMeter(item.credibility)}
                </div>
                <span class="tl-micro text-muted"><i class="bi bi-calendar3 me-1"></i>${item.publicationDate}</span>
              </div>

              <div class="d-flex justify-content-between align-items-center">
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="tl-micro text-primary text-decoration-none fw-medium text-truncate" style="max-width: 190px;">
                  <i class="bi bi-link-45deg me-1"></i>Source Link
                </a>
                <div class="d-inline-flex gap-1">
                  <button type="button" class="tl-table-action-btn btn-view-evidence" data-id="${item.id}" title="Inspect Details">
                    <i class="bi bi-eye"></i>
                  </button>
                  <a href="add-evidence.html?edit=${item.id}" class="tl-table-action-btn" title="Edit Evidence">
                    <i class="bi bi-pencil"></i>
                  </a>
                  <button type="button" class="tl-table-action-btn btn-delete btn-delete-evidence" data-id="${item.id}" data-title="${item.title}" title="Delete Record">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
            </div>

          </div>
        `;
        cardsGrid.appendChild(col);
      });
    };

    // Filter & Sort Logic
    const applyEvidenceFilters = () => {
      const q = searchInput.value.trim().toLowerCase();
      const selClass = filterClassSelect.value;
      const selType = filterTypeSelect.value;
      const selCred = filterCredSelect.value;
      const selSort = sortSelect.value;

      filteredEvidence = evidenceData.filter((item) => {
        const matchesSearch = 
          item.title.toLowerCase().includes(q) ||
          item.publisher.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);

        const matchesClass = selClass === 'all' || item.classification === selClass;
        const matchesType = selType === 'all' || item.type === selType;
        const matchesCred = selCred === 'all' || item.credibility.toString() === selCred;

        return matchesSearch && matchesClass && matchesType && matchesCred;
      });

      // Sorting
      filteredEvidence.sort((a, b) => {
        switch (selSort) {
          case 'date-desc':
            return new Date(b.publicationDate) - new Date(a.publicationDate);
          case 'date-asc':
            return new Date(a.publicationDate) - new Date(b.publicationDate);
          case 'credibility-desc':
            return b.credibility - a.credibility;
          case 'credibility-asc':
            return a.credibility - b.credibility;
          default:
            return 0;
        }
      });

      const hasFilters = q !== '' || selClass !== 'all' || selType !== 'all' || selCred !== 'all';
      resetFiltersBtn.classList.toggle('d-none', !hasFilters);

      renderEvidenceCards();
    };

    const resetFilters = () => {
      searchInput.value = '';
      filterClassSelect.value = 'all';
      filterTypeSelect.value = 'all';
      filterCredSelect.value = 'all';
      sortSelect.value = 'date-desc';
      applyEvidenceFilters();
    };

    // Event Listeners for Filters
    searchInput.addEventListener('input', applyEvidenceFilters);
    filterClassSelect.addEventListener('change', applyEvidenceFilters);
    filterTypeSelect.addEventListener('change', applyEvidenceFilters);
    filterCredSelect.addEventListener('change', applyEvidenceFilters);
    sortSelect.addEventListener('change', applyEvidenceFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);
    emptyResetFiltersBtn.addEventListener('click', resetFilters);

    // Event Delegation: View Evidence Modal
    cardsGrid.addEventListener('click', (e) => {
      const viewTrigger = e.target.closest('.btn-view-evidence');
      if (viewTrigger) {
        e.preventDefault();
        const evId = viewTrigger.getAttribute('data-id');
        const item = evidenceData.find(ev => ev.id === evId);
        if (!item) return;

        document.getElementById('modalClassificationBadge').innerHTML = getClassificationBadge(item.classification);
        document.getElementById('modalTypeBadge').innerHTML = `${getTypeIcon(item.type)}${item.type}`;
        document.getElementById('modalEvidenceId').textContent = `#${item.id}`;
        document.getElementById('modalEvidenceTitle').textContent = item.title;
        document.getElementById('modalPublisher').textContent = item.publisher;
        document.getElementById('modalAuthor').textContent = item.author || 'Not specified';
        document.getElementById('modalPubDate').textContent = item.publicationDate || 'Undated';
        document.getElementById('modalCredibility').textContent = `${item.credibility} / 5`;
        document.getElementById('modalAssociatedCase').textContent = `${item.caseId}: ${item.caseTitle}`;
        document.getElementById('modalSummary').textContent = item.summary;
        document.getElementById('modalDescription').textContent = item.description || 'No additional methodology recorded.';
        document.getElementById('modalNotes').textContent = item.notes || 'No caveats logged.';
        
        const extBtn = document.getElementById('modalExternalUrlBtn');
        if (item.url) {
          extBtn.href = item.url;
          extBtn.classList.remove('d-none');
        } else {
          extBtn.classList.add('d-none');
        }

        bsViewModal.show();
      }

      // Event Delegation: Delete Modal Trigger
      const deleteTrigger = e.target.closest('.btn-delete-evidence');
      if (deleteTrigger) {
        evidenceIdPendingDelete = deleteTrigger.getAttribute('data-id');
        const title = deleteTrigger.getAttribute('data-title');
        deletePreviewTitle.textContent = `${evidenceIdPendingDelete}: ${title}`;
        bsDeleteModal.show();
      }
    });

    confirmDeleteBtn.addEventListener('click', async () => {
      if (evidenceIdPendingDelete) {
        if (window.TruthLensDB) {
          try {
            await window.TruthLensDB.deleteEvidence(evidenceIdPendingDelete);
            if (window.showToast) window.showToast(`Evidence #${evidenceIdPendingDelete} deleted from Firestore.`, 'danger');
          } catch (err) {
            console.error('Error deleting evidence from Firestore:', err);
          }
        }
        evidenceData = evidenceData.filter(item => item.id !== evidenceIdPendingDelete);
        bsDeleteModal.hide();
        evidenceIdPendingDelete = null;
        applyEvidenceFilters();
      }
    });

    const initEvidenceVault = async () => {
      if (window.TruthLensDB) {
        try {
          evidenceData = await window.TruthLensDB.getEvidence();
        } catch (err) {
          console.error('Failed loading evidence from DB:', err);
        }
      }
      applyEvidenceFilters();
    };

    initEvidenceVault();
  }

  // ==========================================================================
  // 2. EVIDENCE INGESTION FORM CONTROLLER (`add-evidence.html`)
  // ==========================================================================
  const evidenceForm = document.getElementById('addEvidenceForm');
  if (evidenceForm) {
    const titleInput = document.getElementById('evidenceTitle');
    const typeSelect = document.getElementById('evidenceType');
    const urlInput = document.getElementById('sourceUrl');
    const publisherInput = document.getElementById('evidencePublisher');
    const classSelect = document.getElementById('evidenceClassification');
    const credibilityRange = document.getElementById('credibilityRating');
    const credibilityLabel = document.getElementById('credibilityLabel');
    const summaryInput = document.getElementById('evidenceSummary');
    const descInput = document.getElementById('evidenceDescription');
    const notesInput = document.getElementById('evidenceNotes');

    const titleCounter = document.getElementById('titleCounter');
    const summaryCounter = document.getElementById('summaryCounter');
    const descCounter = document.getElementById('descCounter');
    const notesCounter = document.getElementById('notesCounter');

    const dropzoneArea = document.getElementById('dropzoneArea');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const browseFileBtn = document.getElementById('browseFileBtn');
    const dropzonePrompt = document.getElementById('dropzonePrompt');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const previewFileName = document.getElementById('previewFileName');
    const previewFileSize = document.getElementById('previewFileSize');
    const previewIcon = document.getElementById('previewIcon');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const fileFeedback = document.getElementById('fileValidationFeedback');

    const btnSubmitEvidence = document.getElementById('btnSubmitEvidence');
    const submitSpinner = document.getElementById('submitSpinner');
    const submitBtnText = document.getElementById('submitBtnText');
    const successAlert = document.getElementById('evidenceSuccessAlert');
    const errorAlert = document.getElementById('evidenceErrorAlert');
    const errorMessage = document.getElementById('evidenceErrorMessage');

    const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'csv', 'xlsx', 'docx'];

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

    bindCounter(titleInput, titleCounter, 150);
    bindCounter(summaryInput, summaryCounter, 400);
    bindCounter(descInput, descCounter, 1200);
    bindCounter(notesInput, notesCounter, 500);

    const credibilityScale = {
      1: '1 / 5 — Very Low (Speculative / Anonymous)',
      2: '2 / 5 — Low (Marketing / Partisan Bias)',
      3: '3 / 5 — Moderate (Secondary Trade Report)',
      4: '4 / 5 — High (Reputable News / Official 10-K)',
      5: '5 / 5 — Very High (Peer-Reviewed / Gov Agency)'
    };

    if (credibilityRange && credibilityLabel) {
      credibilityRange.addEventListener('input', () => {
        const val = credibilityRange.value;
        credibilityLabel.textContent = credibilityScale[val] || `${val} / 5`;
      });
    }

    const formatFileSize = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const getFileIconClass = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      switch (ext) {
        case 'pdf': return 'bi-file-earmark-pdf text-danger';
        case 'png':
        case 'jpg':
        case 'jpeg': return 'bi-file-earmark-image text-success';
        case 'csv':
        case 'xlsx': return 'bi-file-earmark-spreadsheet text-info';
        case 'docx': return 'bi-file-earmark-word text-primary';
        default: return 'bi-file-earmark-text text-secondary';
      }
    };

    const handleSelectedFile = (file) => {
      fileFeedback.classList.add('d-none');
      fileFeedback.textContent = '';
      if (!file) return;

      const fileExt = file.name.split('.').pop().toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
        fileFeedback.textContent = `Unsupported file type (.${fileExt}). Please upload PDF, PNG, JPG, CSV, XLSX, or DOCX.`;
        fileFeedback.classList.remove('d-none');
        fileUploadInput.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        fileFeedback.textContent = `File size (${formatFileSize(file.size)}) exceeds maximum 15MB allowance.`;
        fileFeedback.classList.remove('d-none');
        fileUploadInput.value = '';
        return;
      }

      previewFileName.textContent = file.name;
      previewFileSize.textContent = formatFileSize(file.size);
      previewIcon.innerHTML = `<i class="bi ${getFileIconClass(file.name)}"></i>`;

      dropzonePrompt.classList.add('d-none');
      filePreviewContainer.classList.remove('d-none');
    };

    const resetFileSelection = () => {
      fileUploadInput.value = '';
      filePreviewContainer.classList.add('d-none');
      dropzonePrompt.classList.remove('d-none');
      fileFeedback.classList.add('d-none');
    };

    if (browseFileBtn) browseFileBtn.addEventListener('click', () => fileUploadInput.click());
    if (dropzoneArea) {
      dropzoneArea.addEventListener('click', (e) => {
        if (e.target !== removeFileBtn && !removeFileBtn.contains(e.target)) {
          fileUploadInput.click();
        }
      });

      ['dragenter', 'dragover'].forEach(event => {
        dropzoneArea.addEventListener(event, (e) => {
          e.preventDefault();
          dropzoneArea.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(event => {
        dropzoneArea.addEventListener(event, (e) => {
          e.preventDefault();
          dropzoneArea.classList.remove('dragover');
        });
      });

      dropzoneArea.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          fileUploadInput.files = e.dataTransfer.files;
          handleSelectedFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (fileUploadInput) {
      fileUploadInput.addEventListener('change', () => {
        if (fileUploadInput.files && fileUploadInput.files[0]) {
          handleSelectedFile(fileUploadInput.files[0]);
        }
      });
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileSelection();
      });
    }

    const isValidHttpUrl = (string) => {
      if (!string || string.trim() === '') return true;
      try {
        const url = new URL(string.trim());
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (_) {
        return false;
      }
    };

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

    [titleInput, typeSelect, publisherInput, classSelect, summaryInput, urlInput].forEach((elem) => {
      if (elem) {
        elem.addEventListener('input', () => {
          if (elem.classList.contains('is-invalid')) {
            elem.classList.remove('is-invalid');
          }
        });
      }
    });

    evidenceForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (errorAlert) errorAlert.classList.add('d-none');
      if (successAlert) successAlert.classList.add('d-none');

      const titleVal = titleInput.value.trim();
      const typeVal = typeSelect.value;
      const publisherVal = publisherInput.value.trim();
      const classVal = classSelect.value;
      const summaryVal = summaryInput.value.trim();
      const urlVal = urlInput.value.trim();

      const isTitleValid = titleVal.length >= 10;
      const isTypeValid = typeVal !== '';
      const isPublisherValid = publisherVal.length >= 2;
      const isClassValid = classVal !== '';
      const isSummaryValid = summaryVal.length >= 25;
      const isUrlValid = isValidHttpUrl(urlVal);

      setFieldState(titleInput, isTitleValid);
      setFieldState(typeSelect, isTypeValid);
      setFieldState(publisherInput, isPublisherValid);
      setFieldState(classSelect, isClassValid);
      setFieldState(summaryInput, isSummaryValid);
      setFieldState(urlInput, isUrlValid);

      const isFormValid = isTitleValid && isTypeValid && isPublisherValid && isClassValid && isSummaryValid && isUrlValid;

      if (!isFormValid) {
        if (errorAlert && errorMessage) {
          let msg = 'Please resolve all required fields highlighted in red.';
          if (!isUrlValid) msg = 'Please provide a valid URL starting with http:// or https://.';
          errorMessage.textContent = msg;
          errorAlert.classList.remove('d-none');
          errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      btnSubmitEvidence.disabled = true;
      submitSpinner.classList.remove('d-none');
      submitBtnText.textContent = 'Saving Evidence to Firestore...';

      const targetCaseSelect = document.getElementById('evidenceTargetCase');
      const selectedCaseId = (targetCaseSelect && targetCaseSelect.value) ? targetCaseSelect.value : (new URLSearchParams(window.location.search).get('case') || 'TL-8429');

      try {
        const payload = {
          caseId: selectedCaseId,
          title: titleVal,
          type: typeVal,
          publisher: publisherVal,
          author: (document.getElementById('evidenceAuthor') && document.getElementById('evidenceAuthor').value.trim()) || 'Abinash Panigrahy',
          publicationDate: (document.getElementById('publicationDate') && document.getElementById('publicationDate').value) || new Date().toISOString().slice(0, 10),
          url: urlVal,
          classification: classVal,
          credibility: credibilityRange ? Number(credibilityRange.value) : 3,
          summary: summaryVal,
          description: descInput ? descInput.value.trim() : '',
          notes: notesInput ? notesInput.value.trim() : ''
        };

        if (window.TruthLensDB) {
          await window.TruthLensDB.createEvidence(payload);

          // Add to chronological audit timeline
          await window.TruthLensDB.createTimelineEvent({
            caseId: selectedCaseId,
            caseTitle: targetCaseSelect ? targetCaseSelect.options[targetCaseSelect.selectedIndex]?.text : 'Investigation Case',
            type: 'Evidence Added',
            icon: 'bi-plus-circle',
            color: 'success',
            title: 'Primary Evidence Indexed: ' + titleVal,
            description: summaryVal.substring(0, 90) + (summaryVal.length > 90 ? '...' : ''),
            user: payload.author || 'Abinash Panigrahy'
          });
        }
      } catch (err) {
        console.error('Error saving evidence to Firebase:', err);
      }

      submitSpinner.classList.add('d-none');
      if (successAlert) {
        successAlert.classList.remove('d-none');
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setTimeout(() => {
        window.location.href = `investigation-details.html?id=${selectedCaseId}`;
      }, 1000);
    });

    // Populate Target Case Dossiers from Firestore / TruthLensDB
    const initCaseSelectContext = async () => {
      if (!window.TruthLensDB) return;
      const targetCaseSelect = document.getElementById('evidenceTargetCase');
      const urlParams = new URLSearchParams(window.location.search);
      let activeCaseId = urlParams.get('case') || urlParams.get('id');

      try {
        const cases = await window.TruthLensDB.getInvestigations();
        if (targetCaseSelect && cases && cases.length > 0) {
          targetCaseSelect.innerHTML = '';
          cases.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `#${c.id}: ${c.title.length > 50 ? c.title.substring(0, 48) + '...' : c.title}`;
            if (activeCaseId && c.id === activeCaseId) {
              opt.selected = true;
            }
            targetCaseSelect.appendChild(opt);
          });

          if (!activeCaseId) {
            activeCaseId = cases[0].id;
            targetCaseSelect.value = activeCaseId;
          }
        }

        const updateBannerForCase = (cId) => {
          const selected = cases.find(c => c.id === cId);
          if (selected) {
            const claimEl = document.getElementById('contextClaimText');
            if (claimEl) claimEl.textContent = `"${selected.claim}"`;
            const bannerLabel = document.getElementById('bannerCaseLabel');
            if (bannerLabel) bannerLabel.textContent = `Target Claim Under Inquest (#${selected.id})`;
            const bannerBadge = document.getElementById('bannerCaseBadge');
            if (bannerBadge) {
              bannerBadge.textContent = `${selected.status || 'Active'} Case`;
              bannerBadge.className = `tl-badge ${selected.status === 'Completed' ? 'tl-badge-completed' : 'tl-badge-active'} ms-3 flex-shrink-0`;
            }
            const backBtn = document.getElementById('backToCaseBtn');
            if (backBtn) backBtn.setAttribute('href', `investigation-details.html?id=${selected.id}`);
          }
        };

        if (activeCaseId) {
          updateBannerForCase(activeCaseId);
        }

        if (targetCaseSelect) {
          targetCaseSelect.addEventListener('change', () => {
            updateBannerForCase(targetCaseSelect.value);
          });
        }
      } catch (err) {
        console.error('[Add Evidence] Failed initializing case selector:', err);
      }
    };

    initCaseSelectContext();
  }
});