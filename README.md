# AI Assistant Pro

A production-ready Chrome Extension (Manifest V3) that provides AI-powered assistance on any webpage.

## Features

- **Floating AI Assistant Button** - Accessible on every webpage
- **Context-Aware Assistance** - Ask questions about the current page or selected text
- **Multiple Actions**:
  - Ask questions about webpage content
  - Summarize selected text
  - Rewrite text professionally
  - Translate to English
  - Generate email replies
- **Dark/Light Mode** - Automatic or manual theme switching
- **Conversation History** - Saved locally in your browser
- **Keyboard Shortcuts** - Quick access with Ctrl+Shift+A
- **Context Menu** - Right-click integration

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store
2. Search for "AI Assistant Pro"
3. Click "Add to Chrome"

## Cloud Providers

AI Assistant Pro supports multiple AI providers with automatic fallback:

| Provider | API Key Source | Default Model | Notes |
|----------|---------------|---------------|-------|
| Groq | [groq.com](https://console.groq.com) | llama-3.3-70b-versatile | Free tier available |
| OpenRouter | [openrouter.ai](https://openrouter.ai) | meta-llama/llama-3-8b-instruct:free | Free models available |
| NVIDIA Nemotron | [nvidia.com](https://nvidia.com) | nvidia/nemotron-4-340b-reward | Enterprise grade |
| Gemini | [Google AI Studio](https://aistudio.google.com) | gemini-1.5-flash | Google's model |
| OpenAI | [platform.openai.com](https://platform.openai.com) | gpt-4o-mini | GPT models |
| Anthropic Claude | [console.anthropic.com](https://console.anthropic.com) | claude-3-5-sonnet-20241022 | Claude models |
| Poolside Laguna | [poolside.ai](https://poolside.ai) | laguna-m1 | Self-hosted option |

## Local Providers (No API Key Required)

| Provider | URL | Default Model |
|----------|-----|---------------|
| Ollama | http://localhost:11434 | llama3 |
| LM Studio | http://localhost:1234 | llama-3.2-3b-instruct |

## Manual Installation (Developer Mode)

1. Download or clone this repository
2. Get an API key from your preferred provider (Groq offers free keys)
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" and select the extension folder
6. Click the extension icon or gear icon to open Settings
7. Enter your API key(s) for your preferred provider(s)
8. Start using AI Assistant Pro!

## Requirements

- Chrome browser (version 88 or higher)
- At least one AI provider API key (Groq recommended for free tier)

## Usage

1. **Click the floating button** or press `Ctrl+Shift+A` to open the sidebar
2. **Select text** on any webpage for context-aware assistance
3. **Choose an action** from the dropdown menu:
   - Ask - General question answering
   - Summarize - Condense text to key points
   - Rewrite - Improve tone and clarity
   - Translate - Convert to English
   - Email - Generate email replies
4. **View and copy** responses with the copy button

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+A | Toggle AI Assistant sidebar |

## Privacy

AI Assistant Pro respects your privacy:
- Your API keys are stored locally using Chrome's secure storage
- No data is collected or transmitted to external servers
- Conversation history is stored only in your browser
- Selected text is sent only to your chosen AI provider for processing

## Permissions

- `storage` - Save settings and conversation history
- `activeTab` - Access current tab for selected text
- `scripting` - Inject content script when needed

## Support

For issues, feature requests, or questions, please open an issue on GitHub.

## License

MIT License - See LICENSE file for details.