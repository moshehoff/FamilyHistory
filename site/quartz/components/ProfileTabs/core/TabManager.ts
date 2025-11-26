/**
 * TabManager - ניהול טאבים ראשיים (Biography / Gallery)
 */

import { logger } from '../utils/DebugLogger'
import { stateManager } from './StateManager'
import { eventManager } from './EventManager'
import { parseHash, updateHash, isMediaTab } from '../utils/HashUtils'
import { getElement, getElementSafe, setActiveElements, clearActiveElements } from '../utils/DomUtils'
import { loadMediaIndex, hasMedia } from '../media/MediaLoader'
import { renderGallery, renderLoadingMessage, isGalleryPopulated } from '../media/GalleryRenderer'
import type { TabName } from '../types'
import { SELECTORS, TAB_NAMES, TIMING } from '../constants'

const MODULE = 'TabManager'

/**
 * אתחול טאבים
 */
export async function initializeTabs(): Promise<void> {
  logger.time(MODULE, 'initializeTabs')
  logger.info(MODULE, 'Initializing main tabs...')

  try {
    // בדיקת קיום ProfileTabs
    const profileTabs = getElementSafe(SELECTORS.PROFILE_TABS)
    if (!profileTabs) {
      logger.debug(MODULE, 'No ProfileTabs found, skipping initialization')
      return
    }

    // קבלת נתונים מ-state
    const profileId = profileTabs.getAttribute('data-profile-id')
    const basePath = profileTabs.getAttribute('data-base-path') || ''

    if (!profileId) {
      logger.warn(MODULE, 'No profile ID found')
      return
    }

    // עדכון state
    stateManager.setState({
      profileId,
      basePath: basePath.endsWith('/') ? basePath : basePath + '/',
    })

    logger.debug(MODULE, `Profile ID: ${profileId}, Base path: ${basePath}`)

    // בדיקת תוכן מדיה
    await checkMediaContent()

    // Setup event handlers
    setupTabEventHandlers()

    // Restore tab state from URL
    setTimeout(() => {
      restoreTabFromHash()
    }, TIMING.TAB_RESTORE_INITIAL)

    logger.info(MODULE, '✓ Main tabs initialized')
    logger.timeEnd(MODULE, 'initializeTabs')
  } catch (error) {
    logger.error(MODULE, 'Error initializing tabs:', error)
    logger.timeEnd(MODULE, 'initializeTabs')
  }
}

/**
 * Setup event handlers לכפתורי טאבים
 */
function setupTabEventHandlers(): void {
  logger.debug(MODULE, 'Setting up tab event handlers...')

  const tabButtons = document.querySelectorAll(SELECTORS.TAB_BUTTON)
  let count = 0

  tabButtons.forEach((button) => {
    const tabName = button.getAttribute('data-tab') as TabName | null
    if (!tabName) return

    eventManager.addEventListener(
      button,
      'click',
      () => {
        logger.debug(MODULE, `Tab button clicked: ${tabName}`)
        switchTab(tabName)
      },
      `tab-button:${tabName}`
    )

    count++
  })

  logger.debug(MODULE, `✓ Setup ${count} tab button handlers`)
}

/**
 * מעבר בין טאבים
 */
export async function switchTab(tabName: TabName): Promise<void> {
  logger.info(MODULE, `Switching to tab: ${tabName}`)

  // עדכון UI
  updateTabUI(tabName)

  // עדכון state
  stateManager.set('activeTab', tabName)

  // עדכון URL hash
  const currentChapter = stateManager.get('activeChapter')
  updateHash(tabName, currentChapter || undefined, false)

  // טעינת תוכן אם נדרש
  if (tabName === TAB_NAMES.MEDIA as TabName) {
    await loadMediaIfNeeded()
  }

  logger.info(MODULE, `✓ Switched to tab: ${tabName}`)
}

/**
 * עדכון UI של טאבים
 */
function updateTabUI(tabName: TabName): void {
  logger.debug(MODULE, `Updating tab UI: ${tabName}`)

  // הסרת active מכל הכפתורים וה-panes
  clearActiveElements(SELECTORS.TAB_BUTTON)
  clearActiveElements(SELECTORS.TAB_PANE)

  // הוספת active לכפתור וה-pane הנכונים
  const buttonSelector = `${SELECTORS.TAB_BUTTON}[data-tab="${tabName}"]`
  const paneSelector = `${SELECTORS.TAB_PANE}[data-tab-content="${tabName}"]`

  setActiveElements([buttonSelector, paneSelector])
}

/**
 * בדיקת תוכן מדיה והצגת/הסתרת טאב Gallery
 */
async function checkMediaContent(): Promise<void> {
  logger.debug(MODULE, 'Checking media content...')

  const profileId = stateManager.get('profileId')
  const basePath = stateManager.get('basePath')
  const mediaTabButton = getElementSafe(SELECTORS.MEDIA_TAB_BUTTON)

  if (!profileId || !mediaTabButton) {
    logger.debug(MODULE, 'Cannot check media - missing profileId or button')
    return
  }

  try {
    const mediaIndex = await loadMediaIndex(basePath)

    if (hasMedia(mediaIndex, profileId)) {
      mediaTabButton.style.display = 'block'
      logger.info(MODULE, `✓ Media tab shown (profile has media)`)
    } else {
      mediaTabButton.style.display = 'none'
      logger.debug(MODULE, 'Media tab hidden (no media)')
    }
  } catch (error) {
    logger.error(MODULE, 'Error checking media content:', error)
    if (mediaTabButton) {
      mediaTabButton.style.display = 'none'
    }
  }
}

/**
 * טעינת מדיה אם נדרש
 */
async function loadMediaIfNeeded(): Promise<void> {
  const mediaLoaded = stateManager.get('mediaLoaded')
  if (mediaLoaded) {
    logger.debug(MODULE, 'Media already loaded')
    return
  }

  logger.info(MODULE, 'Loading media...')

  const profileId = stateManager.get('profileId')
  const basePath = stateManager.get('basePath')
  const mediaPane = getElementSafe(SELECTORS.MEDIA_TAB_PANE)
  const mediaContent = mediaPane?.querySelector(SELECTORS.MEDIA_CONTENT)

  if (!profileId || !mediaContent) {
    logger.error(MODULE, 'Cannot load media - missing profileId or content element')
    return
  }

  // בדיקה אם כבר יש תוכן
  if (isGalleryPopulated(mediaContent)) {
    logger.debug(MODULE, 'Gallery already populated')
    stateManager.set('mediaLoaded', true)
    return
  }

  try {
    // הצגת loading
    renderLoadingMessage(mediaContent)

    // טעינת media index
    const mediaIndex = await loadMediaIndex(basePath)

    if (!mediaIndex) {
      logger.warn(MODULE, 'No media index found')
      return
    }

    // קבלת נתוני מדיה
    const images = mediaIndex.images[profileId] || []
    const documents = mediaIndex.documents[profileId] || []

    logger.info(MODULE, `Found ${images.length} images, ${documents.length} documents`)

    // רינדור גלריה
    renderGallery(mediaContent, images, documents, profileId, basePath)

    // סימון שהמדיה נטענה
    stateManager.set('mediaLoaded', true)

    logger.info(MODULE, '✓ Media loaded successfully')
  } catch (error) {
    logger.error(MODULE, 'Error loading media:', error)
  }
}

/**
 * Restore tab state from URL hash
 */
export function restoreTabFromHash(): void {
  const hash = parseHash()

  if (!hash.tab) {
    logger.debug(MODULE, 'No tab in hash, using default')
    return
  }

  logger.info(MODULE, `Restoring tab from hash: ${hash.tab}`)

  // עדכון UI
  updateTabUI(hash.tab)

  // עדכון state
  stateManager.set('activeTab', hash.tab)

  // טעינת תוכן אם נדרש
  if (hash.tab === TAB_NAMES.MEDIA) {
    loadMediaIfNeeded()
  }
}

/**
 * קבלת הטאב הפעיל כרגע
 */
export function getActiveTab(): TabName {
  return stateManager.get('activeTab')
}

/**
 * בדיקה האם טאב ספציפי פעיל
 */
export function isTabActive(tabName: TabName): boolean {
  return getActiveTab() === tabName
}

/**
 * איפוס טאבים (לשימוש בניווט)
 */
export function resetTabs(): void {
  logger.info(MODULE, 'Resetting tabs')

  // איפוס state
  stateManager.setState({
    mediaLoaded: false,
    activeTab: TAB_NAMES.BIOGRAPHY as TabName,
  })

  // ניקוי event handlers
  // (יתבצע דרך eventManager.removeAllListeners())
}

/**
 * log מצב הטאבים
 */
export function logTabState(): void {
  const activeTab = getActiveTab()
  const mediaLoaded = stateManager.get('mediaLoaded')

  logger.group(MODULE, 'Tab State')
  logger.info(MODULE, `Active tab: ${activeTab}`)
  logger.info(MODULE, `Media loaded: ${mediaLoaded}`)
  logger.info(MODULE, `URL hash: ${window.location.hash}`)
  logger.groupEnd()
}

