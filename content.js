// AI Assistant Pro - Content Script (Multi-Provider)
(() => {
  let sidebar = null;
  let selectedText = '';
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  // Inject styles first
  const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      #ai-assistant-pro-button {
        position: fixed !important;
        right: 20px !important;
        bottom: 20px !important;
        width: 56px !important;
        height: 56px !important;
        background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        z-index: 2147483647 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        transition: transform 0.2s !important;
        color: white !important;
      }
      #ai-assistant-pro-button:hover { transform: scale(1.05) !important; }
      #ai-assistant-pro-sidebar {
        position: fixed !important;
        top: 0 !important;
        right: -400px !important;
        width: 380px !important;
        height: 100% !important;
        background: #fff !important;
        z-index: 2147483646 !important;
        box-shadow: -4px 0 20px rgba(0,0,0,0.15) !important;
        transition: right 0.3s ease !important;
        display: flex !important;
        flex-direction: column !important;
      }
      #ai-assistant-pro-sidebar.open { right: 0 !important; }
      @media (prefers-color-scheme: dark) { #ai-assistant-pro-sidebar { background: #0f172a !important; } }
      .ai-header { padding: 16px !important; border-bottom: 1px solid #e2e8f0 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }
      .ai-title { font-weight: 600 !important; color: #1e293b !important; display: flex !important; align-items: center !important; gap: 8px !important; }
      @media (prefers-color-scheme: dark) { .ai-title { color: #f1f5f9 !important; } }
      .ai-header-buttons { display: flex !important; gap: 8px !important; }
      .ai-settings-btn { background: none !important; border: none !important; padding: 4px !important; cursor: pointer !important; color: #64748b !important; border-radius: 4px !important; }
      .ai-settings-btn:hover { background: #f1f5f9 !important; }
      .ai-close { background: none !important; border: none !important; font-size: 24px !important; cursor: pointer !important; color: #64748b !important; }
      .ai-content { flex: 1 !important; padding: 16px !important; display: flex !important; flex-direction: column !important; gap: 12px !important; overflow-y: auto !important; }
      #ai-user-input { width: 100% !important; padding: 10px !important; border: 1px solid #e2e8f0 !important; border-radius: 8px !important; resize: vertical !important; font-family: inherit !important; background: #fff !important; color: #1e293b !important; }
      @media (prefers-color-scheme: dark) { #ai-user-input { background: #1e293b !important; border-color: #475569 !important; color: #f1f5f9 !important; } }
      .ai-actions { display: flex !important; gap: 8px !important; }
      .ai-actions select { flex: 1 !important; padding: 8px !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; background: #fff !important; }
      .ai-send-btn { background: #3b82f6 !important; color: white !important; border: none !important; padding: 0 16px !important; border-radius: 6px !important; cursor: pointer !important; }
      .ai-response { background: #f8fafc !important; padding: 12px !important; border-radius: 8px !important; font-size: 13px !important; line-height: 1.5 !important; white-space: pre-wrap !important; max-height: 200px !important; overflow-y: auto !important; }
      @media (prefers-color-scheme: dark) { .ai-response { background: #1e293b !important; } }
      .ai-loading { color: #64748b !important; }
      .ai-error { color: #ef4444 !important; }
    `;
    document.head.appendChild(style);
  };

  const createFloatingButton = () => {
    if (document.getElementById('ai-assistant-pro-button')) return;
    
    const btn = document.createElement('div');
    btn.id = 'ai-assistant-pro-button';
    btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
      <path d="M12 22V12"/>
      <path d="M8 12h8"/>
    </svg>`;
    btn.title = 'AI Assistant Pro (Click to open, Right-click for settings)';
    document.body.appendChild(btn);
    
    btn.addEventListener('click', toggleSidebar);
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openSettings' });
    });
    btn.addEventListener('mousedown', startDrag);
  };

  function startDrag(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const btn = e.target.closest('#ai-assistant-pro-button');
    const rect = btn.getBoundingClientRect();
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    btn.style.left = rect.left + 'px';
    btn.style.top = rect.top + 'px';
  }

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const btn = document.getElementById('ai-assistant-pro-button');
    if (!btn) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const currentLeft = parseInt(btn.style.left) || 0;
    const currentTop = parseInt(btn.style.top) || 0;
    btn.style.left = (currentLeft + dx) + 'px';
    btn.style.top = (currentTop + dy) + 'px';
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  const createSidebar = () => {
    if (sidebar) return;
    
    sidebar = document.createElement('div');
    sidebar.id = 'ai-assistant-pro-sidebar';
    sidebar.innerHTML = `
      <div class="ai-header">
        <div class="ai-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
            <path d="M12 22V12"/>
            <path d="M8 12h8"/>
          </svg> AI Assistant Pro
        </div>
        <div class="ai-header-buttons">
          <button class="ai-settings-btn" id="ai-open-settings" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button class="ai-close" id="ai-close-sidebar">&times;</button>
        </div>
      </div>
      <div class="ai-content">
<select id="ai-provider">
           <option value="auto">Auto (Best)</option>
           <option value="groq">Groq (Free)</option>
           <option value="openrouter">OpenRouter (Free)</option>
           <option value="nvidia">NVIDIA Nemotron</option>
           <option value="gemini">Gemini</option>
           <option value="openai">OpenAI</option>
           <option value="anthropic">Anthropic Claude</option>
           <option value="poolside">Poolside Laguna</option>
           <option value="ollama">Ollama (Local)</option>
           <option value="lmstudio">LM Studio (Local)</option>
         </select>
        <div id="ai-selection-info"></div>
        <textarea id="ai-user-input" placeholder="Ask about selection or type question..."></textarea>
        <div class="ai-actions">
          <select id="ai-action-type">
            <option value="ask">Ask</option>
            <option value="summarize">Summarize</option>
            <option value="rewrite">Rewrite</option>
            <option value="translate">Translate</option>
            <option value="email">Email</option>
          </select>
          <button id="ai-send-btn">Send</button>
        </div>
        <div class="ai-response" id="ai-response"></div>
      </div>
    `;
    document.body.appendChild(sidebar);
    
    document.getElementById('ai-close-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('ai-send-btn').addEventListener('click', handleSend);
    document.getElementById('ai-open-settings').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openSettings' });
    });
    document.getElementById('ai-user-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
  };

  async function handleSend() {
    const input = document.getElementById('ai-user-input').value.trim();
    const action = document.getElementById('ai-action-type').value;
    const provider = document.getElementById('ai-provider').value;
    const responseDiv = document.getElementById('ai-response');
    
    if (!input && !selectedText) return;
    
    responseDiv.innerHTML = '<div class="ai-loading">Processing...</div>';
    
    try {
      const response = await callAI(input, action, provider);
      responseDiv.textContent = response;
    } catch (error) {
      responseDiv.innerHTML = `<div class="ai-error">Error: ${escapeHtml(error.message)}</div>`;
    }
  }

  async function callAI(input, action, provider) {
    const keys = await chrome.storage.sync.get(['groqApiKey', 'openrouterApiKey', 'nvidiaApiKey', 'geminiApiKey', 'openaiApiKey', 'anthropicApiKey', 'poolsideApiKey']);
    const prompt = formatPrompt(input, action);
    let lastError = null;

    if (provider === 'auto' || provider === 'ollama' || provider === 'lmstudio') {
      if (provider === 'auto' || provider === 'ollama') {
        try { return await callOllama(prompt); } catch (e) { lastError = e; }
      }
      if (provider === 'auto' || provider === 'lmstudio') {
        try { return await callLMStudio(prompt); } catch (e) { lastError = e; }
      }
    }

    const providers = provider === 'auto' ? ['groq', 'openrouter', 'nvidia', 'gemini', 'openai', 'anthropic', 'poolside'] : [provider];
    const availableProviders = providers.filter(p => keys[`${p}ApiKey`]);
    
    if (availableProviders.length === 0) {
      const configured = Object.entries(keys).filter(([k, v]) => v).map(([k]) => k.replace('ApiKey', ''));
      throw new Error(`No API key configured. Please set keys in extension settings.\nConfigured: ${configured.join(', ') || 'none'}\nNeeded: ${providers.join(', ')}`);
    }

    for (const prov of availableProviders) {
      try { return await callCloud(prov, prompt, keys[`${prov}ApiKey`]); } catch (e) { lastError = e; }
    }

    throw lastError || new Error('Provider call failed - check console for details');
  }

  function formatPrompt(input, action) {
    const context = selectedText ? `\n\nSelected: "${selectedText}"` : '';
    const text = input || selectedText;
    
    switch (action) {
      case 'summarize': return `Summarize:\n${text}${context}`;
      case 'rewrite': return `Rewrite professionally:\n${text}${context}`;
      case 'translate': return `Translate to English:\n${text}${context}`;
      case 'email': return `Write email reply:\n${text}${context}`;
      default: return `${input}${context}`;
    }
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

  async function callCloud(provider, prompt, apiKey) {
    const endpoints = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
      gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      poolside: 'https://api.poolside.ai/v1/chat/completions'
    };
    
    const models = {
      groq: 'llama-3.3-70b-versatile',
      openrouter: 'meta-llama/llama-3-8b-instruct:free',
      nvidia: 'nvidia/nemotron-4-340b-reward',
      gemini: 'gemini-1.5-flash',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-sonnet-20241022',
      poolside: 'laguna-m1'
    };
    
    let headers, body;
    
    if (provider === 'gemini') {
      headers = { 'Content-Type': 'application/json' };
      body = { contents: [{ parts: [{ text: prompt }] }] };
    } else if (provider === 'anthropic') {
      headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };
      body = { model: models[provider], max_tokens: 1024, messages: [{ role: 'user', content: prompt }] };
    } else {
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model: models[provider], messages: [{ role: 'user', content: prompt }] };
    }
    
    const response = await fetch(endpoints[provider], { method: 'POST', headers, body: JSON.stringify(body) });
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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function toggleSidebar() {
    createSidebar();
    sidebar.classList.toggle('open');
    updateSelectionInfo();
  }

  function updateSelectionInfo() {
    const info = document.getElementById('ai-selection-info');
    if (info) info.textContent = selectedText ? `Selected: ${selectedText.substring(0, 60)}...` : 'No text selected';
  }

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection().toString().trim();
    if (sel !== selectedText) selectedText = sel;
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'toggleSidebar':
        toggleSidebar();
        sendResponse({ success: true });
        break;
      case 'getSelectedText':
        sendResponse({ selectedText });
        break;
      case 'contextAction':
        selectedText = request.text || '';
        toggleSidebar();
        setTimeout(() => {
          const select = document.getElementById('ai-action-type');
          if (select) select.value = request.type;
        }, 100);
        sendResponse({ success: true });
        break;
    }
  });

  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }
})();