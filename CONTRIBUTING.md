# Contributing Guide

Thank you for your interest in contributing to the Personalized Video Learning Assistant! This project aims to make video learning accessible to everyone, especially those with cognitive and learning disabilities.

## 🎯 Mission Alignment

All contributions should align with our core mission:
- **Reduce cognitive load** in video learning
- **Support learners** with ID, ADHD, dyslexia, and other learning differences
- **Empower users** with full control and customization
- **Maintain accessibility** as a first-class concern

## 🤝 Ways to Contribute

### 1. Code Contributions
- New features
- Bug fixes
- Performance improvements
- Accessibility enhancements

### 2. Documentation
- Improve README
- Add tutorials
- Document use cases
- Translate to other languages

### 3. Testing & Feedback
- User testing with target populations
- Bug reports
- Feature requests
- Accessibility audits

### 4. Design
- UI/UX improvements
- Icon design
- Visual assets
- Accessibility patterns

## 🚀 Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/Personalized-Video-Learning.git
cd Personalized-Video-Learning
```

### 2. Create Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Install & Build
```bash
npm install
npm run dev
```

### 4. Make Changes
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 5. Test
- Test manually with checklist in `TESTING.md`
- Ensure no console errors
- Test with screen reader if touching accessibility

### 6. Commit
```bash
git add .
git commit -m "feat: Add feature description"
# or
git commit -m "fix: Fix bug description"
```

Use conventional commit format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, no code change
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### 7. Push & PR
```bash
git push origin your-branch-name
```
Then create Pull Request on GitHub.

## 📝 Code Style Guidelines

### JavaScript/JSX
```javascript
// ✅ Good
async function analyzeFrame(frameData) {
  console.log('[AIService] Analyzing frame...');
  
  try {
    const result = await callAPI(frameData);
    return result;
  } catch (error) {
    console.error('[AIService] Error:', error);
    throw error;
  }
}

// ❌ Bad
function analyzeFrame(frameData){
  // No logging
  // No error handling
  return callAPI(frameData)
}
```

### React Components
```jsx
// ✅ Good
function MyComponent({ data, onAction }) {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Effect logic
  }, [dependency]);
  
  return (
    <div className="my-component">
      <button onClick={onAction} aria-label="Clear description">
        Action
      </button>
    </div>
  );
}

// ❌ Bad
function MyComponent(props) {
  // No destructuring
  // Missing aria-label
  return <div><button onClick={props.onAction}>Action</button></div>
}
```

### CSS
```css
/* ✅ Good */
.pvl-component {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--pvl-bg-light);
  border-radius: 8px;
}

/* ❌ Bad */
.component {
  /* Not prefixed with pvl- */
  /* Might conflict with page styles */
}
```

## ♿ Accessibility Requirements

All UI changes MUST:
- [ ] Include ARIA labels for interactive elements
- [ ] Support keyboard navigation
- [ ] Have sufficient color contrast (WCAG AA minimum)
- [ ] Work with screen readers
- [ ] Respect `prefers-reduced-motion`
- [ ] Support `prefers-contrast: high`

### Testing Accessibility
```javascript
// Add aria-label
<button aria-label="Close assistant panel">X</button>

// Add role if needed
<div role="alert">Important message</div>

// Support keyboard
onKeyPress={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleAction();
  }
}}
```

## 🧪 Testing Requirements

Before submitting PR:
1. Manual testing (see `TESTING.md`)
2. No console errors
3. Works on YouTube and Vimeo
4. Settings persist correctly
5. No breaking changes

Future: Add automated tests
```javascript
// Example test structure
describe('VideoController', () => {
  test('plays video', () => {
    // Test implementation
  });
});
```

## 📚 Documentation Standards

### Code Comments
```javascript
/**
 * Analyze video frame to identify objects
 * 
 * @param {string} frameDataUrl - Base64 encoded image
 * @param {string} prompt - Analysis prompt
 * @returns {Promise<Object>} Analysis results with objects array
 */
async analyzeFrame(frameDataUrl, prompt) {
  // Implementation
}
```

### Component Comments
```jsx
/**
 * Checklist Component - Interactive step-by-step checklist
 * 
 * Features:
 * - Progress tracking
 * - Timestamp navigation
 * - Clear visual hierarchy
 * 
 * Accessibility:
 * - Keyboard navigation supported
 * - Screen reader compatible
 * - ARIA labels on all interactions
 */
function Checklist({ items, onItemClick }) {
  // Implementation
}
```

## 🎨 UI/UX Principles

All UI changes must follow our 5 principles:

### 1. Proactive but Deferential
```jsx
// ✅ Good - Gentle invitation
<Alert>
  <p>I noticed you might need help.</p>
  <button>Yes, help me</button>
  <button>No thanks</button>
</Alert>

// ❌ Bad - Intrusive command
<Modal blocking>
  <p>You must use this feature!</p>
  <button>OK</button>
</Modal>
```

### 2. Transparency
```jsx
// ✅ Good - Explains why
<Alert>
  <p>You've rewound 3 times. Would you like help?</p>
</Alert>

// ❌ Bad - No explanation
<Alert>
  <p>Do you need help?</p>
</Alert>
```

### 3. Peripherality
```jsx
// ✅ Good - Sidebar placement
<div className="pvl-panel" style={{ position: 'fixed', right: '20px' }}>

// ❌ Bad - Blocks content
<div className="pvl-panel" style={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
```

### 4. User Control
```jsx
// ✅ Good - Toggle available
<Toggle 
  label="Enable feature"
  checked={enabled}
  onChange={toggleFeature}
/>

// ❌ Bad - Always on, no control
<Feature alwaysActive />
```

### 5. Consistency
```jsx
// ✅ Good - Consistent pattern
const buttonClass = "pvl-button pvl-button-primary";

// ❌ Bad - Inconsistent
<button className="btn-primary">OK</button>
<button className="primary-button">Cancel</button>
```

## 🔧 Adding New Features

### Feature Checklist
- [ ] Aligns with mission
- [ ] Reduces cognitive load
- [ ] User can disable it
- [ ] Accessible (WCAG AA)
- [ ] Mobile-friendly
- [ ] Documented
- [ ] Tested

### Feature Template
1. **Define the problem** - What cognitive load does this reduce?
2. **Design the solution** - How does it help?
3. **Implement** - Follow architecture patterns
4. **Test** - With target users if possible
5. **Document** - Update README and docs

## 🐛 Bug Reports

Use this template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What should happen?

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - Browser: [e.g. Chrome 120]
 - OS: [e.g. Windows 11]
 - Extension Version: [e.g. 1.0.0]

**Console Errors**
```
Paste any console errors here
```
```

## 💡 Feature Requests

Use this template:

```markdown
**Problem Statement**
What cognitive load or accessibility barrier does this address?

**Proposed Solution**
Describe your idea.

**Target Users**
Who benefits most? (ID, ADHD, Dyslexia, etc.)

**Alternatives Considered**
Other approaches you thought about.

**Additional Context**
Research, examples, mockups, etc.
```

## 🌍 Internationalization

Future: Support multiple languages

```javascript
// Prepare for i18n
const messages = {
  en: {
    'button.help': 'Help me',
    'alert.confusion': 'I noticed you might need help'
  },
  es: {
    'button.help': 'Ayúdame',
    'alert.confusion': 'Noté que podrías necesitar ayuda'
  }
};
```

## 🎓 Learning Resources

### Cognitive Load Theory
- Sweller, J. (1988). Cognitive load during problem solving
- Mayer, R. (2001). Multimedia Learning

### Accessibility
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Chrome Extensions
- Official Docs: https://developer.chrome.com/docs/extensions/
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/intro/

## 📞 Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussion
- **Pull Requests**: Code contributions

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, helps make learning more accessible. Thank you for being part of this mission!

---

**Questions?** Open a GitHub Discussion or issue. We're here to help! 💙
