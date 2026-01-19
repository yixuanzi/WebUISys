/**
 * Website parsing model configuration
 */
export interface ParseModel {
  web: string;
  chapscope: string;
  chapurl: string;
  content: string;
}

/**
 * Task configuration for text extraction
 */
export interface TaskConfig {
  model: string;
  rootpage: string[];
  store: string;
  lastchap: number;
  chaperlength?: number;
}

/**
 * Chapter information
 */
export interface Chapter {
  name: string;
  url: string;
  index: number;
}

/**
 * Image filtering options
 */
export interface ImageFilterOptions {
  // Size filtering
  sizeMin?: number;
  sizeMax?: number;
  unknownSizeAction: 'skip' | 'save';

  // Dimension filtering
  dimensionWidthMin?: number;
  dimensionWidthMax?: number;
  dimensionHeightMin?: number;
  dimensionHeightMax?: number;
  unknownDimensionAction: 'skip' | 'save';

  // Type filtering
  typeFilter: 'all' | 'selection';
  imageTypes: {
    jpeg: boolean;
    png: boolean;
    gif: boolean;
    bmp: boolean;
  };
  noExtensionAction: 'jpg' | 'skip';

  // Regex filtering
  useRegex: boolean;
  regexPattern?: string;

  // Origin filtering
  sameOriginOnly: boolean;

  // Deep search
  deepSearchLevel: 0 | 1 | 2;

  // Save options
  customDirectory?: string;
  openSaveDialog: boolean;
}

/**
 * Image information
 */
export interface ImageInfo {
  url: string;
  size?: number;
  width?: number;
  height?: number;
  type?: string;
}

/**
 * Download progress
 */
export interface DownloadProgress {
  total: number;
  processed: number;
  willSave: number;
}

/**
 * Message types for extension communication
 */
export type ExtensionMessage =
  | { type: 'EXTRACT_TEXT'; task: TaskConfig }
  | { type: 'SEARCH_TEXT'; query: string; source: string }
  | { type: 'SAVE_IMAGES'; options: ImageFilterOptions }
  | { type: 'GET_TAB_URL' }
  | { type: 'TAB_URL_RESPONSE'; url: string }
  | { type: 'FETCH_PAGE'; url: string };

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  TASK_CONFIG: 'task_config',
  IMAGE_FILTER_OPTIONS: 'image_filter_options',
  LAST_SOURCE: 'last_source'
} as const;
