/**
 * MarkdownParser - המרת Markdown ל-HTML
 * מרכז את לוגיקת ה-parsing שהייתה בפונקציה הענקית parseMarkdownToHTML
 */

import { logger } from '../utils/DebugLogger'
import type { MarkdownParserOptions, ParsingContext, ChaptersData } from '../types'
import { MD_PATTERNS, PLACEHOLDERS, API_PATHS } from '../constants'

const MODULE = 'MarkdownParser'

export class MarkdownParser {
  private options: Required<MarkdownParserOptions>

  constructor(options: MarkdownParserOptions = {}) {
    this.options = {
      chaptersData: options.chaptersData || null,
      profileId: options.profileId || '',
      basePath: options.basePath || '',
      enableDebug: options.enableDebug ?? false,
    }

    if (this.options.enableDebug) {
      logger.debug(MODULE, 'MarkdownParser initialized with options:', this.options)
    }
  }

  /**
   * המרה מלאה של Markdown ל-HTML
   */
  parse(markdown: string): string {
    logger.time(MODULE, 'parse')
    logger.debug(MODULE, `Parsing markdown (${markdown.length} chars)`)

    let html = markdown

    // סדר חשוב! כל שלב תלוי בקודמים
    html = this.parseCodeBlocks(html)
    html = this.parseImages(html)
    html = this.parseProfileLinks(html)
    html = this.parseOrderedLists(html)
    html = this.parseWikiLinks(html)

    // שמירת HTML blocks לפני עיבוד bold/italic
    const { html: htmlWithPlaceholders, blocks } = this.protectHtmlBlocks(html)
    html = htmlWithPlaceholders

    html = this.parseHeaders(html)
    html = this.parseBoldAndItalic(html)

    // החזרת HTML blocks
    html = this.restoreHtmlBlocks(html, blocks)

    html = this.parseExternalLinks(html)
    html = this.parseLineBreaks(html)
    html = this.parseParagraphs(html)
    html = this.parseInlineCode(html)

    logger.timeEnd(MODULE, 'parse')
    logger.debug(MODULE, `✓ Parsing complete (${html.length} chars)`)

    return html
  }

  /**
   * 1. Code blocks (triple backticks) - חייב להיות ראשון!
   */
  private parseCodeBlocks(html: string): string {
    logger.debug(MODULE, 'Parsing code blocks...')
    let count = 0

    const result = html.replace(MD_PATTERNS.CODE_BLOCK, (match, lang, code) => {
      count++
      // הסרת רווחים מיותרים
      code = code.replace(/^\n+|\n+$/g, '')
      // Escape HTML
      code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const langAttr = lang ? ` class="language-${lang}"` : ''
      return `<pre><code${langAttr}>${code}</code></pre>`
    })

    logger.debug(MODULE, `→ Found ${count} code blocks`)
    return result
  }

  /**
   * 2. Images ![[image.png]]
   */
  private parseImages(html: string): string {
    logger.debug(MODULE, 'Parsing images...')
    let count = 0

    const result = html.replace(MD_PATTERNS.IMAGE_WIKI, (match, imagePath) => {
      count++
      const filename = imagePath.split('/').pop()
      // Replace spaces AND underscores with dashes
      const filenameWithDashes = filename.replace(/[ _]/g, '-')
      const imageSrc = this.options.basePath + filenameWithDashes
      const imageSrcWithSpaces = this.options.basePath + encodeURIComponent(filename)
      const escapedFilename = filename.replace(/"/g, '&quot;')

      // Fallback if dashes fail
      return `<img src="${imageSrc}" alt="${escapedFilename}" onerror="this.src=&quot;${imageSrcWithSpaces}&quot;">`
    })

    logger.debug(MODULE, `→ Found ${count} images`)
    return result
  }

  /**
   * 3. Profile links [text](/profiles/...)
   */
  private parseProfileLinks(html: string): string {
    logger.debug(MODULE, 'Parsing profile links...')
    let count = 0

    // Detect site base path from current URL
    let siteBasePath = ''
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (currentPath.indexOf('/profiles/') > 0) {
        const beforeProfiles = currentPath.substring(0, currentPath.indexOf('/profiles/'))
        if (beforeProfiles && beforeProfiles !== '' && beforeProfiles !== '/') {
          siteBasePath = beforeProfiles
        }
      }
    }

    const result = html.replace(MD_PATTERNS.LINK_PROFILE, (match, text, path) => {
      count++
      return `<a href="${siteBasePath}${path}">${text}</a>`
    })

    logger.debug(MODULE, `→ Fixed ${count} profile links (base: ${siteBasePath})`)
    return result
  }

  /**
   * 4. Ordered lists (1. item, 2. item, etc.)
   */
  private parseOrderedLists(html: string): string {
    logger.debug(MODULE, 'Parsing ordered lists...')

    const lines = html.split('\n')
    let inList = false
    let listHtml = ''
    const processedLines: string[] = []
    let listCount = 0

    for (const line of lines) {
      const listMatch = line.match(MD_PATTERNS.ORDERED_LIST)

      if (listMatch) {
        if (!inList) {
          inList = true
          listHtml = '<ol>'
          listCount++
        }
        listHtml += `<li>${listMatch[2]}</li>`
      } else {
        if (inList) {
          listHtml += '</ol>'
          processedLines.push(listHtml)
          listHtml = ''
          inList = false
        }
        processedLines.push(line)
      }
    }

    if (inList) {
      listHtml += '</ol>'
      processedLines.push(listHtml)
    }

    logger.debug(MODULE, `→ Created ${listCount} ordered lists`)
    return processedLines.join('\n')
  }

  /**
   * 5. Wiki-style links [[slug|Display Text]] - convert to chapter links
   */
  private parseWikiLinks(html: string): string {
    logger.debug(MODULE, 'Parsing wiki links...')
    let count = 0

    const result = html.replace(MD_PATTERNS.LINK_WIKI, (match, text) => {
      count++
      const parts = text.split('|')
      const slug = parts[0].trim()
      const displayText = parts.length > 1 ? parts[1].trim() : slug

      // Extract filename from full path
      let cleanSlug = slug
      if (slug.includes('/')) {
        const pathParts = slug.split('/')
        cleanSlug = pathParts[pathParts.length - 1]
      }

      // Try to find matching chapter
      const targetSlug = this.findMatchingChapterSlug(cleanSlug)

      return `<a href="javascript:void(0)" class="chapter-link" data-chapter-slug="${targetSlug}">${displayText}</a>`
    })

    logger.debug(MODULE, `→ Converted ${count} wiki links to chapter links`)
    return result
  }

  /**
   * מציאת chapter תואם לפי slug/name
   */
  private findMatchingChapterSlug(slug: string): string {
    if (!this.options.chaptersData) {
      return slug.replace(/_/g, '-').toLowerCase()
    }

    const normalized = slug.toLowerCase().replace(/_/g, '-')
    const chaptersData = this.options.chaptersData

    // Check main chapter
    if (chaptersData.main) {
      if (
        chaptersData.main.slug === normalized ||
        chaptersData.main.name.toLowerCase() === normalized ||
        chaptersData.main.filename.toLowerCase().replace('.md', '') === normalized
      ) {
        return chaptersData.main.slug
      }
    }

    // Check other chapters
    for (const chapter of chaptersData.chapters) {
      const chapterNameNormalized = chapter.name.toLowerCase().replace(/_/g, '-')
      const chapterFilenameNormalized = chapter.filename.toLowerCase().replace('.md', '').replace(/_/g, '-')

      // Exact match
      if (
        chapter.slug === normalized ||
        chapterNameNormalized === normalized ||
        chapterFilenameNormalized === normalized ||
        chapter.title.toLowerCase() === normalized
      ) {
        return chapter.slug
      }

      // Match without leading numbers
      const slugWithoutNumbers = normalized.replace(/^\d+-/, '')
      const chapterNameWithoutNumbers = chapterNameNormalized.replace(/^\d+-/, '')
      const chapterFilenameWithoutNumbers = chapterFilenameNormalized.replace(/^\d+-/, '')

      if (
        slugWithoutNumbers === chapterNameWithoutNumbers ||
        slugWithoutNumbers === chapterFilenameWithoutNumbers
      ) {
        return chapter.slug
      }
    }

    // No match found, return normalized slug
    return normalized
  }

  /**
   * הגנה על HTML blocks לפני עיבוד bold/italic
   */
  private protectHtmlBlocks(html: string): { html: string; blocks: string[] } {
    logger.debug(MODULE, 'Protecting HTML blocks...')

    const blocks: string[] = []
    let blockIndex = 0

    // Replace img tags
    let result = html.replace(/<img[^>]*>/g, (match) => {
      const placeholder = `${PLACEHOLDERS.HTML_BLOCK}${blockIndex}${PLACEHOLDERS.HTML_BLOCK_END}`
      blocks[blockIndex] = match
      blockIndex++
      return placeholder
    })

    // Replace other HTML tags
    result = result.replace(/<(a|pre|code)([^>]*)>([\s\S]*?)<\/(a|pre|code)>/g, (match) => {
      const placeholder = `${PLACEHOLDERS.HTML_BLOCK}${blockIndex}${PLACEHOLDERS.HTML_BLOCK_END}`
      blocks[blockIndex] = match
      blockIndex++
      return placeholder
    })

    logger.debug(MODULE, `→ Protected ${blockIndex} HTML blocks`)
    return { html: result, blocks }
  }

  /**
   * החזרת HTML blocks
   */
  private restoreHtmlBlocks(html: string, blocks: string[]): string {
    return html.replace(/___HTML_BLOCK_(\d+)___/g, (match, index) => {
      return blocks[parseInt(index)] || match
    })
  }

  /**
   * 6. Headers (###, ##, #)
   */
  private parseHeaders(html: string): string {
    logger.debug(MODULE, 'Parsing headers...')

    let result = html
    result = result.replace(MD_PATTERNS.HEADER_3, '<h3>$1</h3>')
    result = result.replace(MD_PATTERNS.HEADER_2, '<h2>$1</h2>')
    result = result.replace(MD_PATTERNS.HEADER_1, '<h1>$1</h1>')

    return result
  }

  /**
   * 7. Bold and Italic (**, *, _)
   */
  private parseBoldAndItalic(html: string): string {
    logger.debug(MODULE, 'Parsing bold and italic...')

    // Split by placeholders to avoid processing inside them
    const segments = html.split(/(___HTML_BLOCK_\d+___)/)

    for (let i = 0; i < segments.length; i++) {
      // Skip placeholders
      if (!segments[i].match(/^___HTML_BLOCK_\d+___$/)) {
        // Bold
        segments[i] = segments[i].replace(MD_PATTERNS.BOLD, '<strong>$1</strong>')
        // Italic with *
        segments[i] = segments[i].replace(MD_PATTERNS.ITALIC_STAR, '<em>$1</em>')
        // Italic with _
        segments[i] = segments[i].replace(MD_PATTERNS.ITALIC_UNDERSCORE, '$1<em>$2</em>$3')
      }
    }

    return segments.join('')
  }

  /**
   * 8. External links [text](url)
   */
  private parseExternalLinks(html: string): string {
    logger.debug(MODULE, 'Parsing external links...')

    return html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  }

  /**
   * 9. Line breaks (two spaces at end of line)
   */
  private parseLineBreaks(html: string): string {
    return html.replace(/  \r?\n/g, '<br>\n')
  }

  /**
   * 10. Paragraphs
   */
  private parseParagraphs(html: string): string {
    logger.debug(MODULE, 'Parsing paragraphs...')

    // First, protect multi-line HTML blocks
    const htmlBlockPlaceholder = '___HTML_BLOCK_PLACEHOLDER___'
    const htmlBlocks: string[] = []
    let htmlBlockCounter = 0

    const htmlBlockRegex = /<((div|blockquote|pre|ul|ol|table)[^>]*)>([\s\S]*?)<\/(div|blockquote|pre|ul|ol|table)>/gi
    let result = html.replace(htmlBlockRegex, (match) => {
      const placeholder = `${htmlBlockPlaceholder}${htmlBlockCounter}___`
      htmlBlocks[htmlBlockCounter] = match
      htmlBlockCounter++
      return placeholder
    })

    // Split by double newlines
    const paragraphs = result.split(/\n\n/)
    result = paragraphs
      .map((p) => {
        p = p.trim()
        if (!p) return ''

        // Restore HTML blocks
        const placeholderMatch = p.match(new RegExp(`${htmlBlockPlaceholder}(\\d+)___`))
        if (placeholderMatch) {
          const blockIndex = parseInt(placeholderMatch[1])
          return htmlBlocks[blockIndex]
        }

        // Don't wrap block elements
        if (p.match(/^<(div|blockquote|pre|ul|ol|table|h[1-6]|hr)/i)) {
          return p
        }

        // Don't wrap closing tags
        if (p.match(/^<\//)) {
          return p
        }

        // Don't wrap complete HTML blocks
        if (p.match(/^<[^>]+>.*<\/[^>]+>$/)) {
          return p
        }

        // Wrap in <p> tag
        if (p && !p.match(/^<[h|d|u|o|l]/)) {
          return `<p>${p}</p>`
        }

        return p
      })
      .join('\n')

    return result
  }

  /**
   * 11. Inline code (single backticks)
   */
  private parseInlineCode(html: string): string {
    return html.replace(MD_PATTERNS.INLINE_CODE, '<code>$1</code>')
  }
}

/**
 * Helper function למהירות (ללא יצירת instance)
 */
export function parseMarkdown(markdown: string, options: MarkdownParserOptions = {}): string {
  const parser = new MarkdownParser(options)
  return parser.parse(markdown)
}

export default MarkdownParser

