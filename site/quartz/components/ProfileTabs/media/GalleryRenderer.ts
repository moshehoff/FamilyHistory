/**
 * GalleryRenderer - רינדור גלריית תמונות ומסמכים
 */

import { logger } from '../utils/DebugLogger'
import { createElement } from '../utils/DomUtils'
import type { ImageInfo, DocumentInfo } from '../types'
import {
  getImagePath,
  getDocumentPath,
  formatCaption,
  getAltTextFromCaption,
  getFileExtension,
} from './MediaLoader'
import { CSS_CLASSES, DOCUMENT_ICONS, MESSAGES } from '../constants'

const MODULE = 'GalleryRenderer'

/**
 * רינדור גלריה מלאה (תמונות ומסמכים)
 */
export function renderGallery(
  container: Element,
  images: ImageInfo[],
  documents: DocumentInfo[],
  profileId: string,
  basePath: string = ''
): void {
  logger.time(MODULE, 'renderGallery')
  logger.info(MODULE, `Rendering gallery: ${images.length} images, ${documents.length} documents`)

  // ניקוי container
  container.innerHTML = ''

  // אם אין מדיה
  if (images.length === 0 && documents.length === 0) {
    container.innerHTML = `<div class="${CSS_CLASSES.EMPTY_MESSAGE}">${MESSAGES.EMPTY_GALLERY}</div>`
    logger.debug(MODULE, 'No media to display')
    logger.timeEnd(MODULE, 'renderGallery')
    return
  }

  // רינדור תמונות
  if (images.length > 0) {
    const imagesSection = renderImagesSection(images, profileId, basePath)
    container.appendChild(imagesSection)
  }

  // רינדור מסמכים
  if (documents.length > 0) {
    const documentsSection = renderDocumentsSection(documents, profileId, basePath)
    container.appendChild(documentsSection)
  }

  logger.info(MODULE, '✓ Gallery rendered successfully')
  logger.timeEnd(MODULE, 'renderGallery')
}

/**
 * רינדור סקציה של תמונות
 */
function renderImagesSection(
  images: ImageInfo[],
  profileId: string,
  basePath: string
): HTMLElement {
  logger.debug(MODULE, `Rendering ${images.length} images...`)

  const section = createElement('div', {
    class: CSS_CLASSES.MEDIA_SECTION,
  })

  const heading = createElement('h3', {}, 'Images')
  const gallery = createElement('div', {
    class: CSS_CLASSES.GALLERY_GRID,
  })

  section.appendChild(heading)
  section.appendChild(gallery)

  images.forEach((image, index) => {
    const item = renderGalleryItem(image, profileId, basePath, index)
    gallery.appendChild(item)
  })

  logger.debug(MODULE, `✓ Rendered ${images.length} images`)
  return section
}

/**
 * רינדור פריט בגלריה
 */
function renderGalleryItem(
  image: ImageInfo,
  profileId: string,
  basePath: string,
  index: number
): HTMLElement {
  const imagePath = getImagePath(image, profileId, basePath)
  const altText = getAltTextFromCaption(image.caption)
  const formattedCaption = formatCaption(image.caption, basePath)

  const item = createElement('div', {
    class: CSS_CLASSES.GALLERY_ITEM,
  })

  // תמונה
  const img = createElement('img', {
    src: imagePath,
    alt: altText || `Image ${index + 1}`,
  }) as HTMLImageElement

  item.appendChild(img)

  // Caption
  if (formattedCaption) {
    const caption = createElement('div', {
      class: CSS_CLASSES.IMAGE_CAPTION,
    })
    caption.innerHTML = formattedCaption
    item.appendChild(caption)
  }

  // Click handler - פתיחה בחלון חדש
  item.addEventListener('click', (e) => {
    // אם לחצו על link בתוך caption, אל תפתח את התמונה
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'a') {
      return
    }
    window.open(imagePath, '_blank')
  })

  return item
}

/**
 * רינדור סקציה של מסמכים
 */
function renderDocumentsSection(
  documents: DocumentInfo[],
  profileId: string,
  basePath: string
): HTMLElement {
  logger.debug(MODULE, `Rendering ${documents.length} documents...`)

  const section = createElement('div', {
    class: CSS_CLASSES.MEDIA_SECTION,
  })

  const heading = createElement('h3', {}, 'Documents')
  const list = createElement('div', {
    class: CSS_CLASSES.DOCUMENTS_LIST,
  })

  section.appendChild(heading)
  section.appendChild(list)

  documents.forEach((document) => {
    const item = renderDocumentItem(document, profileId, basePath)
    list.appendChild(item)
  })

  logger.debug(MODULE, `✓ Rendered ${documents.length} documents`)
  return section
}

/**
 * רינדור פריט מסמך
 */
function renderDocumentItem(
  document: DocumentInfo,
  profileId: string,
  basePath: string
): HTMLElement {
  const documentPath = getDocumentPath(document, profileId, basePath)
  const icon = getDocumentIcon(document.filename)
  const title = document.title || document.filename
  const description = document.description || ''

  const item = createElement('div', {
    class: CSS_CLASSES.DOCUMENT_ITEM,
  })

  // Icon
  const iconDiv = createElement('div', {
    class: CSS_CLASSES.DOCUMENT_ICON,
  })
  iconDiv.textContent = icon
  item.appendChild(iconDiv)

  // Info
  const info = createElement('div', {
    class: CSS_CLASSES.DOCUMENT_INFO,
  })

  const nameDiv = createElement('div', {
    class: CSS_CLASSES.DOCUMENT_NAME,
  })
  nameDiv.textContent = title
  info.appendChild(nameDiv)

  if (description) {
    const metaDiv = createElement('div', {
      class: CSS_CLASSES.DOCUMENT_META,
    })
    metaDiv.textContent = description
    info.appendChild(metaDiv)
  }

  item.appendChild(info)

  // Download button
  const downloadLink = createElement('a', {
    href: documentPath,
    download: '',
    class: CSS_CLASSES.DOCUMENT_DOWNLOAD,
  })
  downloadLink.textContent = 'Download'
  item.appendChild(downloadLink)

  return item
}

/**
 * קבלת icon למסמך לפי סוג
 */
export function getDocumentIcon(filename: string): string {
  const ext = getFileExtension(filename)
  return DOCUMENT_ICONS[ext] || DOCUMENT_ICONS['txt']
}

/**
 * רינדור הודעת loading
 */
export function renderLoadingMessage(container: Element): void {
  container.innerHTML = `<div class="${CSS_CLASSES.LOADING_MESSAGE}">${MESSAGES.LOADING_GALLERY}</div>`
}

/**
 * רינדור הודעת שגיאה
 */
export function renderErrorMessage(container: Element, error?: string): void {
  const message = error || MESSAGES.ERROR_LOADING_GALLERY
  container.innerHTML = `<div class="${CSS_CLASSES.EMPTY_MESSAGE}">${message}</div>`
}

/**
 * רינדור הודעה ריקה
 */
export function renderEmptyMessage(container: Element): void {
  container.innerHTML = `<div class="${CSS_CLASSES.EMPTY_MESSAGE}">${MESSAGES.EMPTY_GALLERY}</div>`
}

/**
 * ניקוי gallery
 */
export function clearGallery(container: Element): void {
  container.innerHTML = ''
  logger.debug(MODULE, 'Gallery cleared')
}

/**
 * בדיקה האם gallery כבר מלאה בתוכן
 */
export function isGalleryPopulated(container: Element): boolean {
  if (!container || !container.innerHTML) return false

  const html = container.innerHTML.trim()

  // בדיקה אם יש תוכן שאינו loading או empty
  return (
    html.length > 0 &&
    !html.includes(MESSAGES.LOADING_GALLERY) &&
    !html.includes(MESSAGES.EMPTY_GALLERY) &&
    !html.includes(CSS_CLASSES.LOADING_MESSAGE) &&
    !html.includes(CSS_CLASSES.EMPTY_MESSAGE)
  )
}

/**
 * סטטיסטיקות של gallery
 */
export function logGalleryStats(container: Element): void {
  const images = container.querySelectorAll(`.${CSS_CLASSES.GALLERY_ITEM}`)
  const documents = container.querySelectorAll(`.${CSS_CLASSES.DOCUMENT_ITEM}`)

  logger.group(MODULE, 'Gallery Statistics')
  logger.info(MODULE, `Total images: ${images.length}`)
  logger.info(MODULE, `Total documents: ${documents.length}`)
  logger.groupEnd()
}

