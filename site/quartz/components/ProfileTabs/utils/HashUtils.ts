/**
 * HashUtils - פונקציות עזר לניתוח וניהול URL hash
 */

import { logger } from './DebugLogger'
import type { HashParams, TabName } from '../types'
import { HASH_PARAMS, TAB_NAMES } from '../constants'

const MODULE = 'HashUtils'

/**
 * ניתוח ה-hash הנוכחי מה-URL
 * תומך בפורמטים:
 * - #tab=biography
 * - #tabbiography (ללא =)
 * - #chapter=slug&tab=biography
 */
export function parseHash(hash?: string): HashParams {
  const hashStr = hash || window.location.hash
  logger.debug(MODULE, `Parsing hash: "${hashStr}"`)

  const result: HashParams = {}

  if (!hashStr) {
    logger.debug(MODULE, '→ Empty hash')
    return result
  }

  // ניתוח tab parameter
  // תמיכה ב: #tab=media או #tabmedia
  const tabMatchWithEquals = hashStr.match(/[&?#]tab=([^&]+)/)
  if (tabMatchWithEquals) {
    const tabValue = tabMatchWithEquals[1].toLowerCase()
    if (tabValue === TAB_NAMES.BIOGRAPHY || tabValue === TAB_NAMES.MEDIA) {
      result.tab = tabValue as TabName
    }
  } else {
    // פורמט ללא equals: #tabbiography
    const tabMatchWithoutEquals = hashStr.match(/[#&]tab([^&]+)/)
    if (tabMatchWithoutEquals) {
      const tabValue = tabMatchWithoutEquals[1].toLowerCase()
      if (tabValue === TAB_NAMES.BIOGRAPHY || tabValue === TAB_NAMES.MEDIA) {
        result.tab = tabValue as TabName
      }
    }
  }

  // ניתוח chapter parameter
  const chapterMatch = hashStr.match(/[#&]chapter=([^&]+)/)
  if (chapterMatch) {
    // ניקוי הערך - הסרת & או # נוספים
    result.chapter = chapterMatch[1].split('&')[0].split('#')[0].trim()
  }

  logger.debug(MODULE, '→ Parsed result:', result)
  return result
}

/**
 * בניית hash string מפרמטרים
 */
export function buildHash(tab?: TabName, chapter?: string): string {
  const parts: string[] = []

  if (chapter) {
    parts.push(`${HASH_PARAMS.CHAPTER}=${chapter}`)
  }

  if (tab) {
    parts.push(`${HASH_PARAMS.TAB}=${tab}`)
  }

  const hash = parts.length > 0 ? `#${parts.join('&')}` : ''
  logger.debug(MODULE, `Built hash: "${hash}" from tab="${tab}", chapter="${chapter}"`)

  return hash
}

/**
 * עדכון ה-hash ב-URL (ללא ניווט)
 */
export function updateHash(
  tab?: TabName,
  chapter?: string,
  useReplace: boolean = false
): void {
  const hash = buildHash(tab, chapter)
  const newUrl = window.location.pathname + hash

  if (useReplace) {
    logger.debug(MODULE, `Replacing hash: ${hash}`)
    history.replaceState({ tab, chapter }, '', newUrl)
  } else {
    logger.debug(MODULE, `Pushing hash: ${hash}`)
    history.pushState({ tab, chapter }, '', newUrl)
  }
}

/**
 * קבלת ה-tab מה-hash
 */
export function getTabFromHash(hash?: string): TabName | undefined {
  const parsed = parseHash(hash)
  return parsed.tab
}

/**
 * קבלת ה-chapter מה-hash
 */
export function getChapterFromHash(hash?: string): string | undefined {
  const parsed = parseHash(hash)
  return parsed.chapter
}

/**
 * בדיקה האם ה-hash מכיל tab ספציפי
 */
export function hasTab(tab: TabName, hash?: string): boolean {
  const currentTab = getTabFromHash(hash)
  return currentTab === tab
}

/**
 * בדיקה האם ה-hash מכיל chapter
 */
export function hasChapter(hash?: string): boolean {
  const chapter = getChapterFromHash(hash)
  return chapter !== undefined && chapter !== ''
}

/**
 * בדיקה האם יש hash בכלל
 */
export function hasHash(): boolean {
  return window.location.hash.length > 0
}

/**
 * ניקוי ה-hash (הסרה מה-URL)
 */
export function clearHash(useReplace: boolean = true): void {
  logger.debug(MODULE, 'Clearing hash')

  if (useReplace) {
    history.replaceState(null, '', window.location.pathname)
  } else {
    history.pushState(null, '', window.location.pathname)
  }
}

/**
 * קבלת state מה-history
 */
export function getHistoryState(): any {
  return history.state
}

/**
 * בדיקה אם ה-hash שווה ל-hash אחר
 */
export function hashEquals(hash1: string, hash2: string): boolean {
  const parsed1 = parseHash(hash1)
  const parsed2 = parseHash(hash2)

  return parsed1.tab === parsed2.tab && parsed1.chapter === parsed2.chapter
}

/**
 * המרת HashParams ל-string
 */
export function hashParamsToString(params: HashParams): string {
  return buildHash(params.tab, params.chapter)
}

/**
 * שיבוט של URL עם hash חדש
 */
export function cloneUrlWithHash(newHash: string): string {
  const url = new URL(window.location.href)
  url.hash = newHash
  return url.toString()
}

/**
 * log של מצב ה-hash הנוכחי (לדיבאג)
 */
export function logCurrentHash(): void {
  const current = window.location.hash
  const parsed = parseHash(current)

  logger.group(MODULE, 'Current Hash State')
  logger.info(MODULE, `Raw hash: "${current}"`)
  logger.info(MODULE, `Parsed tab: ${parsed.tab || 'none'}`)
  logger.info(MODULE, `Parsed chapter: ${parsed.chapter || 'none'}`)
  logger.info(MODULE, `History state:`, history.state)
  logger.groupEnd()
}

/**
 * בדיקה אם ה-hash מתייחס ל-media tab
 */
export function isMediaTab(hash?: string): boolean {
  return hasTab(TAB_NAMES.MEDIA as TabName, hash)
}

/**
 * בדיקה אם ה-hash מתייחס ל-biography tab
 */
export function isBiographyTab(hash?: string): boolean {
  return hasTab(TAB_NAMES.BIOGRAPHY as TabName, hash)
}

/**
 * קבלת default tab (אם אין tab ב-hash)
 */
export function getDefaultTab(): TabName {
  return TAB_NAMES.BIOGRAPHY as TabName
}

