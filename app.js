(() => {
  'use strict';
  const loginScreen = document.getElementById('loginScreen');
  const appShell = document.getElementById('appShell');
  const loginForm = document.getElementById('loginForm');
  let activeUser = null;
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('loginName').value.trim();
    const nik = document.getElementById('loginNik').value.trim();
    const age = Number(document.getElementById('loginAge').value);
    const error = document.getElementById('loginError');
    if (!name || !/^[0-9]{16}$/.test(nik) || !Number.isInteger(age) || age < 1 || age > 120 || !document.getElementById('loginConsent').checked) {
      error.textContent = 'Please enter a name, a valid 16-digit NIK, an age from 1 to 120, and confirm the checkbox.'; return;
    }
    // NIK is validated in memory only: never write it to localStorage, sessionStorage, or logs.
    activeUser = { name, age };
    document.getElementById('accountName').textContent = name;
    document.getElementById('accountName').title = `${name} · ${age}`;
    loginScreen.hidden = true; appShell.classList.add('authenticated');
    if (voiceEnabled) setTimeout(speakWelcome, 500);
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    activeUser = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    appShell.classList.remove('authenticated'); loginScreen.hidden = false; loginForm.reset();
    document.getElementById('loginName').focus();
  });
  const STORAGE = { aspirations: 'suara_aspirations_v1', reviews: 'suara_reviews_v1', theme: 'suara_theme_v1', voice: 'suara_voice_v1' };
  const titles = { dashboard: 'Dashboard', kebijakan: 'Policy Proposals', aspirasi: 'Public Voices', review: 'Draft Review', tracking: 'Public Tracking' };
  const pages = [...document.querySelectorAll('.page')];
  const navButtons = [...document.querySelectorAll('[data-page]')];
  const toast = document.getElementById('toast');
  let toastTimer;
  let installPrompt = null;

  function showToast(message) {
    document.getElementById('toastText').textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  function openPage(id) {
    if (!titles[id]) return;
    pages.forEach(page => page.classList.toggle('active', page.id === id));
    navButtons.forEach(btn => {
      const active = btn.dataset.page === id;
      btn.classList.toggle('active', active);
      if (btn.hasAttribute('aria-current')) { if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current'); }
      if (btn.classList.contains('nav-btn')) {
        if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
      }
    });
    document.getElementById('pageTitle').textContent = titles[id];
    history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  navButtons.forEach(btn => btn.addEventListener('click', () => openPage(btn.dataset.page)));
  document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => openPage(btn.dataset.go)));
  const initialPage = location.hash.slice(1);
  if (titles[initialPage]) openPage(initialPage);

  const stages = [
    ['Policy Registration', 'A policy proposal is registered and its initial information is published so the public can understand the issue being addressed.'],
    ['Public Impact Mapping', 'Potentially affected communities, relevant issues, and public needs are identified.'],
    ['Public Consultation', 'Members of the public submit views, criticism, and suggestions on the policy proposal.'],
    ['AI-Based Analysis', 'Public input is grouped and analyzed as supporting material. The results must still be reviewed by people.'],
    ['Legislative Response', 'The policy-making institution reviews public input and provides a response.'],
    ['Public Review & Validation', 'The revised draft is presented to the public again so people can assess whether their input has been considered.'],
    ['Policy Enactment', 'After review and validation, the proposal proceeds to enactment in accordance with the applicable authority and legal procedures.'],
    ['Public Tracking', 'The public can follow the proposal’s progress, status, and follow-up information.']
  ];
  const stageButtons = [...document.querySelectorAll('.stage')];
  function selectStage(index) {
    stageButtons.forEach((button, i) => {
      button.classList.toggle('selected', i === index);
      button.setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
    document.getElementById('stageTitle').textContent = stages[index][0];
    document.getElementById('stageText').textContent = stages[index][1];
    document.getElementById('stageDetail').classList.add('show');
  }
  stageButtons.forEach(button => button.addEventListener('click', () => selectStage(Number(button.dataset.stage))));

  function readStore(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch (error) { console.warn('Could not read local storage:', error); return []; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { console.error('Local storage failed:', error); showToast('Could not save. Check your browser storage.'); return false; }
  }
  function escapeText(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function formatDate(value) {
    try { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
    catch { return new Date(value).toLocaleString('en-US'); }
  }
  function renderEntries(containerId, entries, type) {
    const container = document.getElementById(containerId);
    if (!entries.length) { container.innerHTML = '<p class="panel-subtitle">No data saved on this device yet.</p>'; return; }
    container.innerHTML = entries.slice().reverse().map(item => {
      const heading = type === 'aspiration' ? item.judul : item.penilaian;
      const detail = type === 'aspiration' ? item.isi : (item.catatan || 'No additional comments.');
      const meta = type === 'aspiration' ? `${item.topik} · ${item.nama || 'Anonymous'}` : 'Local review';
      return `<article class="entry-card"><div class="entry-top"><div><h4>${escapeText(heading)}</h4><div class="entry-meta">${escapeText(meta)} · ${escapeText(formatDate(item.date))}</div></div><button class="delete-btn" type="button" data-delete="${escapeText(item.id)}" data-kind="${type}">Delete</button></div><p>${escapeText(detail)}</p></article>`;
    }).join('');
  }
  function refreshHistories() {
    renderEntries('aspirationHistory', readStore(STORAGE.aspirations), 'aspiration');
    renderEntries('reviewHistory', readStore(STORAGE.reviews), 'review');
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;
    const isAspiration = button.dataset.kind === 'aspiration';
    const key = isAspiration ? STORAGE.aspirations : STORAGE.reviews;
    const next = readStore(key).filter(item => item.id !== button.dataset.delete);
    if (writeStore(key, next)) { refreshHistories(); showToast('Data deleted from this device.'); }
  });

  const aspirationForm = document.getElementById('aspirationForm');
  const aspirationText = document.getElementById('isi');
  aspirationText.addEventListener('input', () => { document.getElementById('charCount').textContent = `${aspirationText.value.length.toLocaleString('en-US')} / 2,000`; });
  aspirationForm.addEventListener('reset', () => setTimeout(() => { document.getElementById('charCount').textContent = '0 / 2,000'; }, 0));
  aspirationForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!aspirationForm.reportValidity()) return;
    const entry = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      date: new Date().toISOString(),
      nama: document.getElementById('nama').value.trim(),
      topik: document.getElementById('topik').value,
      judul: document.getElementById('judulVoice').value.trim(),
      isi: aspirationText.value.trim()
    };
    const entries = readStore(STORAGE.aspirations);
    entries.push(entry);
    if (writeStore(STORAGE.aspirations, entries)) {
      aspirationForm.reset();
      refreshHistories();
      showToast('Your input has been saved on this device.');
    }
  });

  document.getElementById('reviewForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const entry = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      date: new Date().toISOString(),
      penilaian: document.getElementById('penilaian').value,
      catatan: document.getElementById('catatan').value.trim()
    };
    const entries = readStore(STORAGE.reviews);
    entries.push(entry);
    if (writeStore(STORAGE.reviews, entries)) {
      form.reset();
      refreshHistories();
      showToast('Your review has been saved on this device.');
    }
  });
  refreshHistories();

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE.theme, theme);
    const icon = document.getElementById('themeIcon');
    icon.innerHTML = theme === 'dark'
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
      : '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>';
  }

  // Welcome audio plays after sign-in and can be disabled using the speaker button.
  const voiceButton = document.getElementById('voiceToggle');
  const voiceIcon = document.getElementById('voiceIcon');
  let voiceEnabled = localStorage.getItem(STORAGE.voice) !== 'off';
  let greetingStarted = false;
  function updateVoiceControl() {
    voiceIcon.innerHTML = voiceEnabled
      ? '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/>'
      : '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m17 9 5 6m0-6-5 6"/>';
    voiceButton.setAttribute('aria-label', voiceEnabled ? 'Turn off welcome audio' : 'Turn on welcome audio');
    voiceButton.title = voiceEnabled ? 'Welcome audio is on · Tap to turn off' : 'Welcome audio is off';
  }
  function speakWelcome() {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Welcome. Share your voice.');
      utterance.lang = 'en-US'; utterance.rate = 0.92; utterance.pitch = 1;
      utterance.onstart = () => { greetingStarted = true; };
      utterance.onerror = event => { greetingStarted = false; if (event.error === 'not-allowed') showToast('Tap the speaker icon to play the welcome message.'); };
      const enVoice = window.speechSynthesis.getVoices().find(v => /^en(-|_)?/i.test(v.lang));
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    } catch (error) { console.warn('Welcome audio could not be played:', error); }
  }
  updateVoiceControl();
  if (!('speechSynthesis' in window)) voiceButton.hidden = true;
  
  voiceButton.addEventListener('click', () => {
    if (voiceEnabled && !greetingStarted) { speakWelcome(); showToast('Playing the SUARA welcome message.'); return; }
    voiceEnabled = !voiceEnabled;
    localStorage.setItem(STORAGE.voice, voiceEnabled ? 'on' : 'off');
    updateVoiceControl();
    if (voiceEnabled) { speakWelcome(); showToast('Welcome audio enabled.'); }
    else { window.speechSynthesis.cancel(); showToast('Welcome audio disabled.'); }
  });

  const storedTheme = localStorage.getItem(STORAGE.theme) || 'dark';
  applyTheme(storedTheme === 'light' ? 'light' : 'dark');
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    showToast(`${next === 'dark' ? 'Dark' : 'Light'} theme enabled.`);
  });

  function updateNetwork() {
    const offline = !navigator.onLine;
    const pill = document.getElementById('networkStatus');
    pill.classList.toggle('offline', offline);
    pill.title = offline ? 'No internet connection. Offline features remain available after the app has loaded.' : 'Device is connected to the internet.';
    document.getElementById('networkText').textContent = offline ? 'Offline' : 'Online';
  }
  window.addEventListener('online', updateNetwork);
  window.addEventListener('offline', updateNetwork);
  updateNetwork();

  const installButton = document.getElementById('installBtn');
  const installHelp = document.getElementById('installHelp');
  function isInstalledApp() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
  function syncInstallButton() { installButton.classList.toggle('visible', !isInstalledApp()); }
  function openInstallHelp() { installHelp.classList.add('show'); installHelp.setAttribute('aria-hidden','false'); document.getElementById('doneInstallHelp').focus(); }
  function closeInstallHelp() { installHelp.classList.remove('show'); installHelp.setAttribute('aria-hidden','true'); installButton.focus(); }
  syncInstallButton();
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; syncInstallButton(); });
  installButton.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') showToast('SUARA is being installed.');
      installPrompt = null; syncInstallButton(); return;
    }
    openInstallHelp();
  });
  document.getElementById('closeInstallHelp').addEventListener('click', closeInstallHelp);
  document.getElementById('doneInstallHelp').addEventListener('click', closeInstallHelp);
  installHelp.addEventListener('click', event => { if (event.target === installHelp) closeInstallHelp(); });
  window.addEventListener('appinstalled', () => { syncInstallButton(); showToast('SUARA has been installed.'); });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(registration => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('A SUARA update is available. Reload to use the latest version.');
          });
        });
      }).catch(error => console.error('Service worker registration failed:', error));
    });
  }
})();
