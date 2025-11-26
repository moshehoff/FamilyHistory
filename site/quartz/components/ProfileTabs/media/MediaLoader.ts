/**
 * MediaLoader - טעינת media index ובדיקת תוכן מדיה
 */

import { logger } from '../utils/DebugLogger'
import type { MediaIndex, ImageInfo, DocumentInfo } from '../types'
import { API_PATHS } from '../constants'

const MODULE = 'MediaLoader'

/**
 * טעינת media index
 */
export async function loadMediaIndex(basePath: string = ''): Promise<MediaIndex | null> {
  const url = basePath + API_PATHS.MEDIA_INDEX
  logger.debug(MODULE, `Loading media index from: ${url}`)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      logger.debug(MODULE, `Media index not found (${response.status})`)
      return null
    }

    const data = await response.json()
    logger.info(MODULE, '✓ Media index loaded successfully')
    logMediaIndexStats(data)

    return data as MediaIndex
  } catch (error) {
    logger.error(MODULE, 'Error loading media index:', error)
    return null
  }
}

/**
 * קבלת תמונות לפרופיל ספציפי
 */
export function getImagesForProfile(
  mediaIndex: MediaIndex | null,
  profileId: string
): ImageInfo[] {
  if (!mediaIndex) return []

  const images = mediaIndex.images[profileId] || []
  logger.debug(MODULE, `Found ${images.length} images for profile ${profileId}`)

  return images
}

/**
 * קבלת מסמכים לפרופיל ספציפי
 */
export function getDocumentsForProfile(
  mediaIndex: MediaIndex | null,
  profileId: string
): DocumentInfo[] {
  if (!mediaIndex) return []

  const documents = mediaIndex.documents[profileId] || []
  logger.debug(MODULE, `Found ${documents.length} documents for profile ${profileId}`)

  return documents
}

/**
 * בדיקה האם לפרופיל יש מדיה
 */
export function hasMedia(mediaIndex: MediaIndex | null, profileId: string): boolean {
  const images = getImagesForProfile(mediaIndex, profileId)
  const documents = getDocumentsForProfile(mediaIndex, profileId)

  return images.length > 0 || documents.length > 0
}

/**
 * בדיקה האם לפרופיל יש תמונות
 */
export function hasImages(mediaIndex: MediaIndex | null, profileId: string): boolean {
  const images = getImagesForProfile(mediaIndex, profileId)
  return images.length > 0
}

/**
 * בדיקה האם לפרופיל יש מסמכים
 */
export function hasDocuments(mediaIndex: MediaIndex | null, profileId: string): boolean {
  const documents = getDocumentsForProfile(mediaIndex, profileId)
  return documents.length > 0
}

/**
 * קבלת נתיב מלא לתמונה
 */
export function getImagePath(
  image: ImageInfo,
  profileId: string,
  basePath: string = ''
): string {
  if (image.path) {
    // נתיב מוגדר בנתונים
    const path = image.path.startsWith('/') ? image.path.substring(1) : image.path
    return basePath + path
  } else {
    // בנייה מ-filename
    const documentsPath = basePath + API_PATHS.DOCUMENTS_BASE + profileId + '/'
    return documentsPath + image.filename
  }
}

/**
 * קבלת נתיב מלא למסמך
 */
export function getDocumentPath(
  document: DocumentInfo,
  profileId: string,
  basePath: string = ''
): string {
  if (document.path) {
    const path = document.path.startsWith('/') ? document.path.substring(1) : document.path
    return basePath + path
  } else {
    const documentsPath = basePath + API_PATHS.DOCUMENTS_BASE + profileId + '/'
    return documentsPath + document.filename
  }
}

/**
 * תיקון profile links בתוך caption HTML
 */
export function fixProfileLinksInCaption(caption: string, basePath: string): string {
  if (!caption || !basePath) return caption

  // הסרת slash סופי מ-basePath אם קיים
  const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath

  // תיקון links: href="/profiles/..." -> href="basePath/profiles/..."
  const linkPattern = /href="(\/profiles\/[^"]+)"/g
  return caption.replace(linkPattern, (match, path) => {
    return `href="${cleanBasePath}${path}"`
  })
}

/**
 * המרת newlines ל-<br> בתוך caption
 */
export function formatCaption(caption: string | undefined, basePath: string = ''): string {
  if (!caption) return ''

  // המרת newlines
  const withBreaks = caption.split('\n').join('<br>')

  // תיקון profile links
  return fixProfileLinksInCaption(withBreaks, basePath)
}

/**
 * יצירת alt text מ-caption (הסרת HTML)
 */
export function getAltTextFromCaption(caption: string | undefined): string {
  if (!caption) return ''

  // הסרת HTML tags
  return caption.replace(/<[^>]*>/g, '').trim()
}

/**
 * קבלת סוג קובץ מתוך שם קובץ
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * בדיקה האם קובץ הוא תמונה
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const ext = getFileExtension(filename)
  return imageExtensions.includes(ext)
}

/**
 * בדיקה האם קובץ הוא PDF
 */
export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === 'pdf'
}

/**
 * סטטיסטיקות של media index
 */
function logMediaIndexStats(mediaIndex: MediaIndex): void {
  const profilesWithImages = Object.keys(mediaIndex.images).length
  const profilesWithDocuments = Object.keys(mediaIndex.documents).length
  const totalImages = Object.values(mediaIndex.images).reduce(
    (sum, imgs) => sum + imgs.length,
    0
  )
  const totalDocuments = Object.values(mediaIndex.documents).reduce(
    (sum, docs) => sum + docs.length,
    0
  )

  logger.group(MODULE, 'Media Index Statistics')
  logger.info(MODULE, `Profiles with images: ${profilesWithImages}`)
  logger.info(MODULE, `Profiles with documents: ${profilesWithDocuments}`)
  logger.info(MODULE, `Total images: ${totalImages}`)
  logger.info(MODULE, `Total documents: ${totalDocuments}`)
  logger.groupEnd()
}

/**
 * log מידע על פרופיל ספציפי
 */
export function logProfileMedia(
  mediaIndex: MediaIndex | null,
  profileId: string
): void {
  if (!mediaIndex) {
    logger.info(MODULE, `No media index available for profile ${profileId}`)
    return
  }

  const images = getImagesForProfile(mediaIndex, profileId)
  const documents = getDocumentsForProfile(mediaIndex, profileId)

  logger.group(MODULE, `Media for Profile ${profileId}`)
  logger.info(MODULE, `Images: ${images.length}`)
  logger.info(MODULE, `Documents: ${documents.length}`)

  if (images.length > 0) {
    logger.info(MODULE, 'Image files:', images.map((img) => img.filename))
  }

  if (documents.length > 0) {
    logger.info(MODULE, 'Document files:', documents.map((doc) => doc.filename))
  }

  logger.groupEnd()
}

