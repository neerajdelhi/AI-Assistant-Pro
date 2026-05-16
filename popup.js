// AI Assistant Pro - Popup Script (Multi-Provider)
let selectedText = '';
let conversationHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  setupEventListeners();
});

async function initialize() {
  const { theme, hasSeenOnboarding } = await chrome.storage.sync.get(['theme', 'hasSeenOnboarding']);
  
  const savedTheme = theme || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  if (!hasSeenOnboarding) {
    document.getElementById('onboarding').style.display = 'flex';
  }
  
  detectProviders();
}

function setupEventListeners() {
  document.getElementById('sendBtn').addEventListener('click', handleSend);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('copyBtn').addEventListener('click', copyResponse);
  document.getElementById('dismissOnboarding').addEventListener('click', dismissOnboarding);
  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('openSettingsHeader').addEventListener('click', openSettings);
  document.getElementById('providerSelect').addEventListener('change', saveProviderPreference);
  
  document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}

async function detectProviders() {
  const status = {};
  
  try {
    const res = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
    status.ollama = res.ok ? 'ok' : 'error';
  } catch { status.ollama = 'offline'; }
  
  try {
    const res = await fetch('http://localhost:1234/v1/models', { method: 'GET' });
    status.lmstudio = res.ok ? 'ok' : 'error';
  } catch { status.lmstudio = 'offline'; }
  
  const statusEl = document.getElementById('providerStatus');
  if (status.ollama === 'ok') {
    statusEl.innerHTML = '<span class="local-ok">● Ollama Connected</span>';
  } else if (status.lmstudio === 'ok') {
    statusEl.innerHTML = '<span class="local-ok">● LM Studio Connected</span>';
  } else {
    statusEl.innerHTML = '<span class="local-offline">● Local AI Offline</span>';
  }
}

async function handleSend() {
  const userInput = document.getElementById('userInput').value.trim();
  const actionType = document.getElementById('actionType').value;
  const provider = document.getElementById('providerSelect').value;
  
  if (!userInput && !selectedText) return;
  
const apiKeys = await chrome.storage.sync.get(['groqApiKey', 'openrouterApiKey', 'nvidiaApiKey', 'geminiApiKey', 'openaiApiKey', 'anthropicApiKey', 'poolsideApiKey']);
   const keys = {
     groq: apiKeys.groqApiKey,
     openrouter: apiKeys.openrouterApiKey,
     nvidia: apiKeys.nvidiaApiKey,
     gemini: apiKeys.geminiApiKey,
     openai: apiKeys.openaiApiKey,
     anthropic: apiKeys.anthropicApiKey,
     poolside: apiKeys.poolsideApiKey
   };
  
  const hasValidKey = Object.values(keys).some(k => k);
  if (!hasValidKey && provider !== 'ollama' && provider !== 'lmstudio') {
    openSettings();
    return;
  }
  
  const question = formatQuestion(userInput, actionType);
  showLoading(true);
  
  try {
    const response = await callAI(question, provider, keys);
    displayResponse(response, provider);
  } catch (error) {
    displayError(error.message);
  }
  
  showLoading(false);
}

async function callAI(prompt, provider, keys) {
  let lastError = null;
  
  // Try local providers first
  if (provider === 'ollama' || provider === 'auto') {
    try {
      return await callOllama(prompt);
    } catch (e) { lastError = e; }
  }
  
  if (provider === 'lmstudio' || provider === 'auto') {
    try {
      return await callLMStudio(prompt);
    } catch (e) { lastError = e; }
  }
  
  // Try cloud providers
  const providerOrder = getProviderOrder(provider);
  for (const prov of providerOrder) {
    if (!keys[prov]) continue;
    try {
      return await callCloudAPI(prompt, prov, keys[prov]);
    } catch (e) { lastError = e; }
  }
  
  throw lastError || new Error('All providers failed');
}

function getProviderOrder(preferred) {
  if (preferred === 'auto') {
    return ['groq', 'openrouter', 'nvidia', 'gemini', 'openai', 'anthropic', 'poolside'];
  }
  return [preferred];
}

async function callCloudAPI(prompt, provider, apiKey) {
  let url, body, headers;
  
  switch (provider) {
    case 'groq':
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
      break;
    case 'openrouter':
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model: 'meta-llama/llama-3-8b-instruct:free', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
      break;
    case 'nvidia':
      url = 'https://integrate.api.nvidia.com/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model: 'nvidia/nemotron-4-340b-reward', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
      break;
    case 'gemini':
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } };
      break;
    case 'openai':
      url = 'https://api.openai.com/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
      break;
    case 'anthropic':
      url = 'https://api.anthropic.com/v1/messages';
      headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };
      body = { model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] };
      break;
    case 'poolside':
      url = 'https://api.poolside.ai/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model: 'laguna-m1', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
      break;
  }
  
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) {
    let errorMsg = `API error: ${response.status}`;
    try {
      const error = await response.json();
      if (error.error?.message) {
        errorMsg = error.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
    } catch (e) {}
    throw new Error(errorMsg);
  }
  
  const data = await response.json();
  if (provider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (provider === 'anthropic') {
    return data.content?.[0]?.text;
  }
  return data.choices?.[0]?.message?.content;
}

async function callOllama(prompt) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3', messages: [{ role: 'user', content: prompt }], stream: false })
  });
  if (!response.ok) throw new Error('Ollama not running');
  const data = await response.json();
  return data.message?.content;
}

async function callLMStudio(prompt) {
  const response = await fetch('http://localhost:1234/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.2-3b-instruct', messages: [{ role: 'user', content: prompt }] })
  });
  if (!response.ok) throw new Error('LM Studio not running');
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

function formatQuestion(input, action) {
  const context = selectedText ? `\n\nSelected: "${selectedText}"` : '';
  switch (action) {
    case 'summarize': return `Summarize:\n${input || selectedText}${context}`;
    case 'rewrite': return `Rewrite professionally:\n${input || selectedText}${context}`;
    case 'translate': return `Translate to English:\n${input || selectedText}${context}`;
    case 'email': return `Write email reply:\n${input || selectedText}${context}`;
    default: return `${input}${context}`;
  }
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
  document.getElementById('sendBtn').disabled = show;
}

function displayResponse(text, provider = '') {
  document.getElementById('responseContent').textContent = text;
  document.getElementById('responseSection').classList.add('active');
}

function displayError(message) {
  document.getElementById('responseContent').innerHTML = `<span style="color: var(--error)">Error: ${escapeHtml(message)}</span>`;
  document.getElementById('responseSection').classList.add('active');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function copyResponse() {
  const response = document.getElementById('responseContent').textContent;
  await navigator.clipboard.writeText(response);
}

async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  await chrome.storage.sync.set({ theme: newTheme });
}

async function saveProviderPreference() {
  await chrome.storage.sync.set({ preferredProvider: document.getElementById('providerSelect').value });
}

async function dismissOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  await chrome.storage.sync.set({ hasSeenOnboarding: true });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}