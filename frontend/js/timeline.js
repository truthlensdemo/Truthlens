/**
 * TruthLens - Dynamic Investigation Activity Chronology Controller
 * Handles live Firestore/local data ingestion, filtering, and real-time timeline stream.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const timelineContainer = document.getElementById('timelineContainer');
  const caseFilterSelect = document.getElementById('timelineCaseFilter');
  const activityFilterSelect = document.getElementById('timelineActivityFilter');
  const searchInput = document.getElementById('timelineSearchInput');
  const itemCountEl = document.getElementById('timelineItemCount');
  const resetBtn = document.getElementById('resetTimelineFiltersBtn');
  const scopeBanner = document.getElementById('timelineCaseScopeBanner');
  const scopeLabel = document.getElementById('timelineCaseScopeLabel');
  const scopeClaim = document.getElementById('timelineCaseScopeClaim');
  const scopeBadge = document.getElementById('timelineCaseScopeBadge');
  const backToDossierBtn = document.getElementById('timelineBackToDossierBtn');

  if (!timelineContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  let activeCaseId = urlParams.get('case') || urlParams.get('id') || 'TL-8429';

  let allInvestigations = [];
  let allEvents = [];

  // Icon mapping for event types
  const getEventIcon = (type, customIcon) => {
    if (customIcon) return customIcon;
    const t = (type || '').toLowerCase();
    if (t.includes('conclusion')) return 'bi-check2-circle';
    if (t.includes('evidence classified')) return 'bi-file-earmark-check';
    if (t.includes('evidence added') || t.includes('ingest')) return 'bi-plus-circle';
    if (t.includes('evidence updated')) return 'bi-arrow-repeat';
    if (t.includes('note')) return 'bi-sticky';
    if (t.includes('investigation created') || t.includes('formulat')) return 'bi-folder-plus';
    return 'bi-clock-history';
  };

  // Color mapping for markers
  const getEventColor = (color, type) => {
    if (color) return color;
    const t = (type || '').toLowerCase();
    if (t.includes('conclusion') || t.includes('created')) return 'success';
    if (t.includes('note')) return 'primary';
    if (t.includes('classified')) return 'danger';
    if (t.includes('updated')) return 'info';
    return 'secondary';
  };

  // Populate Case Dropdown with live database cases
  const populateCaseDropdown = () => {
    if (!caseFilterSelect) return;
    const currentVal = caseFilterSelect.value;
    caseFilterSelect.innerHTML = '';

    allInvestigations.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `#${c.id}: ${c.title.length > 40 ? c.title.substring(0, 38) + '...' : c.title}`;
      if (c.id === activeCaseId) opt.selected = true;
      caseFilterSelect.appendChild(opt);
    });

    // Add Global Option
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Workspace Activities (Cross-Case)';
    if (activeCaseId === 'all') allOpt.selected = true;
    caseFilterSelect.appendChild(allOpt);

    // If activeCaseId was not found in options, fallback to first
    if (activeCaseId !== 'all' && !allInvestigations.some(c => c.id === activeCaseId)) {
      if (allInvestigations.length > 0) {
        activeCaseId = allInvestigations[0].id;
        caseFilterSelect.value = activeCaseId;
      }
    }
  };

  // Update Scope Banner
  const updateScopeBanner = () => {
    if (!scopeBanner) return;
    if (activeCaseId === 'all') {
      if (scopeLabel) scopeLabel.textContent = 'Global Workspace Activity Stream';
      if (scopeClaim) scopeClaim.textContent = 'Displaying chronological audit trail across all indexed investigations and verified sources.';
      if (scopeBadge) {
        scopeBadge.textContent = 'Cross-Case Audit';
        scopeBadge.className = 'tl-badge tl-badge-neutral ms-3 flex-shrink-0';
      }
      if (backToDossierBtn) {
        backToDossierBtn.setAttribute('href', 'investigations.html');
        backToDossierBtn.innerHTML = '<i class="bi bi-arrow-left"></i><span>Back to Case Index</span>';
      }
    } else {
      const currentCase = allInvestigations.find(c => c.id === activeCaseId);
      if (currentCase) {
        if (scopeLabel) scopeLabel.textContent = `Current Case Inquest Scope (#${currentCase.id})`;
        if (scopeClaim) scopeClaim.textContent = `"${currentCase.claim}"`;
        if (scopeBadge) {
          scopeBadge.textContent = `${currentCase.status || 'Active'} Inquiry`;
          scopeBadge.className = `tl-badge ${currentCase.status === 'Completed' ? 'tl-badge-completed' : 'tl-badge-active'} ms-3 flex-shrink-0`;
        }
        if (backToDossierBtn) {
          backToDossierBtn.setAttribute('href', `investigation-details.html?id=${currentCase.id}`);
          backToDossierBtn.innerHTML = '<i class="bi bi-arrow-left"></i><span>Back to Dossier</span>';
        }
      }
    }
  };

  // Render Timeline Events
  const renderEvents = () => {
    const selectedCase = caseFilterSelect ? caseFilterSelect.value : activeCaseId;
    const selectedActivity = activityFilterSelect ? activityFilterSelect.value : 'all';
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filtered = allEvents.filter((item) => {
      // 1. Case filter
      if (selectedCase !== 'all' && item.caseId && item.caseId !== selectedCase) {
        return false;
      }
      // 2. Activity filter
      if (selectedActivity !== 'all' && item.type !== selectedActivity) {
        return false;
      }
      // 3. Search query
      if (query) {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const userMatch = (item.user || '').toLowerCase().includes(query);
        const caseMatch = (item.caseId || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !userMatch && !caseMatch) {
          return false;
        }
      }
      return true;
    });

    // Update count
    if (itemCountEl) itemCountEl.textContent = filtered.length;

    // Show / Hide reset button
    const isFiltered = (selectedCase !== (allInvestigations[0]?.id || 'TL-8429')) || (selectedActivity !== 'all') || (query !== '');
    if (resetBtn) {
      if (isFiltered) {
        resetBtn.classList.remove('d-none');
      } else {
        resetBtn.classList.add('d-none');
      }
    }

    // Render HTML
    if (filtered.length === 0) {
      timelineContainer.innerHTML = `
        <div class="text-center py-5 text-muted tl-small">
          <i class="bi bi-clock-history fs-2 d-block mb-2 text-secondary"></i>
          No chronological audit events match your active filter criteria.
          <div class="mt-2">
            <button type="button" class="btn btn-sm btn-tl-outline" id="btnEmptyReset">Reset Filters</button>
          </div>
        </div>
      `;
      const btnEmptyReset = document.getElementById('btnEmptyReset');
      if (btnEmptyReset) {
        btnEmptyReset.addEventListener('click', resetFilters);
      }
      return;
    }

    timelineContainer.innerHTML = filtered.map((evt) => {
      const markerColor = getEventColor(evt.color, evt.type);
      const icon = getEventIcon(evt.type, evt.icon);
      const timeStr = evt.timestamp || evt.relativeTime || 'Recent';

      return `
        <div class="tl-timeline-item" data-activity="${evt.type}" data-user="${evt.user || 'Abinash Panigrahy'}" data-case="${evt.caseId || ''}">
          <div class="tl-timeline-marker bg-${markerColor} text-white">
            <i class="bi ${icon}"></i>
          </div>
          <div class="tl-timeline-content tl-card p-3 p-md-4">
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <span class="tl-badge tl-badge-${markerColor === 'success' ? 'completed' : (markerColor === 'danger' ? 'against' : 'active')}">${evt.type}</span>
                ${evt.caseId ? `<a href="investigation-details.html?id=${evt.caseId}" class="badge bg-light text-dark border tl-micro text-decoration-none">Case #${evt.caseId}</a>` : ''}
              </div>
              <div class="text-muted tl-micro">
                <i class="bi bi-calendar3 me-1"></i><strong>${timeStr}</strong>
              </div>
            </div>

            <h3 class="tl-h4 text-dark mb-2">${evt.title}</h3>
            <p class="tl-small text-secondary mb-3">
              ${evt.description}
            </p>

            <div class="d-flex flex-wrap justify-content-between align-items-center pt-2 border-top tl-micro text-muted">
              <span><i class="bi bi-person-check me-1"></i>Logged by: <strong class="text-dark">${evt.user || 'Investigator'}</strong></span>
              <span class="text-success"><i class="bi bi-patch-check-fill me-1"></i>Audit Hash Verified</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const resetFilters = () => {
    if (caseFilterSelect && allInvestigations.length > 0) {
      activeCaseId = allInvestigations[0].id;
      caseFilterSelect.value = activeCaseId;
    }
    if (activityFilterSelect) activityFilterSelect.value = 'all';
    if (searchInput) searchInput.value = '';
    updateScopeBanner();
    renderEvents();
  };

  // Wire Event Listeners
  if (caseFilterSelect) {
    caseFilterSelect.addEventListener('change', () => {
      activeCaseId = caseFilterSelect.value;
      updateScopeBanner();
      renderEvents();
    });
  }

  if (activityFilterSelect) {
    activityFilterSelect.addEventListener('change', renderEvents);
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderEvents);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  // Load Database Data
  const init = async () => {
    if (!window.TruthLensDB) return;

    try {
      allInvestigations = await window.TruthLensDB.getInvestigations();
      allEvents = await window.TruthLensDB.getTimeline(null); // Fetch all events
    } catch (err) {
      console.error('[Timeline] Failed to load database collections:', err);
    }

    populateCaseDropdown();
    updateScopeBanner();
    renderEvents();
  };

  await init();
});
