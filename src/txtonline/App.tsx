import React, { useState, useEffect, useRef } from 'react';
import * as cheerio from 'cheerio';
import type { TaskConfig, Chapter } from '../types';
import { getModel, getModelNames } from '../lib/models';
import { downloadTextFile } from '../lib/downloader';
import { validateTask, getChapterList, getChapterContent, calculateChapterRange, formatChapterTitle } from '../lib/parser';
import './styles.css';

interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export default function App() {
  const [task, setTask] = useState<TaskConfig | null>(null);
  const [multiTaskCount, setMultiTaskCount] = useState(12);
  const [selectedSource, setSelectedSource] = useState('');
  const [searchWord, setSearchWord] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchResults, setSearchResults] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const logCounter = useRef(0);

  // Add log message
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const entry: LogEntry = {
      id: logCounter.current++,
      message,
      type
    };
    setLogs(prev => [...prev, entry]);
  };

  // Initialize source dropdown
  useEffect(() => {
    const modelNames = getModelNames();
    if (modelNames.length > 0 && !selectedSource) {
      setSelectedSource(modelNames[0]);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const taskData = JSON.parse(content);

        if (validateTask(taskData)) {
          setTask(taskData);
          addLog('Task loaded successfully:\n' + JSON.stringify(taskData, null, 2), 'success');
        } else {
          addLog('Invalid task configuration', 'error');
        }
      } catch (error) {
        addLog(`Failed to parse task file: ${error}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchWord.trim()) {
      addLog('Please enter search words', 'error');
      return;
    }

    if (!selectedSource) {
      addLog('Please select a source', 'error');
      return;
    }

    const model = getModel(selectedSource);
    if (!model) {
      addLog('Invalid model selected', 'error');
      return;
    }

    const searchQuery = `${searchWord} site:${model.web}`;
    addLog(`Searching: ${searchQuery}`);

    try {
      const searchUrl = `https://cn.bing.com/search?q=${encodeURIComponent(searchQuery)}`;
      // Use chrome.runtime.sendMessage for search requests too
      const html = await new Promise<string>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'FETCH_PAGE', url: searchUrl },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.content);
            }
          }
        );
      });
      const $ = cheerio.load(html);
      const results = $('#b_results').html() || '';
      setSearchResults(results);
    } catch (error) {
      addLog(`Search failed: ${error}`, 'error');
    }
  };

  // Start extraction
  const handleStart = async () => {
    if (!task) {
      addLog('Please upload a task configuration file first', 'error');
      return;
    }

    if (!validateTask(task)) {
      addLog('Invalid task configuration', 'error');
      return;
    }

    setIsProcessing(true);
    setLogs([]);

    const model = getModel(task.model);
    if (!model) {
      addLog(`Model "${task.model}" not found`, 'error');
      setIsProcessing(false);
      return;
    }

    try {
      addLog(`Starting extraction with model: ${task.model}`);

      // Collect all chapters from all root pages
      const allChapters: Chapter[] = [];
      const rootPages = [...task.rootpage];

      for (const rootPage of rootPages) {
        addLog(`Fetching chapter list from: ${rootPage}`);
        const chapters = await getChapterList(model, rootPage);
        allChapters.push(...chapters);
        addLog(`Found ${chapters.length} chapters from this page`);
      }

      // Calculate chapter range
      const { start, end, count } = calculateChapterRange(
        allChapters.length,
        task.lastchap,
        task.chaperlength
      );

      addLog(`Total chapters: ${allChapters.length}, will extract: ${count} (chapters ${start + 1}-${end})`);

      // Confirm with user
      const confirmed = confirm(
        `Found ${allChapters.length} chapters total.\n` +
        `Your last chapter: ${task.lastchap}\n` +
        `Will extract ${count} new chapters.\n\n` +
        `Continue?`
      );

      if (!confirmed) {
        addLog('Operation cancelled by user', 'info');
        setIsProcessing(false);
        return;
      }

      // Extract chapters
      const chaptersToExtract = allChapters.slice(start, end);

      // Process chapters concurrently
      const concurrency = Math.min(multiTaskCount, chaptersToExtract.length);
      const results: Map<number, { title: string; content: string }> = new Map();
      let completed = 0;

      const processChapter = async (chapter: Chapter): Promise<void> => {
        try {
          const { content } = await getChapterContent(model, chapter);
          results.set(chapter.index, {
            title: formatChapterTitle(task.lastchap + chapter.index, chapter.name),
            content
          });
          addLog(`[${chapter.index + 1}] ${chapter.name} - ${content.length} chars`, 'success');
        } catch (error) {
          addLog(`Failed to extract chapter ${chapter.name}: ${error}`, 'error');
        } finally {
          completed++;
          if (completed === chaptersToExtract.length) {
            // All chapters processed, download file
            downloadResults(results, task.store);
          }
        }
      };

      // Start concurrent processing
      const queue = [...chaptersToExtract];
      const activeTasks: Promise<void>[] = [];

      while (queue.length > 0 || activeTasks.length > 0) {
        while (activeTasks.length < concurrency && queue.length > 0) {
          const chapter = queue.shift()!;
          const taskPromise = processChapter(chapter);
          activeTasks.push(taskPromise);

          taskPromise.then(() => {
            const index = activeTasks.indexOf(taskPromise);
            if (index > -1) {
              activeTasks.splice(index, 1);
            }
          });
        }

        if (activeTasks.length >= concurrency || queue.length === 0) {
          await Promise.race(activeTasks);
        }
      }

    } catch (error) {
      addLog(`Extraction failed: ${error}`, 'error');
      setIsProcessing(false);
    }
  };

  // Download results
  const downloadResults = (results: Map<number, { title: string; content: string }>, filename: string) => {
    addLog('Preparing download...');

    // Sort by index and create file content
    const sorted = Array.from(results.entries()).sort((a, b) => a[0] - b[0]);
    const content: string[] = [];

    for (const [, data] of sorted) {
      content.push(data.title);
      content.push(data.content);
      content.push('\n');
    }

    downloadTextFile(content, filename);
    addLog(`Download started: ${filename} (${sorted.length} chapters)`, 'success');
    setIsProcessing(false);
  };

  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="txtonline-container">
      <header>
        <h1>WebUISys 文本提取</h1>
      </header>

      <main>
        <section className="config-section">
          <h2>任务配置</h2>
          <div className="file-input-group">
            <label htmlFor="taskFile">选择任务文件:</label>
            <input
              id="taskFile"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            {task && (
              <span className="file-status">
                ✓ 已加载: {task.model}
              </span>
            )}
          </div>

          <div className="task-options">
            <label htmlFor="multiTask">并发任务数:</label>
            <select
              id="multiTask"
              value={multiTaskCount}
              onChange={(e) => setMultiTaskCount(Number(e.target.value))}
              disabled={isProcessing}
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
            </select>
          </div>
        </section>
{/* 
        <section className="search-section">
          <h2>搜索</h2>
          <div className="search-controls">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              disabled={isProcessing}
            >
              {getModelNames().map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="搜索关键词"
              disabled={isProcessing}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={isProcessing || !searchWord}>
              搜索
            </button>
          </div>
          {searchResults && (
            <div className="search-results" dangerouslySetInnerHTML={{ __html: searchResults }} />
          )}
        </section> */}

        <section className="action-section">
          <button
            className="start-button"
            onClick={handleStart}
            disabled={isProcessing || !task}
          >
            {isProcessing ? '处理中...' : '开始提取'}
          </button>
          <button
            className="clear-button"
            onClick={handleClearLogs}
            disabled={isProcessing}
          >
            清空日志
          </button>
        </section>

        <section className="log-section">
          <h2>日志</h2>
          <div className="log-container">
            {logs.length === 0 ? (
              <div className="log-empty">暂无日志</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  {log.message}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
