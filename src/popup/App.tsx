import { useState } from 'react';
import './styles.css';

/**
 * Main Popup Component
 * Provides navigation to text and image extraction features
 */
export default function App() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const openPage = (page: 'txtonline' | 'saveimages') => {
    const path = page === 'txtonline' ? 'src/txtonline/index.html' : 'src/save-images/index.html';
    chrome.tabs.create({
      url: chrome.runtime.getURL(path)
    });
    window.close();
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>WebUiSys</h1>
        <p className="subtitle">内容提取工具</p>
      </header>

      <main className="popup-main">
        <div className="function-list">
          <button
            className={`function-button ${hoveredButton === 'txtonline' ? 'hovered' : ''}`}
            onClick={() => openPage('txtonline')}
            onMouseEnter={() => setHoveredButton('txtonline')}
            onMouseLeave={() => setHoveredButton(null)}
            title="从网页提取文本内容"
          >
            <div className="button-icon">📄</div>
            <div className="button-content">
              <div className="button-title">文本下载</div>
              <div className="button-description">从网页提取文本内容</div>
            </div>
          </button>

          <button
            className={`function-button ${hoveredButton === 'saveimages' ? 'hovered' : ''}`}
            onClick={() => openPage('saveimages')}
            onMouseEnter={() => setHoveredButton('saveimages')}
            onMouseLeave={() => setHoveredButton(null)}
            title="从网页下载图片"
          >
            <div className="button-icon">🖼️</div>
            <div className="button-content">
              <div className="button-title">图片下载</div>
              <div className="button-description">从网页下载图片</div>
            </div>
          </button>
        </div>
      </main>

      <footer className="popup-footer">
        <span className="version">v2.0.0</span>
      </footer>
    </div>
  );
}
