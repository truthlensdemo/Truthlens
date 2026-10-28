/**
 * TruthLens — Research Field Notes Controller (`notes.html`)
 * Handles CRUD operations, category filtration, multi-field search,
 * pinned leads reordering, and modal handling.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const pinnedSection = document.getElementById('pinnedSectionWrapper');
  const pinnedGrid = document.getElementById('pinnedNotesGrid');
  const regularGrid = document.getElementById('regularNotesGrid');
  const emptyState = document.getElementById('noNotesEmptyState');

  if (!regularGrid) return;

  let notesData = [];

  const searchInput = document.getElementById('noteSearchInput');
  const filterCatSelect = document.getElementById('filterCategory');
  const filterCaseSelect = document.getElementById('filterCase');
  const sortSelect = document.getElementById('sortNotes');
  const displayedCount = document.getElementById('notesDisplayedCount');
  const totalCount = document.getElementById('notesTotalCount');
  const resetFiltersBtn = document.getElementById('resetNotesFiltersBtn');
  const emptyResetBtn = document.getElementById('emptyResetNotesBtn');

  const noteModalEl = document.getElementById('noteFormModal');
  const bsNoteModal = new bootstrap.Modal(noteModalEl);
  const noteModalTitle = document.getElementById('noteFormModalLabel');
  const noteForm = document.getElementById('noteEditForm');
  const formNoteId = document.getElementById('formNoteId');
  const formNoteTitle = document.getElementById('formNoteTitle');
  const formNoteCategory = document.getElementById('formNoteCategory');
  const formNoteCase = document.getElementById('formNoteCase');
  const formNoteContent = document.getElementById('formNoteContent');
  const formNotePinned = document.getElementById('formNotePinned');
  const openCreateNoteBtn = document.getElementById('openCreateNoteModalBtn');

  const noteTitleCounter = document.getElementById('noteTitleCounter');
  const noteContentCounter = document.getElementById('noteContentCounter');

  const deleteModalEl = document.getElementById('deleteNoteModal');
  const bsDeleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteTitlePreview = document.getElementById('deleteNoteTitlePreview');
  const confirmDeleteBtn = document.getElementById('confirmDeleteNoteBtn');
  let noteIdPendingDelete = null;

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Observation':
        return `<span class="tl-badge tl-note-badge-observation"><i class="bi bi-eye me-1"></i>Observation</span>`;
      case 'Question':
        return `<span class="tl-badge tl-note-badge-question"><i class="bi bi-question-circle me-1"></i>Question</span>`;
      case 'Important':
        return `<span class="tl-badge tl-note-badge-important"><i class="bi bi-exclamation-triangle me-1"></i>Important</span>`;
      case 'Follow-up':
        return `<span class="tl-badge tl-note-badge-follow-up"><i class="bi bi-arrow-repeat me-1"></i>Follow-up</span>`;
      case 'Conclusion Idea':
        return `<span class="tl-badge tl-note-badge-conclusion-idea"><i class="bi bi-lightbulb me-1"></i>Conclusion Idea</span>`;
      default:
        return `<span class="tl-badge bg-light text-dark border">${category}</span>`;
    }
  };

  if (window.TruthLensValidation) {
    window.TruthLensValidation.bindCounter(formNoteTitle, noteTitleCounter, 120);
    window.TruthLensValidation.bindCounter(formNoteContent, noteContentCounter, 1500);
  }

  const buildNoteCard = (note) => {
    return `
      <div class="col-md-6 col-xl-4" id="note-wrapper-${note.id}">
        <div class="tl-card tl-note-card h-100 p-3 d-flex flex-column justify-content-between ${note.isPinned ? 'pinned' : ''}">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div>${getCategoryBadge(note.category)}</div>
              <div class="d-flex align-items-center gap-1">
                <button type="button" class="tl-pin-btn btn-toggle-pin ${note.isPinned ? 'active' : ''}" data-id="${note.id}" title="${note.isPinned ? 'Unpin note' : 'Pin note'}">
                  <i class="bi ${note.isPinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}"></i>
                </button>
                <div class="dropdown">
                  <button class="btn btn-sm btn-light border-0 py-0 px-1 text-muted" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm p-1 tl-small">
                    <li><button type="button" class="dropdown-item py-1 btn-edit-note" data-id="${note.id}"><i class="bi bi-pencil me-2"></i>Edit Note</button></li>
                    <li><button type="button" class="dropdown-item py-1 btn-toggle-pin" data-id="${note.id}"><i class="bi bi-pin me-2"></i>${note.isPinned ? 'Unpin' : 'Pin to Top'}</button></li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li><button type="button" class="dropdown-item py-1 text-danger btn-delete-note" data-id="${note.id}" data-title="${note.title}"><i class="bi bi-trash3 me-2"></i>Delete</button></li>
                  </ul>
                </div>
              </div>
            </div>
            <h3 class="tl-h4 text-dark mb-2">${note.title}</h3>
            <div class="tl-micro text-muted mb-2">
              <i class="bi bi-folder2 me-1"></i>Case: <span class="fw-semibold text-dark">${note.caseId}</span>
            </div>
            <p class="tl-note-content-body mb-3">${note.content}</p>
          </div>
          <div class="pt-2 border-top mt-auto">
            <div class="d-flex justify-content-between align-items-center tl-micro text-muted">
              <span><i class="bi bi-calendar-plus me-1"></i>Created: ${note.createdDate.split(' ')[0]}</span>
              <span><i class="bi bi-clock-history me-1"></i>Updated: ${note.updatedDate.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderNotes = () => {
    const q = searchInput.value.trim().toLowerCase();
    const selCat = filterCatSelect.value;
    const selCase = filterCaseSelect.value;
    const selSort = sortSelect.value;

    let filtered = notesData.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.caseId.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchesCat = selCat === 'all' || item.category === selCat;
      const matchesCase = selCase === 'all' || item.caseId === selCase;

      return matchesSearch && matchesCat && matchesCase;
    });

    filtered.sort((a, b) => {
      switch (selSort) {
        case 'updated-desc': return new Date(b.updatedDate) - new Date(a.updatedDate);
        case 'created-desc': return new Date(b.createdDate) - new Date(a.createdDate);
        case 'created-asc': return new Date(a.createdDate) - new Date(b.createdDate);
        default: return 0;
      }
    });

    displayedCount.textContent = filtered.length;
    totalCount.textContent = notesData.length;

    const hasFilters = q !== '' || selCat !== 'all' || selCase !== 'all';
    resetFiltersBtn.classList.toggle('d-none', !hasFilters);

    if (filtered.length === 0) {
      pinnedSection.classList.add('d-none');
      regularGrid.classList.add('d-none');
      emptyState.classList.remove('d-none');
      return;
    }

    emptyState.classList.add('d-none');
    regularGrid.classList.remove('d-none');

    const pinnedNotes = filtered.filter(n => n.isPinned);
    const regularNotes = filtered.filter(n => !n.isPinned);

    if (pinnedNotes.length > 0) {
      pinnedSection.classList.remove('d-none');
      pinnedGrid.innerHTML = pinnedNotes.map(buildNoteCard).join('');
    } else {
      pinnedSection.classList.add('d-none');
      pinnedGrid.innerHTML = '';
    }

    regularGrid.innerHTML = regularNotes.map(buildNoteCard).join('');
  };

  document.addEventListener('click', async (e) => {
    const pinBtn = e.target.closest('.btn-toggle-pin');
    if (pinBtn) {
      const id = pinBtn.getAttribute('data-id');
      const note = notesData.find(n => n.id === id);
      if (note) {
        note.isPinned = !note.isPinned;
        note.updatedDate = new Date().toISOString().slice(0, 16).replace('T', ' ');
        if (window.TruthLensDB) {
          try {
            await window.TruthLensDB.togglePinNote(id, note.isPinned);
          } catch (err) {
            console.error('Error toggling pin in DB:', err);
          }
        }
        renderNotes();
      }
      return;
    }

    const editBtn = e.target.closest('.btn-edit-note');
    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      const note = notesData.find(n => n.id === id);
      if (note) {
        formNoteId.value = note.id;
        formNoteTitle.value = note.title;
        formNoteCategory.value = note.category;
        formNoteCase.value = note.caseId;
        formNoteContent.value = note.content;
        formNotePinned.checked = note.isPinned;

        noteModalTitle.innerHTML = `<i class="bi bi-pencil-square me-1 text-primary"></i> Edit Research Note`;
        formNoteTitle.dispatchEvent(new Event('input'));
        formNoteContent.dispatchEvent(new Event('input'));
        bsNoteModal.show();
      }
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete-note');
    if (deleteBtn) {
      noteIdPendingDelete = deleteBtn.getAttribute('data-id');
      const title = deleteBtn.getAttribute('data-title');
      deleteTitlePreview.textContent = `${noteIdPendingDelete}: ${title}`;
      bsDeleteModal.show();
      return;
    }
  });

  if (openCreateNoteBtn) {
    openCreateNoteBtn.addEventListener('click', () => {
      noteForm.reset();
      formNoteId.value = '';
      formNotePinned.checked = false;
      noteModalTitle.innerHTML = `<i class="bi bi-journal-plus me-1 text-primary"></i> Create Research Note`;
      formNoteTitle.dispatchEvent(new Event('input'));
      formNoteContent.dispatchEvent(new Event('input'));
      bsNoteModal.show();
    });
  }

  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleVal = formNoteTitle.value.trim();
    const contentVal = formNoteContent.value.trim();

    if (titleVal.length < 5) {
      formNoteTitle.classList.add('is-invalid');
      return;
    } else {
      formNoteTitle.classList.remove('is-invalid');
    }

    if (contentVal.length < 15) {
      formNoteContent.classList.add('is-invalid');
      return;
    } else {
      formNoteContent.classList.remove('is-invalid');
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const noteId = formNoteId.value;

    if (noteId) {
      const updateData = {
        title: titleVal,
        category: formNoteCategory.value,
        caseId: formNoteCase.value,
        content: contentVal,
        isPinned: formNotePinned.checked
      };

      if (window.TruthLensDB) {
        try {
          await window.TruthLensDB.updateNote(noteId, updateData);
          if (window.showToast) window.showToast(`Note #${noteId} updated in Firestore.`, 'success');
        } catch (err) {
          console.error('Error updating note in DB:', err);
        }
      }

      const note = notesData.find(n => n.id === noteId);
      if (note) {
        Object.assign(note, updateData, { updatedDate: now });
      }
    } else {
      let createdNote = null;
      const newPayload = {
        title: titleVal,
        category: formNoteCategory.value,
        caseId: formNoteCase.value,
        content: contentVal,
        isPinned: formNotePinned.checked
      };

      if (window.TruthLensDB) {
        try {
          createdNote = await window.TruthLensDB.createNote(newPayload);
          if (window.showToast) window.showToast(`Note #${createdNote.id} saved to Firestore.`, 'success');
        } catch (err) {
          console.error('Error creating note in DB:', err);
        }
      }

      notesData.unshift(createdNote || {
        id: `NOTE-${Math.floor(100 + Math.random() * 900)}`,
        ...newPayload,
        createdDate: now,
        updatedDate: now
      });
    }

    bsNoteModal.hide();
    renderNotes();
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (noteIdPendingDelete) {
      if (window.TruthLensDB) {
        try {
          await window.TruthLensDB.deleteNote(noteIdPendingDelete);
          if (window.showToast) window.showToast(`Note #${noteIdPendingDelete} deleted from Firestore.`, 'danger');
        } catch (err) {
          console.error('Error deleting note from DB:', err);
        }
      }
      notesData = notesData.filter(n => n.id !== noteIdPendingDelete);
      bsDeleteModal.hide();
      noteIdPendingDelete = null;
      renderNotes();
    }
  });

  searchInput.addEventListener('input', renderNotes);
  filterCatSelect.addEventListener('change', renderNotes);
  filterCaseSelect.addEventListener('change', renderNotes);
  sortSelect.addEventListener('change', renderNotes);

  const resetAllFilters = () => {
    searchInput.value = '';
    filterCatSelect.value = 'all';
    filterCaseSelect.value = 'all';
    sortSelect.value = 'updated-desc';
    renderNotes();
  };

  resetFiltersBtn.addEventListener('click', resetAllFilters);
  emptyResetBtn.addEventListener('click', resetAllFilters);

  const initNotesWorkspace = async () => {
    if (window.TruthLensDB) {
      try {
        const [notes, cases] = await Promise.all([
          window.TruthLensDB.getNotes(),
          window.TruthLensDB.getInvestigations()
        ]);
        notesData = notes || [];

        // Dynamically populate filterCase and formNoteCase
        if (cases && cases.length > 0) {
          if (filterCaseSelect) {
            const currentVal = filterCaseSelect.value;
            filterCaseSelect.innerHTML = '<option value="all" selected>All Cases</option>';
            cases.forEach((c) => {
              const opt = document.createElement('option');
              opt.value = c.id;
              opt.textContent = `#${c.id} (${c.title.length > 25 ? c.title.substring(0, 23) + '...' : c.title})`;
              if (c.id === currentVal) opt.selected = true;
              filterCaseSelect.appendChild(opt);
            });
          }

          if (formNoteCase) {
            formNoteCase.innerHTML = '';
            cases.forEach((c) => {
              const opt = document.createElement('option');
              opt.value = c.id;
              opt.textContent = `#${c.id}: ${c.title.length > 40 ? c.title.substring(0, 38) + '...' : c.title}`;
              formNoteCase.appendChild(opt);
            });
          }
        }
      } catch (err) {
        console.error('Failed loading notes from DB:', err);
      }
    }
    renderNotes();
  };

  initNotesWorkspace();
});