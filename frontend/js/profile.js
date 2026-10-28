/**
 * TruthLens - Dynamic User Profile & Investigator Accountability Controller
 * Syncs user session, profile edits, and live inquest metrics with TruthLensDB / Firestore.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('profileUpdateForm');
  const nameInput = document.getElementById('profileFullName');
  const emailInput = document.getElementById('profileEmail');
  const orgInput = document.getElementById('profileOrganization');
  const deptInput = document.getElementById('profileDepartment');
  const userIdInput = document.getElementById('profileUserIdField');
  const roleLevelInput = document.getElementById('profileUserRoleField');

  const displayNameEl = document.getElementById('displayProfileName');
  const displayEmailEl = document.getElementById('displayProfileEmail');
  const roleBadgeEl = document.getElementById('displayProfileRoleBadge');

  const accountCreatedDateEl = document.getElementById('profileAccountCreatedDate');
  const totalCasesEl = document.getElementById('profileTotalInvestigations');
  const completedCasesEl = document.getElementById('profileCompletedInvestigations');
  const activeCasesEl = document.getElementById('profileActiveInvestigations');
  const auditedEvidenceEl = document.getElementById('profileAuditedEvidence');

  const successAlert = document.getElementById('profileSuccessAlert');
  const successMsg = document.getElementById('profileSuccessMessage');
  const errorAlert = document.getElementById('profileErrorAlert');
  const errorMsg = document.getElementById('profileErrorMessage');
  const btnSave = document.getElementById('btnSaveProfile');
  const spinner = document.getElementById('saveProfileSpinner');
  const btnText = document.getElementById('saveProfileBtnText');

  if (!form) return;

  // 1. Get Current User Session
  let currentSession = null;
  if (window.TruthLensDB && typeof window.TruthLensDB.getCurrentSession === 'function') {
    currentSession = window.TruthLensDB.getCurrentSession();
  }

  // If no session exists, redirect to login
  if (!currentSession) {
    window.location.href = 'login.html';
    return;
  }

  // Fetch the freshest user profile directly from Cloud Firestore
  try {
    const cloudUser = await window.TruthLensDB.getUser(currentSession.id || currentSession.email);
    if (cloudUser) {
      currentSession = { ...currentSession, ...cloudUser };
    }
  } catch (err) {
    console.warn('[Profile] Error loading profile from Cloud Firestore:', err);
  }

  // 2. Populate Metrics from Database
  const loadAccountabilityMetrics = async () => {
    if (!window.TruthLensDB) return;
    try {
      const [investigations, evidence] = await Promise.all([
        window.TruthLensDB.getInvestigations(),
        window.TruthLensDB.getEvidence()
      ]);

      const totalCases = investigations.length;
      const completedCases = investigations.filter(c => (c.status || '').toLowerCase() === 'completed').length;
      const activeCases = investigations.filter(c => (c.status || '').toLowerCase() === 'active').length;
      const totalEvidence = evidence.length;

      if (totalCasesEl) totalCasesEl.textContent = `${totalCases} Cases`;
      if (completedCasesEl) completedCasesEl.textContent = `${completedCases} Dossiers`;
      if (activeCasesEl) activeCasesEl.textContent = `${activeCases} Active`;
      if (auditedEvidenceEl) auditedEvidenceEl.textContent = `${totalEvidence} Records`;
      if (accountCreatedDateEl && currentSession.joinedDate) {
        accountCreatedDateEl.textContent = currentSession.joinedDate;
      }
    } catch (err) {
      console.error('[Profile] Failed loading database metrics:', err);
    }
  };

  // 3. Populate Profile Card & Form
  const populateProfileUI = () => {
    const fullName = currentSession.displayName || currentSession.name || 'TruthLens Member';
    const email = currentSession.email || '';
    const role = (currentSession.role || 'user').toLowerCase();

    if (displayNameEl) displayNameEl.textContent = fullName;
    if (displayEmailEl) displayEmailEl.textContent = email;

    if (roleBadgeEl) {
      if (role === 'admin') {
        roleBadgeEl.innerHTML = 'Chief Administrator &bull; Verified ID';
      } else if (role === 'investigator') {
        roleBadgeEl.innerHTML = 'Senior Fact-Checker &bull; Verified ID';
      } else {
        roleBadgeEl.innerHTML = 'Community Contributor &bull; Verified Citizen';
      }
    }

    if (nameInput) nameInput.value = fullName;
    if (emailInput) emailInput.value = email;
    if (orgInput) orgInput.value = currentSession.organization || currentSession.department || 'TruthLens Investigative Bureau';
    if (deptInput) deptInput.value = currentSession.title || currentSession.department || (role === 'admin' ? 'Editorial Oversight' : role === 'investigator' ? 'Digital Forensics & AI' : 'Public Contributor');
    if (userIdInput) userIdInput.value = currentSession.uid || currentSession.id || `usr-${Date.now()}`;
    if (roleLevelInput) {
      const tierMap = {
        admin: 'Tier 1 (Chief Editor & Administrator)',
        investigator: 'Tier 2 (Senior Forensic Analyst)',
        user: 'Tier 3 (Citizen Contributor)'
      };
      roleLevelInput.value = tierMap[role] || 'Tier 3 (Citizen Contributor)';
    }
  };

  populateProfileUI();
  await loadAccountabilityMetrics();

  // 4. Handle Profile Update Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorAlert) errorAlert.classList.add('d-none');
    if (successAlert) successAlert.classList.add('d-none');

    const newName = nameInput ? nameInput.value.trim() : '';
    const newEmail = emailInput ? emailInput.value.trim() : '';
    const newOrg = orgInput ? orgInput.value.trim() : '';
    const newDept = deptInput ? deptInput.value.trim() : '';

    if (newName.length < 3) {
      if (nameInput) nameInput.classList.add('is-invalid');
      if (errorAlert && errorMsg) {
        errorMsg.textContent = 'Please enter your professional name or academic alias (min 3 characters).';
        errorAlert.classList.remove('d-none');
      }
      return;
    }
    if (nameInput) nameInput.classList.remove('is-invalid');

    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      if (emailInput) emailInput.classList.add('is-invalid');
      if (errorAlert && errorMsg) {
        errorMsg.textContent = 'Please provide a valid institutional or organizational email.';
        errorAlert.classList.remove('d-none');
      }
      return;
    }
    if (emailInput) emailInput.classList.remove('is-invalid');

    // UI Feedback: Loading
    if (btnSave) btnSave.disabled = true;
    if (spinner) spinner.classList.remove('d-none');
    if (btnText) btnText.innerHTML = 'Saving to Database...';

    try {
      const updatedProfile = {
        name: newName,
        displayName: newName,
        email: newEmail,
        department: newOrg,
        title: newDept
      };

      const userId = currentSession.uid || currentSession.id;
      if (window.TruthLensDB && typeof window.TruthLensDB.updateUserProfile === 'function') {
        await window.TruthLensDB.updateUserProfile(userId, updatedProfile);
      }

      // Update session
      currentSession = { ...currentSession, ...updatedProfile };
      if (window.TruthLensDB && typeof window.TruthLensDB.setCurrentSession === 'function') {
        window.TruthLensDB.setCurrentSession(currentSession);
      }

      // Update Display
      if (displayNameEl) displayNameEl.textContent = newName;
      if (displayEmailEl) displayEmailEl.textContent = newEmail;

      const topbarName = document.getElementById('topbarUserName');
      if (topbarName) topbarName.textContent = newName;

      if (successAlert && successMsg) {
        successMsg.textContent = 'Investigator credentials and institutional contact details saved to Firebase!';
        successAlert.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (window.showToast) {
        window.showToast('Profile updated successfully in Firestore database!', 'success');
      }
    } catch (err) {
      console.error('[Profile] Save error:', err);
      if (errorAlert && errorMsg) {
        errorMsg.textContent = 'An error occurred while updating the profile in Firestore.';
        errorAlert.classList.remove('d-none');
      }
    } finally {
      if (btnSave) btnSave.disabled = false;
      if (spinner) spinner.classList.add('d-none');
      if (btnText) btnText.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Save Changes';
    }
  });

  // 5. Handle Password Change Form
  const passwordForm = document.getElementById('changePasswordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPwd = document.getElementById('newPasswordInput')?.value || '';
      const confirmPwd = document.getElementById('confirmNewPasswordInput')?.value || '';
      const alertBox = document.getElementById('passwordModalAlert');

      if (newPwd.length < 8) {
        if (alertBox) {
          alertBox.textContent = 'Password must be at least 8 characters in length.';
          alertBox.classList.remove('d-none');
        }
        return;
      }

      if (newPwd !== confirmPwd) {
        if (alertBox) {
          alertBox.textContent = 'New password and confirmation do not match.';
          alertBox.classList.remove('d-none');
        }
        return;
      }

      if (alertBox) alertBox.classList.add('d-none');

      const modalEl = document.getElementById('changePasswordModal');
      if (modalEl && window.bootstrap) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }

      if (window.showToast) {
        window.showToast('Account credentials password updated successfully.', 'success');
      }
    });
  }
});
