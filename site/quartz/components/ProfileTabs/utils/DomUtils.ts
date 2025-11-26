/**
 * DomUtils - פונקציות עזר למניפולציה של DOM
 */

import { logger } from './DebugLogger'
import type { WaitForElementOptions } from '../types'
import { CSS_CLASSES, TIMING } from '../constants'

const MODULE = 'DomUtils'

/**
 * הפעלת element ספציפי והסרת active מכל השאר
 */
export function setActiveElement(
  selector: string,
  targetSelector: string,
  parent: Document | Element = document
): boolean {
  logger.debug(MODULE, `Setting active: ${targetSelector} in ${selector}`)

  const elements = parent.querySelectorAll(selector)
  const targetElement = parent.querySelector(targetSelector)

  if (!targetElement) {
    logger.warn(MODULE, `Target element not found: ${targetSelector}`)
    return false
  }

  // הסרת active מכולם
  elements.forEach((el) => {
    el.classList.remove(CSS_CLASSES.ACTIVE)
  })

  // הוספת active ליעד
  targetElement.classList.add(CSS_CLASSES.ACTIVE)

  logger.debug(MODULE, `✓ Active set on: ${targetSelector}`)
  return true
}

/**
 * הסרת active מכל האלמנטים
 */
export function clearActiveElements(selector: string, parent: Document | Element = document): void {
  logger.debug(MODULE, `Clearing active from: ${selector}`)

  const elements = parent.querySelectorAll(selector)
  let count = 0

  elements.forEach((el) => {
    if (el.classList.contains(CSS_CLASSES.ACTIVE)) {
      el.classList.remove(CSS_CLASSES.ACTIVE)
      count++
    }
  })

  logger.debug(MODULE, `✓ Cleared active from ${count} elements`)
}

/**
 * הוספת active למספר elements
 */
export function setActiveElements(selectors: string[], parent: Document | Element = document): void {
  logger.debug(MODULE, `Setting active on multiple elements`, selectors)

  selectors.forEach((selector) => {
    const element = parent.querySelector(selector)
    if (element) {
      element.classList.add(CSS_CLASSES.ACTIVE)
    } else {
      logger.warn(MODULE, `Element not found: ${selector}`)
    }
  })
}

/**
 * המתנה לאלמנט להופיע ב-DOM
 */
export function waitForElement(
  selector: string,
  options: WaitForElementOptions = {}
): Promise<Element> {
  const {
    timeout = TIMING.ELEMENT_WAIT_TIMEOUT,
    checkInterval = TIMING.ELEMENT_CHECK_INTERVAL,
    parent = document,
  } = options

  logger.debug(MODULE, `Waiting for element: ${selector} (timeout: ${timeout}ms)`)

  return new Promise((resolve, reject) => {
    // בדיקה ראשונה
    const element = parent.querySelector(selector)
    if (element) {
      logger.debug(MODULE, `✓ Element found immediately: ${selector}`)
      resolve(element)
      return
    }

    // התחלת polling
    const startTime = Date.now()
    const interval = setInterval(() => {
      const element = parent.querySelector(selector)

      if (element) {
        clearInterval(interval)
        logger.debug(MODULE, `✓ Element found after ${Date.now() - startTime}ms: ${selector}`)
        resolve(element)
        return
      }

      // בדיקת timeout
      if (Date.now() - startTime >= timeout) {
        clearInterval(interval)
        logger.error(MODULE, `✗ Element not found after ${timeout}ms: ${selector}`)
        reject(new Error(`Element not found: ${selector}`))
      }
    }, checkInterval)
  })
}

/**
 * המתנה למספר אלמנטים
 */
export async function waitForElements(
  selectors: string[],
  options: WaitForElementOptions = {}
): Promise<Element[]> {
  logger.debug(MODULE, `Waiting for ${selectors.length} elements`, selectors)

  const promises = selectors.map((selector) => waitForElement(selector, options))
  const elements = await Promise.all(promises)

  logger.debug(MODULE, `✓ All ${selectors.length} elements found`)
  return elements
}

/**
 * בדיקה אם אלמנט קיים
 */
export function elementExists(selector: string, parent: Document | Element = document): boolean {
  return parent.querySelector(selector) !== null
}

/**
 * קבלת אלמנט או זריקת שגיאה
 */
export function getElement<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T {
  const element = parent.querySelector<T>(selector)
  if (!element) {
    const error = `Required element not found: ${selector}`
    logger.error(MODULE, error)
    throw new Error(error)
  }
  return element
}

/**
 * קבלת אלמנט או null (בטוח)
 */
export function getElementSafe<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T | null {
  return parent.querySelector<T>(selector)
}

/**
 * קבלת כל האלמנטים
 */
export function getElements<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector))
}

/**
 * הסרת אלמנט מה-DOM
 */
export function removeElement(selector: string, parent: Document | Element = document): boolean {
  const element = parent.querySelector(selector)
  if (element) {
    element.remove()
    logger.debug(MODULE, `✓ Element removed: ${selector}`)
    return true
  }
  logger.debug(MODULE, `Element not found for removal: ${selector}`)
  return false
}

/**
 * הסרת כל האלמנטים התואמים
 */
export function removeElements(selector: string, parent: Document | Element = document): number {
  const elements = parent.querySelectorAll(selector)
  const count = elements.length

  elements.forEach((el) => el.remove())
  logger.debug(MODULE, `✓ Removed ${count} elements matching: ${selector}`)

  return count
}

/**
 * הוספת אלמנט לפני אלמנט אחר
 */
export function insertBefore(
  newElement: Element,
  targetSelector: string,
  parent: Document | Element = document
): boolean {
  const target = parent.querySelector(targetSelector)
  if (!target || !target.parentElement) {
    logger.warn(MODULE, `Cannot insert before - target not found: ${targetSelector}`)
    return false
  }

  target.parentElement.insertBefore(newElement, target)
  logger.debug(MODULE, `✓ Element inserted before: ${targetSelector}`)
  return true
}

/**
 * הוספת אלמנט אחרי אלמנט אחר
 */
export function insertAfter(
  newElement: Element,
  targetSelector: string,
  parent: Document | Element = document
): boolean {
  const target = parent.querySelector(targetSelector)
  if (!target || !target.parentElement) {
    logger.warn(MODULE, `Cannot insert after - target not found: ${targetSelector}`)
    return false
  }

  target.parentElement.insertBefore(newElement, target.nextSibling)
  logger.debug(MODULE, `✓ Element inserted after: ${targetSelector}`)
  return true
}

/**
 * קבלת attribute או ערך ברירת מחדל
 */
export function getAttribute(
  element: Element,
  attribute: string,
  defaultValue: string = ''
): string {
  return element.getAttribute(attribute) || defaultValue
}

/**
 * Scroll לאלמנט
 */
export function scrollToElement(
  selector: string,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' },
  parent: Document | Element = document
): boolean {
  const element = parent.querySelector(selector)
  if (!element) {
    logger.warn(MODULE, `Cannot scroll - element not found: ${selector}`)
    return false
  }

  element.scrollIntoView(options)
  logger.debug(MODULE, `✓ Scrolled to: ${selector}`)
  return true
}

/**
 * בדיקה אם אלמנט נראה (visible)
 */
export function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  )
}

/**
 * קבלת גובה אלמנט (כולל margins)
 */
export function getElementHeight(element: Element): number {
  const style = window.getComputedStyle(element)
  const marginTop = parseInt(style.marginTop) || 0
  const marginBottom = parseInt(style.marginBottom) || 0
  return element.clientHeight + marginTop + marginBottom
}

/**
 * העתקת אלמנט לפני parent אחר
 */
export function moveElement(
  element: Element,
  newParent: Element,
  position: 'prepend' | 'append' | 'before' | 'after' = 'append'
): void {
  switch (position) {
    case 'prepend':
      newParent.prepend(element)
      break
    case 'append':
      newParent.appendChild(element)
      break
    case 'before':
      newParent.parentElement?.insertBefore(element, newParent)
      break
    case 'after':
      newParent.parentElement?.insertBefore(element, newParent.nextSibling)
      break
  }
  logger.debug(MODULE, `✓ Element moved (${position})`)
}

/**
 * יצירת אלמנט עם attributes
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  content?: string | Element[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)

  // הוספת attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })

  // הוספת תוכן
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content
    } else {
      content.forEach((child) => element.appendChild(child))
    }
  }

  return element
}

