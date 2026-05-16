// AI Assistant Pro - Options Script
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  const { geminiApiKey, theme } = await chrome.storage.sync.get(['geminiApiKey', 'theme']);
  
  document.getElementById('apiKey').value = geminiApiKey || '';
  
  setupEventListeners();
  updateThemeButtons(theme || 'light');
}

function setupEventListeners() {
  document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
  document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('showPrivacy').addEventListener('click', showPrivacy);
  
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });
}

async function saveApiKey() {
  const apiKey = document.getElementById('apiKey').value.trim();
  await chrome.storage.sync.set({ geminiApiKey: apiKey });
  showStatus('API key saved successfully');
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('apiKey');
  const btn = document.getElementById('toggleApiKey');
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.94 9.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  }
}

async function clearHistory() {
  if (confirm('Are you sure you want to clear your conversation history?')) {
    await chrome.storage.local.set({ history: [] });
    showStatus('History cleared');
  }
}

async function resetSettings() {
  if (confirm('This will reset all settings. Continue?')) {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    document.getElementById('apiKey').value = '';
    await chrome.storage.sync.set({ theme: 'light', hasSeenOnboarding: false });
    showStatus('Settings reset');
  }
}

async function setTheme(theme) {
  await chrome.storage.sync.set({ theme });
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButtons(theme);
  showStatus('Theme updated');
}

function updateThemeButtons(activeTheme) {
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === activeTheme);
  });
}

function showPrivacy(e) {
  e.preventDefault();
  alert('AI Assistant Pro does not collect any personal data. Your API key is stored locally on your device. Conversation history is stored only in your browser\'s local storage.');
}

function showStatus(message) {
  const status = document.getElementById('statusMessage');
  status.textContent = message;
  status.classList.add('show');
  setTimeout(() => status.classList.remove('show'), 2000);
}