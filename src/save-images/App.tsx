import { useState, useEffect } from 'react';
import type { ImageFilterOptions, DownloadProgress, ImageInfo } from '../types';
import { getFromStorage, saveToStorage } from '../lib/downloader';
import './styles.css';

export default function App() {
  const [options, setOptions] = useState<ImageFilterOptions>({
    sizeMin: 4000,
    sizeMax: 0,
    unknownSizeAction: 'save',
    dimensionWidthMin: 200,
    dimensionWidthMax: 0,
    dimensionHeightMin: 200,
    dimensionHeightMax: 0,
    unknownDimensionAction: 'save',
    typeFilter: 'all',
    imageTypes: {
      jpeg: false,
      png: false,
      gif: false,
      bmp: false
    },
    noExtensionAction: 'jpg',
    useRegex: false,
    regexPattern: '',
    sameOriginOnly: false,
    deepSearchLevel: 1,
    openSaveDialog: false
  });

  const [progress, setProgress] = useState<DownloadProgress>({
    total: 0,
    processed: 0,
    willSave: 0
  });

  const [tabUrl, setTabUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load saved options on mount
  useEffect(() => {
    loadOptions();
    getCurrentTab();
  }, []);

  // Save options when they change
  useEffect(() => {
    if (tabUrl) {
      saveToStorage('image_filter_options', options);
    }
  }, [options, tabUrl]);

  const loadOptions = async () => {
    try {
      const saved = await getFromStorage<ImageFilterOptions>('image_filter_options');
      if (saved) {
        setOptions(saved);
      }
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        setTabUrl(tab.url);
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  };

  const handleOptionChange = <K extends keyof ImageFilterOptions>(
    key: K,
    value: ImageFilterOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleImageTypeChange = (type: keyof ImageFilterOptions['imageTypes'], checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      imageTypes: { ...prev.imageTypes, [type]: checked }
    }));
  };

  const handleReset = () => {
    const defaultOptions: ImageFilterOptions = {
      sizeMin: 4000,
      sizeMax: 0,
      unknownSizeAction: 'save',
      dimensionWidthMin: 200,
      dimensionWidthMax: 0,
      dimensionHeightMin: 200,
      dimensionHeightMax: 0,
      unknownDimensionAction: 'save',
      typeFilter: 'all',
      imageTypes: {
        jpeg: false,
        png: false,
        gif: false,
        bmp: false
      },
      noExtensionAction: 'jpg',
      useRegex: false,
      regexPattern: '',
      sameOriginOnly: false,
      deepSearchLevel: 1,
      openSaveDialog: false
    };
    setOptions(defaultOptions);
  };

  const handleSave = async () => {
    setIsProcessing(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Inject content script to extract images
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractImages,
        args: [options]
      });

      if (results[0]?.result) {
        const images = results[0].result as ImageInfo[];
        setProgress({
          total: images.length,
          processed: images.length,
          willSave: images.length
        });

        // Download images
        await downloadImages(images);
      }
    } catch (error) {
      console.error('Failed to save images:', error);
      alert(`Failed to save images: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImages = async (images: ImageInfo[]) => {
    // This would implement the actual download logic
    // For now, just show a notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'WebUISys',
      message: `Found ${images.length} images. Download functionality will be implemented.`
    });
  };

  return (
    <div className="save-images-container">
      <header>
        <h1>图片下载</h1>
        <p className="subtitle">从当前页面提取并下载图片</p>
      </header>

      <main>
        <section className="stats-section">
          <h2>统计信息</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">总数:</span>
              <span className="stat-value">{progress.total || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">已处理:</span>
              <span className="stat-value">{progress.processed || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">将保存:</span>
              <span className="stat-value">{progress.willSave || '-'}</span>
            </div>
          </div>
          {progress.total > 0 && (
            <progress
              value={progress.processed}
              max={progress.total}
              className="progress-bar"
            />
          )}
        </section>

        <section className="deep-search-section">
          <h2>深度搜索</h2>
          <p className="section-description">等待解析的HTML链接数: <strong>0</strong></p>
          <div className="form-group">
            <label htmlFor="deepLevel">搜索级别:</label>
            <select
              id="deepLevel"
              value={options.deepSearchLevel}
              onChange={(e) => handleOptionChange('deepSearchLevel', Number(e.target.value) as 0 | 1 | 2)}
              disabled={isProcessing}
            >
              <option value={0}>0 - 不提取链接图片（快速）</option>
              <option value={1}>1 - 提取链接图片（较慢）</option>
              <option value={2}>2 - 提取链接并解析目标HTML（很慢）</option>
            </select>
          </div>
        </section>

        <section className="filters-section">
          <h2>过滤选项</h2>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={(options.sizeMin ?? 0) > 0 || (options.sizeMax ?? 0) > 0}
                onChange={(e) => {
                  if (!e.target.checked) {
                    handleOptionChange('sizeMin', 0);
                    handleOptionChange('sizeMax', 0);
                  }
                }}
                disabled={isProcessing}
              />
              文件大小
            </label>
            <div className="filter-controls">
              <div className="input-row">
                <label>最小:</label>
                <input
                  type="number"
                  value={options.sizeMin}
                  onChange={(e) => handleOptionChange('sizeMin', Number(e.target.value))}
                  disabled={isProcessing}
                />
                <span>bytes</span>
              </div>
              <div className="input-row">
                <label>最大:</label>
                <input
                  type="number"
                  value={options.sizeMax}
                  onChange={(e) => handleOptionChange('sizeMax', Number(e.target.value))}
                  disabled={isProcessing}
                />
                <span>bytes</span>
              </div>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="unknownSize"
                    checked={options.unknownSizeAction === 'skip'}
                    onChange={() => handleOptionChange('unknownSizeAction', 'skip')}
                    disabled={isProcessing}
                  />
                  跳过未知大小
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="unknownSize"
                    checked={options.unknownSizeAction === 'save'}
                    onChange={() => handleOptionChange('unknownSizeAction', 'save')}
                    disabled={isProcessing}
                  />
                  保存未知大小
                </label>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={(options.dimensionWidthMin ?? 0) > 0 || (options.dimensionWidthMax ?? 0) > 0 ||
                        (options.dimensionHeightMin ?? 0) > 0 || (options.dimensionHeightMax ?? 0) > 0}
                onChange={(e) => {
                  if (!e.target.checked) {
                    handleOptionChange('dimensionWidthMin', 0);
                    handleOptionChange('dimensionWidthMax', 0);
                    handleOptionChange('dimensionHeightMin', 0);
                    handleOptionChange('dimensionHeightMax', 0);
                  }
                }}
                disabled={isProcessing}
              />
              尺寸（像素）
            </label>
            <div className="filter-controls">
              <div className="input-row">
                <label>最小宽度:</label>
                <input
                  type="number"
                  value={options.dimensionWidthMin}
                  onChange={(e) => handleOptionChange('dimensionWidthMin', Number(e.target.value))}
                  disabled={isProcessing}
                />
              </div>
              <div className="input-row">
                <label>最大宽度:</label>
                <input
                  type="number"
                  value={options.dimensionWidthMax}
                  onChange={(e) => handleOptionChange('dimensionWidthMax', Number(e.target.value))}
                  disabled={isProcessing}
                />
              </div>
              <div className="input-row">
                <label>最小高度:</label>
                <input
                  type="number"
                  value={options.dimensionHeightMin}
                  onChange={(e) => handleOptionChange('dimensionHeightMin', Number(e.target.value))}
                  disabled={isProcessing}
                />
              </div>
              <div className="input-row">
                <label>最大高度:</label>
                <input
                  type="number"
                  value={options.dimensionHeightMax}
                  onChange={(e) => handleOptionChange('dimensionHeightMax', Number(e.target.value))}
                  disabled={isProcessing}
                />
              </div>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="unknownDimension"
                    checked={options.unknownDimensionAction === 'skip'}
                    onChange={() => handleOptionChange('unknownDimensionAction', 'skip')}
                    disabled={isProcessing}
                  />
                  跳过未知尺寸
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="unknownDimension"
                    checked={options.unknownDimensionAction === 'save'}
                    onChange={() => handleOptionChange('unknownDimensionAction', 'save')}
                    disabled={isProcessing}
                  />
                  保存未知尺寸
                </label>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.typeFilter === 'selection'}
                onChange={(e) => handleOptionChange('typeFilter', e.target.checked ? 'selection' : 'all')}
                disabled={isProcessing}
              />
              图片类型
            </label>
            {options.typeFilter === 'selection' && (
              <div className="filter-controls">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.imageTypes.jpeg}
                      onChange={(e) => handleImageTypeChange('jpeg', e.target.checked)}
                      disabled={isProcessing}
                    />
                    JPG/JPEG
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.imageTypes.png}
                      onChange={(e) => handleImageTypeChange('png', e.target.checked)}
                      disabled={isProcessing}
                    />
                    PNG
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.imageTypes.gif}
                      onChange={(e) => handleImageTypeChange('gif', e.target.checked)}
                      disabled={isProcessing}
                    />
                    GIF
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.imageTypes.bmp}
                      onChange={(e) => handleImageTypeChange('bmp', e.target.checked)}
                      disabled={isProcessing}
                    />
                    BMP
                  </label>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={options.noExtensionAction === 'jpg'}
                    onChange={(e) => handleOptionChange('noExtensionAction', e.target.checked ? 'jpg' : 'skip')}
                    disabled={isProcessing}
                  />
                  无扩展名时保存为JPG
                </label>
              </div>
            )}
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.useRegex}
                onChange={(e) => handleOptionChange('useRegex', e.target.checked)}
                disabled={isProcessing}
              />
              正则表达式
            </label>
            {options.useRegex && (
              <div className="filter-controls">
                <input
                  type="text"
                  value={options.regexPattern}
                  onChange={(e) => handleOptionChange('regexPattern', e.target.value)}
                  placeholder=".*"
                  disabled={isProcessing}
                />
                <small>仅保存匹配URL的图片</small>
              </div>
            )}
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.sameOriginOnly}
                onChange={(e) => handleOptionChange('sameOriginOnly', e.target.checked)}
                disabled={isProcessing}
              />
              仅保存与当前页面同源的图片
            </label>
          </div>

          <div className="filter-group">
            <div className="input-row">
              <label>保存位置:</label>
              <input
                type="text"
                value={options.customDirectory || ''}
                onChange={(e) => handleOptionChange('customDirectory', e.target.value)}
                placeholder="默认下载目录的相对路径"
                disabled={isProcessing}
              />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.openSaveDialog}
                onChange={(e) => handleOptionChange('openSaveDialog', e.target.checked)}
                disabled={isProcessing}
              />
              打开保存对话框
            </label>
          </div>
        </section>

        <section className="actions-section">
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={isProcessing}
          >
            重置
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? '处理中...' : '保存图片'}
          </button>
        </section>
      </main>
    </div>
  );
}

/**
 * Extract images from the current page
 * This function is injected into the page context
 */
function extractImages(options: ImageFilterOptions): ImageInfo[] {
  const images: ImageInfo[] = [];
  const imgElements = document.querySelectorAll('img');

  imgElements.forEach((img) => {
    const url = img.src;
    if (!url) return;

    // Check same origin
    if (options.sameOriginOnly) {
      try {
        const imgUrl = new URL(url, window.location.href);
        if (imgUrl.origin !== window.location.origin) {
          return;
        }
      } catch {
        return;
      }
    }

    // Check regex
    if (options.useRegex && options.regexPattern) {
      try {
        const regex = new RegExp(options.regexPattern);
        if (!regex.test(url)) {
          return;
        }
      } catch {
        // Invalid regex, skip
      }
    }

    images.push({
      url,
      width: img.naturalWidth || undefined,
      height: img.naturalHeight || undefined,
      type: getImageType(url)
    });
  });

  return images;
}

/**
 * Get image type from URL
 */
function getImageType(url: string): string | undefined {
  const match = url.match(/\.([^.?]+)(?:\?|$)/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
      return ext;
    }
  }
  return undefined;
}
