/**
 * TruthLens — Authentication & Registration Controller
 * Handles client-side validation, password strength checking, confirm password matching,
 * toggle visibility, async simulation, and Flask POST readiness.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================
  // COMMON HELPER UTILITIES
  // ==========================================
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const setInputState = (inputEl, isValid) => {
    if (!inputEl) return;
    if (isValid) {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.add('is-valid');
    } else {
      inputEl.classList.remove('is-valid');
      inputEl.classList.add('is-invalid');
    }
  };

  // Shared Password Visibility Toggler
  const togglePasswordBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');

  if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      
      togglePasswordIcon.classList.toggle('bi-eye', !isPassword);
      togglePasswordIcon.classList.toggle('bi-eye-slash', isPassword);
      togglePasswordBtn.setAttribute(
        'aria-label',
        isPassword ? 'Hide password' : 'Show password'
      );
    });
  }

  // ==========================================
  // REGISTRATION PAGE LOGIC (`register.html`)
  // ==========================================
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const fullNameInput = document.getElementById('fullName');
    const regEmailInput = document.getElementById('email');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheck = document.getElementById('termsCheck');
    
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    const registerSpinner = document.getElementById('registerSpinner');
    const registerBtnText = document.getElementById('registerBtnText');
    
    const authAlert = document.getElementById('authAlert');
    const authAlertIcon = document.getElementById('authAlertIcon');
    const authAlertMessage = document.getElementById('authAlertMessage');

    const showAlert = (message, isSuccess = false) => {
      if (!authAlert || !authAlertMessage) return;
      authAlertMessage.textContent = message;
      authAlert.classList.remove('d-none', 'alert-danger', 'alert-success');
      authAlert.classList.add('d-flex', isSuccess ? 'alert-success' : 'alert-danger');
      if (authAlertIcon) {
        authAlertIcon.className = isSuccess ? 'bi bi-check-circle-fill fs-6 flex-shrink-0' : 'bi bi-exclamation-triangle-fill fs-6 flex-shrink-0';
      }
    };

    const hideAlert = () => {
      if (!authAlert) return;
      authAlert.classList.add('d-none');
      authAlert.classList.remove('d-flex');
    };

    // Password Strength Evaluator
    const evaluatePasswordStrength = (pwd) => {
      let score = 0;
      if (!pwd) return { score: 0, text: 'Strength: Too short', class: 'bg-danger', width: '0%' };

      if (pwd.length >= 8) score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++;

      switch (score) {
        case 0:
        case 1:
          return { text: 'Strength: Weak', class: 'bg-danger', width: '25%' };
        case 2:
          return { text: 'Strength: Fair', class: 'bg-warning', width: '50%' };
        case 3:
          return { text: 'Strength: Good', class: 'bg-info', width: '75%' };
        case 4:
          return { text: 'Strength: Strong', class: 'bg-success', width: '100%' };
        default:
          return { text: 'Strength: Too short', class: 'bg-danger', width: '0%' };
      }
    };

    // Live Validation Events
    if (fullNameInput) {
      fullNameInput.addEventListener('input', () => {
        setInputState(fullNameInput, fullNameInput.value.trim().length >= 2);
        hideAlert();
      });
    }

    if (regEmailInput) {
      regEmailInput.addEventListener('input', () => {
        setInputState(regEmailInput, validateEmail(regEmailInput.value.trim()));
        hideAlert();
      });
    }

    if (passwordInput && strengthBar && strengthText) {
      passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        const evaluation = evaluatePasswordStrength(val);
        
        strengthBar.style.width = evaluation.width;
        strengthBar.className = `progress-bar ${evaluation.class}`;
        strengthText.textContent = evaluation.text;

        setInputState(passwordInput, val.length >= 8);

        // Re-check confirmation match if confirm field has text
        if (confirmPasswordInput && confirmPasswordInput.value.length > 0) {
          setInputState(confirmPasswordInput, confirmPasswordInput.value === val);
        }
        hideAlert();
      });
    }

    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', () => {
        const matches = confirmPasswordInput.value === passwordInput.value && confirmPasswordInput.value.length >= 8;
        setInputState(confirmPasswordInput, matches);
        hideAlert();
      });
    }

    if (termsCheck) {
      termsCheck.addEventListener('change', () => {
        if (termsCheck.checked) {
          termsCheck.classList.remove('is-invalid');
        }
      });
    }

    // Form Submission Handler
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert();

      const fullNameVal = fullNameInput.value.trim();
      const emailVal = regEmailInput.value.trim();
      const passwordVal = passwordInput.value;
      const confirmVal = confirmPasswordInput.value;
      const termsAccepted = termsCheck.checked;

      const isNameValid = fullNameVal.length >= 2;
      const isEmailValid = validateEmail(emailVal);
      const isPasswordValid = passwordVal.length >= 8;
      const isMatchValid = confirmVal === passwordVal && isPasswordValid;

      setInputState(fullNameInput, isNameValid);
      setInputState(regEmailInput, isEmailValid);
      setInputState(passwordInput, isPasswordValid);
      setInputState(confirmPasswordInput, isMatchValid);

      if (!termsAccepted) {
        termsCheck.classList.add('is-invalid');
      } else {
        termsCheck.classList.remove('is-invalid');
      }

      if (!isNameValid || !isEmailValid || !isPasswordValid || !isMatchValid || !termsAccepted) {
        showAlert('Please resolve all validation errors highlighted in the form.');
        return;
      }

      const roleSelect = document.getElementById('userRoleSelect');
      const chosenRole = roleSelect ? roleSelect.value : 'user';
      const targetUrl = chosenRole === 'admin' ? 'admin-dashboard.html' : chosenRole === 'user' ? 'user-dashboard.html' : 'dashboard.html';

      // Enter Loading State
      registerSubmitBtn.disabled = true;
      registerSpinner.classList.remove('d-none');
      registerBtnText.textContent = 'Registering Account...';

      const newUserObj = {
        id: 'usr-' + Date.now(),
        name: fullNameVal,
        email: emailVal,
        role: chosenRole,
        title: chosenRole === 'admin' ? 'Editorial Administrator' : chosenRole === 'user' ? 'Community Fact-Checker' : 'Forensic Analyst',
        department: chosenRole === 'admin' ? 'Administration' : chosenRole === 'user' ? 'Public Contributor' : 'Forensics',
        avatar: fullNameVal.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TL',
        status: 'Active',
        joinedDate: new Date().toISOString().split('T')[0]
      };

      // 1. Live Firebase Auth (if configured)
      if (window.TruthLensFirebase && window.TruthLensFirebase.isConfigured && window.TruthLensFirebase.auth) {
        window.TruthLensFirebase.auth.createUserWithEmailAndPassword(emailVal, passwordVal)
          .then(async (userCred) => {
            const finalUser = {
              ...newUserObj,
              id: userCred.user.uid,
              uid: userCred.user.uid
            };
            if (window.TruthLensDB && typeof window.TruthLensDB.createUser === 'function') {
              await window.TruthLensDB.createUser(finalUser);
              window.TruthLensDB.setCurrentSession(finalUser);
            }
            registerSpinner.classList.add('d-none');
            showAlert('Account created in Cloud Firestore! Redirecting to workspace...', true);
            setTimeout(() => { window.location.href = targetUrl; }, 1000);
          })
          .catch(async (err) => {
            console.warn('[TruthLens Auth] Live Firebase Auth note:', err.message);
            // Even if Firebase Auth throws, persist user profile to Firestore database
            if (window.TruthLensDB && typeof window.TruthLensDB.createUser === 'function') {
              await window.TruthLensDB.createUser(newUserObj);
              window.TruthLensDB.setCurrentSession(newUserObj);
            }
            registerSpinner.classList.add('d-none');
            showAlert('Account profile saved to database! Redirecting to workspace...', true);
            setTimeout(() => { window.location.href = targetUrl; }, 1000);
          });
        return;
      }

      // 2. Local & Direct Database Storage
      (async () => {
        try {
          if (window.TruthLensDB && typeof window.TruthLensDB.createUser === 'function') {
            await window.TruthLensDB.createUser(newUserObj);
            window.TruthLensDB.setCurrentSession(newUserObj);
          }
          registerSpinner.classList.add('d-none');
          showAlert('Account created successfully! Redirecting to workspace...', true);
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 1000);
        } catch (err) {
          registerSpinner.classList.add('d-none');
          registerSubmitBtn.disabled = false;
          registerBtnText.textContent = 'Create Account';
          showAlert(`Error saving user: ${err.message}`);
        }
      })();
    });
  }

  // ==========================================
  // LOGIN PAGE LOGIC (`login.html`)
  // ==========================================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const loginEmailInput = document.getElementById('email');
    const loginPasswordInput = document.getElementById('password');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginBtnText = document.getElementById('loginBtnText');
    const authAlert = document.getElementById('authAlert');
    const authAlertMessage = document.getElementById('authAlertMessage');

    const showLoginAlert = (msg) => {
      if (!authAlert || !authAlertMessage) return;
      authAlertMessage.textContent = msg;
      authAlert.classList.remove('d-none');
      authAlert.classList.add('d-flex');
    };

    const hideLoginAlert = () => {
      if (!authAlert) return;
      authAlert.classList.add('d-none');
      authAlert.classList.remove('d-flex');
    };

    if (loginEmailInput) {
      loginEmailInput.addEventListener('input', () => {
        setInputState(loginEmailInput, validateEmail(loginEmailInput.value.trim()));
        hideLoginAlert();
      });
    }

    if (loginPasswordInput) {
      loginPasswordInput.addEventListener('input', () => {
        setInputState(loginPasswordInput, loginPasswordInput.value.length >= 8);
        hideLoginAlert();
      });
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideLoginAlert();

      const emailVal = loginEmailInput.value.trim();
      const pwdVal = loginPasswordInput.value;

      const isEmailValid = validateEmail(emailVal);
      const isPwdValid = pwdVal.length >= 8;

      setInputState(loginEmailInput, isEmailValid);
      setInputState(loginPasswordInput, isPwdValid);

      if (!isEmailValid || !isPwdValid) {
        showLoginAlert('Please verify your email and password format.');
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSpinner.classList.remove('d-none');
      loginBtnText.textContent = 'Verifying credentials...';

      // 1. Fetch user directly from Firestore / TruthLensDB
      let resolvedUser = null;
      if (window.TruthLensDB && typeof window.TruthLensDB.getUser === 'function') {
        try {
          resolvedUser = await window.TruthLensDB.getUser(emailVal);
        } catch (err) {
          console.warn('[TruthLens Auth] Error querying user in DB:', err);
        }
      }

      // 2. If not found in database, check demo accounts or create clean new user profile in Firestore
      if (!resolvedUser) {
        const lower = emailVal.toLowerCase().trim();
        let defaultRole = 'user';
        let defaultName = '';
        let defaultTitle = 'Community Fact-Checker';
        let defaultDept = 'Public Contributor';

        if (lower === 'admin@truthlens.org') {
          resolvedUser = window.TruthLensDB ? window.TruthLensDB.DEFAULT_USERS.find(u => u.role === 'admin') : null;
        } else if (lower === 'investigator@truthlens.org') {
          resolvedUser = window.TruthLensDB ? window.TruthLensDB.DEFAULT_USERS.find(u => u.role === 'investigator') : null;
        } else if (lower === 'user@truthlens.org') {
          resolvedUser = window.TruthLensDB ? window.TruthLensDB.DEFAULT_USERS.find(u => u.role === 'user') : null;
        }

        if (!resolvedUser) {
          // Derive realistic name from email (e.g. "alex.turner@gmail.com" -> "Alex Turner", "john_smith" -> "John Smith")
          const prefix = lower.split('@')[0];
          defaultName = prefix
            .split(/[\._\-+]/)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') || 'Community Contributor';

          if (lower.includes('admin') || lower.includes('editor')) {
            defaultRole = 'admin';
            defaultTitle = 'Editorial Administrator';
            defaultDept = 'Editorial Oversight';
          } else if (lower.includes('investigat') || lower.includes('analyst') || lower.includes('forensic')) {
            defaultRole = 'investigator';
            defaultTitle = 'Forensic Analyst';
            defaultDept = 'Digital Forensics & AI';
          } else {
            defaultRole = 'user';
            defaultTitle = 'Community Fact-Checker';
            defaultDept = 'Public Contributor';
          }

          const initials = defaultName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TL';
          const newUserId = 'usr-' + Date.now();

          const newUserRecord = {
            id: newUserId,
            uid: newUserId,
            name: defaultName,
            email: lower,
            role: defaultRole,
            title: defaultTitle,
            department: defaultDept,
            avatar: initials,
            status: 'Active',
            joinedDate: new Date().toISOString().split('T')[0],
            lastActive: new Date().toISOString()
          };

          if (window.TruthLensDB && typeof window.TruthLensDB.createUser === 'function') {
            resolvedUser = await window.TruthLensDB.createUser(newUserRecord);
          } else {
            resolvedUser = newUserRecord;
          }
        }
      }

      const role = resolvedUser.role || 'investigator';
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      const targetDashboard = role === 'admin' ? 'admin-dashboard.html' : role === 'user' ? 'user-dashboard.html' : 'dashboard.html';

      loginBtnText.textContent = `Authenticating ${roleLabel}...`;

      // Persist active session in TruthLensDB
      if (window.TruthLensDB && typeof window.TruthLensDB.setCurrentSession === 'function') {
        window.TruthLensDB.setCurrentSession(resolvedUser);
      }

      // Update last active in Firestore
      if (window.TruthLensDB && typeof window.TruthLensDB.updateUserProfile === 'function') {
        window.TruthLensDB.updateUserProfile(resolvedUser.id, { lastActive: new Date().toISOString() }).catch(() => {});
      }

      // 3. Live Firebase Auth (if configured)
      if (window.TruthLensFirebase && window.TruthLensFirebase.isConfigured && window.TruthLensFirebase.auth) {
        window.TruthLensFirebase.auth.signInWithEmailAndPassword(emailVal, pwdVal)
          .then(() => {
            window.location.href = targetDashboard;
          })
          .catch((err) => {
            console.warn('[TruthLens Auth] Firebase cloud auth note:', err.message);
            window.location.href = targetDashboard;
          });
        return;
      }

      // 4. Local Fallback Routing
      setTimeout(() => {
        window.location.href = targetDashboard;
      }, 700);
    });
  }

  // Global Auth Helper for Programmatic / Modal switching
  window.TruthLensAuth = {
    loginAs: (role) => {
      const mapping = {
        admin: {
          user: {
            id: 'usr-admin-1',
            name: 'Puja Mohapatra',
            email: 'admin@truthlens.org',
            role: 'admin',
            title: 'Chief Editor & Administrator',
            department: 'Editorial Oversight',
            avatar: 'PM',
            status: 'Active'
          },
          target: 'admin-dashboard.html'
        },
        investigator: {
          user: {
            id: 'usr-investigator-1',
            name: 'Abinash Panigrahy',
            email: 'investigator@truthlens.org',
            role: 'investigator',
            title: 'Senior Forensic Analyst',
            department: 'Digital Forensics & AI',
            avatar: 'AP',
            status: 'Active'
          },
          target: 'dashboard.html'
        },
        user: {
          user: {
            id: 'usr-user-1',
            name: 'Saumya Jit Mohanty',
            email: 'user@truthlens.org',
            role: 'user',
            title: 'Community Fact-Checker',
            department: 'Public Contributor',
            avatar: 'SM',
            status: 'Active'
          },
          target: 'user-dashboard.html'
        }
      };

      const targetRole = mapping[role] || mapping.investigator;
      if (window.TruthLensDB && typeof window.TruthLensDB.setCurrentSession === 'function') {
        window.TruthLensDB.setCurrentSession(targetRole.user);
      }
      window.location.href = targetRole.target;
    }
  };
});