/**
 * DebugLogger - מערכת logging מרכזית עבור ProfileTabs
 * מאפשר logging מתקדם עם levels, modules, timestamps
 */

import type { LogLevel, LoggerConfig, LogEntry } from '../types'
import { LOG_PREFIX } from '../constants'

class DebugLogger {
  private config: LoggerConfig = {
    enabled: true, // ניתן לשנות ל-false בפרודקשן
    level: 'DEBUG', // DEBUG | INFO | WARN | ERROR
    modules: {}, // מודולים ספציפיים שניתן להפעיל/לכבות
    prefix: LOG_PREFIX,
    timestamp: true,
  }

  private logLevels: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  }

  private logHistory: LogEntry[] = []
  private maxHistorySize = 1000

  constructor() {
    this.log('INFO', 'Logger', '🚀 DebugLogger initialized')
  }

  /**
   * הגדרת קונפיגורציה
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
    this.log('INFO', 'Logger', '⚙️ Configuration updated', config)
  }

  /**
   * הפעלה/כיבוי של מודול ספציפי
   */
  setModuleEnabled(moduleName: string, enabled: boolean): void {
    this.config.modules[moduleName] = enabled
    this.log('INFO', 'Logger', `📦 Module ${moduleName}: ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * שינוי רמת ה-log הגלובלית
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
    this.log('INFO', 'Logger', `📊 Log level set to: ${level}`)
  }

  /**
   * Log רגיל
   */
  private log(level: LogLevel, module: string, message: string, ...data: any[]): void {
    if (!this.config.enabled) return
    if (!this.shouldLog(level, module)) return

    const timestamp = new Date()
    const prefix = `${this.config.prefix}:${module}]`
    const timeStr = this.config.timestamp ? `[${timestamp.toISOString().split('T')[1].split('.')[0]}]` : ''
    const levelEmoji = this.getLevelEmoji(level)

    // הדפסה לקונסול
    const logMethod = this.getConsoleMethod(level)
    const style = this.getLevelStyle(level)

    if (data.length > 0) {
      console[logMethod](
        `%c${timeStr} ${prefix} ${levelEmoji} ${level}:`,
        style,
        message,
        ...data
      )
    } else {
      console[logMethod](`%c${timeStr} ${prefix} ${levelEmoji} ${level}:`, style, message)
    }

    // שמירה בהיסטוריה
    this.addToHistory({ timestamp, level, module, message, data: data.length > 0 ? data : undefined })
  }

  /**
   * בדיקה האם צריך לבצע log
   */
  private shouldLog(level: LogLevel, module: string): boolean {
    // בדיקת רמה גלובלית
    if (this.logLevels[level] < this.logLevels[this.config.level]) {
      return false
    }

    // בדיקת מודול ספציפי
    if (module in this.config.modules) {
      return this.config.modules[module]
    }

    return true
  }

  /**
   * קבלת method מתאים של console
   */
  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
      case 'DEBUG':
        return 'log'
      case 'INFO':
        return 'info'
      case 'WARN':
        return 'warn'
      case 'ERROR':
        return 'error'
    }
  }

  /**
   * קבלת emoji לפי level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'DEBUG':
        return '🔍'
      case 'INFO':
        return 'ℹ️'
      case 'WARN':
        return '⚠️'
      case 'ERROR':
        return '❌'
    }
  }

  /**
   * קבלת CSS style לפי level
   */
  private getLevelStyle(level: LogLevel): string {
    switch (level) {
      case 'DEBUG':
        return 'color: #6c757d; font-weight: normal;'
      case 'INFO':
        return 'color: #0d6efd; font-weight: bold;'
      case 'WARN':
        return 'color: #ffc107; font-weight: bold;'
      case 'ERROR':
        return 'color: #dc3545; font-weight: bold;'
    }
  }

  /**
   * הוספה להיסטוריה
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }
  }

  /**
   * Public API - Debug level
   */
  debug(module: string, message: string, ...data: any[]): void {
    this.log('DEBUG', module, message, ...data)
  }

  /**
   * Public API - Info level
   */
  info(module: string, message: string, ...data: any[]): void {
    this.log('INFO', module, message, ...data)
  }

  /**
   * Public API - Warning level
   */
  warn(module: string, message: string, ...data: any[]): void {
    this.log('WARN', module, message, ...data)
  }

  /**
   * Public API - Error level
   */
  error(module: string, message: string, ...data: any[]): void {
    this.log('ERROR', module, message, ...data)
  }

  /**
   * Log group (קיבוץ logs)
   */
  group(module: string, title: string): void {
    if (!this.config.enabled) return
    console.group(`${this.config.prefix}:${module}] 📂 ${title}`)
  }

  /**
   * סיום log group
   */
  groupEnd(): void {
    if (!this.config.enabled) return
    console.groupEnd()
  }

  /**
   * Log מתקדם עם timing
   */
  time(module: string, label: string): void {
    if (!this.config.enabled) return
    const timerLabel = `${this.config.prefix}:${module}] ⏱️ ${label}`
    console.time(timerLabel)
  }

  /**
   * סיום timing
   */
  timeEnd(module: string, label: string): void {
    if (!this.config.enabled) return
    const timerLabel = `${this.config.prefix}:${module}] ⏱️ ${label}`
    console.timeEnd(timerLabel)
  }

  /**
   * Log table (נוח למערכים ואובייקטים)
   */
  table(module: string, data: any): void {
    if (!this.config.enabled) return
    this.log('INFO', module, 'Data table:')
    console.table(data)
  }

  /**
   * קבלת היסטוריית logs
   */
  getHistory(level?: LogLevel, module?: string): LogEntry[] {
    let filtered = this.logHistory

    if (level) {
      filtered = filtered.filter((entry) => entry.level === level)
    }

    if (module) {
      filtered = filtered.filter((entry) => entry.module === module)
    }

    return filtered
  }

  /**
   * ניקוי היסטוריה
   */
  clearHistory(): void {
    this.logHistory = []
    this.log('INFO', 'Logger', '🗑️ History cleared')
  }

  /**
   * הדפסת סטטיסטיקות
   */
  printStats(): void {
    const stats = {
      total: this.logHistory.length,
      byLevel: {} as Record<LogLevel, number>,
      byModule: {} as Record<string, number>,
    }

    this.logHistory.forEach((entry) => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1
      stats.byModule[entry.module] = (stats.byModule[entry.module] || 0) + 1
    })

    this.group('Logger', 'Statistics')
    this.info('Logger', `Total logs: ${stats.total}`)
    this.info('Logger', 'By level:', stats.byLevel)
    this.info('Logger', 'By module:', stats.byModule)
    this.groupEnd()
  }

  /**
   * Enable/Disable logging globally
   */
  enable(): void {
    this.config.enabled = true
    console.log(`${this.config.prefix}] ✅ Logging enabled`)
  }

  disable(): void {
    console.log(`${this.config.prefix}] ❌ Logging disabled`)
    this.config.enabled = false
  }
}

// Singleton instance
export const logger = new DebugLogger()

// Export for advanced usage
export default logger

// Helper function for quick access
export function getLogger(): DebugLogger {
  return logger
}

