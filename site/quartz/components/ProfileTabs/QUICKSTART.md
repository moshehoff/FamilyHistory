# 🚀 Quick Start - ProfileTabs v2.0

## התקנה ובנייה (5 דקות)

### שלב 1: התקן Dependencies
```bash
cd site/quartz/components/ProfileTabs
npm install
```

### שלב 2: בנה את ה-Bundle
```bash
npm run build
```

**תוצאה:** נוצר `dist/profile-tabs-bundle.js`

### שלב 3: אינטגרציה

ערוך את `ProfileTabs.tsx` (הראשי):

```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"
import fs from 'fs'

export default (() => {
  const ProfileTabs: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    const profileId = fileData.frontmatter?.ID as string | undefined
    const isProfile = fileData.frontmatter?.type === "profile"
    
    if (!isProfile || !profileId) {
      return null
    }

    const basePath = pathToRoot(fileData.slug!)

    return (
      <div 
        class={classNames(displayClass, "profile-tabs")} 
        data-profile-id={profileId} 
        data-base-path={basePath}
      >
        <div class="tabs-header">
          <button class="tab-button active" data-tab="biography">
            📖 Biography
          </button>
          <button class="tab-button" data-tab="media" id="media-tab-button" style="display: none;">
            🖼️ Gallery
          </button>
        </div>
        
        <div class="tabs-content">
          <div class="tab-pane active" data-tab-content="biography">
            {/* Biography content */}
          </div>
          
          <div class="tab-pane" data-tab-content="media">
            <div id="media-content">
              <div class="loading-message">Loading gallery...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Load CSS
  ProfileTabs.css = fs.readFileSync('./ProfileTabs/ProfileTabs.css', 'utf8')

  // Load bundled JavaScript
  ProfileTabs.afterDOMLoaded = fs.readFileSync('./ProfileTabs/dist/profile-tabs-bundle.js', 'utf8')

  return ProfileTabs
}) satisfies QuartzComponentConstructor
```

### שלב 4: בדוק
```bash
npx quartz build --serve
```

פתח profile page בדפדפן ובדוק:
- ✅ Tabs מוצגים
- ✅ אין שגיאות בקונסול
- ✅ Tab switching עובד

## 🐛 Debug Mode

פתח קונסול ובדפדפן והקלד:

```javascript
// הפעל debug mode
__profileTabs.setDebug(true)

// בדוק state
__profileTabs.getState()

// צפה בלוגים
// יופיעו לוגים מפורטים עם [ProfileTabs:Module] prefix
```

## 📊 בדיקות חשובות

### ✅ Test Checklist

1. **Basic Loading**
   ```javascript
   // Should see in console:
   // [ProfileTabs:ProfileTabsManager] 🚀 Initializing ProfileTabs...
   // [ProfileTabs:ProfileTabsManager] ✅ ProfileTabs initialization complete!
   ```

2. **Tab Switching**
   - לחץ על Gallery → אמור להיפתח
   - חזור ל-Biography → אמור לחזור

3. **Chapter Navigation** (אם יש)
   - לחץ על פרק → אמור לטעון
   - בדוק שה-URL מתעדכן

4. **Browser Navigation**
   - לחץ Back בדפדפן → אמור לחזור לפרק קודם
   - לחץ Forward → אמור להתקדם

## ⚡ Production Build

לפרודקשן, השתמש בגרסה minified:

```bash
npm run build:min
```

עדכן ב-`ProfileTabs.tsx`:
```tsx
ProfileTabs.afterDOMLoaded = fs.readFileSync(
  './ProfileTabs/dist/profile-tabs-bundle.min.js', 
  'utf8'
)
```

## 🔄 Development Workflow

### Watch Mode (פיתוח מתמשך)
```bash
npm run dev
```

זה יבנה מחדש אוטומטית כשיש שינויים ב-TypeScript files.

### עריכה + Build
```bash
# ערוך קובץ (למשל utils/DebugLogger.ts)
nano utils/DebugLogger.ts

# בנה מחדש
npm run build

# רענן דפדפן
```

## 🎯 Common Tasks

### הוסף פיצ'ר חדש
1. צור מודול חדש (למשל `utils/NewUtil.ts`)
2. הוסף ל-`build-bundle.js` ברשימת `MODULES_ORDER`
3. `npm run build`
4. רענן דפדפן

### שנה log level
```javascript
// In console:
__profileTabs.setDebug(false)  // Disable debug logs
__profileTabs.logger.setLevel('ERROR')  // Only errors
```

### נקה cache של chapters
```javascript
__profileTabs.stateManager.clearChapterCache()
```

### צפה ב-event listeners
```javascript
__profileTabs.eventManager.logStats()
```

## 🆘 אם משהו לא עובד

### בעיה: "Bundle not found"
```bash
# ודא שה-build רץ:
ls -l dist/
# אמור להיות profile-tabs-bundle.js
```

### בעיה: "Cannot find module"
```bash
# בדוק שכל הקבצים קיימים:
npm run type-check
```

### בעיה: "State is undefined"
```javascript
// בדוק אתחול:
__profileTabs.getState()
// אם זה Promise, השתמש ב-await:
await __profileTabs.getState()
```

### בעיה: "Tabs not switching"
```javascript
// הפעל debug ובדוק:
__profileTabs.setDebug(true)
// לחץ על tab וראה מה קורה בקונסול
```

## 📚 למידע נוסף

- **מבנה מפורט**: ראה `README.md`
- **אינטגרציה מלאה**: ראה `INTEGRATION_GUIDE.md`
- **סיכום רפקטורינג**: ראה `REFACTORING_SUMMARY.md`

## 🎉 Success!

אם הגעת לכאן והכל עובד - מעולה! 

הקוד החדש הוא:
- 🚀 מהיר יותר
- 🧹 נקי יותר  
- 🐛 קל יותר לדיבאג
- 🔧 קל יותר לתחזק

---

**זמן הפעלה משוער:** 5-10 דקות  
**קושי:** 🟢 קל

