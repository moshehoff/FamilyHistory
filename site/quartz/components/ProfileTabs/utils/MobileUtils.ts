/**
 * MobileUtils - פונקציות עזר לטיפול במובייל
 */

import { logger } from './DebugLogger'
import { BREAKPOINTS, EMOJIS } from '../constants'

const MODULE = 'MobileUtils'

/**
 * בדיקה האם המכשיר הוא מובייל
 */
export function isMobile(): boolean {
  return window.innerWidth <= BREAKPOINTS.MOBILE
}

/**
 * בדיקה האם המכשיר הוא מובייל קטן
 */
export function isSmallMobile(): boolean {
  return window.innerWidth <= BREAKPOINTS.MOBILE_SMALL
}

/**
 * קבלת גודל מסך
 */
export function getScreenSize(): 'small' | 'mobile' | 'desktop' {
  const width = window.innerWidth

  if (width <= BREAKPOINTS.MOBILE_SMALL) {
    return 'small'
  } else if (width <= BREAKPOINTS.MOBILE) {
    return 'mobile'
  } else {
    return 'desktop'
  }
}

/**
 * הסרת emojis מטקסט
 */
export function removeEmojis(text: string): string {
  // הסרת כל הסמלילים הידועים
  let cleaned = text
  Object.values(EMOJIS).forEach((emoji) => {
    cleaned = cleaned.replace(new RegExp(emoji, 'g'), '')
  })
  return cleaned.trim()
}

/**
 * הסרת emojis מכפתור
 */
export function removeEmojiFromButton(button: Element): void {
  const originalText = button.textContent?.trim() || ''
  const cleanedText = removeEmojis(originalText)

  if (originalText !== cleanedText) {
    button.textContent = cleanedText
    logger.debug(MODULE, `Removed emoji from button: "${originalText}" → "${cleanedText}"`)
  }
}

/**
 * הסרת emojis מרשימת כפתורים
 */
export function removeEmojisFromButtons(buttons: NodeListOf<Element> | Element[]): void {
  logger.debug(MODULE, `Removing emojis from ${buttons.length} buttons`)

  let count = 0
  buttons.forEach((button) => {
    const originalText = button.textContent?.trim() || ''
    const cleanedText = removeEmojis(originalText)

    if (originalText !== cleanedText) {
      button.textContent = cleanedText
      count++
    }
  })

  logger.debug(MODULE, `✓ Removed emojis from ${count} buttons`)
}

/**
 * הוספת emoji חזרה לכפתור (למקרה של חזרה לדסקטופ)
 */
export function restoreEmojiToButton(
  button: Element,
  emoji: string,
  position: 'start' | 'end' = 'start'
): void {
  const currentText = button.textContent?.trim() || ''

  // בדיקה אם כבר יש emoji
  if (currentText.includes(emoji)) {
    return
  }

  const newText = position === 'start' ? `${emoji} ${currentText}` : `${currentText} ${emoji}`
  button.textContent = newText
}

/**
 * התאמה אוטומטית של UI למובייל/דסקטופ
 */
export function adaptButtonsForScreenSize(
  buttons: NodeListOf<Element> | Element[],
  emojiMap: Map<Element, string>
): void {
  const screenSize = getScreenSize()
  logger.debug(MODULE, `Adapting ${buttons.length} buttons for ${screenSize}`)

  if (screenSize === 'small' || screenSize === 'mobile') {
    // הסרת emojis במובייל
    removeEmojisFromButtons(buttons)
  } else {
    // החזרת emojis בדסקטופ
    buttons.forEach((button) => {
      const emoji = emojiMap.get(button)
      if (emoji) {
        restoreEmojiToButton(button, emoji, 'start')
      }
    })
  }
}

/**
 * listener לשינויי גודל מסך
 */
export function onScreenSizeChange(callback: (size: 'small' | 'mobile' | 'desktop') => void): () => void {
  let currentSize = getScreenSize()

  const handler = () => {
    const newSize = getScreenSize()
    if (newSize !== currentSize) {
      logger.debug(MODULE, `Screen size changed: ${currentSize} → ${newSize}`)
      currentSize = newSize
      callback(newSize)
    }
  }

  window.addEventListener('resize', handler)
  logger.debug(MODULE, 'Screen size change listener added')

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handler)
    logger.debug(MODULE, 'Screen size change listener removed')
  }
}

/**
 * בדיקה האם המכשיר תומך ב-touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * קבלת אוריינטציה של המסך
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
}

/**
 * בדיקה אם המסך נמצא במצב landscape
 */
export function isLandscape(): boolean {
  return getOrientation() === 'landscape'
}

/**
 * log מצב המכשיר (לדיבאג)
 */
export function logDeviceInfo(): void {
  logger.group(MODULE, 'Device Information')
  logger.info(MODULE, `Screen width: ${window.innerWidth}px`)
  logger.info(MODULE, `Screen height: ${window.innerHeight}px`)
  logger.info(MODULE, `Screen size: ${getScreenSize()}`)
  logger.info(MODULE, `Is mobile: ${isMobile()}`)
  logger.info(MODULE, `Is small mobile: ${isSmallMobile()}`)
  logger.info(MODULE, `Is touch device: ${isTouchDevice()}`)
  logger.info(MODULE, `Orientation: ${getOrientation()}`)
  logger.info(MODULE, `User agent: ${navigator.userAgent}`)
  logger.groupEnd()
}

/**
 * המתנה לאוריינטציה מסויימת
 */
export function waitForOrientation(
  targetOrientation: 'portrait' | 'landscape',
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (getOrientation() === targetOrientation) {
      resolve()
      return
    }

    const handler = () => {
      if (getOrientation() === targetOrientation) {
        window.removeEventListener('resize', handler)
        resolve()
      }
    }

    window.addEventListener('resize', handler)

    setTimeout(() => {
      window.removeEventListener('resize', handler)
      reject(new Error(`Orientation change timeout after ${timeout}ms`))
    }, timeout)
  })
}

