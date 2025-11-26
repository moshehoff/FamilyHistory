/**
 * ChapterManager - יצירה וניהול של chapter tabs UI
 */

import { logger } from '../utils/DebugLogger'
import { stateManager } from '../core/StateManager'
import { eventManager } from '../core/EventManager'
import { createElement } from '../utils/DomUtils'
import { isMobile, removeEmojiFromButton } from '../utils/MobileUtils'
import { navigateToChapter, updateChapterButtonsState, updateChapterPanesState } from './ChapterNavigator'
import { loadChapterContent, findChapterInfo } from './ChapterLoader'
import { initializeMermaidDiagrams } from '../content/MermaidInitializer'
import type { ChaptersData } from '../types'
import { CSS_CLASSES, EMOJIS, MESSAGES, TIMING } from '../constants'

const MODULE = 'ChapterManager'

/**
 * יצירת chapter tabs UI
 */
export async function createChapterTabs(
  container: Element,
  chaptersData: ChaptersData,
  initialChapterSlug?: string
): Promise<void> {
  logger.time(MODULE, 'createChapterTabs')
  logger.info(MODULE, 'Creating chapter tabs...', { initialChapterSlug })

  // הסרת chapter tabs קיימים
  const existing = container.querySelector(`.${CSS_CLASSES.CHAPTER_TABS_CONTAINER}`)
  if (existing) {
    existing.remove()
    logger.debug(MODULE, 'Removed existing chapter tabs')
  }

  // יצירת container
  const chapterTabsContainer = createElement('div', {
    class: CSS_CLASSES.CHAPTER_TABS_CONTAINER,
  })

  // הוספת Biography heading
  const heading = createElement('h2', {
    class: CSS_CLASSES.BIOGRAPHY_HEADING,
  })
  heading.textContent = 'Biography'
  chapterTabsContainer.appendChild(heading)

  // יצירת header (כפתורים)
  const header = createChapterTabsHeader(chaptersData, initialChapterSlug)
  chapterTabsContainer.appendChild(header)

  // יצירת content (panes)
  const content = createChapterTabsContent(chaptersData, initialChapterSlug)
  chapterTabsContainer.appendChild(content)

  // הוספה ל-container
  container.appendChild(chapterTabsContainer)

  // Setup event handlers
  setupChapterEventHandlers()

  // טעינת הפרק הראשוני
  if (initialChapterSlug) {
    await loadAndDisplayChapter(initialChapterSlug)
  } else if (chaptersData.main) {
    await loadAndDisplayChapter(chaptersData.main.slug)
  }

  logger.info(MODULE, '✓ Chapter tabs created')
  logger.timeEnd(MODULE, 'createChapterTabs')
}

/**
 * יצירת header של chapter tabs
 */
function createChapterTabsHeader(
  chaptersData: ChaptersData,
  initialChapterSlug?: string
): HTMLElement {
  const header = createElement('div', {
    class: CSS_CLASSES.CHAPTER_TABS_HEADER,
  })

  const mobile = isMobile()

  // הוספת main chapter (Introduction)
  if (chaptersData.main) {
    const isActive = initialChapterSlug
      ? initialChapterSlug === chaptersData.main.slug
      : true // default active

    const button = createElement('button', {
      class: `${CSS_CLASSES.CHAPTER_TAB_BUTTON}${isActive ? ' active' : ''}`,
      'data-chapter-tab': 'introduction',
      'data-chapter-slug': chaptersData.main.slug,
    })

    button.textContent = mobile ? 'Introduction' : `${EMOJIS.INTRODUCTION} Introduction`
    header.appendChild(button)
  }

  // הוספת chapters
  chaptersData.chapters.forEach((chapter, index) => {
    const isActive = initialChapterSlug === chapter.slug

    const button = createElement('button', {
      class: `${CSS_CLASSES.CHAPTER_TAB_BUTTON}${isActive ? ' active' : ''}`,
      'data-chapter-tab': `chapter-${index + 1}`,
      'data-chapter-slug': chapter.slug,
    })

    button.textContent = mobile ? chapter.title : `${EMOJIS.CHAPTER} ${chapter.title}`
    header.appendChild(button)
  })

  return header
}

/**
 * יצירת content של chapter tabs
 */
function createChapterTabsContent(
  chaptersData: ChaptersData,
  initialChapterSlug?: string
): HTMLElement {
  const content = createElement('div', {
    class: CSS_CLASSES.CHAPTER_TABS_CONTENT,
  })

  // Main chapter pane
  if (chaptersData.main) {
    const isActive = initialChapterSlug
      ? initialChapterSlug === chaptersData.main.slug
      : true

    const pane = createElement('div', {
      class: `${CSS_CLASSES.CHAPTER_TAB_PANE}${isActive ? ' active' : ''}`,
      'data-chapter-tab-content': 'introduction',
      'data-chapter-slug': chaptersData.main.slug,
    })

    pane.innerHTML = `<div class="${CSS_CLASSES.LOADING_MESSAGE}">${MESSAGES.LOADING_CHAPTER}</div>`
    content.appendChild(pane)
  }

  // Chapters panes
  chaptersData.chapters.forEach((chapter, index) => {
    const isActive = initialChapterSlug === chapter.slug

    const pane = createElement('div', {
      class: `${CSS_CLASSES.CHAPTER_TAB_PANE}${isActive ? ' active' : ''}`,
      'data-chapter-tab-content': `chapter-${index + 1}`,
      'data-chapter-slug': chapter.slug,
    })

    pane.innerHTML = `<div class="${CSS_CLASSES.LOADING_MESSAGE}">${MESSAGES.LOADING_CHAPTER}</div>`
    content.appendChild(pane)
  })

  return content
}

/**
 * Setup event handlers לכפתורי chapter
 */
function setupChapterEventHandlers(): void {
  logger.debug(MODULE, 'Setting up chapter event handlers...')

  const buttons = document.querySelectorAll(`.${CSS_CLASSES.CHAPTER_TAB_BUTTON}`)
  let count = 0

  buttons.forEach((button) => {
    const chapterSlug = button.getAttribute('data-chapter-slug')
    if (!chapterSlug) return

    const cleanup = eventManager.addEventListener(
      button,
      'click',
      () => {
        logger.debug(MODULE, `Chapter button clicked: ${chapterSlug}`)
        switchToChapter(chapterSlug)
      },
      `chapter-button:${chapterSlug}`
    )

    count++
  })

  logger.debug(MODULE, `✓ Setup ${count} chapter button handlers`)
}

/**
 * מעבר לפרק (switch)
 */
export async function switchToChapter(chapterSlug: string): Promise<void> {
  logger.info(MODULE, `Switching to chapter: ${chapterSlug}`)

  // עדכון UI
  updateChapterButtonsState(chapterSlug)
  updateChapterPanesState(chapterSlug)

  // עדכון navigation
  navigateToChapter(chapterSlug, false, false)

  // טעינת תוכן
  await loadAndDisplayChapter(chapterSlug)

  logger.info(MODULE, `✓ Switched to chapter: ${chapterSlug}`)
}

/**
 * טעינה ותצוגה של פרק
 */
async function loadAndDisplayChapter(chapterSlug: string): Promise<void> {
  logger.debug(MODULE, `Loading and displaying chapter: ${chapterSlug}`)

  const profileId = stateManager.get('profileId')
  const basePath = stateManager.get('basePath')

  if (!profileId) {
    logger.error(MODULE, 'No profileId in state')
    return
  }

  // טעינת תוכן
  const html = await loadChapterContent(chapterSlug, profileId, basePath)

  if (!html) {
    logger.error(MODULE, `Failed to load chapter content: ${chapterSlug}`)
    displayChapterError(chapterSlug)
    return
  }

  // תצוגת תוכן
  displayChapter(chapterSlug, html)

  logger.debug(MODULE, `✓ Chapter displayed: ${chapterSlug}`)
}

/**
 * תצוגת תוכן פרק
 */
function displayChapter(chapterSlug: string, html: string): void {
  const pane = document.querySelector(
    `.${CSS_CLASSES.CHAPTER_TAB_PANE}[data-chapter-slug="${chapterSlug}"]`
  )

  if (!pane) {
    logger.error(MODULE, `Pane not found for slug: ${chapterSlug}`)
    return
  }

  // הצגת תוכן
  pane.innerHTML = html

  // המרת chapter links לכפתורים פעילים
  setupChapterLinks(pane)

  // אתחול Mermaid
  setTimeout(() => {
    initializeMermaidDiagrams(pane, { delay: TIMING.MERMAID_INIT_DELAY })
  }, TIMING.MERMAID_INIT_DELAY)
}

/**
 * תצוגת שגיאה בפרק
 */
function displayChapterError(chapterSlug: string): void {
  const pane = document.querySelector(
    `.${CSS_CLASSES.CHAPTER_TAB_PANE}[data-chapter-slug="${chapterSlug}"]`
  )

  if (pane) {
    pane.innerHTML = `<div class="${CSS_CLASSES.EMPTY_MESSAGE}">${MESSAGES.ERROR_LOADING_CHAPTER}</div>`
  }
}

/**
 * Setup chapter links (קישורים בין פרקים)
 */
function setupChapterLinks(container: Element): void {
  const links = container.querySelectorAll(`.${CSS_CLASSES.CHAPTER_LINK}`)
  logger.debug(MODULE, `Setting up ${links.length} chapter links`)

  links.forEach((link) => {
    const targetSlug = link.getAttribute('data-chapter-slug')
    if (!targetSlug) return

    eventManager.addEventListener(
      link,
      'click',
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        logger.debug(MODULE, `Chapter link clicked: ${targetSlug}`)
        switchToChapter(targetSlug)
      },
      `chapter-link:${targetSlug}`
    )
  })
}

/**
 * הסרת chapter tabs
 */
export function removeChapterTabs(container: Element): void {
  const chapterTabs = container.querySelector(`.${CSS_CLASSES.CHAPTER_TABS_CONTAINER}`)
  if (chapterTabs) {
    chapterTabs.remove()
    logger.debug(MODULE, 'Chapter tabs removed')
  }
}

/**
 * בדיקה האם chapter tabs קיימים
 */
export function hasChapterTabs(container: Element): boolean {
  return container.querySelector(`.${CSS_CLASSES.CHAPTER_TABS_CONTAINER}`) !== null
}

/**
 * סטטיסטיקות של chapter tabs
 */
export function logChapterTabsStats(container: Element): void {
  const chapterTabs = container.querySelector(`.${CSS_CLASSES.CHAPTER_TABS_CONTAINER}`)
  if (!chapterTabs) {
    logger.info(MODULE, 'No chapter tabs found')
    return
  }

  const buttons = chapterTabs.querySelectorAll(`.${CSS_CLASSES.CHAPTER_TAB_BUTTON}`)
  const panes = chapterTabs.querySelectorAll(`.${CSS_CLASSES.CHAPTER_TAB_PANE}`)
  const activeButton = chapterTabs.querySelector(`.${CSS_CLASSES.CHAPTER_TAB_BUTTON}.active`)
  const activePane = chapterTabs.querySelector(`.${CSS_CLASSES.CHAPTER_TAB_PANE}.active`)

  logger.group(MODULE, 'Chapter Tabs Statistics')
  logger.info(MODULE, `Total buttons: ${buttons.length}`)
  logger.info(MODULE, `Total panes: ${panes.length}`)
  logger.info(MODULE, `Active button: ${activeButton?.getAttribute('data-chapter-slug') || 'none'}`)
  logger.info(MODULE, `Active pane: ${activePane?.getAttribute('data-chapter-slug') || 'none'}`)
  logger.groupEnd()
}

