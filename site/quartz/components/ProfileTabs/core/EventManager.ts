/**
 * EventManager - ניהול מרכזי של event listeners
 * מבטיח ניקוי נכון של listeners ומונע memory leaks
 */

import { logger } from '../utils/DebugLogger'
import type { EventListenerInfo, CleanupFunction } from '../types'

const MODULE = 'EventManager'

class EventManager {
  private listeners: Map<string, EventListenerInfo> = new Map()
  private listenerCounter = 0

  constructor() {
    logger.info(MODULE, '🎧 EventManager initialized')
  }

  /**
   * הוספת event listener עם tracking
   */
  addEventListener<K extends keyof WindowEventMap>(
    element: Window,
    event: K,
    handler: (this: Window, ev: WindowEventMap[K]) => any,
    description?: string
  ): CleanupFunction

  addEventListener<K extends keyof DocumentEventMap>(
    element: Document,
    event: K,
    handler: (this: Document, ev: DocumentEventMap[K]) => any,
    description?: string
  ): CleanupFunction

  addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    event: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    description?: string
  ): CleanupFunction

  addEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    description: string = 'unnamed listener'
  ): CleanupFunction {
    const id = `listener_${this.listenerCounter++}`

    // שמירת המידע
    this.listeners.set(id, {
      element,
      event,
      handler,
      description,
      addedAt: new Date(),
    })

    // הוספת ה-listener
    element.addEventListener(event, handler)

    logger.debug(
      MODULE,
      `✓ Added listener #${this.listenerCounter}: "${description}" on ${event}`,
      `(total: ${this.listeners.size})`
    )

    // Return cleanup function
    return () => {
      this.removeListener(id)
    }
  }

  /**
   * הסרת listener ספציפי
   */
  private removeListener(id: string): void {
    const info = this.listeners.get(id)
    if (!info) return

    info.element.removeEventListener(info.event, info.handler)
    this.listeners.delete(id)

    logger.debug(
      MODULE,
      `✓ Removed listener: "${info.description}" on ${info.event}`,
      `(remaining: ${this.listeners.size})`
    )
  }

  /**
   * הסרת כל ה-listeners
   */
  removeAllListeners(): void {
    logger.info(MODULE, `🧹 Removing all listeners (${this.listeners.size} total)`)

    let count = 0
    this.listeners.forEach((info, id) => {
      info.element.removeEventListener(info.event, info.handler)
      count++
    })

    this.listeners.clear()
    logger.info(MODULE, `✓ Removed ${count} listeners`)
  }

  /**
   * הסרת listeners לפי אלמנט
   */
  removeListenersForElement(element: Element | Window | Document): number {
    const toRemove: string[] = []

    this.listeners.forEach((info, id) => {
      if (info.element === element) {
        toRemove.push(id)
      }
    })

    toRemove.forEach((id) => this.removeListener(id))

    logger.debug(MODULE, `✓ Removed ${toRemove.length} listeners for element`)
    return toRemove.length
  }

  /**
   * הסרת listeners לפי event type
   */
  removeListenersByEvent(event: string): number {
    const toRemove: string[] = []

    this.listeners.forEach((info, id) => {
      if (info.event === event) {
        toRemove.push(id)
      }
    })

    toRemove.forEach((id) => this.removeListener(id))

    logger.debug(MODULE, `✓ Removed ${toRemove.length} listeners for event: ${event}`)
    return toRemove.length
  }

  /**
   * קבלת מספר ה-listeners הפעילים
   */
  getActiveListenersCount(): number {
    return this.listeners.size
  }

  /**
   * קבלת מידע על listeners פעילים
   */
  getActiveListeners(): EventListenerInfo[] {
    return Array.from(this.listeners.values())
  }

  /**
   * קבלת listeners לפי event type
   */
  getListenersByEvent(event: string): EventListenerInfo[] {
    return Array.from(this.listeners.values()).filter((info) => info.event === event)
  }

  /**
   * הדפסת סטטיסטיקות
   */
  logStats(): void {
    const byEvent: Record<string, number> = {}
    const byElement: Record<string, number> = {}

    this.listeners.forEach((info) => {
      // Count by event
      byEvent[info.event] = (byEvent[info.event] || 0) + 1

      // Count by element type
      const elementType = this.getElementType(info.element)
      byElement[elementType] = (byElement[elementType] || 0) + 1
    })

    logger.group(MODULE, 'Event Listeners Statistics')
    logger.info(MODULE, `Total listeners: ${this.listeners.size}`)
    logger.info(MODULE, 'By event type:', byEvent)
    logger.info(MODULE, 'By element type:', byElement)
    logger.groupEnd()
  }

  /**
   * הדפסת רשימה מפורטת של listeners
   */
  logDetailedList(): void {
    logger.group(MODULE, `Active Listeners (${this.listeners.size})`)

    this.listeners.forEach((info, id) => {
      const age = Date.now() - info.addedAt.getTime()
      const elementType = this.getElementType(info.element)

      logger.info(
        MODULE,
        `${id}: "${info.description}"`,
        `\n  Event: ${info.event}`,
        `\n  Element: ${elementType}`,
        `\n  Age: ${Math.round(age / 1000)}s`
      )
    })

    logger.groupEnd()
  }

  /**
   * קבלת סוג אלמנט (לצורך תצוגה)
   */
  private getElementType(element: Element | Window | Document): string {
    if (element === window) return 'Window'
    if (element === document) return 'Document'
    if (element instanceof Element) {
      const id = element.id ? `#${element.id}` : ''
      const classes = element.className ? `.${element.className.split(' ').join('.')}` : ''
      return `${element.tagName}${id}${classes}`
    }
    return 'Unknown'
  }

  /**
   * בדיקה אם יש listeners ישנים (potential memory leak)
   */
  checkForOldListeners(maxAge: number = 300000): EventListenerInfo[] {
    const now = Date.now()
    const old: EventListenerInfo[] = []

    this.listeners.forEach((info) => {
      const age = now - info.addedAt.getTime()
      if (age > maxAge) {
        old.push(info)
      }
    })

    if (old.length > 0) {
      logger.warn(
        MODULE,
        `⚠️ Found ${old.length} listeners older than ${maxAge / 1000}s (potential memory leak)`
      )
      old.forEach((info) => {
        const age = Math.round((now - info.addedAt.getTime()) / 1000)
        logger.warn(MODULE, `  - "${info.description}" (${age}s old)`)
      })
    }

    return old
  }

  /**
   * Cleanup helper - יוצר wrapper function שמנקה אוטומטית
   */
  createAutoCleanupListener<T extends Element | Window | Document>(
    element: T,
    event: string,
    handler: EventListener,
    description: string,
    cleanupCondition: () => boolean
  ): void {
    const wrappedHandler = (e: Event) => {
      // Execute the original handler
      handler(e)

      // Check cleanup condition
      if (cleanupCondition()) {
        element.removeEventListener(event, wrappedHandler)
        logger.debug(MODULE, `✓ Auto-cleanup: "${description}"`)
      }
    }

    this.addEventListener(element, event, wrappedHandler, description)
  }

  /**
   * One-time listener (מנוקה אוטומטית אחרי ביצוע)
   */
  addOneTimeListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    description: string = 'one-time listener'
  ): void {
    const wrappedHandler = (e: Event) => {
      handler(e)
      element.removeEventListener(event, wrappedHandler)
      logger.debug(MODULE, `✓ One-time listener executed: "${description}"`)
    }

    this.addEventListener(element, event, wrappedHandler, `${description} (one-time)`)
  }

  /**
   * Debounced listener
   */
  addDebouncedListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    delay: number,
    description: string = 'debounced listener'
  ): CleanupFunction {
    let timeout: NodeJS.Timeout | null = null

    const debouncedHandler = (e: Event) => {
      if (timeout) clearTimeout(timeout)

      timeout = setTimeout(() => {
        handler(e)
      }, delay)
    }

    return this.addEventListener(element, event, debouncedHandler, `${description} (debounced ${delay}ms)`)
  }

  /**
   * Throttled listener
   */
  addThrottledListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    delay: number,
    description: string = 'throttled listener'
  ): CleanupFunction {
    let lastRun = 0

    const throttledHandler = (e: Event) => {
      const now = Date.now()
      if (now - lastRun >= delay) {
        handler(e)
        lastRun = now
      }
    }

    return this.addEventListener(element, event, throttledHandler, `${description} (throttled ${delay}ms)`)
  }

  /**
   * איפוס מלא
   */
  reset(): void {
    logger.info(MODULE, '🔄 Resetting EventManager')
    this.removeAllListeners()
    this.listenerCounter = 0
  }
}

// Singleton instance
export const eventManager = new EventManager()

// Export for advanced usage
export default eventManager

