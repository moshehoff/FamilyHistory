/**
 * ProfileTabs Type Definitions
 * מכיל את כל הממשקים והטיפוסים עבור מערכת ProfileTabs
 */

// ============================================================================
// Core Types
// ============================================================================

export interface ProfileTabsState {
  profileId: string | null
  basePath: string
  mediaLoaded: boolean
  chaptersData: ChaptersData | null
  loadedChapters: Map<string, string>
  isInitialLoad: boolean
  activeTab: TabName
  activeChapter: string | null
}

export type TabName = 'biography' | 'media'

export interface HashParams {
  tab?: TabName
  chapter?: string
}

// ============================================================================
// Chapter Types
// ============================================================================

export interface ChaptersData {
  main?: ChapterInfo
  chapters: ChapterInfo[]
}

export interface ChapterInfo {
  name: string
  title: string
  slug: string
  filename: string
}

// ============================================================================
// Media Types
// ============================================================================

export interface MediaIndex {
  images: Record<string, ImageInfo[]>
  documents: Record<string, DocumentInfo[]>
}

export interface ImageInfo {
  filename: string
  path?: string
  caption?: string
}

export interface DocumentInfo {
  filename: string
  title?: string
  description?: string
  path?: string
}

// ============================================================================
// Event Management Types
// ============================================================================

export interface EventListenerInfo {
  element: Element | Window | Document
  event: string
  handler: EventListener
  description: string
  addedAt: Date
}

export type CleanupFunction = () => void

// ============================================================================
// Parser Types
// ============================================================================

export interface MarkdownParserOptions {
  chaptersData?: ChaptersData
  profileId?: string
  basePath?: string
  enableDebug?: boolean
}

export interface ParsingContext {
  htmlBlocks: string[]
  htmlBlockIndex: number
  listState: {
    inList: boolean
    listHtml: string
  }
}

// ============================================================================
// Logger Types
// ============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  modules: Record<string, boolean>
  prefix: string
  timestamp: boolean
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  module: string
  message: string
  data?: any
}

// ============================================================================
// DOM Utilities Types
// ============================================================================

export interface WaitForElementOptions {
  timeout?: number
  checkInterval?: number
  parent?: Element | Document
}

// ============================================================================
// Content Mover Types
// ============================================================================

export interface ContentElement {
  element: Element
  type: 'profile-info' | 'diagram' | 'biography' | 'other'
  priority: number
}

// ============================================================================
// Mermaid Types
// ============================================================================

export interface MermaidInitOptions {
  container: Element
  delay?: number
  markProcessed?: boolean
}

export interface MermaidElement {
  element: Element
  type: 'div' | 'code'
  processed: boolean
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavigationState {
  tab: TabName
  chapter?: string
  profileId: string
}

export interface HistoryStateData {
  tab?: TabName
  chapter?: string
  profileId?: string
}

