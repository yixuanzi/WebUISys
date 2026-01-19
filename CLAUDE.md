# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebUISys is a modern Chrome/Firefox browser extension (v2.0.0) that provides web-based task management interfaces for content extraction. It enables users to download text content (e-books/articles) and images from web pages through a popup interface.

**Core Features:**
- Text downloading from web URLs with multi-task concurrent processing (4-16 tasks)
- Image downloading with advanced filtering (size, dimensions, type, regex patterns)
- Configuration-driven parsing models for different websites
- Resume capability for interrupted downloads

## Architecture

### Modern Technology Stack (v2.0.0)

- **TypeScript** - Type-safe development
- **React 18** - Modern UI components with hooks
- **Vite** - Fast build tool with HMR
- **Cheerio** - HTML parsing with CSS selectors
- **Manifest V3** - Latest Chrome extension standard

### Project Structure

```
webuisys/
├── src/
│   ├── background/           # Service worker (background script)
│   │   └── service-worker.ts
│   ├── popup/               # Popup UI (extension icon click)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── txtonline/           # Text extraction interface
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── save-images/         # Image extraction interface
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── lib/                 # Shared utilities
│   │   ├── parser.ts        # Parsing logic & cheerio wrapper
│   │   ├── downloader.ts    # Download utilities
│   │   └── models.ts        # Website configuration models
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── components/          # Reusable React components
├── public/                  # Static assets
│   ├── manifest.json        # Extension manifest (Manifest V3)
│   ├── icons/
│   ├── popup.html
│   ├── txtonline.html
│   └── saveimages.html
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

### Entry Points

1. **`popup.html`** → **`src/popup/App.tsx`**
   - Main popup interface (triggered by clicking extension icon)
   - Routes to specialized interfaces for text or image extraction

2. **`txtonline.html`** → **`src/txtonline/App.tsx`**
   - Text extraction interface
   - Handles e-book/content scraping from configured websites
   - Uses configuration models defined in `src/lib/models.ts`

3. **`saveimages.html`** → **`src/save-images/App.tsx`**
   - Image extraction interface
   - Advanced image download with filtering options
   - Supports deep search for linked images (Level 0-2)

4. **Background Service Worker** → **`src/background/service-worker.ts`**
   - Handles extension lifecycle events
   - Manages context menus
   - Processes messages between components

## Development Commands

### Installation

```bash
npm install
```

### Development

```bash
# Watch mode - rebuilds on file changes
npm run dev

# Type checking
npm run type-check
```

### Building

```bash
# Build all components
npm run build

# Or build individual components
npm run build:background
npm run build:popup
npm run build:txtonline
npm run build:save-images
```

Build output goes to `dist/` directory.

### Running/Testing

1. Build the extension:
   ```bash
   npm run build
   ```

2. Load extension in browser:
   - **Chrome**: `chrome://extensions` → Enable "Developer mode" → Load unpacked → Select `dist/` folder
   - **Firefox**: `about:debugging` → This Firefox → Load Temporary Add-on → Select `manifest.json` in `dist/`

3. Test changes:
   - Click extension icon to open popup
   - Navigate to text or image extraction interfaces
   - Configure and run extraction tasks

4. For development with hot reload:
   ```bash
   npm run dev
   ```
   Then reload the extension in the browser after each build.

### Deployment (Firefox)

```bash
# Sign extension for Firefox distribution
./sign.sh
```

This uses Mozilla's `web-ext` tool with API credentials configured in the script.

## Configuration System

Text extraction uses a model-based configuration system in `src/lib/models.ts`:

```typescript
interface ParseModel {
  web: string;           // Base URL
  chapscope: string;     // CSS selector for chapter list
  chapurl: string;       // Regex pattern for chapter URLs
  content: string;       // CSS selector for content
}
```

**Supported models:** `xxbiquge`, `uu234`, `e8zw`, `biquge`, `biquge2`, `3344ui`

Tasks are configured via `task.json`:
```json
{
  "model": "xxbiquge",
  "rootpage": ["https://example.com/book/"],
  "store": "ebook/output.txt",
  "lastchap": 0,
  "chaperlength": 100
}
```

## Key Implementation Details

### Multi-Task Processing
Text extraction supports concurrent downloads (4-16 parallel tasks) for efficiency. Task count is configurable in the UI using React state.

### Website-Specific Parsing
Each supported website has a dedicated model in `src/lib/models.ts` that defines:
- Base URL
- Chapter list CSS selector
- Chapter URL regex pattern
- Content extraction CSS selector

### Image Filtering Options
The save-images module supports:
- File size filtering (min/max bytes)
- Dimension filtering (width/height)
- Image type filtering (JPG, PNG, GIF, BMP)
- Regex URL pattern matching
- Deep search levels (0-2) for linked images

## Extension Permissions (Manifest V3)

- `activeTab` - Access current tab
- `storage` - Local settings storage
- `contextMenus` - Right-click menu integration
- `notifications` - Desktop notifications
- `tabs` - Tab management
- `downloads` - Download management
- `scripting` - Content script injection
- `host_permissions: ["<all_urls>"]` - Access to all websites
- `content_security_policy` - Restricts scripts to extension pages only

## Code Conventions

- **TypeScript** - Strong typing with interfaces and type aliases
- **React Functional Components** - With hooks for state management
- **CSS Modules** - Scoped styles per component
- **ES6+ Syntax** - Modern JavaScript features
- **Configuration-driven** - Add new websites by updating `src/lib/models.ts`
- **Chinese language UI** - Interface text is in Simplified Chinese

## Adding New Website Models

To add support for a new website in the text extraction module:

1. Add a new entry to `src/lib/models.ts`:
   ```typescript
   export const PARSE_MODELS: Record<string, ParseModel> = {
     // ... existing models
     newsite: {
       web: 'https://example.com',
       chapscope: 'css.selector.for.chapter.list',
       chapurl: '\\d+\\.html',  // regex for chapter URLs
       content: 'css.selector.for.content'
     }
   };
   ```

2. Test by creating a `task.json` with the new model name
3. Build the extension: `npm run build`
4. Load the extension and run extraction from the text extraction UI

## Type Definitions

Core types are defined in `src/types/index.ts`:
- `ParseModel` - Website parsing configuration
- `TaskConfig` - Task configuration for text extraction
- `Chapter` - Chapter information
- `ImageFilterOptions` - Image filtering configuration
- `ImageInfo` - Image metadata
- `DownloadProgress` - Download progress tracking

## CSP (Content Security Policy)

The extension uses strict CSP headers:
- No inline scripts (all scripts loaded as modules)
- No eval() or similar functions
- Only allows scripts from extension pages (`'self'`)

This is enforced via:
1. Manifest V3 CSP declaration
2. Meta tags in HTML files
3. Vite's production build process
