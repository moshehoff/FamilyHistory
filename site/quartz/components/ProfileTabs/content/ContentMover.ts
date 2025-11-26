/**
 * ContentMover - העברת תוכן מ-article לטאב Biography
 * מטפל בסידור, ניקוי placeholders, ואתחול Mermaid
 */

import { logger } from '../utils/DebugLogger'
import { SELECTORS, CSS_CLASSES, TIMING } from '../constants'
import { getElement, getElementSafe, getElements, moveElement } from '../utils/DomUtils'
import { initializeMermaidAfterMove } from './MermaidInitializer'
import type { ContentElement } from '../types'

const MODULE = 'ContentMover'

/**
 * העברת ProfileTabs ל-article (אם הוא ב-afterBody)
 */
export function moveProfileTabsToArticle(): boolean {
  logger.debug(MODULE, 'Attempting to move ProfileTabs to article...')

  const profileTabs = getElementSafe(SELECTORS.PROFILE_TABS)
  const article = getElementSafe(SELECTORS.ARTICLE)

  if (!profileTabs || !article) {
    logger.debug(MODULE, 'ProfileTabs or article not found')
    return false
  }

  // בדיקה אם כבר ב-article
  if (profileTabs.parentElement === article) {
    logger.debug(MODULE, 'ProfileTabs already in article')
    return true
  }

  // העברה
  article.appendChild(profileTabs)
  logger.info(MODULE, '✓ ProfileTabs moved to article')
  return true
}

/**
 * העברת תוכן לטאב Biography
 */
export async function moveContentToBiographyTab(): Promise<boolean> {
  logger.time(MODULE, 'moveContentToBiographyTab')
  logger.info(MODULE, 'Moving content to Biography tab...')

  try {
    const profileTabs = getElement(SELECTORS.PROFILE_TABS)
    const biographyPane = getElement(SELECTORS.BIOGRAPHY_TAB_PANE)
    const article = getElement(SELECTORS.ARTICLE)

    // העברת ProfileTabs ל-article תחילה
    if (profileTabs.parentElement !== article) {
      article.appendChild(profileTabs)
      logger.debug(MODULE, '✓ Moved ProfileTabs to article')
    }

    // קבלת כל הילדים של article
    const articleChildren = Array.from(article.children)

    // מציאת מיקום ProfileTabs
    const profileTabsIndex = articleChildren.indexOf(profileTabs)
    if (profileTabsIndex === -1) {
      logger.error(MODULE, 'ProfileTabs not found in article children')
      return false
    }

    logger.debug(MODULE, `ProfileTabs is at index ${profileTabsIndex} of ${articleChildren.length} children`)

    // אם אין תוכן לפני ProfileTabs, אין מה להעביר
    if (profileTabsIndex === 0) {
      logger.debug(MODULE, 'No content before ProfileTabs, nothing to move')
      logger.timeEnd(MODULE, 'moveContentToBiographyTab')
      return true
    }

    // רשימת אלמנטים להעברה
    const elementsToMove = articleChildren.slice(0, profileTabsIndex)
    logger.debug(MODULE, `Found ${elementsToMove.length} elements to process`)

    // ניקוי placeholders
    const cleanedElements = cleanPlaceholders(elementsToMove)
    logger.debug(MODULE, `After cleaning placeholders: ${cleanedElements.length} elements`)

    // סידור האלמנטים
    const sortedElements = sortContentElements(cleanedElements)
    logger.debug(MODULE, 'Elements sorted by type')

    // ניקוי biography pane מ-placeholders קיימים
    cleanBiographyPane(biographyPane)

    // שמירת chapter tabs אם קיימים
    const existingChapterTabs = biographyPane.querySelector(`.${CSS_CLASSES.CHAPTER_TABS_CONTAINER}`)

    // ניקוי תוכן קיים (חוץ מ-chapter tabs)
    const existingChildren = Array.from(biographyPane.children)
    existingChildren.forEach((child) => {
      if (child !== existingChapterTabs) {
        child.remove()
      }
    })

    // העברת האלמנטים
    sortedElements.forEach((element) => {
      if (existingChapterTabs) {
        biographyPane.insertBefore(element, existingChapterTabs)
      } else {
        biographyPane.appendChild(element)
      }
    })

    logger.info(MODULE, `✓ Moved ${sortedElements.length} elements to Biography tab`)

    // אתחול Mermaid
    setTimeout(() => {
      initializeMermaidAfterMove(biographyPane, TIMING.MERMAID_MOVE_DELAY)
    }, TIMING.MERMAID_MOVE_DELAY)

    logger.timeEnd(MODULE, 'moveContentToBiographyTab')
    return true
  } catch (error) {
    logger.error(MODULE, 'Error moving content:', error)
    logger.timeEnd(MODULE, 'moveContentToBiographyTab')
    return false
  }
}

/**
 * ניקוי placeholders מרשימת אלמנטים
 */
function cleanPlaceholders(elements: Element[]): Element[] {
  logger.debug(MODULE, 'Cleaning placeholders...')

  const cleaned: Element[] = []
  let skipNext = false

  elements.forEach((element, index) => {
    if (skipNext) {
      skipNext = false
      return
    }

    const tagName = element.tagName?.toLowerCase()
    const text = element.textContent?.trim()

    // בדיקה ל-placeholder Biography heading
    if (tagName === 'h2' && text === 'Biography') {
      const nextSibling = element.nextElementSibling

      // אם הבא הוא placeholder text
      if (nextSibling?.textContent?.includes('chapters will be loaded')) {
        logger.debug(MODULE, 'Removing placeholder Biography heading and text')
        skipNext = true
        nextSibling.remove()
        element.remove()
        return
      } else {
        // Biography heading עם תוכן אמיתי - מסירים רק את הכותרת
        logger.debug(MODULE, 'Removing Biography heading (keeping content)')
        element.remove()
        return
      }
    }

    // הסרת placeholder paragraphs
    if (tagName === 'p' && text?.includes('chapters will be loaded')) {
      logger.debug(MODULE, 'Removing placeholder paragraph')
      element.remove()
      return
    }

    // שמירת האלמנט
    cleaned.push(element)
  })

  return cleaned.filter((el) => el.parentElement !== null)
}

/**
 * ניקוי Biography pane מ-placeholders
 */
function cleanBiographyPane(biographyPane: Element): void {
  logger.debug(MODULE, 'Cleaning Biography pane...')

  // הסרת Biography heading
  const biographyHeading = biographyPane.querySelector('h2')
  if (
    biographyHeading &&
    (biographyHeading.textContent?.trim() === 'Biography' ||
      biographyHeading.textContent?.trim().includes('Biography'))
  ) {
    const nextSibling = biographyHeading.nextElementSibling
    if (nextSibling?.textContent?.includes('chapters will be loaded')) {
      nextSibling.remove()
    }
    biographyHeading.remove()
    logger.debug(MODULE, '✓ Removed Biography heading from pane')
  }

  // הסרת placeholder paragraphs
  const placeholders = biographyPane.querySelectorAll('p')
  let removed = 0
  placeholders.forEach((p) => {
    if (p.textContent?.includes('chapters will be loaded')) {
      p.remove()
      removed++
    }
  })

  if (removed > 0) {
    logger.debug(MODULE, `✓ Removed ${removed} placeholder paragraphs from pane`)
  }
}

/**
 * סידור אלמנטים לפי סוג
 * סדר: profile info -> diagrams -> biography content -> other
 */
export function sortContentElements(elements: Element[]): Element[] {
  logger.debug(MODULE, 'Sorting content elements...')

  const categorized = categorizeElements(elements)

  logger.debug(
    MODULE,
    `Categorized: ${categorized.profileInfo.length} profile info, ` +
      `${categorized.diagrams.length} diagrams, ` +
      `${categorized.biography.length} biography, ` +
      `${categorized.other.length} other`
  )

  // מיזוג בסדר הנכון
  return [
    ...categorized.profileInfo,
    ...categorized.diagrams,
    ...categorized.biography,
    ...categorized.other,
  ]
}

/**
 * קטלוג אלמנטים לפי סוג
 */
function categorizeElements(elements: Element[]): {
  profileInfo: Element[]
  diagrams: Element[]
  biography: Element[]
  other: Element[]
} {
  const profileInfo: Element[] = []
  const diagrams: Element[] = []
  const biography: Element[] = []
  const other: Element[] = []

  elements.forEach((element) => {
    const type = getElementType(element)

    switch (type) {
      case 'profile-info':
        profileInfo.push(element)
        break
      case 'diagram':
        diagrams.push(element)
        break
      case 'biography':
        biography.push(element)
        break
      default:
        other.push(element)
    }
  })

  return { profileInfo, diagrams, biography, other }
}

/**
 * זיהוי סוג אלמנט
 */
function getElementType(element: Element): 'profile-info' | 'diagram' | 'biography' | 'other' {
  const tagName = element.tagName?.toLowerCase()
  const className = element.className?.toString() || ''
  const id = element.id || ''

  // Profile info (definition list)
  if (tagName === 'dl' || (tagName === 'div' && element.querySelector('dl'))) {
    return 'profile-info'
  }

  // Diagrams
  if (
    className.includes(CSS_CLASSES.MERMAID) ||
    element.querySelector(`.${CSS_CLASSES.MERMAID}`) ||
    element.querySelector('mermaid') ||
    (tagName === 'code' && element.textContent?.includes('graph'))
  ) {
    return 'diagram'
  }

  // H2 that's not biography (likely a diagram heading)
  if (tagName === 'h2' && id && !id.includes('biography')) {
    return 'diagram'
  }

  // Biography content
  if (['p', 'ul', 'ol', 'blockquote', 'div', 'pre'].includes(tagName)) {
    return 'biography'
  }

  return 'other'
}

/**
 * קבלת סטטיסטיקות על התוכן
 */
export function getContentStats(container: Element = document.body): void {
  const article = getElementSafe(SELECTORS.ARTICLE)
  const biographyPane = getElementSafe(SELECTORS.BIOGRAPHY_TAB_PANE)

  logger.group(MODULE, 'Content Statistics')

  if (article) {
    const children = article.children
    logger.info(MODULE, `Article children: ${children.length}`)

    const categorized = categorizeElements(Array.from(children))
    logger.info(MODULE, 'Article content breakdown:', {
      profileInfo: categorized.profileInfo.length,
      diagrams: categorized.diagrams.length,
      biography: categorized.biography.length,
      other: categorized.other.length,
    })
  }

  if (biographyPane) {
    logger.info(MODULE, `Biography pane children: ${biographyPane.children.length}`)
  }

  logger.groupEnd()
}

