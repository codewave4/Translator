<div align="center">

  <a href="https://codewave4.github.io/Translator/">
    <img src="logo.svg" width="96" height="96" alt="Translator Logo" />
  </a>

  # Translator
  **Intelligent, Privacy-First Persian ↔ English Translation Engine**

  <p>
    A blazing-fast client-side translator with zero backend tracking, dual free engines, and Bring-Your-Own-Key (BYOK) AI acceleration.
  </p>

  <p>
    <code>Built with React 19 + TypeScript + Tailwind CSS</code>
  </p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/REACT-19.2-20232a?style=for-the-badge&logo=react&logoColor=61dafb" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TYPESCRIPT-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TAILWIND_CSS-v4-0f172a?style=for-the-badge&logo=tailwindcss&logoColor=38bdf8" alt="Tailwind CSS" /></a>
    <a href="https://codewave4.github.io/Translator/"><img src="https://img.shields.io/badge/DEPLOY-GITHUB_PAGES-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-MIT-e11d48?style=for-the-badge" alt="MIT License" /></a>
  </p>

  <p>
    <a href="https://github.com/codewave4/Translator/stargazers"><img src="https://img.shields.io/github/stars/codewave4/Translator?style=flat-square&color=2563eb" alt="GitHub Stars" /></a>
    <a href="https://github.com/codewave4/Translator/network/members"><img src="https://img.shields.io/github/forks/codewave4/Translator?style=flat-square&color=2563eb" alt="GitHub Forks" /></a>
    <a href="https://github.com/codewave4/Translator/commits/main"><img src="https://img.shields.io/github/last-commit/codewave4/Translator?style=flat-square&color=10b981" alt="Last Commit" /></a>
    <a href="https://github.com/codewave4/Translator"><img src="https://img.shields.io/github/repo-size/codewave4/Translator?style=flat-square&color=64748b" alt="Repo Size" /></a>
  </p>

  <p>
    <a href="https://codewave4.github.io/Translator/"><strong>🚀 Launch Web App</strong></a> •
    <a href="#-core-capabilities">✨ Core Features</a> •
    <a href="#-how-it-works">🔄 How It Works</a> •
    <a href="#-supported-ai-providers-byok">🤖 AI Providers</a> •
    <a href="#-zero-knowledge-privacy">🔒 Privacy</a>
  </p>

</div>

---

## 🌟 Why Translator?

Most modern web translators require server-side proxies, user logins, or harvest your input for tracking. **Translator** was built with a different philosophy:

- ⚡ **Zero Setup & Free Forever:** Instant translation without accounts or credit cards.
- 🔒 **100% Client-Side:** Everything executes directly in your browser. No intermediary backend or telemetry.
- 🧠 **Bring-Your-Own-Key AI:** Want human-level literary translations? Connect your own Gemini, OpenAI, or Groq API keys and pay only pennies directly to the providers.
- 🎙️ **Voice & Audio First:** Dictate with your voice and listen to authentic native pronunciation.
- 🎨 **Persian Heritage UI:** Designed with authentic Persian Girih geometric motifs and seamless RTL ↔ LTR transitions.

---

## 🔄 How It Works

```text
 ┌──────────────────┐
 │ 🎙️ Voice / Text  │ ──> Automatic Language Detection (Persian, English, etc.)
 └────────┬─────────┘
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │                   Translation Engine                   │
 ├──────────────────────────┬─────────────────────────────┤
 │   ⚡ Default Free Mode   │     🤖 Smart AI Mode        │
 │   Google Translate API   │     Google Gemini           │
 │   MyMemory Translation   │     Groq (LLaMA 3.3)        │
 │   (No Key Required)      │     OpenAI (GPT-4o)         │
 │                          │     Mistral & OpenRouter    │
 └──────────────────────────┴─────────────────────────────┘
          │
          ▼
 ┌──────────────────┐
 │ 🔊 Speech & Save │ ──> Native Text-to-Speech, Alternative Phrases,
 └──────────────────┘     Local Searchable History & ZIP Export
```

---

## ✨ Core Capabilities

| Capability | What It Does | Benefit |
| :--- | :--- | :--- |
| **🌐 Free Multi-Engine** | Automatic routing between Google Translate and MyMemory | Translates instantly with no quota limits or setup |
| **🤖 BYOK AI Acceleration** | Direct browser-to-API calls for Gemini, OpenAI, Groq, Mistral | Superior nuance, tone adjustment, and literary flow |
| **🎙️ Speech-to-Text (STT)** | Real-time speech dictation powered by Web Speech API | Hands-free translation for quick conversations |
| **🔊 Text-to-Speech (TTS)** | Native browser pronunciation synthesis | Hear accurate phonetics for Persian, English, and 20+ languages |
| **📦 History & ZIP Export** | Persistent local translation history with search and filtering | Download your glossary as **TXT**, **JSON**, or compressed **ZIP** |
| **🌓 Persian-Inspired Design** | Authentic Girih geometric patterns with dark/light themes | Easy on the eyes with instant RTL (فارسی) and LTR (English) toggle |

---

## 🤖 Supported AI Providers (BYOK)

Switch from standard dictionary translation to state-of-the-art Large Language Models using your own API key. Keys never leave your browser:

| Provider | Recommended Models | Free Tier? | Best For |
| :--- | :--- | :---: | :--- |
| **Google Gemini** | `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro` | ✅ Free Key | High speed, generous free quota, nuanced Persian idioms |
| **Groq Cloud** | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768` | ✅ Free Key | Instantaneous speed (500+ tokens/sec) |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo` | 💳 Pay-as-you-go | Industry standard for formal business and technical texts |
| **Mistral AI** | `mistral-small-latest`, `mistral-large-latest` | ✅ Free Key | Fluent multilingual understanding |
| **OpenRouter** | Any OpenRouter model ID | Optional | Access hundreds of open-source models under one key |

---

## 🌍 Supported Languages

The application supports seamless bi-directional translation across 22+ languages:

```text
 🇮🇷 Persian (فارسی)      🇬🇧 English           🇸🇦 Arabic (العربية)    🇹🇷 Turkish (Türkçe)
 🇫🇷 French (Français)   🇩🇪 German (Deutsch)  🇪🇸 Spanish (Español)   🇮🇹 Italian (Italiano)
 🇷🇺 Russian (Русский)   🇨🇳 Chinese (中文)    🇯🇵 Japanese (日本語)   🇰🇷 Korean (한국어)
 🇮🇳 Hindi (हिन्दी)       🇵🇹 Portuguese        🇳🇱 Dutch (Nederlands)  🇸🇪 Swedish (Svenska)
 🇵🇱 Polish (Polski)     🇺🇦 Ukrainian         🇮🇩 Indonesian          🇲🇾 Malay
 🇹🇭 Thai                🇻🇳 Vietnamese
```

---

## 🔒 Zero-Knowledge Privacy

Your data belongs strictly to you:
- **No Analytics or Trackers:** No Google Analytics, no telemetry, no tracking cookies.
- **Client-Side Storage:** Translation history and API keys reside exclusively in your browser’s `localStorage`.
- **Direct Network Traffic:** Requests are dispatched directly from your browser to Google / MyMemory / AI provider endpoints over encrypted HTTPS.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Crafted with ❤️ by <a href="https://github.com/codewave4"><strong>codewave4</strong></a> • Community & Updates on <a href="https://t.me/DeepRed_Code"><strong>Telegram</strong></a>
</div>
