# How to Export PITCH_DECK.md to PDF

## Easiest Method: VS Code Extension

1. **Install Extension:**
   - Open VS Code
   - Press `Ctrl+Shift+X`
   - Search: "Markdown PDF" by yzane
   - Click Install

2. **Export:**
   - Open `PITCH_DECK.md`
   - Right-click → "Markdown PDF: Export (pdf)"
   - Done! PDF saved in same folder

## Alternative: Online Converter

1. Go to: https://www.markdowntopdf.com/
2. Upload `PITCH_DECK.md` or paste content
3. Click "Convert" → Download PDF

## Alternative: Browser Print

1. Open markdown in viewer:
   - https://dillinger.io/ (paste content)
   - Or VS Code preview (Ctrl+Shift+V)
2. Print to PDF:
   - Press `Ctrl+P`
   - Select "Save as PDF"
   - Click Save

## Command Line (if Pandoc installed)

```bash
pandoc PITCH_DECK.md -o PITCH_DECK.pdf --pdf-engine=wkhtmltopdf
```




