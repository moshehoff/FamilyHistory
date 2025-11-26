/**
 * MermaidInitializer - אתחול דיאגרמות Mermaid
 * מרכז את הלוגיקה שהייתה מפוזרת ב-3 מקומות
 */

import { logger } from '../utils/DebugLogger'
import type { MermaidInitOptions, MermaidElement } from '../types'
import { SELECTORS, CSS_CLASSES, DATA_ATTRS, TIMING } from '../constants'

const MODULE = 'MermaidInit'

// Declare mermaid on window
declare global {
  interface Window {
    mermaid?: {
      init: (config?: any, element?: Element) => void
      run: () => Promise<void>
      initialize: (config: any) => void
    }
  }
}

/**
 * בדיקה אם Mermaid זמין
 */
export function isMermaidAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.mermaid
}

/**
 * המתנה ל-Mermaid להיטען
 */
export async function waitForMermaid(timeout: number = 5000): Promise<boolean> {
  if (isMermaidAvailable()) {
    logger.debug(MODULE, '✓ Mermaid already available')
    return true
  }

  logger.debug(MODULE, `Waiting for Mermaid to load (timeout: ${timeout}ms)`)

  return new Promise((resolve) => {
    const startTime = Date.now()
    const checkInterval = 100

    const check = () => {
      if (isMermaidAvailable()) {
        logger.info(MODULE, `✓ Mermaid loaded after ${Date.now() - startTime}ms`)
        resolve(true)
        return
      }

      if (Date.now() - startTime >= timeout) {
        logger.warn(MODULE, `⚠️ Mermaid not loaded after ${timeout}ms timeout`)
        resolve(false)
        return
      }

      setTimeout(check, checkInterval)
    }

    check()
  })
}

/**
 * איתור כל אלמנטי Mermaid בתוך container
 */
export function findMermaidElements(container: Element): MermaidElement[] {
  const elements = container.querySelectorAll(SELECTORS.MERMAID_ELEMENTS)
  const found: MermaidElement[] = []

  logger.debug(MODULE, `Found ${elements.length} potential Mermaid elements in container`)

  elements.forEach((element) => {
    const tagName = element.tagName?.toLowerCase()
    const isProcessed = element.hasAttribute(DATA_ATTRS.PROCESSED)

    if (tagName === 'code') {
      found.push({
        element,
        type: 'code',
        processed: isProcessed,
      })
    } else {
      found.push({
        element,
        type: 'div',
        processed: isProcessed,
      })
    }
  })

  logger.debug(MODULE, `→ ${found.filter((m) => !m.processed).length} unprocessed elements`)

  return found
}

/**
 * עיבוד אלמנט Mermaid בודד
 */
export function processMermaidElement(mermaidEl: MermaidElement): boolean {
  if (mermaidEl.processed) {
    logger.debug(MODULE, 'Element already processed, skipping')
    return false
  }

  try {
    const element = mermaidEl.element

    if (mermaidEl.type === 'code') {
      // אלמנט code צריך להמיר ל-div
      const mermaidCode = element.textContent
      if (!mermaidCode) {
        logger.warn(MODULE, 'Code element has no content')
        return false
      }

      // יצירת div חדש
      const mermaidDiv = document.createElement('div')
      mermaidDiv.className = CSS_CLASSES.MERMAID
      mermaidDiv.textContent = mermaidCode

      // החלפת האלמנט
      if (element.parentElement) {
        element.parentElement.replaceChild(mermaidDiv, element)
        logger.debug(MODULE, '✓ Converted code element to div')

        // אתחול Mermaid על ה-div החדש
        if (window.mermaid) {
          window.mermaid.init(undefined, mermaidDiv)
          mermaidDiv.setAttribute(DATA_ATTRS.PROCESSED, 'true')
          logger.debug(MODULE, '✓ Initialized Mermaid on new div')
        }
      }
    } else {
      // אלמנט div או mermaid רגיל
      if (window.mermaid) {
        window.mermaid.init(undefined, element)
        element.setAttribute(DATA_ATTRS.PROCESSED, 'true')
        logger.debug(MODULE, '✓ Initialized Mermaid on element')
      }
    }

    return true
  } catch (error) {
    logger.error(MODULE, 'Error processing Mermaid element:', error)
    return false
  }
}

/**
 * אתחול כל דיאגרמות Mermaid בתוך container
 */
export async function initializeMermaidDiagrams(
  container: Element,
  options: Partial<MermaidInitOptions> = {}
): Promise<number> {
  const { delay = TIMING.MERMAID_INIT_DELAY, markProcessed = true } = options

  logger.time(MODULE, 'initializeMermaidDiagrams')
  logger.debug(MODULE, `Initializing Mermaid diagrams in container (delay: ${delay}ms)`)

  // המתנה אם נדרש
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  // בדיקה ש-Mermaid זמין
  const available = await waitForMermaid()
  if (!available) {
    logger.warn(MODULE, 'Mermaid not available, skipping initialization')
    return 0
  }

  // איתור אלמנטים
  const mermaidElements = findMermaidElements(container)

  if (mermaidElements.length === 0) {
    logger.debug(MODULE, 'No Mermaid elements found')
    logger.timeEnd(MODULE, 'initializeMermaidDiagrams')
    return 0
  }

  // עיבוד כל אלמנט
  let processedCount = 0
  for (const mermaidEl of mermaidElements) {
    if (processMermaidElement(mermaidEl)) {
      processedCount++
    }
  }

  // ניסיון להריץ את mermaid.run() אם קיים
  if (window.mermaid && typeof window.mermaid.run === 'function') {
    try {
      await window.mermaid.run()
      logger.debug(MODULE, '✓ Executed mermaid.run()')
    } catch (error) {
      logger.warn(MODULE, 'Error running mermaid.run():', error)
    }
  }

  logger.info(MODULE, `✓ Processed ${processedCount} Mermaid diagrams`)
  logger.timeEnd(MODULE, 'initializeMermaidDiagrams')

  return processedCount
}

/**
 * אתחול Mermaid עם retry (לאחר העברת אלמנטים)
 */
export async function initializeMermaidWithRetry(
  container: Element,
  maxRetries: number = 3,
  retryDelay: number = TIMING.MERMAID_INIT_DELAY
): Promise<number> {
  logger.debug(MODULE, `Initializing Mermaid with retry (max ${maxRetries} attempts)`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logger.debug(MODULE, `Attempt ${attempt}/${maxRetries}`)

    const count = await initializeMermaidDiagrams(container, { delay: retryDelay })

    if (count > 0) {
      logger.info(MODULE, `✓ Success on attempt ${attempt}`)
      return count
    }

    if (attempt < maxRetries) {
      logger.debug(MODULE, `No diagrams found, retrying in ${retryDelay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }

  logger.warn(MODULE, `⚠️ Failed to initialize Mermaid after ${maxRetries} attempts`)
  return 0
}

/**
 * ניקוי אלמנטי Mermaid (הסרת סימון processed)
 */
export function resetMermaidElements(container: Element): number {
  const elements = container.querySelectorAll(`[${DATA_ATTRS.PROCESSED}]`)
  let count = 0

  elements.forEach((element) => {
    if (element.classList.contains(CSS_CLASSES.MERMAID)) {
      element.removeAttribute(DATA_ATTRS.PROCESSED)
      count++
    }
  })

  logger.debug(MODULE, `Reset ${count} Mermaid elements`)
  return count
}

/**
 * אתחול Mermaid מחדש (force re-init)
 */
export async function reinitializeMermaidDiagrams(
  container: Element,
  options: Partial<MermaidInitOptions> = {}
): Promise<number> {
  logger.info(MODULE, 'Force reinitializing Mermaid diagrams')

  // ניקוי סימוני processed
  resetMermaidElements(container)

  // אתחול מחדש
  return await initializeMermaidDiagrams(container, options)
}

/**
 * Helper: אתחול Mermaid לאחר הזזת תוכן
 */
export async function initializeMermaidAfterMove(
  container: Element,
  delay: number = TIMING.MERMAID_MOVE_DELAY
): Promise<number> {
  logger.info(MODULE, `Initializing Mermaid after content move (delay: ${delay}ms)`)
  return await initializeMermaidDiagrams(container, { delay })
}

/**
 * סטטיסטיקות Mermaid
 */
export function logMermaidStats(container: Element): void {
  const all = container.querySelectorAll(SELECTORS.MERMAID_ELEMENTS)
  const processed = container.querySelectorAll(`${SELECTORS.MERMAID_ELEMENTS}[${DATA_ATTRS.PROCESSED}]`)
  const unprocessed = all.length - processed.length

  logger.group(MODULE, 'Mermaid Statistics')
  logger.info(MODULE, `Total elements: ${all.length}`)
  logger.info(MODULE, `Processed: ${processed.length}`)
  logger.info(MODULE, `Unprocessed: ${unprocessed}`)
  logger.info(MODULE, `Mermaid available: ${isMermaidAvailable()}`)
  logger.groupEnd()
}

