/**
 * ChapterNavigator - ניווט בין פרקים וניהול history
 */

import { logger } from '../utils/DebugLogger'
import { stateManager } from '../core/StateManager'
import { updateHash, parseHash } from '../utils/HashUtils'
import { scrollToElement } from '../utils/DomUtils'
import { SELECTORS, SCROLL_OPTIONS } from '../constants'
import type { TabName } from '../types'

const MODULE = 'ChapterNav'

/**
 * ניווט לפרק
 * @param chapterSlug - slug של הפרק
 * @param fromPopstate - האם זה מגיע מ-popstate (back/forward button)
 * @param shouldScroll - האם לבצע scroll לפרק
 */
export function navigateToChapter(
  chapterSlug: string,
  fromPopstate: boolean = false,
  shouldScroll: boolean = false
): void {
  logger.info(MODULE, `Navigating to chapter: ${chapterSlug}`, {
    fromPopstate,
    shouldScroll,
  })

  // ניקוי slug
  const cleanSlug = cleanChapterSlug(chapterSlug)

  // עדכון state
  stateManager.set('activeChapter', cleanSlug)

  // עדכון URL hash (אם לא מגיע מ-popstate)
  if (!fromPopstate) {
    const useReplace = stateManager.get('isInitialLoad')
    updateHash('biography' as TabName, cleanSlug, useReplace)

    // סימון שהטעינה הראשונית הושלמה
    if (useReplace) {
      stateManager.markInitialLoadComplete()
    }
  }

  // Scroll אם נדרש
  if (shouldScroll) {
    scrollToChapter(cleanSlug)
  }

  logger.debug(MODULE, `✓ Navigated to chapter: ${cleanSlug}`)
}

/**
 * ניקוי chapter slug מפרמטרים מיותרים
 */
export function cleanChapterSlug(slug: string): string {
  return slug.split('&')[0].split('#')[0].trim()
}

/**
 * Scroll לפרק
 */
export function scrollToChapter(chapterSlug: string, delay: number = 500): void {
  logger.debug(MODULE, `Scrolling to chapter: ${chapterSlug} (delay: ${delay}ms)`)

  setTimeout(() => {
    // ניסיון 1: scroll לתוכן של chapter tabs
    const success = scrollToElement(SELECTORS.CHAPTER_TABS_CONTAINER, SCROLL_OPTIONS)

    if (!success) {
      // ניסיון 2: scroll לחלונית הפרק עצמה
      const paneSelector = `.${SELECTORS.CHAPTER_TAB_PANE.substring(1)}[data-chapter-slug="${chapterSlug}"].active`
      scrollToElement(paneSelector, SCROLL_OPTIONS)
    }
  }, delay)
}

/**
 * קבלת chapter slug מה-URL
 */
export function getChapterFromUrl(): string | null {
  const hash = parseHash()
  return hash.chapter || null
}

/**
 * בדיקה האם צריך לעשות scroll אוטומטי (לפי hash)
 */
export function shouldAutoScroll(): boolean {
  const hash = window.location.hash

  // רק אם יש #chapter= בלבד (לא כשלוחצים על link רגיל לפרופיל)
  return hash.includes('#chapter=')
}

/**
 * קבלת chapter מה-hash הנוכחי
 */
export function getCurrentChapter(): string | null {
  return stateManager.get('activeChapter')
}

/**
 * האם chapter ספציפי פעיל כרגע
 */
export function isChapterActive(slug: string): boolean {
  return getCurrentChapter() === slug
}

/**
 * Restore chapter state from URL
 */
export function restoreChapterFromUrl(shouldScroll: boolean = true): void {
  const chapterSlug = getChapterFromUrl()

  if (chapterSlug) {
    logger.info(MODULE, `Restoring chapter from URL: ${chapterSlug}`)
    navigateToChapter(chapterSlug, true, shouldScroll)
  }
}

/**
 * טיפול ב-popstate (back/forward buttons)
 */
export function handlePopstate(event: PopStateEvent): void {
  logger.debug(MODULE, 'Popstate event received', {
    state: event.state,
    hash: window.location.hash,
  })

  const hash = parseHash()

  // בדיקה אם יש chapter ב-hash
  if (hash.chapter) {
    logger.info(MODULE, `Popstate: navigating to chapter ${hash.chapter}`)
    navigateToChapter(hash.chapter, true, false)
  } else {
    // אין chapter - לך ל-default (main chapter)
    const chaptersData = stateManager.get('chaptersData')
    if (chaptersData?.main) {
      logger.info(MODULE, `Popstate: no chapter in hash, going to default`)
      navigateToChapter(chaptersData.main.slug, true, false)
    }
  }
}

/**
 * עדכון active state של chapter buttons
 */
export function updateChapterButtonsState(activeSlug: string): void {
  logger.debug(MODULE, `Updating chapter buttons state: ${activeSlug}`)

  // הסרת active מכל הכפתורים
  const buttons = document.querySelectorAll('.chapter-tab-button')
  buttons.forEach((btn) => btn.classList.remove('active'))

  // הוספת active לכפתור הנכון
  const activeButton = document.querySelector(
    `.chapter-tab-button[data-chapter-slug="${activeSlug}"]`
  )
  if (activeButton) {
    activeButton.classList.add('active')
    logger.debug(MODULE, `✓ Active button updated`)
  } else {
    logger.warn(MODULE, `Button not found for slug: ${activeSlug}`)
  }
}

/**
 * עדכון active state של chapter panes
 */
export function updateChapterPanesState(activeSlug: string): void {
  logger.debug(MODULE, `Updating chapter panes state: ${activeSlug}`)

  // הסרת active מכל ה-panes
  const panes = document.querySelectorAll('.chapter-tab-pane')
  panes.forEach((pane) => pane.classList.remove('active'))

  // הוספת active ל-pane הנכון
  const activePane = document.querySelector(
    `.chapter-tab-pane[data-chapter-slug="${activeSlug}"]`
  )
  if (activePane) {
    activePane.classList.add('active')
    logger.debug(MODULE, `✓ Active pane updated`)
  } else {
    logger.warn(MODULE, `Pane not found for slug: ${activeSlug}`)
  }
}

/**
 * Log navigation state
 */
export function logNavigationState(): void {
  const currentChapter = getCurrentChapter()
  const urlChapter = getChapterFromUrl()
  const hash = window.location.hash

  logger.group(MODULE, 'Navigation State')
  logger.info(MODULE, `Current chapter: ${currentChapter || 'none'}`)
  logger.info(MODULE, `URL chapter: ${urlChapter || 'none'}`)
  logger.info(MODULE, `URL hash: ${hash || 'none'}`)
  logger.info(MODULE, `Should auto-scroll: ${shouldAutoScroll()}`)
  logger.groupEnd()
}

