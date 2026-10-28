// ==========================================================================
// TruthLens Theme Controller (Dark Mode / Light Mode)
// Universal Theme Switching, System Detection, Topbar & Settings Sync
// ==========================================================================
const THEME_STORAGE_KEY = 'truthlens_theme';

window.TruthLensTheme = {
  getStoredTheme: () => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (_) {
      return null;
    }
  },

  getPreferredTheme: () => {
    const stored = window.TruthLensTheme.getStoredTheme();
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  getTheme: () => {
    return document.documentElement.getAttribute('data-theme') || window.TruthLensTheme.getPreferredTheme();
  },

  applyTheme: (theme, save = true) => {
    const normalized = (theme === 'dark') ? 'dark' : 'light';
    const isDark = normalized === 'dark';

    document.documentElement.setAttribute('data-theme', normalized);
    document.documentElement.setAttribute('data-bs-theme', normalized);

    if (save) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, normalized);
      } catch (err) {
        console.warn('[TruthLensTheme] Failed to write theme to localStorage', err);
      }
    }

    // 1. Update all theme toggle buttons, icons, and tooltips across the DOM
    document.querySelectorAll('#topbarThemeToggleBtn, .tl-theme-toggle-btn').forEach((btn) => {
      btn.setAttribute('title', isDark ? 'Switch to Light Mode (Alt+T)' : 'Switch to Dark Mode (Alt+T)');
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      btn.setAttribute('data-current-theme', normalized);

      const icon = btn.querySelector('#topbarThemeIcon, .tl-theme-icon, i');
      if (icon) {
        icon.className = isDark ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars text-secondary';
      }
    });

    // 2. Update Settings page switch if present
    const switchToggle = document.getElementById('themeSwitchToggle');
    if (switchToggle) {
      switchToggle.checked = isDark;
    }

    const switchLabel = document.getElementById('themeSwitchLabel');
    if (switchLabel) {
      switchLabel.textContent = isDark ? 'Dark Mode Active' : 'Light Mode Active';
      switchLabel.className = 'form-check-label tl-small ms-1 ' + (isDark ? 'text-primary fw-semibold' : 'text-muted');
    }

    // 3. Dispatch global custom event for external listeners (e.g. Chart.js)
    window.dispatchEvent(new CustomEvent('truthlens-theme-change', {
      detail: { theme: normalized, isDark }
    }));
  },

  toggleTheme: () => {
    const current = window.TruthLensTheme.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    window.TruthLensTheme.applyTheme(next, true);

    if (window.showToast) {
      window.showToast(next === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated', 'info');
    }
  },

  injectTopbarToggleIfMissing: () => {
    // If a topbar exists and doesn't already contain a theme toggle button, auto-inject one
    const topbarRight = document.querySelector('.tl-topbar .d-flex.align-items-center.gap-2');
    if (topbarRight && !document.getElementById('topbarThemeToggleBtn') && !topbarRight.querySelector('.tl-theme-toggle-btn')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn btn-light tl-btn-icon tl-theme-toggle-btn';
      toggleBtn.id = 'topbarThemeToggleBtn';
      toggleBtn.title = window.TruthLensTheme.getTheme() === 'dark' ? 'Switch to Light Mode (Alt+T)' : 'Switch to Dark Mode (Alt+T)';
      toggleBtn.setAttribute('aria-label', 'Toggle Theme');

      const isDark = window.TruthLensTheme.getTheme() === 'dark';
      toggleBtn.innerHTML = `<i class="bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-stars text-secondary'}" id="topbarThemeIcon"></i>`;

      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.TruthLensTheme.toggleTheme();
      });

      // Insert before notifications dropdown or profile dropdown
      const notifOrProfile = topbarRight.querySelector('#notifDropdown, #userProfileDropdown, .dropdown');
      if (notifOrProfile && notifOrProfile.closest('.dropdown')) {
        topbarRight.insertBefore(toggleBtn, notifOrProfile.closest('.dropdown'));
      } else {
        topbarRight.appendChild(toggleBtn);
      }
    }
  },

  initUI: () => {
    // 1. Auto-inject in topbar if absent
    window.TruthLensTheme.injectTopbarToggleIfMissing();

    // 2. Wire up all theme buttons
    document.querySelectorAll('#topbarThemeToggleBtn, .tl-theme-toggle-btn').forEach((btn) => {
      if (!btn._tlThemeBound) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          window.TruthLensTheme.toggleTheme();
        });
        btn._tlThemeBound = true;
      }
    });

    // 3. Wire up settings page switch toggle
    const switchToggle = document.getElementById('themeSwitchToggle');
    if (switchToggle && !switchToggle._tlThemeBound) {
      switchToggle.addEventListener('change', (e) => {
        const targetTheme = e.target.checked ? 'dark' : 'light';
        window.TruthLensTheme.applyTheme(targetTheme, true);
        if (window.showToast) {
          window.showToast(targetTheme === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated', 'info');
        }
      });
      switchToggle._tlThemeBound = true;
    }

    // 4. Update UI labels and icons
    window.TruthLensTheme.applyTheme(window.TruthLensTheme.getTheme(), false);

    // 5. Cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        window.TruthLensTheme.applyTheme(e.newValue, false);
      }
    });

    // 6. Listen to system preference changes if user hasn't explicitly chosen
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!window.TruthLensTheme.getStoredTheme()) {
          window.TruthLensTheme.applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }

    // 7. Global Keyboard Shortcut: Alt + T or Alt + Shift + D
    if (!window._tlThemeKeyShortcutBound) {
      document.addEventListener('keydown', (e) => {
        if ((e.altKey && (e.key === 't' || e.key === 'T')) ||
            (e.altKey && e.shiftKey && (e.key === 'd' || e.key === 'D'))) {
          const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
          if (activeTag !== 'input' && activeTag !== 'textarea') {
            e.preventDefault();
            window.TruthLensTheme.toggleTheme();
          }
        }
      });
      window._tlThemeKeyShortcutBound = true;
    }
  },

  init: () => {
    // Immediately apply theme before DOMContentLoaded to prevent flicker
    const initial = window.TruthLensTheme.getPreferredTheme();
    window.TruthLensTheme.applyTheme(initial, false);
  }
};

// Immediately execute initial theme resolution
window.TruthLensTheme.init();

/**
 * TruthLens — Core Application Shell Controller
 * Handles universal sidebar drawer toggling, dynamic nav highlighting,
 * Bootstrap tooltips, and Firebase connection status indication.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Initialize Theme UI
  window.TruthLensTheme.initUI();

  // 1. Responsive Sidebar Drawer Toggle (Mobile & Tablet)
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

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

  // 2. Active Navigation Link Highlighting
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.tl-sidebar-menu .nav-link, .tl-navbar .nav-link');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || href.split('?')[0] === currentPath)) {
      link.classList.add('active');
    }
  });

  // 3. Initialize Bootstrap Tooltips (if Bootstrap exists)
  if (window.bootstrap && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));
  }

  // 4. Update Firebase Status Badge in Top Bar
  const updateFirebaseStatusUI = () => {
    const pill = document.getElementById('firebaseStatusPill');
    if (!pill) return;

    if (window.TruthLensDB && window.TruthLensDB.isConfigured()) {
      pill.className = 'badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 py-1 px-2';
      pill.innerHTML = '<span class="status-dot bg-success rounded-circle" style="width:7px;height:7px;display:inline-block;"></span> Firestore Connected';
      pill.setAttribute('title', `Connected to project: ${window.TruthLensDB.getProjectId()}`);
    } else {
      pill.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-flex align-items-center gap-1 py-1 px-2';
      pill.innerHTML = '<span class="status-dot bg-warning rounded-circle" style="width:7px;height:7px;display:inline-block;"></span> Firebase Demo Mode';
      pill.setAttribute('title', 'Running in local fallback mode. Configure firebase-config.js to connect live Firestore.');
    }
  };

  // 5. User Session UI Management
  const initUserSessionUI = () => {
    if (!window.TruthLensDB || typeof window.TruthLensDB.getCurrentSession !== 'function') return;

    const session = window.TruthLensDB.getCurrentSession();
    
    // On protected pages, enforce active session
    const protectedPages = ['dashboard.html', 'user-dashboard.html', 'admin-dashboard.html', 'profile.html', 'create-investigation.html', 'add-evidence.html', 'conclusion.html'];
    if (!session && protectedPages.includes(currentPath)) {
      console.warn('[TruthLens] No active session on protected route; redirecting to login.html');
      window.location.href = 'login.html';
      return;
    }

    if (!session) return;

    // A. Update Sidebar Footer & User Profile Elements
    document.querySelectorAll('#sidebarUserName, .sidebar-user-name, .tl-sidebar-footer .fw-semibold').forEach(el => {
      el.textContent = session.name;
    });

    document.querySelectorAll('#sidebarUserTitle, #sidebarUserRole, .tl-sidebar-footer .tl-micro').forEach(el => {
      const roleBadge = session.role === 'admin' ? '<span class="badge bg-dark text-white py-0 px-1">Chief Editor &bull; Admin</span>'
                      : session.role === 'user' ? '<span class="badge bg-success-subtle text-success py-0 px-1">Citizen Contributor</span>'
                      : '<span class="badge bg-primary-subtle text-primary py-0 px-1">Forensic Analyst</span>';
      el.innerHTML = session.title ? `${session.title} &bull; TruthLens` : roleBadge;
    });

    document.querySelectorAll('#sidebarUserAvatar, .tl-sidebar-footer .tl-avatar-sm').forEach(el => {
      if (session.avatar) {
        const colorClass = session.role === 'admin' ? 'text-dark' : session.role === 'user' ? 'text-success' : 'text-primary';
        el.innerHTML = `<span class="fw-bold ${colorClass}" style="font-size:0.8rem;">${session.avatar}</span>`;
      }
    });

    // B. Update Topbar Dropdown Profile & Label
    const topbarUserBtn = document.getElementById('userProfileDropdown');
    if (topbarUserBtn) {
      const labelSpans = topbarUserBtn.querySelectorAll('span.d-none, span.d-sm-inline, #topbarUserName');
      labelSpans.forEach(span => {
        span.textContent = session.name;
      });

      const topbarAvatar = topbarUserBtn.querySelector('.tl-avatar-xs, #topbarUserAvatar');
      if (topbarAvatar && session.avatar) {
        const colorClass = session.role === 'admin' ? 'text-dark' : session.role === 'user' ? 'text-success' : 'text-primary';
        topbarAvatar.innerHTML = `<span class="fw-bold ${colorClass}" style="font-size:0.7rem;">${session.avatar}</span>`;
      }
    }

    // C. Update Dropdown Menu Header
    document.querySelectorAll('#dropdownUserName, [aria-labelledby="userProfileDropdown"] .fw-semibold').forEach(el => {
      el.textContent = session.name;
    });

    document.querySelectorAll('#dropdownUserEmail, #topbarUserEmail, [aria-labelledby="userProfileDropdown"] .tl-micro').forEach(el => {
      el.textContent = session.email;
    });

    document.querySelectorAll('#dropdownUserRole').forEach(el => {
      el.textContent = session.title || (session.role === 'admin' ? 'Administrator' : session.role === 'user' ? 'Citizen Fact-Checker' : 'Forensic Analyst');
    });

    // D. Update Page Greeting Headings
    document.querySelectorAll('#welcomeUserName, #userWelcomeName, #adminWelcomeName, #dashboardWelcomeName, .tl-welcome-username').forEach(el => {
      el.textContent = session.name;
    });

    // E. Update Profile Card Elements (if present on profile.html)
    const dispName = document.getElementById('displayProfileName');
    if (dispName) dispName.textContent = session.name;
    const dispEmail = document.getElementById('displayProfileEmail');
    if (dispEmail) dispEmail.textContent = session.email;
    const dispRole = document.getElementById('displayProfileRoleBadge');
    if (dispRole) {
      dispRole.textContent = `${session.title || (session.role.toUpperCase() + ' Specialist')} • Verified ID`;
    }
  };

  // 6. Universal Logout Handler
  const executeLogout = () => {
    if (window.TruthLensDB && typeof window.TruthLensDB.clearSession === 'function') {
      window.TruthLensDB.clearSession();
    }
    if (window.firebase && window.firebase.auth) {
      try { window.firebase.auth().signOut(); } catch (_) {}
    }
    window.location.href = 'login.html';
  };

  document.querySelectorAll('#btnLogoutTrigger, [data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // If the button delegates to Bootstrap modal, let modal open
      if (btn.getAttribute('data-bs-toggle') === 'modal') {
        return;
      }
      e.preventDefault();
      if (confirm('Are you sure you want to log out of the TruthLens workspace?')) {
        executeLogout();
      }
    });
  });

  // Attach logout handler to all modal Sign Out confirmation links/buttons
  document.querySelectorAll('#logoutModal a[href="login.html"], #logoutModal .btn-danger, #logoutModal .bg-danger').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      executeLogout();
    });
  });

  // Run initial checks and subscribe to config events
  setTimeout(() => {
    updateFirebaseStatusUI();
    initUserSessionUI();
  }, 50);
  window.addEventListener('firebase-status-change', updateFirebaseStatusUI);
  window.addEventListener('truthlens-session-change', initUserSessionUI);
  window.addEventListener('user-session-change', initUserSessionUI);
});

// Global Session Switcher API
window.TruthLensSession = {
  switchRole: (role) => {
    if (window.TruthLensAuth && typeof window.TruthLensAuth.loginAs === 'function') {
      window.TruthLensAuth.loginAs(role);
      return;
    }
    const targetMap = {
      admin: 'admin-dashboard.html',
      investigator: 'dashboard.html',
      user: 'user-dashboard.html'
    };
    if (window.TruthLensDB && window.TruthLensDB.DEFAULT_USERS) {
      const u = window.TruthLensDB.DEFAULT_USERS.find(x => x.role === role);
      if (u) window.TruthLensDB.setCurrentSession(u);
    }
    window.location.href = targetMap[role] || 'dashboard.html';
  }
};

// Global UI Toast Helper
window.showToast = (message, type = 'success') => {
  let toastContainer = document.getElementById('tlToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'tlToastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' : type === 'danger' ? 'bg-danger text-white' : 'bg-primary text-white';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.className = `toast align-items-center border-0 ${bgClass}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${icon}"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);
  if (window.bootstrap && bootstrap.Toast) {
    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  } else {
    setTimeout(() => toastEl.remove(), 4000);
  }
};
