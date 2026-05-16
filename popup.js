// AI Assistant Pro - Popup Script
let apiKey = null;
let selectedText = '';
let conversationHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  setupEventListeners();
});

async function initialize() {
  const { geminiApiKey, theme, hasSeenOnboarding } = await chrome.storage.sync.get(['geminiApiKey', 'theme', 'hasSeenOnboarding']);
  apiKey = geminiApiKey || null;
  
  // Set theme
  const savedTheme = theme || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('themeToggle').innerHTML = savedTheme === 'dark' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  // Show/hide onboarding
  if (!hasSeenOnboarding) {
    document.getElementById('onboarding').style.display = 'flex';
  }

  // Check API key
  updateApiWarning();

  // Load history
  await loadHistory();

  // Get selected text from content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
      if (response?.selectedText) {
        selectedText = response.selectedText;
        updateSelectionInfo();
      }
    } catch (e) {
      // Content script may not be ready yet
    }
  }
}

function setupEventListeners() {
  document.getElementById('sendBtn').addEventListener('click', handleSend);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('copyBtn').addEventListener('click', copyResponse);
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
  document.getElementById('dismissOnboarding').addEventListener('click', dismissOnboarding);
  document.getElementById('openSettings').addEventListener('click', openSettings);
  
  document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-expand textarea
  const textarea = document.getElementById('userInput');
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  });
}

function updateSelectionInfo() {
  const info = document.getElementById('selectionInfo');
  const span = info.querySelector('span');
  if (selectedText) {
    span.textContent = selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : '');
    info.classList.add('active');
  } else {
    info.classList.remove('active');
  }
}

async function handleSend() {
  const userInput = document.getElementById('userInput').value.trim();
  const actionType = document.getElementById('actionType').value;
  
  if (!userInput && !selectedText) return;
  if (!apiKey) {
    openSettings();
    return;
  }

  const question = formatQuestion(userInput, actionType);
  showLoading(true);
  
  try {
    const response = await callGeminiAPI(question);
    displayResponse(response);
    saveToHistory(actionType, question, response);
  } catch (error) {
    displayError(error.message);
  }
  
  showLoading(false);
}

function formatQuestion(input, action) {
  const context = selectedText ? `\n\nSelected text: "${selectedText}"` : '';
  
  switch (action) {
    case 'summarize':
      return `Summarize the following text professionally:${context}\n${input || selectedText || ''}`;
    case 'rewrite':
      return `Rewrite the following text professionally and clearly:${context}\n${input || selectedText || ''}`;
    case 'translate':
      return `Translate the following text to English:${context}\n${input || selectedText || ''}`;
    case 'email':
      return `Generate a professional email reply to the following:${context}\n${input || selectedText || ''}`;
    default:
      return `${input}${context}`;
  }
}

async function callGeminiAPI(prompt) {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: sanitizeInput(prompt) }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  
  throw lastError;
}

function sanitizeInput(text) {
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

function displayResponse(text) {
  const responseSection = document.getElementById('responseSection');
  const responseContent = document.getElementById('responseContent');
  
  responseContent.textContent = text;
  responseSection.classList.add('active');
  
  // Auto-scroll to response
  responseSection.scrollIntoView({ behavior: 'smooth' });
}

function displayError(message) {
  const responseSection = document.getElementById('responseSection');
  const responseContent = document.getElementById('responseContent');
  
  responseContent.innerHTML = `<span style="color: var(--error)">Error: ${escapeHtml(message)}</span>`;
  responseSection.classList.add('active');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  loading.style.display = show ? 'flex' : 'none';
  document.getElementById('sendBtn').disabled = show;
}

async function copyResponse() {
  const response = document.getElementById('responseContent').textContent;
  try {
    await navigator.clipboard.writeText(response);
    const btn = document.getElementById('copyBtn');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    setTimeout(() => {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    }, 2000);
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  await chrome.storage.sync.set({ theme: newTheme });
  document.getElementById('themeToggle').innerHTML = newTheme === 'dark'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

async function loadHistory() {
  const { history } = await chrome.storage.local.get(['history']);
  conversationHistory = history || [];
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = conversationHistory.slice(-5).reverse().map(item => `
    <div class="history-item" data-question="${escapeHtml(item.question)}">
      <div class="action">${item.action}</div>
      <div class="question">${escapeHtml(item.question.substring(0, 60))}${item.question.length > 60 ? '...' : ''}</div>
    </div>
  `).join('');

  list.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('userInput').value = item.dataset.question;
      handleSend();
    });
  });
}

async function saveToHistory(action, question, response) {
  conversationHistory.push({ action, question, response, timestamp: Date.now() });
  conversationHistory = conversationHistory.slice(-50); // Keep last 50
  await chrome.storage.local.set({ history: conversationHistory });
  renderHistory();
}

async function clearHistory() {
  conversationHistory = [];
  await chrome.storage.local.set({ history: [] });
  renderHistory();
}

async function dismissOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  await chrome.storage.sync.set({ hasSeenOnboarding: true });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

function updateApiWarning() {
  document.getElementById('apiWarning').style.display = apiKey ? 'none' : 'flex';
}