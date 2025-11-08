# Design: Biography Tabs with Nested Chapter Tabs

## המבנה הרצוי (Visual Design)

```
┌─────────────────────────────────────────────────────────────┐
│                    עמוד פרופיל                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [📖 Biography]  [🖼️ Gallery]                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Biography Tab Content (active):                      │  │
│  │  ───────────────────────────────────────────────────  │  │
│  │                                                       │  │
│  │  📋 פרטי הפרופיל:                                     │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │ Birth: 1884                                 │     │  │
│  │  │ Death: 1973                                 │     │  │
│  │  │ Parents: ...                                │     │  │
│  │  │ Spouse: ...                                 │     │  │
│  │  │ Children: ...                               │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  │                                                       │  │
│  │  📊 דיאגרמות:                                        │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │ Family Tree (Mermaid)                       │     │  │
│  │  │ Descendants (Mermaid)                      │     │  │
│  │  │ Ancestors (Mermaid)                        │     │  │
│  │  │ Nuclear Family (Mermaid)                   │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  │                                                       │  │
│  │  ───────────────────────────────────────────────────  │  │
│  │                                                       │  │
│  │  📚 ביוגרפיה מורחבת:                                 │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │ [📖 Introduction] [📄 Chapter 1] [📄 Ch 2]   │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │                                             │     │  │
│  │  │  תוכן הפרק הנבחר (Introduction/Chapter 1/2) │     │  │
│  │  │                                             │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Gallery Tab Content (hidden when Biography active): │  │
│  │  ───────────────────────────────────────────────────  │  │
│  │                                                       │  │
│  │  🖼️ תמונות ומסמכים בלבד                              │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## עקרונות עיצוב

1. **טאבים ראשיים**: Biography (active) | Gallery
2. **בתוך טאב Biography**:
   - פרטי הפרופיל (Birth, Death, Parents, Spouse, Children) - **בתחילה**
   - דיאגרמות (Mermaid) - **אחרי הפרטים**
   - טאבים משניים לפרקים - **אחרי הדיאגרמות**
   - תוכן הפרק הנבחר - **תחת הטאבים המשניים**

3. **Gallery Tab**: רק תמונות ומסמכים

## שינויים נדרשים בקוד

### 1. `site/quartz.layout.ts`

**שינוי**: העברת `ProfileTabs` מ-`beforeBody` ל-`afterBody`

**למה**: 
- `ProfileTabs` צריך להופיע אחרי ה-`article` (שמכיל את הפרטים והדיאגרמות)
- אחר כך נזיז את התוכן מה-`article` לטאב Biography באמצעות JavaScript

**קוד**:
```typescript
// לפני:
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    ...
    Component.ProfileTabs(),  // ← כאן
  ],
  ...
}

// אחרי:
export const sharedPageComponents: SharedLayout = {
  ...
  afterBody: [
    Component.ConditionalRender({
      component: Component.ProfileTabs(),
      condition: (page) => page.fileData.frontmatter?.type === "profile",
    }),
  ],
  ...
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    ...
    // ProfileTabs הועבר ל-afterBody
  ],
  ...
}
```

---

### 2. `site/quartz/components/ProfileTabs.tsx`

#### 2.1. העברת ProfileTabs ל-article

**למה**: `ProfileTabs` מופיע ב-`afterBody` (אחרי ה-article), אבל אנחנו רוצים שהוא יהיה בתוך ה-article כדי שנוכל להעביר את התוכן אליו.

**קוד**:
```javascript
// בפונקציה initProfileTabs()
function moveProfileTabsToArticle() {
  const profileTabs = document.querySelector('.profile-tabs');
  const article = document.querySelector('article');
  
  if (profileTabs && article && profileTabs.parentElement !== article) {
    article.appendChild(profileTabs);
  }
}
```

#### 2.2. העברת פרטים ודיאגרמות לטאב Biography

**למה**: 
- הפרטים והדיאגרמות נמצאים ב-`article` (מחוץ לטאבים)
- אנחנו רוצים שהם יהיו בתוך טאב Biography
- צריך למיין אותם כך שפרטים יופיעו לפני דיאגרמות

**קוד**:
```javascript
function moveContentToBiographyTab() {
  const profileTabs = document.querySelector('.profile-tabs');
  const biographyPane = document.querySelector('[data-tab-content="biography"]');
  const article = document.querySelector('article');
  
  // 1. העברת ProfileTabs ל-article
  if (profileTabs.parentElement !== article) {
    article.appendChild(profileTabs);
  }
  
  // 2. איסוף כל התוכן לפני ProfileTabs
  const articleChildren = Array.from(article.children);
  let profileTabsIndex = articleChildren.indexOf(profileTabs);
  
  if (profileTabsIndex > 0) {
    const elementsToMove = articleChildren.slice(0, profileTabsIndex);
    
    // 3. מיון: פרטים → דיאגרמות
    const profileInfoElements = [];
    const diagramElements = [];
    const otherElements = [];
    
    elementsToMove.forEach(function(element) {
      const tagName = element.tagName ? element.tagName.toLowerCase() : '';
      
      // זיהוי פרטים (dl = definition list)
      if (tagName === 'dl' || element.querySelector('dl')) {
        profileInfoElements.push(element);
      }
      // זיהוי דיאגרמות (h2 או code עם mermaid)
      else if (tagName === 'h2' || 
               element.querySelector('.mermaid') || 
               element.querySelector('code.language-mermaid')) {
        diagramElements.push(element);
      }
      else {
        otherElements.push(element);
      }
    });
    
    // 4. העברה בסדר: פרטים → אחר → דיאגרמות
    const sortedElements = profileInfoElements.concat(otherElements).concat(diagramElements);
    sortedElements.forEach(function(element) {
      biographyPane.insertBefore(element, biographyPane.firstChild);
    });
  }
}
```

#### 2.3. יצירת טאבים משניים (פרקים) בתוך טאב Biography

**למה**: 
- הטאבים המשניים צריכים להופיע **אחרי** הפרטים והדיאגרמות
- הם צריכים להיות **בתוך** טאב Biography, לא ברמה העליונה

**קוד**:
```javascript
function createChapterTabs(chapters) {
  const biographyPane = document.querySelector('[data-tab-content="biography"]');
  
  // יצירת מבנה הטאבים המשניים
  const chapterTabsContainer = document.createElement('div');
  chapterTabsContainer.className = 'chapter-tabs-container';
  
  const chapterTabsHeader = document.createElement('div');
  chapterTabsHeader.className = 'chapter-tabs-header';
  
  const chapterTabsContent = document.createElement('div');
  chapterTabsContent.className = 'chapter-tabs-content';
  
  // הוספת טאב Introduction (אם קיים)
  if (chapters.main) {
    // יצירת כפתור טאב
    const mainButton = document.createElement('button');
    mainButton.className = 'chapter-tab-button active';
    mainButton.setAttribute('data-chapter-slug', chapters.main.slug);
    mainButton.textContent = '📖 Introduction';
    chapterTabsHeader.appendChild(mainButton);
    
    // יצירת תוכן טאב
    const mainPane = document.createElement('div');
    mainPane.className = 'chapter-tab-pane active';
    mainPane.setAttribute('data-chapter-slug', chapters.main.slug);
    mainPane.innerHTML = '<div class="loading-message">Loading chapter...</div>';
    chapterTabsContent.appendChild(mainPane);
  }
  
  // הוספת טאבים לפרקים
  chapters.chapters.forEach(function(chapter) {
    // יצירת כפתור טאב
    const chapterButton = document.createElement('button');
    chapterButton.className = 'chapter-tab-button';
    chapterButton.setAttribute('data-chapter-slug', chapter.slug);
    chapterButton.textContent = '📄 ' + chapter.title;
    chapterTabsHeader.appendChild(chapterButton);
    
    // יצירת תוכן טאב
    const chapterPane = document.createElement('div');
    chapterPane.className = 'chapter-tab-pane';
    chapterPane.setAttribute('data-chapter-slug', chapter.slug);
    chapterPane.innerHTML = '<div class="loading-message">Loading chapter...</div>';
    chapterTabsContent.appendChild(chapterPane);
  });
  
  // חיבור הכל
  chapterTabsContainer.appendChild(chapterTabsHeader);
  chapterTabsContainer.appendChild(chapterTabsContent);
  
  // הוספה לסוף טאב Biography (אחרי הפרטים והדיאגרמות)
  biographyPane.appendChild(chapterTabsContainer);
}
```

#### 2.4. טעינת תוכן הפרקים

**למה**: 
- הפרקים נמצאים ב-`/static/chapters/{profileId}/{filename}.md`
- צריך לטעון אותם דינמית ולהציג אותם בטאב המתאים
- צריך להשתמש ב-`filename` מ-`chapters-index.json`, לא ב-`slug`

**קוד**:
```javascript
function loadChapter(chapterSlug) {
  // מציאת שם הקובץ מ-chaptersData
  var chapterFilename = null;
  if (chaptersData) {
    if (chaptersData.main && chaptersData.main.slug === chapterSlug) {
      chapterFilename = chaptersData.main.filename;
    } else {
      for (var i = 0; i < chaptersData.chapters.length; i++) {
        if (chaptersData.chapters[i].slug === chapterSlug) {
          chapterFilename = chaptersData.chapters[i].filename;
          break;
        }
      }
    }
  }
  
  // טעינת הקובץ
  const chapterPath = '/static/chapters/' + profileId + '/' + chapterFilename;
  fetch(chapterPath)
    .then(function(response) {
      if (!response.ok) throw new Error('Chapter not found');
      return response.text();
    })
    .then(function(content) {
      // המרת Markdown ל-HTML
      const html = parseMarkdownToHTML(content, chaptersData);
      displayChapter(chapterSlug, html);
    });
}
```

#### 2.5. אתחול מחדש של דיאגרמות Mermaid

**למה**: 
- הדיאגרמות נטענות ב-Quartz לפני שהעברנו אותן לטאב
- אחרי העברה לטאב, צריך לאתחל אותן מחדש

**קוד**:
```javascript
// אחרי העברת התוכן לטאב Biography
setTimeout(function() {
  if (window.mermaid) {
    const mermaidElements = biographyPane.querySelectorAll('.mermaid, code.language-mermaid');
    mermaidElements.forEach(function(element) {
      // אם זה code block, המר ל-div
      if (element.tagName === 'code') {
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = element.textContent;
        element.parentElement.replaceChild(mermaidDiv, element);
        window.mermaid.init(undefined, mermaidDiv);
      } else {
        window.mermaid.init(undefined, element);
      }
    });
  }
}, 500);
```

#### 2.6. הסרת טקסט placeholder

**למה**: 
- `doit.py` מוסיף טקסט "Biography chapters will be loaded here" כשיש פרקים
- הטקסט הזה מיותר כי הפרקים נטענים דינמית

**קוד**:
```javascript
// הסרת placeholder text מה-article לפני העברה
elementsToMove.forEach(function(element) {
  if (element.tagName === 'p' && 
      element.textContent.includes('chapters will be loaded')) {
    element.remove();
  }
  if (element.tagName === 'h2' && 
      element.textContent.trim() === 'Biography') {
    const nextSibling = element.nextElementSibling;
    if (nextSibling && nextSibling.textContent.includes('chapters will be loaded')) {
      nextSibling.remove();
    }
    element.remove();
  }
});
```

---

### 3. `scripts/doit.py`

**שינוי**: הסרת הטקסט "Biography chapters will be loaded here"

**למה**: הטקסט הזה מיותר כי הפרקים נטענים דינמית דרך JavaScript

**קוד**:
```python
# לפני:
if has_chapters:
    lines += ["", "---", "", "## Biography", "", "Biography chapters will be loaded here."]

# אחרי:
if has_chapters:
    lines += ["", "---", "", "## Biography"]
```

---

### 4. CSS - `site/quartz/components/ProfileTabs.tsx`

**שינוי**: הוספת CSS לטאבים המשניים (פרקים)

**למה**: הטאבים המשניים צריכים עיצוב נפרד מהטאבים הראשיים

**קוד**:
```css
/* Chapter tabs (nested inside biography tab) */
.chapter-tabs-container {
  margin: 2rem 0;
}

.chapter-tabs-header {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--lightgray);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.chapter-tab-button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--gray);
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--darkgray);
    background: var(--lightgray);
  }
  
  &.active {
    color: var(--secondary);
    border-bottom-color: var(--secondary);
  }
}

.chapter-tabs-content {
  .chapter-tab-pane {
    display: none;
    animation: fadeIn 0.3s ease;
    
    &.active {
      display: block;
    }
  }
}
```

---

## סדר הביצוע

1. **העברת ProfileTabs ל-article** (100ms delay)
2. **העברת פרטים ודיאגרמות לטאב Biography** (100ms delay)
3. **יצירת טאבים משניים (פרקים)** (200ms delay - אחרי שהתוכן הועבר)
4. **טעינת פרק ראשוני** (300ms delay)
5. **אתחול מחדש של דיאגרמות Mermaid** (500ms delay)

---

## סיכום השינויים

| קובץ | שינוי | למה |
|------|-------|-----|
| `quartz.layout.ts` | העברת ProfileTabs ל-afterBody | כדי שיופיע אחרי article |
| `ProfileTabs.tsx` | העברת ProfileTabs ל-article | כדי שנוכל להעביר תוכן אליו |
| `ProfileTabs.tsx` | העברת פרטים ודיאגרמות לטאב Biography | כדי שיהיו בתוך הטאב |
| `ProfileTabs.tsx` | יצירת טאבים משניים (פרקים) | כדי שיופיעו בתוך טאב Biography |
| `ProfileTabs.tsx` | טעינת תוכן פרקים | כדי להציג את הפרקים |
| `ProfileTabs.tsx` | אתחול מחדש של Mermaid | כדי שהדיאגרמות יעבדו אחרי העברה |
| `ProfileTabs.tsx` | הסרת placeholder text | כדי להסיר טקסט מיותר |
| `doit.py` | הסרת "Biography chapters will be loaded here" | כי הפרקים נטענים דינמית |
| `ProfileTabs.tsx` | CSS לטאבים משניים | כדי שיהיו מעוצבים נכון |

---

## האם לאשר את ה-design הזה?

אם אתה מאשר, אני אתחיל ליישם את כל השינויים לפי הסדר.

