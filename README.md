# WebUISys

**Version:** 2.0.0
**Type:** Chrome/Firefox Browser Extension (Manifest V3)

WebUISys is a modern browser extension for web content extraction. It enables users to download text content (e-books/articles) and images from web pages through an intuitive popup interface.

## Features

### 1. Text Downloading (文本下载)
- Download e-books and articles from configured websites
- Multi-task concurrent processing (4-16 parallel tasks)
- Resume capability for interrupted downloads
- Configuration-driven parsing models for different websites

### 2. Image Extraction (图片提取)
- Download all images from a web page
- Advanced filtering options:
  - File size (min/max bytes)
  - Image dimensions (width/height)
  - Image type (JPG, PNG, GIF, BMP)
  - Regex URL pattern matching
  - Deep search levels (0-2) for linked images

## Technology Stack

- **TypeScript** - Type-safe development
- **React 18** - Modern UI components with hooks
- **Vite** - Fast build tool with HMR
- **Cheerio** - HTML parsing with CSS selectors
- **Manifest V3** - Latest Chrome extension standard

## Installation

### Build from Source

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Or build individual components
npm run build:background
npm run build:popup
npm run build:txtonline
npm run build:save-images
```

### Load Extension in Browser

**Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

**Firefox:**
1. Open `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json` in the `dist/` folder

## Development

```bash
# Watch mode - rebuilds on file changes
npm run dev

# Type checking
npm run type-check
```

## Project Structure

```
webuisys/
├── src/
│   ├── background/           # Service worker
│   ├── popup/               # Main popup UI
│   ├── txtonline/           # Text extraction interface
│   ├── save-images/         # Image extraction interface
│   ├── lib/                 # Shared utilities
│   │   ├── parser.ts        # Parsing logic
│   │   ├── downloader.ts    # Download utilities
│   │   └── models.ts        # Website configurations
│   └── types/               # TypeScript definitions
├── public/                  # Static assets
│   ├── manifest.json
│   ├── popup.html
│   ├── txtonline.html
│   └── saveimages.html
└── vite.config.ts
```

## Supported Websites

The text extraction module uses a model-based configuration system. Supported sites include:
- `xxbiquge`
- `uu234`
- `e8zw`
- `biquge`
- `biquge2`
- `3344ui`

Add new websites by updating `src/lib/models.ts`.

## Extension Permissions

- `activeTab` - Access current tab
- `storage` - Local settings storage
- `contextMenus` - Right-click menu integration
- `notifications` - Desktop notifications
- `tabs` - Tab management
- `downloads` - Download management
- `scripting` - Content script injection
- `host_permissions: ["<all_urls>"]` - Access to all websites

## License

MIT
