/**
 * ChapterLoader - טעינת תוכן של פרקים
 */

import { logger } from '../utils/DebugLogger'
import { stateManager } from '../core/StateManager'
import { parseMarkdown } from '../content/MarkdownParser'
import type { ChaptersData, ChapterInfo } from '../types'
import { API_PATHS, MESSAGES, CACHE_BUST_PARAM } from '../constants'

const MODULE = 'ChapterLoader'

/**
 * טעינת chapters index
 */
export async function loadChaptersIndex(
  profileId: string,
  basePath: string = ''
): Promise<ChaptersData | null> {
  const url = basePath + API_PATHS.CHAPTERS_INDEX
  logger.debug(MODULE, `Loading chapters index from: ${url}`)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      logger.debug(MODULE, `Chapters index not found (${response.status})`)
      return null
    }

    const data = await response.json()
    const profileChapters = data[profileId] || null

    if (profileChapters) {
      logger.info(MODULE, `✓ Found chapters for profile ${profileId}`)
      logChaptersData(profileChapters)
    } else {
      logger.debug(MODULE, `No chapters found for profile ${profileId}`)
    }

    return profileChapters
  } catch (error) {
    logger.error(MODULE, 'Error loading chapters index:', error)
    return null
  }
}

/**
 * טעינת תוכן פרק
 */
export async function loadChapterContent(
  chapterSlug: string,
  profileId: string,
  basePath: string = ''
): Promise<string | null> {
  logger.time(MODULE, `loadChapter:${chapterSlug}`)
  logger.debug(MODULE, `Loading chapter: ${chapterSlug} for profile ${profileId}`)

  // בדיקה אם כבר נטען (מהזיכרון)
  if (stateManager.isChapterLoaded(chapterSlug)) {
    const cached = stateManager.getChapterContent(chapterSlug)
    if (cached) {
      logger.debug(MODULE, `✓ Chapter loaded from cache: ${chapterSlug}`)
      logger.timeEnd(MODULE, `loadChapter:${chapterSlug}`)
      return cached
    }
  }

  // קבלת שם הקובץ
  const chaptersData = stateManager.get('chaptersData')
  const filename = getChapterFilename(chapterSlug, chaptersData)

  if (!filename) {
    logger.warn(MODULE, `Cannot determine filename for chapter: ${chapterSlug}`)
    return null
  }

  // בניית URL
  const chapterPath =
    basePath +
    API_PATHS.CHAPTERS_BASE +
    profileId +
    '/' +
    filename +
    `?${CACHE_BUST_PARAM}=${Date.now()}`

  logger.debug(MODULE, `Fetching from: ${chapterPath}`)

  try {
    const response = await fetch(chapterPath)

    if (!response.ok) {
      logger.error(MODULE, `Chapter not found: ${chapterPath} (${response.status})`)
      throw new Error(`Chapter not found: ${chapterPath}`)
    }

    const markdown = await response.text()
    logger.debug(MODULE, `✓ Chapter markdown loaded (${markdown.length} chars)`)

    // המרה ל-HTML
    const html = parseMarkdown(markdown, {
      chaptersData: chaptersData || undefined,
      profileId,
      basePath,
      enableDebug: false,
    })

    logger.debug(MODULE, `✓ Chapter HTML created (${html.length} chars)`)

    // שמירה בזיכרון
    stateManager.cacheChapter(chapterSlug, html)

    logger.info(MODULE, `✓ Chapter loaded successfully: ${chapterSlug}`)
    logger.timeEnd(MODULE, `loadChapter:${chapterSlug}`)

    return html
  } catch (error) {
    logger.error(MODULE, `Error loading chapter ${chapterSlug}:`, error)
    logger.timeEnd(MODULE, `loadChapter:${chapterSlug}`)
    return null
  }
}

/**
 * קבלת שם קובץ לפרק
 */
function getChapterFilename(slug: string, chaptersData: ChaptersData | null): string | null {
  if (!chaptersData) {
    // ניחוש: slug + .md
    return slug + '.md'
  }

  // בדיקת main chapter
  if (chaptersData.main && chaptersData.main.slug === slug) {
    return chaptersData.main.filename
  }

  // בדיקת chapters רגילים
  for (const chapter of chaptersData.chapters) {
    if (chapter.slug === slug) {
      return chapter.filename
    }
  }

  // לא נמצא, ניחוש
  return slug + '.md'
}

/**
 * מציאת מידע chapter לפי slug
 */
export function findChapterInfo(
  slug: string,
  chaptersData: ChaptersData | null
): ChapterInfo | null {
  if (!chaptersData) return null

  // חיפוש ב-main
  if (chaptersData.main && chaptersData.main.slug === slug) {
    return chaptersData.main
  }

  // חיפוש ב-chapters
  for (const chapter of chaptersData.chapters) {
    if (chapter.slug === slug) {
      return chapter
    }
  }

  return null
}

/**
 * קבלת רשימת כל ה-slugs
 */
export function getAllChapterSlugs(chaptersData: ChaptersData | null): string[] {
  if (!chaptersData) return []

  const slugs: string[] = []

  if (chaptersData.main) {
    slugs.push(chaptersData.main.slug)
  }

  chaptersData.chapters.forEach((chapter) => {
    slugs.push(chapter.slug)
  })

  return slugs
}

/**
 * קבלת הפרק הראשון (default)
 */
export function getDefaultChapter(chaptersData: ChaptersData | null): string | null {
  if (!chaptersData) return null

  // אם יש main, זה ה-default
  if (chaptersData.main) {
    return chaptersData.main.slug
  }

  // אחרת, הפרק הראשון
  if (chaptersData.chapters.length > 0) {
    return chaptersData.chapters[0].slug
  }

  return null
}

/**
 * קבלת הפרק הבא
 */
export function getNextChapter(
  currentSlug: string,
  chaptersData: ChaptersData | null
): string | null {
  if (!chaptersData) return null

  const slugs = getAllChapterSlugs(chaptersData)
  const currentIndex = slugs.indexOf(currentSlug)

  if (currentIndex === -1 || currentIndex === slugs.length - 1) {
    return null // אין הבא
  }

  return slugs[currentIndex + 1]
}

/**
 * קבלת הפרק הקודם
 */
export function getPreviousChapter(
  currentSlug: string,
  chaptersData: ChaptersData | null
): string | null {
  if (!chaptersData) return null

  const slugs = getAllChapterSlugs(chaptersData)
  const currentIndex = slugs.indexOf(currentSlug)

  if (currentIndex <= 0) {
    return null // אין קודם
  }

  return slugs[currentIndex - 1]
}

/**
 * log מידע על chapters
 */
function logChaptersData(chaptersData: ChaptersData): void {
  logger.group(MODULE, 'Chapters Data')

  if (chaptersData.main) {
    logger.info(MODULE, `Main chapter: ${chaptersData.main.title} (${chaptersData.main.slug})`)
  }

  logger.info(MODULE, `Chapters count: ${chaptersData.chapters.length}`)

  if (chaptersData.chapters.length > 0) {
    chaptersData.chapters.forEach((chapter, index) => {
      logger.debug(
        MODULE,
        `  ${index + 1}. ${chapter.title} (${chapter.slug}) - ${chapter.filename}`
      )
    })
  }

  logger.groupEnd()
}

/**
 * סטטיסטיקות טעינה
 */
export function logLoadingStats(): void {
  const loadedCount = stateManager.get('loadedChapters').size
  const chaptersData = stateManager.get('chaptersData')
  const totalCount = chaptersData
    ? (chaptersData.main ? 1 : 0) + chaptersData.chapters.length
    : 0

  logger.group(MODULE, 'Chapter Loading Statistics')
  logger.info(MODULE, `Loaded chapters: ${loadedCount}/${totalCount}`)

  if (loadedCount > 0) {
    const loaded = Array.from(stateManager.get('loadedChapters').keys())
    logger.info(MODULE, 'Loaded slugs:', loaded)
  }

  logger.groupEnd()
}

/**
 * ניקוי cache
 */
export function clearChapterCache(): void {
  stateManager.clearChapterCache()
  logger.info(MODULE, '🗑️ Chapter cache cleared')
}

