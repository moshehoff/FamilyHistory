/**
 * ProfileTabsManager - המנהל המרכזי של ProfileTabs
 * מתאם בין כל המודולים ומנהל את מחזור החיים
 */

import { logger } from './utils/DebugLogger'
import { stateManager } from './core/StateManager'
import { eventManager } from './core/EventManager'
import { initializeTabs, resetTabs } from './core/TabManager'
import { moveContentToBiographyTab } from './content/ContentMover'
import { loadChaptersIndex } from './chapters/ChapterLoader'
import { createChapterTabs } from './chapters/ChapterManager'
import { getChapterFromUrl, shouldAutoScroll, handlePopstate } from './chapters/ChapterNavigator'
import { getElementSafe } from './utils/DomUtils'
import { logDeviceInfo } from './utils/MobileUtils'
import { SELECTORS, TIMING } from './constants'

const MODULE = 'ProfileTabsManager'

/**
 * אתחול ProfileTabs - הפונקציה הראשית
 */
export async function initProfileTabs(): Promise<void> {
  logger.time(MODULE, 'initProfileTabs')
  logger.info(MODULE, '🚀 Initializing ProfileTabs...')

  // בדיקת קיום ProfileTabs
  const profileTabs = getElementSafe(SELECTORS.PROFILE_TABS)
  if (!profileTabs) {
    logger.debug(MODULE, 'No ProfileTabs found, skipping initialization')
    return
  }

  // Log device info (helpful for debugging mobile issues)
  if (logger.getHistory().length === 0) {
    // Only on first init
    logDeviceInfo()
  }

  try {
    // שלב 1: איפוס state מניווט קודם
    stateManager.reset()

    // שלב 2: העברת תוכן לטאב Biography
    await moveContentToBiographyTab()
    logger.debug(MODULE, '✓ Content moved to Biography tab')

    // שלב 3: אתחול טאבים ראשיים
    await initializeTabs()
    logger.debug(MODULE, '✓ Main tabs initialized')

    // שלב 4: טעינה ויצירת chapter tabs
    await initializeChapters()
    logger.debug(MODULE, '✓ Chapters initialized')

    // שלב 5: Setup global event handlers
    setupGlobalEventHandlers()
    logger.debug(MODULE, '✓ Global event handlers setup')

    // שלב 6: Log final state
    stateManager.logState()

    logger.info(MODULE, '✅ ProfileTabs initialization complete!')
    logger.timeEnd(MODULE, 'initProfileTabs')
  } catch (error) {
    logger.error(MODULE, 'Error during initialization:', error)
    logger.timeEnd(MODULE, 'initProfileTabs')
  }
}

/**
 * אתחול chapters
 */
async function initializeChapters(): Promise<void> {
  logger.debug(MODULE, 'Initializing chapters...')

  const profileId = stateManager.get('profileId')
  const basePath = stateManager.get('basePath')

  if (!profileId) {
    logger.debug(MODULE, 'No profileId, skipping chapters')
    return
  }

  // טעינת chapters index
  const chaptersData = await loadChaptersIndex(profileId, basePath)

  if (!chaptersData) {
    logger.debug(MODULE, 'No chapters data found')
    return
  }

  // שמירה ב-state
  stateManager.set('chaptersData', chaptersData)

  // קבלת biography pane
  const biographyPane = getElementSafe(SELECTORS.BIOGRAPHY_TAB_PANE)
  if (!biographyPane) {
    logger.error(MODULE, 'Biography pane not found')
    return
  }

  // קביעת הפרק הראשוני
  const initialChapter = determineInitialChapter(chaptersData)

  // יצירת chapter tabs
  setTimeout(async () => {
    await createChapterTabs(biographyPane, chaptersData, initialChapter || undefined)
  }, TIMING.CHAPTER_TABS_DELAY)
}

/**
 * קביעת הפרק הראשוני לטעינה
 */
function determineInitialChapter(chaptersData: any): string | null {
  // בדיקה אם יש chapter ב-URL
  const urlChapter = getChapterFromUrl()

  if (urlChapter) {
    logger.debug(MODULE, `Initial chapter from URL: ${urlChapter}`)
    return urlChapter
  }

  // אחרת, הפרק הראשי (main)
  if (chaptersData.main) {
    logger.debug(MODULE, `Initial chapter: main (${chaptersData.main.slug})`)
    return chaptersData.main.slug
  }

  // אחרת, הפרק הראשון
  if (chaptersData.chapters.length > 0) {
    const firstChapter = chaptersData.chapters[0].slug
    logger.debug(MODULE, `Initial chapter: first (${firstChapter})`)
    return firstChapter
  }

  return null
}

/**
 * Setup global event handlers (popstate, etc.)
 */
function setupGlobalEventHandlers(): void {
  logger.debug(MODULE, 'Setting up global event handlers...')

  // Popstate handler (back/forward buttons)
  eventManager.addEventListener(
    window,
    'popstate',
    (event) => {
      logger.debug(MODULE, 'Popstate event detected')
      handlePopstate(event as PopStateEvent)
    },
    'popstate-handler'
  )

  // Navigation handler (SPA navigation)
  eventManager.addEventListener(
    document,
    'nav',
    () => {
      logger.info(MODULE, 'Navigation event detected - reinitializing')
      cleanup()
      // Re-initialize after navigation
      setTimeout(() => {
        initProfileTabs()
      }, TIMING.DOM_READY_MEDIUM)
    },
    'nav-handler'
  )
}

/**
 * ניקוי לפני navigation
 */
function cleanup(): void {
  logger.info(MODULE, '🧹 Cleaning up...')

  // ניקוי event listeners
  eventManager.removeAllListeners()

  // איפוס טאבים
  resetTabs()

  // ניקוי chapter cache (optional - ניתן להשאיר לביצועים)
  // stateManager.clearChapterCache()

  logger.debug(MODULE, '✓ Cleanup complete')
}

/**
 * הרצה ראשונית
 */
export function runOnLoad(): void {
  logger.info(MODULE, '📍 Running on initial load')
  initProfileTabs()
}

/**
 * Export for testing/debugging
 */
export function getProfileTabsState() {
  return {
    state: stateManager.getState(),
    activeListeners: eventManager.getActiveListenersCount(),
    logger: {
      history: logger.getHistory(),
      stats: () => logger.printStats(),
    },
  }
}

/**
 * Force reinitialize (for debugging)
 */
export function forceReinitialize(): void {
  logger.warn(MODULE, '⚠️ Force reinitialization requested')
  cleanup()
  initProfileTabs()
}

/**
 * Enable/Disable debug mode
 */
export function setDebugMode(enabled: boolean): void {
  if (enabled) {
    logger.enable()
    logger.setLevel('DEBUG')
    logger.info(MODULE, '🐛 Debug mode enabled')
  } else {
    logger.setLevel('INFO')
    logger.info(MODULE, 'Debug mode disabled')
  }
}

