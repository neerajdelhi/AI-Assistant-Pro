// AI Assistant Pro - Background Service Worker
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.sync.set({
      theme: 'light',
      hasSeenOnboarding: false,
      geminiApiKey: ''
    });
    await chrome.storage.local.set({ history: [] });
  }
  
  // Create context menus on install/update
  chrome.contextMenus.create({
    id: 'ai-assistant-pro',
    title: 'AI Assistant Pro',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ask-question',
    parentId: 'ai-assistant-pro',
    title: 'Ask about selection',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'summarize',
    parentId: 'ai-assistant-pro',
    title: 'Summarize selection',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'rewrite',
    parentId: 'ai-assistant-pro',
    title: 'Rewrite professionally',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'translate',
    parentId: 'ai-assistant-pro',
    title: 'Translate selection',
    contexts: ['selection']
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === '_execute_action') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
      } catch (e) {
        // Content script inject and retry
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
        } catch (injectError) {
          console.error('Failed to inject content script:', injectError);
        }
      }
    }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  
  let action = '';
  switch (info.menuItemId) {
    case 'ask-question': action = 'ask'; break;
    case 'summarize': action = 'summarize'; break;
    case 'rewrite': action = 'rewrite'; break;
    case 'translate': action = 'translate'; break;
    default: return;
  }
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'contextAction',
    type: action,
    text: info.selectionText
  }).catch(() => {});
});