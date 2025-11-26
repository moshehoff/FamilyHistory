/**
 * ProfileTabs Constants
 * מכיל את כל הקבועים והערכים הקבועים במערכת
 */

// ============================================================================
// Timing Constants (מילישניות)
// ============================================================================

export const TIMING = {
  // DOM ready delays
  DOM_READY_SHORT: 50,
  DOM_READY_MEDIUM: 100,
  DOM_READY_LONG: 200,
  DOM_READY_EXTRA_LONG: 500,

  // Content loading delays
  CONTENT_MOVE_DELAY: 100,
  CHAPTER_TABS_DELAY: 200,
  BIOGRAPHY_BANNER_DELAY: 150,

  // Mermaid initialization
  MERMAID_INIT_DELAY: 100,
  MERMAID_MOVE_DELAY: 500,

  // Tab restoration
  TAB_RESTORE_INITIAL: 500,
  TAB_RESTORE_RETRY: 300,

  // Chapter loading
  CHAPTER_SETUP_DELAY: 50,
  CHAPTER_LOAD_DELAY: 50,
  CHAPTER_SCROLL_DELAY: 500,

  // Popstate handling
  POPSTATE_RESET_DELAY: 100,

  // Scroll behavior
  SCROLL_BEHAVIOR_DELAY: 100,

  // Wait for element timeout
  ELEMENT_WAIT_TIMEOUT: 5000,
  ELEMENT_CHECK_INTERVAL: 100,
} as const

// ============================================================================
// CSS Selectors
// ============================================================================

export const SELECTORS = {
  // Main components
  PROFILE_TABS: '.profile-tabs',
  ARTICLE: 'article',
  
  // Tab elements
  TAB_BUTTON: '.tab-button',
  TAB_PANE: '.tab-pane',
  MEDIA_TAB_BUTTON: '#media-tab-button',
  
  // Biography tab
  BIOGRAPHY_TAB_BUTTON: '[data-tab="biography"]',
  BIOGRAPHY_TAB_PANE: '[data-tab-content="biography"]',
  BIOGRAPHY_HEADING: '.biography-heading',
  BIOGRAPHY_BANNER: '.biography-banner-top',
  
  // Media tab
  MEDIA_TAB_BUTTON_SELECTOR: '[data-tab="media"]',
  MEDIA_TAB_PANE: '[data-tab-content="media"]',
  MEDIA_CONTENT: '#media-content',
  
  // Chapter elements
  CHAPTER_TABS_CONTAINER: '.chapter-tabs-container',
  CHAPTER_TABS_HEADER: '.chapter-tabs-header',
  CHAPTER_TAB_BUTTON: '.chapter-tab-button',
  CHAPTER_TAB_PANE: '.chapter-tab-pane',
  CHAPTER_LINK: '.chapter-link',
  
  // Gallery elements
  GALLERY_GRID: '.gallery-grid',
  GALLERY_ITEM: '.gallery-item',
  IMAGE_CAPTION: '.image-caption',
  
  // Documents
  DOCUMENTS_LIST: '.documents-list',
  DOCUMENT_ITEM: '.document-item',
  
  // Mermaid
  MERMAID_ELEMENTS: '.mermaid, mermaid, code.language-mermaid',
  
  // Content sections
  MEDIA_SECTION: '.media-section',
  
  // Messages
  LOADING_MESSAGE: '.loading-message',
  EMPTY_MESSAGE: '.empty-message',
} as const

// ============================================================================
// Data Attributes
// ============================================================================

export const DATA_ATTRS = {
  PROFILE_ID: 'data-profile-id',
  BASE_PATH: 'data-base-path',
  TAB: 'data-tab',
  TAB_CONTENT: 'data-tab-content',
  CHAPTER_TAB: 'data-chapter-tab',
  CHAPTER_TAB_CONTENT: 'data-chapter-tab-content',
  CHAPTER_SLUG: 'data-chapter-slug',
  PROCESSED: 'data-processed',
} as const

// ============================================================================
// CSS Classes
// ============================================================================

export const CSS_CLASSES = {
  ACTIVE: 'active',
  PROFILE_TABS: 'profile-tabs',
  TAB_BUTTON: 'tab-button',
  TAB_PANE: 'tab-pane',
  CHAPTER_TABS_CONTAINER: 'chapter-tabs-container',
  CHAPTER_TABS_HEADER: 'chapter-tabs-header',
  CHAPTER_TABS_CONTENT: 'chapter-tabs-content',
  CHAPTER_TAB_BUTTON: 'chapter-tab-button',
  CHAPTER_TAB_PANE: 'chapter-tab-pane',
  BIOGRAPHY_HEADING: 'biography-heading',
  BIOGRAPHY_BANNER_TOP: 'biography-banner-top',
  MEDIA_SECTION: 'media-section',
  GALLERY_GRID: 'gallery-grid',
  GALLERY_ITEM: 'gallery-item',
  IMAGE_CAPTION: 'image-caption',
  DOCUMENTS_LIST: 'documents-list',
  DOCUMENT_ITEM: 'document-item',
  DOCUMENT_ICON: 'document-icon',
  DOCUMENT_INFO: 'document-info',
  DOCUMENT_NAME: 'document-name',
  DOCUMENT_META: 'document-meta',
  DOCUMENT_DOWNLOAD: 'document-download',
  LOADING_MESSAGE: 'loading-message',
  EMPTY_MESSAGE: 'empty-message',
  CHAPTER_LINK: 'chapter-link',
  MERMAID: 'mermaid',
} as const

// ============================================================================
// API Paths
// ============================================================================

export const API_PATHS = {
  CHAPTERS_INDEX: 'static/chapters-index.json',
  MEDIA_INDEX: 'static/media-index.json',
  CHAPTERS_BASE: 'static/chapters/',
  DOCUMENTS_BASE: 'static/documents/',
} as const

// ============================================================================
// Mobile Breakpoints
// ============================================================================

export const BREAKPOINTS = {
  MOBILE: 768,
  MOBILE_SMALL: 480,
} as const

// ============================================================================
// Log Prefixes
// ============================================================================

export const LOG_PREFIX = '[ProfileTabs'

// ============================================================================
// Tab Names
// ============================================================================

export const TAB_NAMES = {
  BIOGRAPHY: 'biography',
  MEDIA: 'media',
} as const

// ============================================================================
// Hash Parameter Names
// ============================================================================

export const HASH_PARAMS = {
  TAB: 'tab',
  CHAPTER: 'chapter',
} as const

// ============================================================================
// Emojis
// ============================================================================

export const EMOJIS = {
  BIOGRAPHY: '📖',
  GALLERY: '🖼️',
  CHAPTER: '📄',
  INTRODUCTION: '📖',
  BANNER_ARROW: '⬇️',
  
  // Document icons
  PDF: '📕',
  DOC: '📘',
  XLS: '📊',
  TXT: '📄',
  IMAGE: '🖼️',
} as const

// ============================================================================
// Messages
// ============================================================================

export const MESSAGES = {
  LOADING_CHAPTER: 'Loading chapter...',
  LOADING_GALLERY: 'Loading gallery...',
  EMPTY_GALLERY: 'No images or documents available',
  ERROR_LOADING_GALLERY: 'Error loading gallery',
  ERROR_LOADING_CHAPTER: 'Error loading chapter',
  NO_CHAPTERS: 'No chapters index found',
  NO_MEDIA: 'No media index found',
  BIOGRAPHY_BANNER: '📖 View Biography Chapters Below ⬇️',
} as const

// ============================================================================
// Scroll Behavior
// ============================================================================

export const SCROLL_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'start',
} as const

// ============================================================================
// Cache Busting
// ============================================================================

export const CACHE_BUST_PARAM = 't'

// ============================================================================
// HTML Placeholder Patterns
// ============================================================================

export const PLACEHOLDERS = {
  HTML_BLOCK: '___HTML_BLOCK_',
  HTML_BLOCK_END: '___',
} as const

// ============================================================================
// Markdown Patterns
// ============================================================================

export const MD_PATTERNS = {
  CODE_BLOCK: /```(\w+)?\s*([\s\S]*?)```/g,
  IMAGE_WIKI: /!\[\[([^\]]+)\]\]/g,
  LINK_PROFILE: /\[([^\]]+)\]\((\/profiles\/[^)]+)\)/g,
  LINK_WIKI: /\[\[([^\]]+)\]\]/g,
  ORDERED_LIST: /^(\d+)\.\s+(.*)$/,
  HEADER_3: /^### (.*$)/gim,
  HEADER_2: /^## (.*$)/gim,
  HEADER_1: /^# (.*$)/gim,
  BOLD: /\*\*(.*?)\*\*/g,
  ITALIC_STAR: /\*(.*?)\*/g,
  ITALIC_UNDERSCORE: /(^|[^_\w])_([^_]+)_((?=[^_\w])|$)/g,
  INLINE_CODE: /`([^`]+)`/g,
  LINE_BREAK: /  \r?\n/g,
} as const

// ============================================================================
// Document Icons Mapping
// ============================================================================

export const DOCUMENT_ICONS: Record<string, string> = {
  pdf: EMOJIS.PDF,
  doc: EMOJIS.DOC,
  docx: EMOJIS.DOC,
  xls: EMOJIS.XLS,
  xlsx: EMOJIS.XLS,
  txt: EMOJIS.TXT,
  jpg: EMOJIS.IMAGE,
  jpeg: EMOJIS.IMAGE,
  png: EMOJIS.IMAGE,
  gif: EMOJIS.IMAGE,
} as const

