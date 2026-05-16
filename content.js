// AI Assistant Pro - Content Script
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
        transition: transform 0.2s, box-shadow 0.2s !important;
        color: white !important;
      }
      #ai-assistant-pro-button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
      }
      #ai-assistant-pro-button:active {
        transform: scale(0.95) !important;
      }
      #ai-assistant-pro-sidebar {
        position: fixed !important;
        top: 0 !important;
        right: -400px !important;
        width: 380px !important;
        height: 100% !important;
        background: #ffffff !important;
        z-index: 2147483646 !important;
        box-shadow: -4px 0 20px rgba(0,0,0,0.15) !important;
        transition: right 0.3s ease !important;
        display: flex !important;
        flex-direction: column !important;
      }
      #ai-assistant-pro-sidebar.open {
        right: 0 !important;
      }
      @media (prefers-color-scheme: dark) {
        #ai-assistant-pro-sidebar { background: #0f172a !important; }
      }
      .ai-sidebar-header {
        padding: 16px !important;
        border-bottom: 1px solid #e2e8f0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      .ai-sidebar-title {
        font-weight: 600 !important;
        color: #1e293b !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      @media (prefers-color-scheme: dark) {
        .ai-sidebar-header { border-bottom-color: #475569 !important; }
        .ai-sidebar-title { color: #f1f5f9 !important; }
      }
      .ai-close-btn {
        background: none !important;
        border: none !important;
        font-size: 24px !important;
        cursor: pointer !important;
        color: #64748b !important;
        padding: 0 !important;
        width: 30px !important;
        height: 30px !important;
      }
      .ai-sidebar-content {
        flex: 1 !important;
        padding: 16px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        overflow-y: auto !important;
      }
      .ai-selection-info {
        background: #f1f5f9 !important;
        padding: 8px 12px !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        color: #64748b !important;
      }
      @media (prefers-color-scheme: dark) {
        .ai-selection-info { background: #334155 !important; color: #cbd5e1 !important; }
      }
      #ai-user-input {
        width: 100% !important;
        padding: 10px !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        resize: vertical !important;
        font-family: inherit !important;
        background: #ffffff !important;
        color: #1e293b !important;
      }
      @media (prefers-color-scheme: dark) {
        #ai-user-input { background: #1e293b !important; border-color: #475569 !important; color: #f1f5f9 !important; }
      }
      .ai-actions {
        display: flex !important;
        gap: 8px !important;
      }
      .ai-actions select {
        flex: 1 !important;
        padding: 8px !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 6px !important;
        background: #ffffff !important;
      }
      @media (prefers-color-scheme: dark) {
        .ai-actions select { background: #1e293b !important; border-color: #475569 !important; }
      }
      #ai-send-btn {
        background: #3b82f6 !important;
        color: white !important;
        border: none !important;
        padding: 0 16px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
      }
      #ai-send-btn:hover { background: #2563eb !important; }
      .ai-response {
        background: #f8fafc !important;
        padding: 12px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        white-space: pre-wrap !important;
        max-height: 200px !important;
        overflow-y: auto !important;
      }
      @media (prefers-color-scheme: dark) {
        .ai-response { background: #1e293b !important; }
      }
      .ai-loading { color: #64748b !important; }
      .ai-error { color: #ef4444 !important; }
    `;
    document.head.appendChild(style);
  };

  // Create floating button
  const createFloatingButton = () => {
    if (document.getElementById('ai-assistant-pro-button')) return;
    
    const btn = document.createElement('div');
    btn.id = 'ai-assistant-pro-button';
    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
        <path d="M12 22V12"/>
        <path d="M8 12h8"/>
      </svg>
    `;
    btn.title = 'AI Assistant Pro';
    document.body.appendChild(btn);
    
    btn.addEventListener('click', toggleSidebar);
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

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Create sidebar
  const createSidebar = () => {
    if (sidebar) return;
    
    sidebar = document.createElement('div');
    sidebar.id = 'ai-assistant-pro-sidebar';
    sidebar.innerHTML = `
      <div class="ai-sidebar-header">
        <div class="ai-sidebar-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
            <path d="M12 22V12"/>
            <path d="M8 12h8"/>
          </svg>
          AI Assistant Pro
        </div>
        <button class="ai-close-btn" id="ai-close-sidebar">&times;</button>
      </div>
      <div class="ai-sidebar-content">
        <div class="ai-selection-info" id="ai-selection-info"></div>
        <textarea id="ai-user-input" placeholder="Ask about the selection or type your question..."></textarea>
        <div class="ai-actions">
          <select id="ai-action-type">
            <option value="ask">Ask</option>
            <option value="summarize">Summarize</option>
            <option value="rewrite">Rewrite</option>
            <option value="translate">Translate</option>
            <option value="email">Email Reply</option>
          </select>
          <button id="ai-send-btn">Send</button>
        </div>
        <div class="ai-response" id="ai-response"></div>
      </div>
    `;
    document.body.appendChild(sidebar);
    
    document.getElementById('ai-close-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('ai-send-btn').addEventListener('click', handleSidebarSend);
    document.getElementById('ai-user-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSidebarSend();
      }
    });
  };

  async function handleSidebarSend() {
    const input = document.getElementById('ai-user-input').value.trim();
    const action = document.getElementById('ai-action-type').value;
    const responseDiv = document.getElementById('ai-response');
    
    if (!input && !selectedText) return;
    
    responseDiv.innerHTML = '<div class="ai-loading">Processing...</div>';
    
    const { geminiApiKey } = await chrome.storage.sync.get(['geminiApiKey']);
    if (!geminiApiKey) {
      responseDiv.innerHTML = '<div class="ai-error">Please set your API key in extension settings.</div>';
      return;
    }
    
    const question = formatActionPrompt(input, action);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: question }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      responseDiv.textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
    } catch (error) {
      responseDiv.innerHTML = `<div class="ai-error">Error: ${escapeHtml(error.message)}</div>`;
    }
  }

  function formatActionPrompt(input, action) {
    const context = selectedText ? `\n\nSelected text: "${selectedText.replace(/"/g, '\\"')}"` : '';
    switch (action) {
      case 'summarize': return `Summarize the following text professionally:${context}\n${input || selectedText || ''}`;
      case 'rewrite': return `Rewrite the following text professionally:${context}\n${input || selectedText || ''}`;
      case 'translate': return `Translate to English:${context}\n${input || selectedText || ''}`;
      case 'email': return `Generate a professional email reply to:${context}\n${input || selectedText || ''}`;
      default: return `${input}${context}`;
    }
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
    if (info) {
      info.textContent = selectedText ? `Selected: ${selectedText.substring(0, 60)}...` : 'No text selected';
    }
  }

  // Track selected text
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection().toString().trim();
    if (sel !== selectedText) {
      selectedText = sel;
    }
  });

  // Message listener
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

  // Initialize
  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }
})();