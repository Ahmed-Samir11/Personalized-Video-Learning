# Personalized Video Learning Assistant

> An AI-powered browser extension that reduces cognitive load in procedural video learning, making educational content accessible to learners with cognitive and learning disabilities.

## 🎯 Mission

To bridge the **Cognitive Accessibility Gap** by providing real-time, personalized learning support that restructures and simplifies video content, reducing extraneous cognitive load for learners with:

- Intellectual Disabilities (ID)
- ADHD
- Dyslexia
- Other cognitive and learning differences

## ✨ Key Features

### 🎨 Visual Support
- **Object Highlighting**: Automatically identifies and highlights tools/objects mentioned in videos
- **Focus Mode**: Dims distractions around the video player

### 📝 Content Simplification
- **Vocabulary Helper**: Real-time simplification of complex jargon
- **Adaptive Language**: Adjustable reading levels (elementary, middle, high school)

### ✅ Learning Scaffolds
- **Interactive Checklists**: AI-generated step-by-step guides with timestamps
- **Progress Tracking**: Visual completion indicators

### 🧠 Intelligent Assistance
- **Confusion Detection**: Monitors user behavior (rewinds, pauses) to offer proactive help
- **Adaptive Pacing**: Optional auto-pause before complex steps

## 🏗️ Architecture

Built on **Chrome Extension Manifest V3** with strict separation of concerns:

```
┌─────────────────────┐
│   Background.js     │  ← "The Brain"
│  (Service Worker)   │     - AI API calls (VLM/LLM)
│                     │     - State management
└──────────┬──────────┘     - Message routing
           │
           ├─ Messages ─→ ┌──────────────────┐
           │              │   Content.js     │  ← "The Hands"
           └─ Results ──← │ (Content Script) │     - UI injection
                          │                  │     - Video control
                          └────────┬─────────┘     - Visual overlays
                                   │
                                   ├─ Injects ─→ ┌─────────────┐
                                   │             │  React UI   │
                                   └─────────────│  Components │
                                                 └─────────────┘
```

### Components

- **`background.js`**: Service worker handling AI operations
- **`content.js`**: Injected script managing page interaction
- **`react-app/`**: React-based user interface
- **`popup/`**: Extension settings popup

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Chrome/Chromium browser
- AI API key (OpenAI, Anthropic, or Google)

### Installation

1. **Clone and install dependencies:**

```bash
git clone https://github.com/yourusername/Personalized-Video-Learning.git
cd Personalized-Video-Learning
npm install
```

2. **Build the extension:**

```bash
# Production build
npm run build

# Development with watch mode
npm run dev
```

3. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

### Configuration

1. Click the extension icon
2. Go to **AI Settings** tab
3. Enter your API key
4. Select your preferred AI provider

## 📖 Usage

1. **Navigate to any video page** (YouTube, Vimeo, etc.)
2. **The assistant will appear** on the right side of the page
3. **Use quick tools:**
   - 🔍 **Highlight Objects**: Identify tools in the current frame
   - 📝 **Generate Steps**: Create a checklist from the video
   - 🎯 **Focus Mode**: Reduce distractions
   - 💬 **Vocabulary Helper**: Simplify complex text

4. **Automatic assistance:**
   - If you rewind 3+ times, the system offers help
   - Confusion alerts are gentle and dismissible

## 🎨 UI/UX Principles

Our design follows **5 core principles** for cognitive accessibility:

1. **Proactive but Deferential** - Gentle invitations, not commands
2. **Transparency & Predictability** - No "magic", always explain why
3. **Peripherality** - Stay out of the way (sidebar, not pop-ups)
4. **Full User Control** - Toggle everything on/off
5. **Consistency** - Same location, same behavior

## 🛠️ Technology Stack

- **Frontend**: React 18, CSS3
- **Build**: Webpack 5, Babel
- **Extension**: Chrome Manifest V3
- **AI**: VLM (Vision-Language Models) & LLM integration
- **Storage**: Chrome Storage API

## 📁 Project Structure

```
Personalized-Video-Learning/
├── src/
│   ├── background/          # Service worker
│   │   ├── background.js
│   │   └── services/
│   │       ├── aiService.js
│   │       ├── storageManager.js
│   │       └── messageRouter.js
│   ├── content/             # Content script
│   │   ├── content.js
│   │   ├── content.css
│   │   ├── controllers/
│   │   │   ├── videoController.js
│   │   │   ├── uiManager.js
│   │   │   ├── overlayManager.js
│   │   │   └── behaviorTracker.js
│   │   └── utils/
│   │       └── messageClient.js
│   ├── react-app/           # React UI
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   ├── components/
│   │   │   ├── AssistantPanel.jsx
│   │   │   ├── Checklist.jsx
│   │   │   ├── VocabularyHelper.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   └── ConfusionAlert.jsx
│   │   └── styles/
│   │       └── app.css
│   └── popup/               # Settings popup
│       ├── popup.html
│       ├── popup.jsx
│       ├── PopupApp.jsx
│       └── popup.css
├── assets/                  # Icons and images
├── manifest.json
├── webpack.config.js
└── package.json
```

## 🧪 Development

### Build Commands

```bash
npm run build      # Production build
npm run dev        # Development with watch mode
npm run lint       # Run ESLint
npm test           # Run tests (when implemented)
```

### Adding New Features

1. **AI Features**: Add methods to `src/background/services/aiService.js`
2. **UI Components**: Create new components in `src/react-app/components/`
3. **Content Script Features**: Add controllers to `src/content/controllers/`

## 🔒 Privacy & Security

- **All processing happens locally** when possible
- **API keys are stored securely** in Chrome's encrypted storage
- **No user data is collected** or transmitted to our servers
- **AI API calls** follow each provider's privacy policy

## 🤝 Contributing

We welcome contributions! This project aims to make learning accessible to all.

### Areas for Contribution

- 🎯 Additional AI providers
- 🌍 Internationalization (i18n)
- ♿ Accessibility improvements
- 📱 Mobile browser support
- 🧪 Testing infrastructure

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

This project is inspired by research in:
- Cognitive Load Theory (Sweller, Chandler, Mayer)
- Universal Design for Learning (UDL)
- Cognitive Accessibility in Digital Learning

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/Personalized-Video-Learning/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/Personalized-Video-Learning/discussions)

---

**Built with ❤️ for accessible education**
