import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"

export default (() => {
  const ProfileTabs: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // Extract profile ID from frontmatter
    const profileId = fileData.frontmatter?.ID as string | undefined
    
    // Check if this is a profile page
    const isProfile = fileData.frontmatter?.type === "profile"
    
    if (!isProfile || !profileId) {
      return null
    }

    // Get base path for this page (relative path to root)
    const basePath = pathToRoot(fileData.slug!)

    return (
      <div class={classNames(displayClass, "profile-tabs")} data-profile-id={profileId} data-base-path={basePath}>
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
            {/* Biography content - rendered by Quartz */}
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

  ProfileTabs.css = `
.profile-tabs {
  margin: 2rem 0;
}

.tabs-header {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--lightgray);
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
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

.tabs-content {
  .tab-pane {
    display: none;
    animation: fadeIn 0.3s ease;
    
    &.active {
      display: block;
    }
  }
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 3rem;
  background: var(--light);
  border-radius: 8px;
  color: var(--gray);
  font-size: 1.1rem;
}

.media-section {
  margin-bottom: 2rem;
  
  h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: var(--dark);
    border-bottom: 2px solid var(--lightgray);
    padding-bottom: 0.5rem;
  }
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .image-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem;
    font-size: 0.9rem;
    text-align: center;
  }
}

.documents-list {
  padding: 1rem 0;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--light);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  transition: background 0.2s ease;
  
  &:hover {
    background: var(--lightgray);
  }
  
  .document-icon {
    font-size: 2rem;
  }
  
  .document-info {
    flex: 1;
    
    .document-name {
      font-weight: 600;
      color: var(--dark);
      margin-bottom: 0.25rem;
    }
    
    .document-meta {
      font-size: 0.85rem;
      color: var(--gray);
    }
  }
  
  .document-download {
    padding: 0.5rem 1rem;
    background: var(--secondary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    
    &:hover {
      opacity: 0.8;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .profile-tabs {
    margin: 1rem 0;
  }
  
  .tabs-header {
    gap: 0.25rem;
    margin-bottom: 1rem;
  }
  
  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    flex: 1;
    text-align: center;
  }
  
  .chapter-tabs-container {
    margin: 1rem 0;
  }
  
  .chapter-tabs-header {
    gap: 0.25rem;
    margin-bottom: 1rem;
  }
  
  .chapter-tab-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Better text sizing for mobile */
  .chapter-tab-pane {
    font-size: 0.95rem;
    line-height: 1.6;
    
    h1 {
      font-size: 1.5rem;
      margin: 1rem 0 0.75rem;
    }
    
    h2 {
      font-size: 1.3rem;
      margin: 0.9rem 0 0.6rem;
    }
    
    h3 {
      font-size: 1.1rem;
      margin: 0.8rem 0 0.5rem;
    }
    
    p {
      margin: 0.75rem 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
      margin: 1rem 0;
    }
  }
  
  /* Mermaid diagrams - make scrollable */
  .mermaid {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100%;
    
    svg {
      max-width: none;
      height: auto;
    }
  }
  
  /* Profile info box */
  .profile-info-box {
    margin: 0.75rem 0;
    padding: 0.75rem;
  }
  
  .profile-info-list {
    font-size: 0.85rem;
    
    dt {
      font-size: 0.8rem;
    }
    
    dd {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
  }
  
  /* Gallery grid - smaller on mobile */
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
    padding: 0.5rem 0;
  }
  
  /* Documents list - stack better */
  .document-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 0.75rem;
    gap: 0.5rem;
    
    .document-download {
      align-self: stretch;
      text-align: center;
    }
  }
  
  /* Reduce padding everywhere */
  .loading-message,
  .empty-message {
    padding: 2rem 1rem;
    font-size: 1rem;
  }
  
  .media-section h3 {
    font-size: 1.1rem;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .tab-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
  }
  
  .chapter-tab-button {
    padding: 0.35rem 0.5rem;
    font-size: 0.7rem;
  }
  
  .chapter-tab-pane {
    font-size: 0.9rem;
  }
}
`

  ProfileTabs.afterDOMLoaded = `
// Store cleanup functions for tab button event listeners
let tabButtonCleanups = [];
let chaptersData = null;
let loadedChapters = {}; // Cache for loaded chapter content

// Initialize profile tabs - runs on every navigation
function initProfileTabs() {
  console.log('[ProfileTabs] initProfileTabs() called');
  
  // Clean up previous event listeners
  tabButtonCleanups.forEach(function(cleanup) {
    cleanup();
  });
  tabButtonCleanups = [];
  
  const profileTabs = document.querySelector('.profile-tabs');
  console.log('[ProfileTabs] profileTabs element:', profileTabs);
  if (!profileTabs) {
    // Not a profile page, skip initialization
    console.log('[ProfileTabs] No profileTabs found, skipping');
    return;
  }
  
  const profileId = profileTabs.getAttribute('data-profile-id');
  let basePath = profileTabs.getAttribute('data-base-path') || '';
  // Ensure basePath ends with / if it's not empty
  if (basePath && !basePath.endsWith('/')) {
    basePath = basePath + '/';
  }
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const mediaTabButton = document.getElementById('media-tab-button');
  
  let mediaLoaded = false;
  
  console.log('[ProfileTabs] Initializing, profileId:', profileId, 'basePath:', basePath);
  
  if (!profileId) {
    return;
  }
  
  // Load chapters index
  function loadChaptersIndex() {
    fetch(basePath + 'static/chapters-index.json')
      .then(function(response) {
        if (!response.ok) {
          console.log('[ProfileTabs] No chapters index found');
          return null;
        }
        return response.json();
      })
      .then(function(data) {
        if (!data) return;
        
        chaptersData = data[profileId] || null;
        
        if (chaptersData) {
          console.log('[ProfileTabs] Found chapters for profile', profileId, chaptersData);
          // Wait a bit to ensure content has been moved to Biography tab
          setTimeout(function() {
            createChapterTabs(chaptersData);
          }, 200);
        }
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Error loading chapters index:', err);
      });
  }
  
  // Check if profile has media content and show/hide the gallery tab accordingly
  function checkMediaContent() {
    fetch(basePath + 'static/media-index.json')
      .then(function(response) {
        if (!response.ok) {
          console.log('[ProfileTabs] No media index found');
          return null;
        }
        return response.json();
      })
      .then(function(data) {
        if (!data) return;
        
        const images = data.images[profileId] || [];
        const documents = data.documents[profileId] || [];
        
        console.log('[ProfileTabs] Found', images.length, 'images and', documents.length, 'documents for profile', profileId);
        
        if (images.length > 0 || documents.length > 0) {
          if (mediaTabButton) {
            mediaTabButton.style.display = 'block';
          }
        } else {
          if (mediaTabButton) {
            mediaTabButton.style.display = 'none';
          }
        }
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Error checking media content:', err);
        if (mediaTabButton) {
          mediaTabButton.style.display = 'none';
        }
      });
  }
  
  // Check media content
  checkMediaContent();
  
  // Move ProfileTabs to article first (if it's in afterBody)
  function moveProfileTabsToArticle() {
    const profileTabs = document.querySelector('.profile-tabs');
    const article = document.querySelector('article');
    
    if (profileTabs && article && profileTabs.parentElement !== article) {
      article.appendChild(profileTabs);
      console.log('[ProfileTabs] Moved ProfileTabs to article');
    }
  }
  
  // Move profile info and diagrams from article to Biography tab
  function moveContentToBiographyTab() {
    const profileTabs = document.querySelector('.profile-tabs');
    const biographyPane = document.querySelector('[data-tab-content="biography"]');
    const article = document.querySelector('article');
    
    if (!profileTabs || !biographyPane || !article) {
      console.log('[ProfileTabs] Cannot find required elements');
      return;
    }
    
    // Move ProfileTabs to article first (if it's in afterBody)
    if (profileTabs.parentElement !== article) {
      article.appendChild(profileTabs);
      console.log('[ProfileTabs] Moved ProfileTabs to article');
    }
    
    // Get all children of article (profile info, diagrams, etc.)
    const articleChildren = Array.from(article.children);
    
    // Find where ProfileTabs is in article
    let profileTabsIndex = -1;
    for (let i = 0; i < articleChildren.length; i++) {
      if (articleChildren[i] === profileTabs) {
        profileTabsIndex = i;
        break;
      }
    }
    
    // Move all content before ProfileTabs to Biography tab
    // This includes profile info, diagrams, and biography content
    if (profileTabsIndex > 0) {
      const elementsToMove = [];
      for (let i = 0; i < profileTabsIndex; i++) {
        elementsToMove.push(articleChildren[i]);
      }
      
      // Process elements: remove placeholders, but keep biography content
      const cleanedElements = [];
      let skipNext = false;
      
      console.log('[ProfileTabs] elementsToMove count:', elementsToMove.length);
      
      elementsToMove.forEach(function(element, index) {
        console.log('[ProfileTabs] Processing element', index, ':', element.tagName, element.textContent ? element.textContent.substring(0, 50) : '');
        
        if (skipNext) {
          skipNext = false;
          return;
        }
        
        // Check if it's a placeholder Biography heading
        if (element.tagName && element.tagName.toLowerCase() === 'h2') {
          if (element.textContent && element.textContent.trim() === 'Biography') {
            // Check if next element is placeholder text
            const nextSibling = element.nextElementSibling;
            if (nextSibling && nextSibling.textContent && 
                nextSibling.textContent.includes('chapters will be loaded')) {
              // Skip both this heading and the next placeholder
              console.log('[ProfileTabs] Removing placeholder Biography heading and text');
              skipNext = true;
              nextSibling.remove();
              element.remove();
              return;
            } else {
              // It's a Biography heading with real content, remove only the heading
              console.log('[ProfileTabs] Removing Biography heading (keeping content after)');
              element.remove();
              return;
            }
          }
        }
        
        // Remove standalone placeholder paragraphs
        if (element.tagName && element.tagName.toLowerCase() === 'p') {
          if (element.textContent && element.textContent.includes('chapters will be loaded')) {
            console.log('[ProfileTabs] Removing placeholder paragraph');
            element.remove();
            return;
          }
        }
        
        // Keep this element
        console.log('[ProfileTabs] Keeping element:', element.tagName);
        cleanedElements.push(element);
      });
      
      // Use cleanedElements (already filtered)
      const validElements = cleanedElements.filter(function(element) {
        return element.parentElement !== null;
      });
      
      // Sort elements: profile info first, then diagrams, then biography content (paragraphs, etc.)
      const profileInfoElements = [];
      const diagramElements = [];
      const biographyContent = [];
      const otherElements = [];
      
      validElements.forEach(function(element) {
        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        const className = element.className ? element.className.toString() : '';
        
        // Check if it's profile info (dl = definition list)
        if (tagName === 'dl' || 
            (tagName === 'div' && element.querySelector('dl'))) {
          profileInfoElements.push(element);
        }
        // Check if it's a diagram (h2 that's not biography, or mermaid element, or code with mermaid)
        else if ((tagName === 'h2' && element.getAttribute('id') && !element.getAttribute('id').includes('biography')) || 
                 className.includes('mermaid') || 
                 element.querySelector('.mermaid') || 
                 element.querySelector('mermaid') ||
                 (tagName === 'code' && element.textContent && element.textContent.includes('graph'))) {
          diagramElements.push(element);
        }
        // Check if it's biography content (p, ul, ol, blockquote, etc.)
        else if (tagName === 'p' || tagName === 'ul' || tagName === 'ol' || 
                 tagName === 'blockquote' || tagName === 'div' || tagName === 'pre') {
          biographyContent.push(element);
        }
        else {
          otherElements.push(element);
        }
      });
      
      // Move elements in order: profile info, diagrams, biography content, other
      const sortedElements = profileInfoElements.concat(diagramElements).concat(biographyContent).concat(otherElements);
      
      // Remove any remaining placeholder text from biography pane
      const biographyHeading = biographyPane.querySelector('h2');
      if (biographyHeading && biographyHeading.textContent && 
          (biographyHeading.textContent.trim() === 'Biography' || 
           biographyHeading.textContent.trim().includes('Biography'))) {
        const nextSibling = biographyHeading.nextElementSibling;
        if (nextSibling && nextSibling.textContent && 
            nextSibling.textContent.includes('chapters will be loaded')) {
          nextSibling.remove();
        }
        biographyHeading.remove();
      }
      
      // Remove any paragraphs with placeholder text from biography pane
      const placeholderParagraphs = biographyPane.querySelectorAll('p');
      placeholderParagraphs.forEach(function(p) {
        if (p.textContent && p.textContent.includes('chapters will be loaded')) {
          p.remove();
        }
      });
      
      // Clear biography pane first (remove any existing content except chapter tabs)
      const existingChapterTabs = biographyPane.querySelector('.chapter-tabs-container');
      const existingChildren = Array.from(biographyPane.children);
      existingChildren.forEach(function(child) {
        if (child !== existingChapterTabs) {
          child.remove();
        }
      });
      
      // Move elements to Biography tab in order: profile info, diagrams
      // (chapter tabs will be added later by createChapterTabs)
      sortedElements.forEach(function(element) {
        if (existingChapterTabs) {
          // Insert before chapter tabs
          biographyPane.insertBefore(element, existingChapterTabs);
        } else {
          // Append if no chapter tabs yet
          biographyPane.appendChild(element);
        }
      });
      
      console.log('[ProfileTabs] Moved', sortedElements.length, 'elements to Biography tab (sorted)');
      
      // Re-initialize Mermaid diagrams after moving them
      setTimeout(function() {
        if (window.mermaid) {
          // Find all mermaid elements (including code blocks that contain mermaid)
          const mermaidElements = biographyPane.querySelectorAll('.mermaid, mermaid, code.language-mermaid');
          
          mermaidElements.forEach(function(element) {
            try {
              // Check if already initialized
              if (!element.hasAttribute('data-processed')) {
                // If it's a code element, we need to render it
                if (element.tagName && element.tagName.toLowerCase() === 'code') {
                  const mermaidCode = element.textContent;
                  if (mermaidCode) {
                    // Create a new div for mermaid
                    const mermaidDiv = document.createElement('div');
                    mermaidDiv.className = 'mermaid';
                    mermaidDiv.textContent = mermaidCode;
                    element.parentElement.replaceChild(mermaidDiv, element);
                    window.mermaid.init(undefined, mermaidDiv);
                    mermaidDiv.setAttribute('data-processed', 'true');
                  }
                } else {
                  window.mermaid.init(undefined, element);
                  element.setAttribute('data-processed', 'true');
                }
              }
            } catch (e) {
              console.log('[ProfileTabs] Error initializing Mermaid:', e);
            }
          });
          
          // Also try to trigger mermaid rendering if there's a global render function
          if (window.mermaid && typeof window.mermaid.run === 'function') {
            window.mermaid.run();
          }
        }
      }, 500);
    }
  }
  
  // Move ProfileTabs to article and content to Biography tab
  // Wait a bit to ensure DOM is ready
  setTimeout(function() {
    moveProfileTabsToArticle();
    moveContentToBiographyTab();
  }, 100);
  
  // Load chapters index
  loadChaptersIndex();
  
  // Create chapter tabs dynamically - inside the biography tab
  function createChapterTabs(chapters) {
    const biographyPane = document.querySelector('[data-tab-content="biography"]');
    if (!biographyPane) return;
    
    // Remove existing chapter tabs if they exist
    const existingChapterTabs = biographyPane.querySelector('.chapter-tabs-container');
    if (existingChapterTabs) {
      existingChapterTabs.remove();
    }
    
    // Create inner tabs structure for chapters inside biography tab
    const chapterTabsContainer = document.createElement('div');
    chapterTabsContainer.className = 'chapter-tabs-container';
    
    // Add Biography heading
    const biographyHeading = document.createElement('h2');
    biographyHeading.className = 'biography-heading';
    biographyHeading.textContent = 'Biography';
    chapterTabsContainer.appendChild(biographyHeading);
    
    // Create chapter tabs header
    const chapterTabsHeader = document.createElement('div');
    chapterTabsHeader.className = 'chapter-tabs-header';
    
    // Create chapter tabs content
    const chapterTabsContent = document.createElement('div');
    chapterTabsContent.className = 'chapter-tabs-content';
    
    // Add main chapter tab (Introduction) if exists
    if (chapters.main) {
      const mainButton = document.createElement('button');
      mainButton.className = 'chapter-tab-button active';
      mainButton.setAttribute('data-chapter-tab', 'introduction');
      mainButton.setAttribute('data-chapter-slug', chapters.main.slug);
      mainButton.textContent = '📖 Introduction';
      chapterTabsHeader.appendChild(mainButton);
      
      const mainPane = document.createElement('div');
      mainPane.className = 'chapter-tab-pane active';
      mainPane.setAttribute('data-chapter-tab-content', 'introduction');
      mainPane.setAttribute('data-chapter-slug', chapters.main.slug);
      mainPane.innerHTML = '<div class="loading-message">Loading chapter...</div>';
      chapterTabsContent.appendChild(mainPane);
    }
    
    // Add chapter tabs
    chapters.chapters.forEach(function(chapter, index) {
      const chapterButton = document.createElement('button');
      chapterButton.className = 'chapter-tab-button';
      chapterButton.setAttribute('data-chapter-tab', 'chapter-' + (index + 1));
      chapterButton.setAttribute('data-chapter-slug', chapter.slug);
      chapterButton.textContent = '📄 ' + chapter.title;
      chapterTabsHeader.appendChild(chapterButton);
      
      const chapterPane = document.createElement('div');
      chapterPane.className = 'chapter-tab-pane';
      chapterPane.setAttribute('data-chapter-tab-content', 'chapter-' + (index + 1));
      chapterPane.setAttribute('data-chapter-slug', chapter.slug);
      chapterPane.innerHTML = '<div class="loading-message">Loading chapter...</div>';
      chapterTabsContent.appendChild(chapterPane);
    });
    
    // Append tabs header and content to container
    chapterTabsContainer.appendChild(chapterTabsHeader);
    chapterTabsContainer.appendChild(chapterTabsContent);
    
    // Insert chapter tabs at the end of biography pane (after profile info and diagrams)
    // Find all non-chapter-tab elements and insert chapter tabs after them
    const existingContent = Array.from(biographyPane.children).filter(function(child) {
      return !child.classList.contains('chapter-tabs-container');
    });
    
    if (existingContent.length > 0) {
      // Insert after the last non-chapter-tab element
      const lastElement = existingContent[existingContent.length - 1];
      biographyPane.insertBefore(chapterTabsContainer, lastElement.nextSibling);
    } else {
      // If no existing content, just append
      biographyPane.appendChild(chapterTabsContainer);
    }
    
    // Setup chapter tab switching after tabs are created
    setTimeout(function() {
      document.querySelectorAll('.chapter-tab-button').forEach(function(button) {
        const clickHandler = function() {
          const chapterSlug = button.getAttribute('data-chapter-slug');
          if (chapterSlug) {
            switchToChapter(chapterSlug);
          }
        };
        
        button.addEventListener('click', clickHandler);
        tabButtonCleanups.push(function() {
          button.removeEventListener('click', clickHandler);
        });
      });
    }, 50);
    
    // Check URL hash for initial chapter
    const hash = window.location.hash;
    if (hash && hash.startsWith('#chapter=')) {
      const chapterSlug = hash.substring(9);
      setTimeout(function() {
        switchToChapter(chapterSlug);
      }, 100);
    } else if (chapters.main) {
      // Default to introduction if exists
      setTimeout(function() {
        switchToChapter(chapters.main.slug);
      }, 100);
    }
  }
  
  // Switch to chapter (works with inner chapter tabs)
  function switchToChapter(chapterSlug, fromPopstate) {
    console.log('[ProfileTabs] Switching to chapter:', chapterSlug, 'fromPopstate:', fromPopstate);
    
    // Remove active from all chapter tab buttons
    document.querySelectorAll('.chapter-tab-button').forEach(function(button) {
      button.classList.remove('active');
    });
    
    // Remove active from all chapter tab panes
    document.querySelectorAll('.chapter-tab-pane').forEach(function(pane) {
      pane.classList.remove('active');
    });
    
    // Find and activate the correct chapter tab button
    const chapterTabButton = document.querySelector('.chapter-tab-button[data-chapter-slug="' + chapterSlug + '"]');
    if (chapterTabButton) {
      chapterTabButton.classList.add('active');
    }
    
    // Find and activate the correct chapter tab pane
    const chapterTabPane = document.querySelector('.chapter-tab-pane[data-chapter-slug="' + chapterSlug + '"]');
    if (chapterTabPane) {
      chapterTabPane.classList.add('active');
    }
    
    // Make sure biography tab is active
    const biographyButton = document.querySelector('[data-tab="biography"]');
    const biographyPane = document.querySelector('[data-tab-content="biography"]');
    if (biographyButton && biographyPane) {
      // Remove active from ALL main tabs first
      document.querySelectorAll('.tab-button').forEach(function(btn) {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-pane').forEach(function(pane) {
        pane.classList.remove('active');
      });
      
      // Then activate biography
      biographyButton.classList.add('active');
      biographyPane.classList.add('active');
    }
    
    // Load chapter content if not already loaded
    loadChapter(chapterSlug);
    
    // Update URL hash ONLY if not from popstate (to avoid double history entry)
    if (!fromPopstate) {
      const newUrl = window.location.pathname + '#chapter=' + chapterSlug;
      history.pushState({ chapter: chapterSlug, tab: 'biography' }, '', newUrl);
    }
    
    // Scroll to the Biography heading (smooth scroll)
    setTimeout(function() {
      const biographyHeading = document.querySelector('.biography-heading');
      if (biographyHeading) {
        biographyHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: scroll to chapter tabs container
        const chapterTabsContainer = document.querySelector('.chapter-tabs-container');
        if (chapterTabsContainer) {
          chapterTabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }
  
  // Load chapter content
  function loadChapter(chapterSlug) {
    if (loadedChapters[chapterSlug]) {
      // Already loaded, just display it
      displayChapter(chapterSlug, loadedChapters[chapterSlug]);
      return;
    }
    
    // Find the chapter filename from chaptersData
    var chapterFilename = null;
    if (chaptersData) {
      // Check main chapter
      if (chaptersData.main && chaptersData.main.slug === chapterSlug) {
        chapterFilename = chaptersData.main.filename;
      } else {
        // Check other chapters
        for (var i = 0; i < chaptersData.chapters.length; i++) {
          if (chaptersData.chapters[i].slug === chapterSlug) {
            chapterFilename = chaptersData.chapters[i].filename;
            break;
          }
        }
      }
    }
    
    // Use filename if found, otherwise use slug
    var chapterFile = chapterFilename || (chapterSlug + '.md');
    const chapterPath = basePath + 'static/chapters/' + profileId + '/' + chapterFile;
    console.log('[ProfileTabs] Loading chapter:', chapterPath, '(slug:', chapterSlug + ')');
    
    fetch(chapterPath + '?t=' + Date.now())
      .then(function(response) {
        if (!response.ok) {
          console.log('[ProfileTabs] Chapter not found:', chapterPath, 'status:', response.status);
          throw new Error('Chapter not found: ' + chapterPath);
        }
        return response.text();
      })
      .then(function(content) {
        // Parse Markdown to HTML (simple conversion)
        const html = parseMarkdownToHTML(content, chaptersData, profileId, basePath);
        loadedChapters[chapterSlug] = html;
        displayChapter(chapterSlug, html);
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Error loading chapter:', err);
        const pane = document.querySelector('.chapter-tab-pane[data-chapter-slug="' + chapterSlug + '"]');
        if (pane) {
          pane.innerHTML = '<div class="empty-message">Error loading chapter: ' + err.message + '</div>';
        }
      });
  }
  
  // Display chapter content
  function displayChapter(chapterSlug, html) {
    // Find the chapter tab pane (not the main tab pane)
    const pane = document.querySelector('.chapter-tab-pane[data-chapter-slug="' + chapterSlug + '"]');
    if (pane) {
      pane.innerHTML = html;
      
      // Convert chapter links to clickable buttons
      const chapterLinks = pane.querySelectorAll('.chapter-link');
      console.log('[ProfileTabs] Found', chapterLinks.length, 'chapter links in', chapterSlug);
      chapterLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const targetSlug = link.getAttribute('data-chapter-slug');
          console.log('[ProfileTabs] Chapter link clicked, target:', targetSlug);
          if (targetSlug) {
            switchToChapter(targetSlug, false);
          }
        });
      });
      
      // Re-initialize Mermaid diagrams if present
      setTimeout(function() {
        if (window.mermaid) {
          const mermaidElements = pane.querySelectorAll('.mermaid, mermaid, code.language-mermaid');
          mermaidElements.forEach(function(element) {
            try {
              if (!element.hasAttribute('data-processed')) {
                if (element.tagName && element.tagName.toLowerCase() === 'code') {
                  const mermaidCode = element.textContent;
                  if (mermaidCode) {
                    const mermaidDiv = document.createElement('div');
                    mermaidDiv.className = 'mermaid';
                    mermaidDiv.textContent = mermaidCode;
                    element.parentElement.replaceChild(mermaidDiv, element);
                    window.mermaid.init(undefined, mermaidDiv);
                    mermaidDiv.setAttribute('data-processed', 'true');
                  }
                } else {
                  window.mermaid.init(undefined, element);
                  element.setAttribute('data-processed', 'true');
                }
              }
            } catch (e) {
              console.log('[ProfileTabs] Error initializing Mermaid:', e);
            }
          });
        }
      }, 100);
    }
  }
  
  // Simple Markdown to HTML parser (basic conversion)
  function parseMarkdownToHTML(markdown, chaptersDataForLinks, profileIdForImages, basePathForImages) {
    var html = markdown;
    
    // Code blocks (triple backticks) - must be processed FIRST before any other Markdown
    // Match code blocks with optional language
    var backtick = String.fromCharCode(96);
    // Allow optional whitespace after opening backticks and language tag
    var codeBlockPattern = backtick + backtick + backtick + '(\\\\w+)?\\\\s*([\\\\s\\\\S]*?)' + backtick + backtick + backtick;
    var codeBlockRegex = new RegExp(codeBlockPattern, 'g');
    html = html.replace(codeBlockRegex, function(match, lang, code) {
      // Remove leading/trailing newlines from code
      code = code.replace(/^\\n+|\\n+$/g, '');
      // Escape HTML in code
      code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var langAttr = lang ? ' class="language-' + lang + '"' : '';
      return '<pre><code' + langAttr + '>' + code + '</code></pre>';
    });
    
    // Images ![[image.png]] - MUST be processed BEFORE bold/italic/links
    html = html.replace(/!\\[\\[([^\\]]+)\\]\\]/g, function(match, imagePath) {
      // Extract filename from path
      var filename = imagePath.split('/').pop();
      // Images are in site/content/ and served directly by Quartz
      // Replace both spaces AND underscores with dashes to match what doit.py copies
      var filenameWithDashes = filename.replace(/[ _]/g, '-');
      // Use the basePath parameter if provided (from enclosing scope)
      var imageBasePath = basePathForImages || '';
      var imageSrc = imageBasePath + filenameWithDashes;
      var imageSrcWithSpaces = imageBasePath + encodeURIComponent(filename);
      // Escape quotes properly for HTML attribute
      var escapedFilename = filename.replace(/"/g, '&quot;');
      // Try with spaces if dashes fail (fallback)
      return '<img src="' + imageSrc + '" alt="' + escapedFilename + '" onerror="this.src=&quot;' + imageSrcWithSpaces + '&quot;">';
    });
    
    // Links [[slug|Display Text]] or [[slug]] - convert to chapter links (MUST be after images, before bold/italic)
    html = html.replace(/\\[\\[([^\\]]+)\\]\\]/g, function(match, text) {
      // Split by | to get slug and display text
      var parts = text.split('|');
      var slug = parts[0].trim();
      var displayText = parts.length > 1 ? parts[1].trim() : slug;
      
      // Try to find matching chapter by name or slug
      var targetSlug = null;
      if (chaptersDataForLinks) {
        // Check if it matches a chapter name or slug
        var normalizedSlug = slug.toLowerCase().replace(/_/g, '-');
        
        // Check main chapter
        if (chaptersDataForLinks.main && (
          chaptersDataForLinks.main.slug === normalizedSlug ||
          chaptersDataForLinks.main.name.toLowerCase() === normalizedSlug ||
          chaptersDataForLinks.main.filename.toLowerCase().replace('.md', '') === normalizedSlug
        )) {
          targetSlug = chaptersDataForLinks.main.slug;
        } else {
          // Check other chapters - try exact match first
          for (var i = 0; i < chaptersDataForLinks.chapters.length; i++) {
            var chapter = chaptersDataForLinks.chapters[i];
            var chapterNameNormalized = chapter.name.toLowerCase().replace(/_/g, '-');
            var chapterFilenameNormalized = chapter.filename.toLowerCase().replace('.md', '').replace(/_/g, '-');
            
            if (chapter.slug === normalizedSlug ||
                chapterNameNormalized === normalizedSlug ||
                chapterFilenameNormalized === normalizedSlug ||
                chapter.title.toLowerCase() === normalizedSlug) {
              targetSlug = chapter.slug;
              break;
            }
            
            // Try to match by removing leading numbers (e.g., "02-in_russia" matches "01-in-russia")
            var slugWithoutNumbers = normalizedSlug.replace(/^\\d+-/, '');
            var chapterNameWithoutNumbers = chapterNameNormalized.replace(/^\\d+-/, '');
            var chapterFilenameWithoutNumbers = chapterFilenameNormalized.replace(/^\\d+-/, '');
            
            if (slugWithoutNumbers === chapterNameWithoutNumbers ||
                slugWithoutNumbers === chapterFilenameWithoutNumbers) {
              targetSlug = chapter.slug;
              break;
            }
          }
        }
        
        // If no match found, try to create slug from text
        if (!targetSlug) {
          targetSlug = normalizedSlug;
        }
      } else {
        // Fallback: create slug from text
        targetSlug = slug.replace(/_/g, '-').toLowerCase();
      }
      
      return '<a href="javascript:void(0)" class="chapter-link" data-chapter-slug="' + targetSlug + '">' + displayText + '</a>';
    });
    
    // Store HTML blocks (img, a, pre, code tags) before processing bold/italic
    // to prevent markdown processing inside HTML attributes
    var htmlBlocks = [];
    var htmlBlockIndex = 0;
    
    // Replace HTML blocks with placeholders (process each type separately for safety)
    // First, replace img tags (self-closing)
    html = html.replace(/<img[^>]*>/g, function(match) {
      var placeholder = '___HTML_BLOCK_' + htmlBlockIndex + '___';
      htmlBlocks[htmlBlockIndex] = match;
      htmlBlockIndex++;
      return placeholder;
    });
    
    // Then replace other HTML tags (with content)
    html = html.replace(/<(a|pre|code)([^>]*)>([\\s\\S]*?)<\\/\\1>/g, function(match) {
      var placeholder = '___HTML_BLOCK_' + htmlBlockIndex + '___';
      htmlBlocks[htmlBlockIndex] = match;
      htmlBlockIndex++;
      return placeholder;
    });
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Process bold and italic only in text segments (not in placeholders)
    // Split by placeholders, process each segment, then rejoin
    var segments = html.split(/(___HTML_BLOCK_\\d+___)/);
    for (var i = 0; i < segments.length; i++) {
      // Skip placeholders (they match the pattern ___HTML_BLOCK_N___)
      if (!segments[i].match(/^___HTML_BLOCK_\\d+___$/)) {
        // Bold
        segments[i] = segments[i].replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
        // Italic with *
        segments[i] = segments[i].replace(/\\*(.*?)\\*/g, '<em>$1</em>');
        // Italic with _ (but not underscores that are part of words/filenames)
        segments[i] = segments[i].replace(/\\b_(.*?)_\\b/g, '<em>$1</em>');
      }
    }
    html = segments.join('');
    
    // Restore HTML blocks
    html = html.replace(/___HTML_BLOCK_(\\d+)___/g, function(match, index) {
      return htmlBlocks[parseInt(index)];
    });
    
    // Ordered lists (1. item, 2. item, etc.)
    var lines = html.split('\\n');
    var inList = false;
    var listHtml = '';
    var processedLines = [];
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var listMatch = line.match(/^(\\d+)\\.\\s+(.*)$/);
      
      if (listMatch) {
        if (!inList) {
          inList = true;
          listHtml = '<ol>';
        }
        listHtml += '<li>' + listMatch[2] + '</li>';
      } else {
        if (inList) {
          listHtml += '</ol>';
          processedLines.push(listHtml);
          listHtml = '';
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    if (inList) {
      listHtml += '</ol>';
      processedLines.push(listHtml);
    }
    
    html = processedLines.join('\\n');
    

    
    // External links [text](url)
    html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');
    
    // Handle line breaks (two spaces at end of line = <br>)
    // This must be done BEFORE paragraph processing
    html = html.replace(/  \\n/g, '<br>\\n');
    
    // First, extract and preserve multi-line HTML blocks (div, blockquote, etc.)
    // This prevents them from being broken by paragraph splitting
    var htmlBlocks = [];
    var htmlBlockCounter = 0;
    var htmlBlockPlaceholder = '___HTML_BLOCK_PLACEHOLDER___';
    
    // Match HTML blocks that span multiple lines (e.g., <div class="citation-box">...</div>)
    // This regex matches opening tag, content (including newlines), and closing tag
    // Use capturing groups: group 1 = full opening tag, group 2 = tag name, group 3 = content
    var htmlBlockRegex = new RegExp('<((div|blockquote|pre|ul|ol|table)[^>]*)>([\\s\\S]*?)</(div|blockquote|pre|ul|ol|table)>', 'gi');
    html = html.replace(htmlBlockRegex, function(match, fullTag, tagName1, content, tagName2) {
      var placeholder = htmlBlockPlaceholder + htmlBlockCounter + '___';
      htmlBlocks[htmlBlockCounter] = match;
      htmlBlockCounter++;
      return placeholder;
    });
    
    // Paragraphs - split by double newlines
    // But preserve HTML blocks (div, blockquote, pre, etc.)
    var paragraphs = html.split(/\\n\\n/);
    html = paragraphs.map(function(p) {
      p = p.trim();
      if (!p) return '';
      
      // If it's a placeholder for an HTML block, restore it
      var placeholderMatch = p.match(new RegExp(htmlBlockPlaceholder + '(\\d+)___'));
      if (placeholderMatch) {
        var blockIndex = parseInt(placeholderMatch[1]);
        return htmlBlocks[blockIndex];
      }
      
      // If it's already an HTML block element, don't wrap in <p>
      if (p.match(/^<(div|blockquote|pre|ul|ol|table|h[1-6]|hr)/i)) {
        return p;
      }
      
      // If it starts with a closing tag, don't wrap
      if (p.match(/^<\\//)) {
        return p;
      }
      
      // If it's a complete HTML block (has both opening and closing tags), don't wrap
      if (p.match(/^<[^>]+>.*<\\/[^>]+>$/)) {
        return p;
      }
      
      // Otherwise, wrap in <p> tag
      if (p && !p.match(/^<[h|d|u|o|l]/)) {
        return '<p>' + p + '</p>';
      }
      return p;
    }).join('\\n');
    
    // Inline code (single backticks) - escape backticks properly
    // Must be after code blocks to avoid matching triple backticks
    var inlineCodeRegex = /\`([^\`]+)\`/g;
    html = html.replace(inlineCodeRegex, '<code>$1</code>');
    
    return html;
  }
  
  // Load media (images and documents combined)
  function loadMedia(profileId) {
    console.log('[ProfileTabs] Loading media for profile:', profileId);
    // Find media-content within the media tab pane
    const mediaPane = document.querySelector('[data-tab-content="media"]');
    const mediaContent = mediaPane ? mediaPane.querySelector('#media-content') : document.getElementById('media-content');
    if (!mediaContent) {
      console.log('[ProfileTabs] media-content not found');
      return;
    }
    
    const profileTabs = document.querySelector('.profile-tabs');
    let pageBasePath = profileTabs ? profileTabs.getAttribute('data-base-path') || '' : '';
    // Ensure pageBasePath ends with / if it's not empty
    if (pageBasePath && !pageBasePath.endsWith('/')) {
      pageBasePath = pageBasePath + '/';
    }
    const documentsBasePath = pageBasePath + 'static/documents/' + profileId + '/';
    
    fetch(pageBasePath + 'static/media-index.json')
      .then(function(response) {
        if (!response.ok) throw new Error('No media index');
        return response.json();
      })
      .then(function(data) {
        const images = data.images[profileId] || [];
        const documents = data.documents[profileId] || [];
        
        console.log('[ProfileTabs] Found', images.length, 'images and', documents.length, 'documents');
        
        if (images.length === 0 && documents.length === 0) {
          mediaContent.innerHTML = '<div class="empty-message">No images or documents available</div>';
          return;
        }
        
        mediaContent.innerHTML = '';
        
        // Add images section
        if (images.length > 0) {
          const imagesSection = document.createElement('div');
          imagesSection.className = 'media-section';
          imagesSection.innerHTML = '<h3>Images</h3><div class="gallery-grid"></div>';
          mediaContent.appendChild(imagesSection);
          
          const galleryGrid = imagesSection.querySelector('.gallery-grid');
          images.forEach(function(img) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = '<img src="' + documentsBasePath + img.filename + '" alt="' + (img.caption || '') + '">' +
                            (img.caption ? '<div class="image-caption">' + img.caption + '</div>' : '');
            
            // Click to open full size
            item.addEventListener('click', function() {
              window.open(documentsBasePath + img.filename, '_blank');
            });
            
            galleryGrid.appendChild(item);
          });
        }
        
        // Add documents section
        if (documents.length > 0) {
          const docsSection = document.createElement('div');
          docsSection.className = 'media-section';
          docsSection.innerHTML = '<h3>Documents</h3><div class="documents-list"></div>';
          mediaContent.appendChild(docsSection);
          
          const docsList = docsSection.querySelector('.documents-list');
          documents.forEach(function(doc) {
            const item = document.createElement('div');
            item.className = 'document-item';
            
            const icon = getDocumentIcon(doc.filename);
            
            item.innerHTML = '<div class="document-icon">' + icon + '</div>' +
                            '<div class="document-info">' +
                            '<div class="document-name">' + (doc.title || doc.filename) + '</div>' +
                            '<div class="document-meta">' + (doc.description || '') + '</div>' +
                            '</div>' +
                            '<a href="' + documentsBasePath + doc.filename + '" download class="document-download">Download</a>';
            
            docsList.appendChild(item);
          });
        }
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Media loading error:', err);
        mediaContent.innerHTML = '<div class="empty-message">Error loading gallery</div>';
      });
  }
  
  function getDocumentIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      'pdf': '📕',
      'doc': '📘',
      'docx': '📘',
      'xls': '📊',
      'xlsx': '📊',
      'txt': '📄',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️'
    };
    return icons[ext] || '📄';
  }
  
  // Tab switching with proper cleanup
  tabButtons.forEach(function(button) {
    const clickHandler = function() {
      const tabName = button.getAttribute('data-tab');
      console.log('[ProfileTabs] Switching to tab:', tabName);
      
      // Remove active class from all
      tabButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });
      tabPanes.forEach(function(pane) {
        pane.classList.remove('active');
      });
      
      // Add active to clicked
      button.classList.add('active');
      const targetPane = document.querySelector('[data-tab-content="' + tabName + '"]');
      if (targetPane) {
        targetPane.classList.add('active');
      }
      
      // Load content on first view
      if (tabName === 'media' && !mediaLoaded && profileId) {
        loadMedia(profileId);
        mediaLoaded = true;
      }
    };
    
      button.addEventListener('click', clickHandler);
      tabButtonCleanups.push(function() {
        button.removeEventListener('click', clickHandler);
      });
    });
    
    // Handle browser back/forward button for chapter tabs
    window.addEventListener('popstate', function(event) {
      console.log('[ProfileTabs] Popstate event:', event.state, 'hash:', window.location.hash);
      
      const hash = window.location.hash;
      
      // Handle chapter navigation
      if (hash && hash.startsWith('#chapter=')) {
        const chapterSlug = hash.substring(9);
        console.log('[ProfileTabs] Restoring chapter from popstate:', chapterSlug);
        
        // Just call switchToChapter with fromPopstate=true
        switchToChapter(chapterSlug, true);
      } else if (!hash || hash === '#') {
        // No hash or empty hash - go back to introduction
        console.log('[ProfileTabs] No hash, showing introduction');
        if (chaptersData && chaptersData.main) {
          switchToChapter(chaptersData.main.slug, true);
        }
      }
    });
  }
  
  // Run on initial load
  initProfileTabs();
  
  // Run on every navigation (SPA)
  document.addEventListener('nav', function() {
    initProfileTabs();
  });
`

  return ProfileTabs
}) satisfies QuartzComponentConstructor

