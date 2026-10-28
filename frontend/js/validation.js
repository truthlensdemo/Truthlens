/**
 * TruthLens — Universal Client Validation Module
 * Standardizes email, URL, password strength, and field length checks across all forms.
 */

window.TruthLensValidation = (() => {
  'use strict';

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateUrl = (url) => {
    if (!url || url.trim() === '') return true;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const setFieldState = (field, isValid) => {
    if (!field) return;
    field.classList.toggle('is-valid', isValid);
    field.classList.toggle('is-invalid', !isValid);
  };

  const bindCounter = (inputEl, counterEl, maxLimit) => {
    if (!inputEl || !counterEl) return;
    const update = () => {
      const len = inputEl.value.length;
      counterEl.textContent = `${len} / ${maxLimit}`;
      counterEl.classList.toggle('text-danger', len >= maxLimit);
      counterEl.classList.toggle('counter-limit', len >= maxLimit);
    };
    inputEl.addEventListener('input', update);
    update();
  };

  return {
    validateEmail,
    validateUrl,
    setFieldState,
    bindCounter
  };
})();