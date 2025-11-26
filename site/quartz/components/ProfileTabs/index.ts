/**
 * ProfileTabs Module - נקודת כניסה ראשית
 * מייצא את כל הפונקציות הציבוריות
 */

// Main Manager
export {
  initProfileTabs,
  runOnLoad,
  forceReinitialize,
  setDebugMode,
  getProfileTabsState,
} from './ProfileTabsManager'

// Core
export { stateManager } from './core/StateManager'
export { eventManager } from './core/EventManager'
export { initializeTabs, switchTab, getActiveTab } from './core/TabManager'

// Chapters
export {
  loadChaptersIndex,
  loadChapterContent,
  findChapterInfo,
} from './chapters/ChapterLoader'
export { createChapterTabs, switchToChapter } from './chapters/ChapterManager'
export {
  navigateToChapter,
  getCurrentChapter,
  getChapterFromUrl,
} from './chapters/ChapterNavigator'

// Content
export { moveContentToBiographyTab } from './content/ContentMover'
export { MarkdownParser, parseMarkdown } from './content/MarkdownParser'
export { initializeMermaidDiagrams } from './content/MermaidInitializer'

// Media
export { loadMediaIndex, hasMedia } from './media/MediaLoader'
export { renderGallery, getDocumentIcon } from './media/GalleryRenderer'

// Utils
export { logger, getLogger } from './utils/DebugLogger'
export * as DomUtils from './utils/DomUtils'
export * as HashUtils from './utils/HashUtils'
export * as MobileUtils from './utils/MobileUtils'

// Types
export type {
  ProfileTabsState,
  TabName,
  HashParams,
  ChaptersData,
  ChapterInfo,
  MediaIndex,
  ImageInfo,
  DocumentInfo,
  LogLevel,
} from './types'

// Constants
export {
  TIMING,
  SELECTORS,
  CSS_CLASSES,
  API_PATHS,
  TAB_NAMES,
} from './constants'

