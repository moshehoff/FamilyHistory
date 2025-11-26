/**
 * StateManager - ניהול מצב מרכזי עבור ProfileTabs
 * מחליף משתנים גלובליים במערכת state מובנית
 */

import { logger } from '../utils/DebugLogger'
import type { ProfileTabsState, TabName, ChaptersData } from '../types'
import { TAB_NAMES } from '../constants'

const MODULE = 'StateManager'

type StateChangeListener = (state: ProfileTabsState, changedKeys: string[]) => void

class StateManager {
  private state: ProfileTabsState = {
    profileId: null,
    basePath: '',
    mediaLoaded: false,
    chaptersData: null,
    loadedChapters: new Map<string, string>(),
    isInitialLoad: true,
    activeTab: TAB_NAMES.BIOGRAPHY as TabName,
    activeChapter: null,
  }

  private listeners: StateChangeListener[] = []
  private previousState: ProfileTabsState | null = null

  constructor() {
    logger.info(MODULE, '🏗️ StateManager initialized')
    this.logState()
  }

  /**
   * קבלת ה-state הנוכחי (read-only)
   */
  getState(): Readonly<ProfileTabsState> {
    return { ...this.state }
  }

  /**
   * עדכון ה-state
   */
  setState(updates: Partial<ProfileTabsState>): void {
    this.previousState = { ...this.state }
    const changedKeys: string[] = []

    // מיזוג העדכונים
    Object.keys(updates).forEach((key) => {
      const typedKey = key as keyof ProfileTabsState
      const oldValue = this.state[typedKey]
      const newValue = updates[typedKey]

      if (oldValue !== newValue) {
        changedKeys.push(key)
        // @ts-ignore - we're updating with the correct type
        this.state[typedKey] = newValue
      }
    })

    if (changedKeys.length > 0) {
      logger.debug(MODULE, `State updated (${changedKeys.length} changes):`, changedKeys)
      logger.debug(MODULE, '→ New values:', this.getChangedValues(changedKeys))

      // התרעה למאזינים
      this.notifyListeners(changedKeys)
    }
  }

  /**
   * עדכון ערך בודד
   */
  set<K extends keyof ProfileTabsState>(key: K, value: ProfileTabsState[K]): void {
    this.setState({ [key]: value } as Partial<ProfileTabsState>)
  }

  /**
   * קבלת ערך בודד
   */
  get<K extends keyof ProfileTabsState>(key: K): ProfileTabsState[K] {
    return this.state[key]
  }

  /**
   * איפוס מלא של ה-state (לשימוש בניווט)
   */
  reset(): void {
    logger.info(MODULE, '🔄 Resetting state')

    this.previousState = { ...this.state }

    this.state = {
      profileId: null,
      basePath: '',
      mediaLoaded: false,
      chaptersData: null,
      loadedChapters: new Map<string, string>(),
      isInitialLoad: true,
      activeTab: TAB_NAMES.BIOGRAPHY as TabName,
      activeChapter: null,
    }

    this.notifyListeners(Object.keys(this.state))
    this.logState()
  }

  /**
   * איפוס חלקי (שמירה על נתונים בסיסיים)
   */
  softReset(): void {
    logger.info(MODULE, '🔄 Soft reset (keeping profileId and basePath)')

    const { profileId, basePath } = this.state

    this.setState({
      mediaLoaded: false,
      chaptersData: null,
      loadedChapters: new Map<string, string>(),
      isInitialLoad: true,
      activeTab: TAB_NAMES.BIOGRAPHY as TabName,
      activeChapter: null,
    })
  }

  /**
   * הרשמה לשינויי state
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.push(listener)
    logger.debug(MODULE, `Listener added (total: ${this.listeners.length})`)

    // Return unsubscribe function
    return () => {
      this.unsubscribe(listener)
    }
  }

  /**
   * ביטול הרשמה
   */
  unsubscribe(listener: StateChangeListener): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
      logger.debug(MODULE, `Listener removed (remaining: ${this.listeners.length})`)
    }
  }

  /**
   * התרעה לכל המאזינים
   */
  private notifyListeners(changedKeys: string[]): void {
    if (this.listeners.length === 0) return

    logger.debug(MODULE, `Notifying ${this.listeners.length} listeners`)

    this.listeners.forEach((listener) => {
      try {
        listener(this.getState(), changedKeys)
      } catch (error) {
        logger.error(MODULE, 'Error in state listener:', error)
      }
    })
  }

  /**
   * קבלת ערכים ששונו
   */
  private getChangedValues(keys: string[]): Record<string, any> {
    const values: Record<string, any> = {}
    keys.forEach((key) => {
      values[key] = this.state[key as keyof ProfileTabsState]
    })
    return values
  }

  /**
   * הדפסת ה-state הנוכחי
   */
  logState(): void {
    logger.group(MODULE, 'Current State')
    logger.info(MODULE, `Profile ID: ${this.state.profileId || 'none'}`)
    logger.info(MODULE, `Base Path: ${this.state.basePath || '/'}`)
    logger.info(MODULE, `Active Tab: ${this.state.activeTab}`)
    logger.info(MODULE, `Active Chapter: ${this.state.activeChapter || 'none'}`)
    logger.info(MODULE, `Media Loaded: ${this.state.mediaLoaded}`)
    logger.info(MODULE, `Chapters Data: ${this.state.chaptersData ? 'loaded' : 'not loaded'}`)
    logger.info(MODULE, `Loaded Chapters: ${this.state.loadedChapters.size}`)
    logger.info(MODULE, `Is Initial Load: ${this.state.isInitialLoad}`)
    logger.groupEnd()
  }

  /**
   * השוואה עם state קודם
   */
  logStateDiff(): void {
    if (!this.previousState) {
      logger.info(MODULE, 'No previous state to compare')
      return
    }

    logger.group(MODULE, 'State Diff')

    Object.keys(this.state).forEach((key) => {
      const typedKey = key as keyof ProfileTabsState
      const oldValue = this.previousState![typedKey]
      const newValue = this.state[typedKey]

      if (oldValue !== newValue) {
        logger.info(MODULE, `${key}: ${oldValue} → ${newValue}`)
      }
    })

    logger.groupEnd()
  }

  /**
   * שמירת state ב-sessionStorage (אופציונלי)
   */
  saveToStorage(): void {
    try {
      const serializable = {
        ...this.state,
        loadedChapters: Array.from(this.state.loadedChapters.entries()),
      }
      sessionStorage.setItem('profileTabsState', JSON.stringify(serializable))
      logger.debug(MODULE, '💾 State saved to sessionStorage')
    } catch (error) {
      logger.error(MODULE, 'Failed to save state to storage:', error)
    }
  }

  /**
   * טעינת state מ-sessionStorage
   */
  loadFromStorage(): boolean {
    try {
      const stored = sessionStorage.getItem('profileTabsState')
      if (!stored) return false

      const parsed = JSON.parse(stored)
      this.state = {
        ...parsed,
        loadedChapters: new Map(parsed.loadedChapters || []),
      }

      logger.info(MODULE, '📂 State loaded from sessionStorage')
      this.logState()
      return true
    } catch (error) {
      logger.error(MODULE, 'Failed to load state from storage:', error)
      return false
    }
  }

  /**
   * ניקוי storage
   */
  clearStorage(): void {
    sessionStorage.removeItem('profileTabsState')
    logger.debug(MODULE, '🗑️ State cleared from sessionStorage')
  }

  // ==========================================================================
  // Convenience methods for common operations
  // ==========================================================================

  /**
   * האם profile טעון?
   */
  hasProfile(): boolean {
    return this.state.profileId !== null
  }

  /**
   * האם chapters נטענו?
   */
  hasChapters(): boolean {
    return this.state.chaptersData !== null
  }

  /**
   * האם chapter ספציפי נטען?
   */
  isChapterLoaded(slug: string): boolean {
    return this.state.loadedChapters.has(slug)
  }

  /**
   * קבלת תוכן chapter
   */
  getChapterContent(slug: string): string | undefined {
    return this.state.loadedChapters.get(slug)
  }

  /**
   * הוספת chapter לזיכרון
   */
  cacheChapter(slug: string, content: string): void {
    this.state.loadedChapters.set(slug, content)
    logger.debug(MODULE, `Chapter cached: ${slug} (total: ${this.state.loadedChapters.size})`)
  }

  /**
   * ניקוי cache של chapters
   */
  clearChapterCache(): void {
    const count = this.state.loadedChapters.size
    this.state.loadedChapters.clear()
    logger.debug(MODULE, `Chapter cache cleared (${count} chapters removed)`)
  }

  /**
   * סימון שהטעינה הראשונית הושלמה
   */
  markInitialLoadComplete(): void {
    if (this.state.isInitialLoad) {
      this.set('isInitialLoad', false)
      logger.info(MODULE, '✅ Initial load marked as complete')
    }
  }
}

// Singleton instance
export const stateManager = new StateManager()

// Export for advanced usage
export default stateManager

