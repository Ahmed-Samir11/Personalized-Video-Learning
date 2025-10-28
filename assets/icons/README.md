# Icon Placeholder

This directory should contain the extension icons:

- `icon16.png` - 16x16px
- `icon32.png` - 32x32px  
- `icon48.png` - 48x48px
- `icon128.png` - 128x128px

## Creating Icons

You can create simple placeholder icons using any image editor, or use this online tool:
https://www.favicon-generator.org/

### Recommended Icon Design

- Use a simple book/graduation cap/learning symbol
- Primary color: #4F46E5 (indigo)
- White background or transparent
- Clean, accessible design

### Quick Placeholder (macOS/Linux)

```bash
# Install ImageMagick if needed
# brew install imagemagick (macOS)
# sudo apt install imagemagick (Linux)

# Create simple colored squares as placeholders
convert -size 16x16 xc:#4F46E5 icon16.png
convert -size 32x32 xc:#4F46E5 icon32.png
convert -size 48x48 xc:#4F46E5 icon48.png
convert -size 128x128 xc:#4F46E5 icon128.png
```

### Quick Placeholder (Windows with PowerShell)

For now, you can use any 16x16, 32x32, 48x48, and 128x128 PNG images.
The extension will work without icons, but Chrome will show a default icon.
