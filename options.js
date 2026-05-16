// AI Assistant Pro - Options Script
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  const data = await chrome.storage.sync.get([
    'groqApiKey', 'openrouterApiKey', 'nvidiaApiKey', 'geminiApiKey', 'openaiApiKey', 'anthropicApiKey', 'poolsideApiKey'
  ]);
  
  document.getElementById('groqApiKey').value = data.groqApiKey || '';
  document.getElementById('openrouterApiKey').value = data.openrouterApiKey || '';
  document.getElementById('nvidiaApiKey').value = data.nvidiaApiKey || '';
  document.getElementById('geminiApiKey').value = data.geminiApiKey || '';
  document.getElementById('openaiApiKey').value = data.openaiApiKey || '';
  document.getElementById('anthropicApiKey').value = data.anthropicApiKey || '';
  document.getElementById('poolsideApiKey').value = data.poolsideApiKey || '';
  
  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById('saveApiKeys').addEventListener('click', saveApiKeys);
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
  document.getElementById('showPrivacy').addEventListener('click', (e) => {
    e.preventDefault();
    alert('AI Assistant Pro does not collect any personal data. Your API keys are stored locally on your device.');
  });
  
  // Toggle visibility buttons
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', toggleKeyVisibility);
  });
}

async function saveApiKeys() {
  const apiKeys = {
    groqApiKey: document.getElementById('groqApiKey').value.trim(),
    openrouterApiKey: document.getElementById('openrouterApiKey').value.trim(),
    nvidiaApiKey: document.getElementById('nvidiaApiKey').value.trim(),
    geminiApiKey: document.getElementById('geminiApiKey').value.trim(),
    openaiApiKey: document.getElementById('openaiApiKey').value.trim(),
    anthropicApiKey: document.getElementById('anthropicApiKey').value.trim(),
    poolsideApiKey: document.getElementById('poolsideApiKey').value.trim()
  };
  
  await chrome.storage.sync.set(apiKeys);
  showStatus('API keys saved successfully!');
}

async function clearHistory() {
  if (confirm('Are you sure you want to clear your conversation history?')) {
    await chrome.storage.local.set({ history: [] });
    showStatus('History cleared');
  }
}

function toggleKeyVisibility(e) {
  const targetId = e.currentTarget.dataset.target;
  const input = document.getElementById(targetId);
  
  if (input.type === 'password') {
    input.type = 'text';
    e.currentTarget.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.94 9.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>`;
  } else {
    input.type = 'password';
    e.currentTarget.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  }
}

function showStatus(message) {
  const status = document.getElementById('statusMessage');
  status.textContent = message;
  status.classList.add('show');
  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}