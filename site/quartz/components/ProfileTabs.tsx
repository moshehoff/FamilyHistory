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
            📖 Background
          </button>
          <button class="tab-button" data-tab="media" id="media-tab-button" style="display: none;">
            🖼️ Gallery
          </button>
          <button class="tab-button" data-tab="documents" id="documents-tab-button" style="display: none;">
            📄 Documents
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
          
          <div class="tab-pane" data-tab-content="documents">
            <div id="documents-content">
              <div class="loading-message">Loading documents...</div>
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
  background: var(--lightgray);
  border: 2px solid var(--lightgray);
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: var(--darkgray);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--gray);
    border-color: var(--gray);
    color: var(--light);
  }
  
  &.active {
    background: var(--secondary);
    border-color: var(--secondary);
    color: white;
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

/* Gallery styles - High specificity to override custom.scss */
/* Masonry layout using CSS Multi-column for true masonry effect */
.tab-pane .gallery-grid,
[data-tab-content="media"] .gallery-grid,
.gallery-grid {
  column-count: 2 !important; /* 2 columns for masonry */
  column-gap: 0.75rem !important; /* Gap between columns */
  padding: 0 !important; /* No padding */
  margin-top: 1rem !important;
  break-inside: avoid !important; /* Prevent items from breaking across columns */
}

.tab-pane .gallery-item,
[data-tab-content="media"] .gallery-item,
.gallery-item {
  display: inline-block !important; /* Required for column-count masonry */
  width: 100% !important; /* Full width of column */
  vertical-align: top !important; /* Align items to top */
  border-radius: 0 !important; /* No border radius - cleaner look */
  overflow: visible !important; /* Ensure border and shadow are visible */
  background: transparent !important; /* No background */
  transition: transform 0.2s ease !important;
  margin: 0 0 0.75rem 0 !important; /* Margin bottom for spacing between items */
  cursor: pointer !important;
  break-inside: avoid !important; /* Prevent breaking across columns */
  page-break-inside: avoid !important; /* For older browsers */
  
  &:hover {
    transform: scale(1.01) !important; /* Subtle hover */
    z-index: 10 !important;
  }
  
  img {
    width: 100% !important;
    height: auto !important; /* Natural image height */
    cursor: pointer !important;
    background: white !important;
    display: block !important;
    border: 2px solid #333 !important;
    border-radius: 4px 4px 0 0 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    padding: 0 !important; /* No padding */
    margin: 0 !important; /* No margin */
    object-fit: contain !important; /* Show full image */
    max-width: 100% !important; /* Override base.scss */
    content-visibility: auto !important; /* Override base.scss */
  }
  
  .document-thumbnail {
    width: 100% !important;
    height: auto !important;
    cursor: pointer !important;
    background: white !important;
    display: block !important;
    border: 2px solid #333 !important;
    border-radius: 4px 4px 0 0 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
  }
  
  .document-icon-preview {
    width: 100% !important;
    min-height: 300px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: #f5f5f5 !important;
    border: 2px solid #333 !important;
    border-radius: 4px 4px 0 0 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    font-size: 5rem !important;
    color: #999 !important;
    cursor: pointer !important;
  }
  
  .image-caption {
    padding: 0.35rem 0.5rem !important; /* Very tight padding */
    font-size: 0.85rem !important;
    line-height: 1.3 !important; /* Tighter line height */
    background: #ffffff !important;
    margin: 0 !important; /* No margin */
    border: 1px solid #e1e4e8 !important;
    border-top: none !important; /* No border on top - attached to image */
    border-radius: 0 0 4px 4px !important;
    text-align: left !important;
    color: #666 !important;
    
    a {
      color: #0066cc !important;
      text-decoration: underline !important;
      
      &:hover {
        text-decoration: none !important;
        color: #0052a3 !important;
      }
    }
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
    gap: 0.2rem;
    margin-bottom: 0.75rem;
  }
  
  .tab-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    flex: 1;
    text-align: center;
    border-radius: 50px;
  }
  
  .chapter-tabs-container {
    margin: 1rem 0;
  }
  
  .chapter-tabs-header {
    gap: 0.15rem;
    margin-bottom: 0.75rem;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.25rem;
  }
  
  .chapter-tab-button {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    white-space: nowrap;
    flex-shrink: 0;
    border-radius: 50px;
    min-width: fit-content;
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
    column-count: 2 !important; /* Keep 2 columns on mobile */
    column-gap: 0.5rem !important; /* Even tighter on mobile */
    padding: 0 !important;
  }
  
  .gallery-item .image-caption {
    font-size: 0.75rem !important;
    padding: 0.3rem 0.4rem !important; /* Very tight on mobile */
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
    font-size: 0.7rem;
    border-radius: 50px;
  }
  
  .chapter-tab-button {
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
    border-radius: 50px;
  }
  
  .chapter-tab-pane {
    font-size: 0.9rem;
  }
  
  .tabs-header {
    gap: 0.25rem;
  }
  
  .chapter-tabs-header {
    gap: 0.25rem;
  }
}
`

  ProfileTabs.afterDOMLoaded = `
// Store cleanup functions for tab button event listeners
let tabButtonCleanups = [];
let chaptersData = null;
let loadedChapters = {}; // Cache for loaded chapter content
let isInitialChapterLoad = true; // Track if this is the first chapter load to avoid duplicate history
let idToSlugMapping = null; // Cache for ID to slug mapping

// Initialize profile tabs - runs on every navigation
function initProfileTabs() {
  console.log('[ProfileTabs] initProfileTabs() called');
  
  // Reset initial chapter load flag for new profile
  isInitialChapterLoad = true;
  
  // Clear cached chapters and data from previous profile
  loadedChapters = {};
  chaptersData = null;
  idToSlugMapping = null; // Reset mapping cache for new profile
  
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
  
  // Add biography banner will be added later, after we know where profile-tabs is
  
  const profileId = profileTabs.getAttribute('data-profile-id');
  let basePath = profileTabs.getAttribute('data-base-path') || '';
  // Ensure basePath ends with / if it's not empty
  if (basePath && !basePath.endsWith('/')) {
    basePath = basePath + '/';
  }
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const mediaTabButton = document.getElementById('media-tab-button');
  const documentsTabButton = document.getElementById('documents-tab-button');
  
  // Remove emojis from main tabs on mobile
  if (window.innerWidth <= 768) {
    tabButtons.forEach(function(button) {
      const text = button.textContent.trim();
      // Remove emojis (📖, 🖼️, 📄) from button text
      button.textContent = text.replace(/📖|🖼️|📄/g, '').trim();
    });
  }
  
  let mediaLoaded = false;
  let documentsLoaded = false;
  
  // Function to restore tab state from URL hash on initial load
  function restoreTabFromHash() {
    const hash = window.location.hash;
    if (!hash) return;
    
    // Check for tab parameter - support both #tab=biography and #tabbiography formats
    let tabName = null;
    const tabMatchWithEquals = hash.match(/[&?#]tab=([^&]+)/);
    if (tabMatchWithEquals) {
      tabName = tabMatchWithEquals[1];
    } else {
      // Check for format without equals: #tabbiography
      const tabMatchWithoutEquals = hash.match(/[#&]tab([^&]+)/);
      if (tabMatchWithoutEquals) {
        tabName = tabMatchWithoutEquals[1];
      }
    }
    
    if (tabName) {
      console.log('[ProfileTabs] Restoring tab from hash:', tabName);
      
      // Get tab elements
      const tabButton = document.querySelector('[data-tab="' + tabName + '"]');
      const tabPane = document.querySelector('[data-tab-content="' + tabName + '"]');
      
      if (tabButton && tabPane) {
        // Remove active from all tabs
        document.querySelectorAll('.tab-button').forEach(function(btn) {
          btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(function(pane) {
          pane.classList.remove('active');
        });
        
        // Activate the correct tab
        tabButton.classList.add('active');
        tabPane.classList.add('active');
        
        // Load media if switching to gallery tab
        // Always reload media when restoring from hash to ensure it's loaded
        if (tabName === 'media' && profileId) {
          const mediaContent = tabPane.querySelector('#media-content');
          // Check if media is already loaded (has content other than loading message)
          const hasContent = mediaContent && mediaContent.innerHTML && 
                            !mediaContent.innerHTML.includes('Loading') &&
                            !mediaContent.innerHTML.includes('Loading gallery');
          
          if (!hasContent) {
            console.log('[ProfileTabs] Loading media for restored gallery tab');
            loadMedia(profileId);
            mediaLoaded = true;
          }
        }
        
        // Load documents if switching to documents tab
        if (tabName === 'documents' && profileId) {
          const documentsContent = tabPane.querySelector('#documents-content');
          // Check if documents are already loaded
          const hasContent = documentsContent && documentsContent.innerHTML && 
                            !documentsContent.innerHTML.includes('Loading') &&
                            !documentsContent.innerHTML.includes('Loading documents');
          
          if (!hasContent) {
            console.log('[ProfileTabs] Loading documents for restored documents tab');
            loadDocuments(profileId);
            documentsLoaded = true;
          }
        }
      }
    }
  }
  
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
          
          // Add biography banner ONLY if this profile has chapters
          setTimeout(function() {
            const article = document.querySelector('article');
            const profileTabs = document.querySelector('.profile-tabs');
            const existingBanner = document.querySelector('.biography-banner-top');
            
            if (article && profileTabs && !existingBanner) {
              const banner = document.createElement('div');
              banner.className = 'biography-banner-top';
              banner.innerHTML = '📖 View Biography Chapters Below ⬇️';
              banner.style.cursor = 'pointer';
              banner.addEventListener('click', function() {
                // First, switch to Biography tab if not already active
                const biographyButton = document.querySelector('[data-tab="biography"]');
                const biographyPane = document.querySelector('[data-tab-content="biography"]');
                const currentActiveTab = document.querySelector('.tab-button.active');
                
                // Check if Biography tab is not active
                if (biographyButton && biographyPane && 
                    (!currentActiveTab || currentActiveTab.getAttribute('data-tab') !== 'biography')) {
                  // Remove active from all tabs
                  document.querySelectorAll('.tab-button').forEach(function(btn) {
                    btn.classList.remove('active');
                  });
                  document.querySelectorAll('.tab-pane').forEach(function(pane) {
                    pane.classList.remove('active');
                  });
                  
                  // Activate Biography tab
                  biographyButton.classList.add('active');
                  biographyPane.classList.add('active');
                }
                
                // Wait a bit for tab switch animation, then scroll
                setTimeout(function() {
                  const biographyHeading = document.querySelector('.biography-heading');
                  if (biographyHeading) {
                    biographyHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    // Fallback: scroll to biography tab content
                    const bioTab = document.querySelector('[data-tab-content="biography"]');
                    if (bioTab) {
                      bioTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                }, 100);
              });
              
              // Insert banner before ProfileTabs in article
              article.insertBefore(banner, profileTabs);
              console.log('[ProfileTabs] Added biography banner');
            }
          }, 150);
          
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
  
  // Check if profile has media content and show/hide the gallery and documents tabs accordingly
  function checkMediaContent() {
    // Add cache busting to prevent stale cache on mobile browsers
    const cacheBuster = '?t=' + Date.now();
    fetch(basePath + 'static/media-index.json' + cacheBuster, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      }
    })
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
        
        // Show/hide gallery tab based on images
        if (images.length > 0) {
          if (mediaTabButton) {
            mediaTabButton.style.display = 'block';
          }
        } else {
          if (mediaTabButton) {
            mediaTabButton.style.display = 'none';
          }
        }
        
        // Show/hide documents tab based on documents
        if (documents.length > 0) {
          if (documentsTabButton) {
            documentsTabButton.style.display = 'block';
          }
        } else {
          if (documentsTabButton) {
            documentsTabButton.style.display = 'none';
          }
        }
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Error checking media content:', err);
        if (mediaTabButton) {
          mediaTabButton.style.display = 'none';
        }
        if (documentsTabButton) {
          documentsTabButton.style.display = 'none';
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
    
    // Add Biography heading (for extended biography content below)
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
    
    // Determine which chapter should be active initially
    const hash = window.location.hash;
    // Check if we're in media tab - if so, don't load chapters
    const isMediaTab = hash && hash.includes('tab=media');
    // Only extract chapter from hash if hash actually contains #chapter=
    // This prevents auto-scrolling when clicking plain profile links
    const hasChapterHash = hash && hash.includes('#chapter=');
    const initialChapterSlug = !isMediaTab && hasChapterHash
      ? hash.substring(hash.indexOf('#chapter=') + 9).split('&')[0].split('#')[0].trim()
      : null;
    
    // Add main chapter tab (Introduction) if exists
    if (chapters.main) {
      const mainButton = document.createElement('button');
      // Only set active if this is the initial chapter from URL hash
      const isInitialChapter = initialChapterSlug === chapters.main.slug;
      mainButton.className = 'chapter-tab-button' + (isInitialChapter ? ' active' : '');
      mainButton.setAttribute('data-chapter-tab', 'introduction');
      mainButton.setAttribute('data-chapter-slug', chapters.main.slug);
      // Remove emoji on mobile
      mainButton.textContent = window.innerWidth <= 768 ? 'Introduction' : '📖 Introduction';
      chapterTabsHeader.appendChild(mainButton);
      
      const mainPane = document.createElement('div');
      // Set active only if this is the initial chapter from hash, otherwise default to active for main chapter
      mainPane.className = 'chapter-tab-pane' + (isInitialChapter || !hasChapterHash ? ' active' : '');
      mainPane.setAttribute('data-chapter-tab-content', 'introduction');
      mainPane.setAttribute('data-chapter-slug', chapters.main.slug);
      mainPane.innerHTML = '<div class="loading-message">Loading chapter...</div>';
      chapterTabsContent.appendChild(mainPane);
    }
    
    // Add chapter tabs
    chapters.chapters.forEach(function(chapter, index) {
      const chapterButton = document.createElement('button');
      // Set active if this is the initial chapter from URL
      const isInitialChapter = initialChapterSlug === chapter.slug;
      chapterButton.className = 'chapter-tab-button' + (isInitialChapter ? ' active' : '');
      chapterButton.setAttribute('data-chapter-tab', 'chapter-' + (index + 1));
      chapterButton.setAttribute('data-chapter-slug', chapter.slug);
      // Remove emoji on mobile
      chapterButton.textContent = window.innerWidth <= 768 ? chapter.title : '📄 ' + chapter.title;
      chapterTabsHeader.appendChild(chapterButton);
      
      const chapterPane = document.createElement('div');
      chapterPane.className = 'chapter-tab-pane' + (isInitialChapter ? ' active' : '');
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
    
    // Load the initial chapter ONLY if there's a hash fragment with #chapter=
    // This prevents auto-scrolling when clicking plain profile links
    const currentHash = window.location.hash;
    const isCurrentlyMediaTab = currentHash && currentHash.includes('tab=media');
    const hasChapterInHash = currentHash && currentHash.includes('#chapter=');
    if (initialChapterSlug && !isCurrentlyMediaTab && hasChapterInHash) {
      // Wait a bit to ensure switchToChapter function is defined
      setTimeout(function() {
        if (typeof switchToChapter === 'function') {
          switchToChapter(initialChapterSlug);
        } else {
          console.log('[ProfileTabs] switchToChapter not yet defined, retrying...');
          setTimeout(function() {
            if (typeof switchToChapter === 'function') {
              switchToChapter(initialChapterSlug);
            }
          }, 100);
        }
      }, 50);
    } else if (!hasChapterInHash && chapters.main) {
      // If no chapter hash, load main chapter content without scrolling
      // This ensures the main chapter is displayed but doesn't trigger scroll
      setTimeout(function() {
        if (typeof loadChapter === 'function') {
          loadChapter(chapters.main.slug);
        }
      }, 50);
    }
    
    // After creating chapter tabs, restore tab state from hash if needed
    // This ensures tab state is restored even if createChapterTabs was delayed
    setTimeout(function() {
      const hash = window.location.hash;
      if (hash && hash.includes('tab=media')) {
        console.log('[ProfileTabs] Restoring media tab after createChapterTabs');
        restoreTabFromHash();
      }
    }, 100);
  }
  
  // Switch to chapter (works with inner chapter tabs)
  function switchToChapter(chapterSlug, fromPopstate) {
    // Clean chapterSlug to ensure it doesn't contain hash fragments or parameters
    if (chapterSlug) {
      chapterSlug = chapterSlug.split('&')[0].split('#')[0].trim();
    }
    
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
    
    // Make sure biography tab is active (only if not explicitly in media tab)
    // Check current hash to see if we should stay in media tab
    const currentHash = window.location.hash;
    const isMediaTab = currentHash && currentHash.includes('tab=media');
    
    if (!isMediaTab) {
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
    }
    
    // Load chapter content if not already loaded
    loadChapter(chapterSlug);
    
    // Save isInitialChapterLoad before it changes
    const shouldScrollToChapter = isInitialChapterLoad && !fromPopstate;
    
    // Update URL hash ONLY if not from popstate (to avoid double history entry)
    if (!fromPopstate) {
      const newUrl = window.location.pathname + '#chapter=' + chapterSlug + '&tab=biography';
      
      // Use replaceState for initial load (to avoid duplicate history entry)
      // Use pushState for user-initiated chapter changes
      if (isInitialChapterLoad) {
        history.replaceState({ chapter: chapterSlug, tab: 'biography' }, '', newUrl);
        isInitialChapterLoad = false; // Mark that we've done initial load
      } else {
        history.pushState({ chapter: chapterSlug, tab: 'biography' }, '', newUrl);
      }
    }
    
    // Auto-scroll to chapter if loading from URL hash (initial load)
    // Check if this is an initial load from URL hash
    if (shouldScrollToChapter) {
      // Wait for content to load, then scroll to chapter tab container
      setTimeout(function() {
        const chapterTabsContainer = document.querySelector('.chapter-tabs-container');
        if (chapterTabsContainer) {
          chapterTabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback: scroll to chapter pane
          const chapterPane = document.querySelector('.chapter-tab-pane[data-chapter-slug="' + chapterSlug + '"].active');
          if (chapterPane) {
            chapterPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 500); // Wait longer for content to load
    }
  }
  
  // Load chapter content
  function loadChapter(chapterSlug) {
    // Clean chapterSlug to ensure it doesn't contain hash fragments or parameters
    if (chapterSlug) {
      chapterSlug = chapterSlug.split('&')[0].split('#')[0].trim();
    }
    
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
    
    // Load ID to slug mapping first, then fetch and parse chapter
    loadIdToSlugMapping(basePath).then(function() {
      return fetch(chapterPath + '?t=' + Date.now());
    })
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
  
  // Load ID to slug mapping (cached)
  function loadIdToSlugMapping(basePath) {
    if (idToSlugMapping !== null) {
      return Promise.resolve(idToSlugMapping);
    }
    
    return fetch(basePath + 'static/id-to-slug.json')
      .then(function(response) {
        if (!response.ok) {
          console.log('[ProfileTabs] Could not load id-to-slug.json');
          return {};
        }
        return response.json();
      })
      .then(function(mapping) {
        idToSlugMapping = mapping;
        return mapping;
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Error loading id-to-slug.json:', err);
        idToSlugMapping = {}; // Cache empty mapping to avoid repeated requests
        return {};
      });
  }
  
  // Simple Markdown to HTML parser (basic conversion)
  function parseMarkdownToHTML(markdown, chaptersDataForLinks, profileIdForImages, basePathForImages) {
    var html = markdown;
    
    // Normalize line endings: convert CRLF to LF, then CR to LF
    var CR = String.fromCharCode(13);
    var LF = String.fromCharCode(10);
    var CRLF = CR + LF;
    html = html.split(CRLF).join(LF).split(CR).join(LF);
    
    // Detect base path from current URL (e.g., /FamilyHistory/ for GitHub Pages)
    // Must be defined before code blocks processing
    var siteBasePath = '';
    if (typeof window !== 'undefined') {
      var currentPath = window.location.pathname;
      // Extract base path: if path is /FamilyHistory/profiles/..., extract /FamilyHistory
      if (currentPath.indexOf('/profiles/') > 0) {
        var beforeProfiles = currentPath.substring(0, currentPath.indexOf('/profiles/'));
        // If beforeProfiles is not empty and not just '/', it's our base path
        if (beforeProfiles && beforeProfiles !== '' && beforeProfiles !== '/') {
          siteBasePath = beforeProfiles;
        }
      }
    }
    
    // Code blocks (triple backticks) - must be processed FIRST before any other Markdown
    // Match code blocks with optional language
    var backtick = String.fromCharCode(96);
    // Allow optional whitespace after opening backticks and language tag
    var codeBlockPattern = backtick + backtick + backtick + '(\\\\w+)?\\\\s*([\\\\s\\\\S]*?)' + backtick + backtick + backtick;
    var codeBlockRegex = new RegExp(codeBlockPattern, 'g');
    
    // Process code blocks - convert [Name|ID] and [Name](/profiles/...) links to HTML
    // Note: This is synchronous, so we need to handle async loading of id-to-slug mapping
    // For now, we'll process code blocks synchronously and use cached mapping if available
    html = html.replace(codeBlockRegex, function(match, lang, code) {
      // Remove leading/trailing newlines from code
      code = code.replace(/^\\n+|\\n+$/g, '');
      
      // Convert [Name|ID] format to Markdown links [Name](/profiles/Slug)
      // Use cached id-to-slug mapping if available
      code = code.replace(/\\[([^\\|]+)\\|(I\\d+)\\]/g, function(match, name, id) {
        // Try to find the slug for this ID from cached mapping
        var slug = id; // Default to ID if mapping not available
        if (idToSlugMapping && idToSlugMapping[id]) {
          slug = idToSlugMapping[id];
        } else {
          // If mapping not available, log warning but keep ID (will be checked later)
          console.log('[ProfileTabs] Warning: ID to slug mapping not available for', id, '- using ID as fallback');
        }
        return '[' + name + '](/profiles/' + encodeURIComponent(slug) + ')';
      });
      
      // Also handle [Name|numeric] format (if any exist - though they shouldn't)
      code = code.replace(/\\[([^\\|]+)\\|(\\d+)\\]/g, function(match, name, numericId) {
        // Try to find the slug for this numeric ID (with I prefix)
        var idWithPrefix = 'I' + numericId;
        var slug = numericId; // Default to numeric ID if mapping not available
        if (idToSlugMapping && idToSlugMapping[idWithPrefix]) {
          slug = idToSlugMapping[idWithPrefix];
        } else if (idToSlugMapping && idToSlugMapping[numericId]) {
          slug = idToSlugMapping[numericId];
        } else {
          console.log('[ProfileTabs] Warning: Could not find slug for numeric ID', numericId, '- using as-is');
        }
        return '[' + name + '](/profiles/' + encodeURIComponent(slug) + ')';
      });
      
      // Convert Markdown links [Name](/profiles/...) to HTML links inside code blocks
      // Pattern: [text](/profiles/something)
      var codeLinkPattern = new RegExp('\\\\[([^\\\\]]+)\\\\]\\\\(\\\\/profiles\\\\/([^)]+)\\\\)', 'g');
      code = code.replace(codeLinkPattern, function(match, text, pathPart) {
        // Check if this is a broken link (ID or number instead of slug)
        // Broken links: just a number (141), or ID pattern (I123)
        var isBroken = /^[0-9]+$/.test(pathPart) || /^I\\d+$/.test(pathPart);
        
        if (isBroken) {
          // Try to find the slug for this ID
          var slug = pathPart; // Default to original if not found
          
          if (idToSlugMapping) {
            // First try exact match
            if (idToSlugMapping[pathPart]) {
              slug = idToSlugMapping[pathPart];
            } else if (/^[0-9]+$/.test(pathPart)) {
              // If it's a number, try with I prefix
              var idWithPrefix = 'I' + pathPart;
              if (idToSlugMapping[idWithPrefix]) {
                slug = idToSlugMapping[idWithPrefix];
              } else {
                console.log('[ProfileTabs] Warning: Could not find slug for numeric ID', pathPart, 'or', idWithPrefix);
              }
            } else {
              console.log('[ProfileTabs] Warning: Could not find slug for ID', pathPart);
            }
          } else {
            console.log('[ProfileTabs] Warning: ID to slug mapping not loaded yet for link', pathPart);
          }
          
          pathPart = slug;
        }
        
        // Check if pathPart is already URL-encoded (contains % followed by hex digits)
        // If it's already encoded, use it as-is; otherwise encode it
        var isAlreadyEncoded = /%[0-9A-Fa-f]{2}/.test(pathPart);
        var finalPath = isAlreadyEncoded ? pathPart : encodeURIComponent(pathPart);
        
        return '<a href="' + siteBasePath + '/profiles/' + finalPath + '">' + text + '</a>';
      });
      
      // Escape remaining HTML in code (but keep the links we just created)
      // We need to be careful not to escape the <a> tags we just added
      var parts = code.split(/(<a[^>]*>.*?<\\/a>)/g);
      code = parts.map(function(part) {
        if (part.match(/^<a[^>]*>.*?<\\/a>$/)) {
          // This is a link we created, don't escape it
          return part;
        } else {
          // Escape HTML in other parts
          return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
      }).join('');
      
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
    
    // Convert external links [text](https://...) to HTML FIRST (before profile links)
    // Pattern: [text](url) where url is NOT /profiles/...
    var externalLinkPattern = new RegExp('\\\\[([^\\\\]]+)\\\\]\\\\((https?://[^)]+)\\\\)', 'g');
    html = html.replace(externalLinkPattern, function(match, text, url) {
      return '<a href="' + url + '">' + text + '</a>';
    });
    
    // Fix absolute profile links by adding base path
    // Pattern: [text](/profiles/something) -> capture text and path
    // IMPORTANT: This must come AFTER external links to avoid matching them
    var linkPattern = new RegExp('\\\\[([^\\\\]]+)\\\\]\\\\((\\\\/profiles\\\\/[^)]+)\\\\)', 'g');
    html = html.replace(linkPattern, function(match, text, path) {
      return '<a href="' + siteBasePath + path + '">' + text + '</a>';
    });
    
    // Ordered lists (1. item, 2. item, etc.) - MUST be processed BEFORE converting [[links]]
    // Otherwise the links will be converted to HTML and the list detection won't work properly
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
    
    // Links [[slug|Display Text]] or [[slug]] - convert to chapter links (MUST be after lists, before bold/italic)
    html = html.replace(/\\[\\[([^\\]]+)\\]\\]/g, function(match, text) {
      // Split by | to get slug and display text
      var parts = text.split('|');
      var slug = parts[0].trim();
      var displayText = parts.length > 1 ? parts[1].trim() : slug;
      
      // Extract filename from full path if present (e.g., "bios/I39965449/02-arrival_australia" -> "02-arrival_australia")
      if (slug.includes('/')) {
        var pathParts = slug.split('/');
        slug = pathParts[pathParts.length - 1];
      }
      
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
    // Process links inside <pre><code> blocks before storing them
    html = html.replace(/<(a|pre|code)([^>]*)>([\\s\\S]*?)<\\/(a|pre|code)>/g, function(match, tag1, attrs, content, tag2) {
      var processedMatch = match;
      // If this is a <pre><code> block, process links inside it
      if (tag1 === 'pre' && content.indexOf('<code') !== -1) {
        // Process markdown links inside the code block content
        processedMatch = match.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');
      }
      var placeholder = '___HTML_BLOCK_' + htmlBlockIndex + '___';
      htmlBlocks[htmlBlockIndex] = processedMatch;
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
        // Italic with _ (match underscores not preceded/followed by word characters)
        // Captures: $1 = prefix (space/punctuation/start), $2 = content, $3 = suffix (space/punctuation/end)
        segments[i] = segments[i].replace(/(^|[^_\\w])_([^_]+)_((?=[^_\\w])|$)/g, '$1<em>$2</em>$3');
      }
    }
    html = segments.join('');
    
    // External links [text](url) - process BEFORE restoring HTML blocks
    // This allows links inside code blocks to be processed
    html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');
    
    // Restore HTML blocks and process links inside code blocks
    html = html.replace(/___HTML_BLOCK_(\\d+)___/g, function(match, index) {
      var block = htmlBlocks[parseInt(index)];
      // Process links inside <pre><code> blocks
      if (block && block.indexOf('<pre') !== -1 && block.indexOf('<code') !== -1) {
        // Links inside code blocks should already be processed by the regex above
        // But if they weren't (because they were stored as placeholders), process them now
        block = block.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');
      }
      return block;
    });
    
    // Handle line breaks (two spaces at end of line = <br>)
    // This must be done BEFORE paragraph processing
    // Support both Unix and Windows line endings
    html = html.replace(/  \\r?\\n/g, '<br>\\n');
    
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
  
  // Load PDF.js and render first page as thumbnail
  function loadPdfThumbnail(pdfUrl, canvas) {
    // Check if PDF.js is already loaded
    if (typeof window.pdfjsLib === 'undefined') {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="pdf.js"]');
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', function() {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            renderPdfThumbnail(pdfUrl, canvas);
          }
        });
        return;
      }
      
      // Load PDF.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = function() {
        if (window.pdfjsLib) {
          // Set worker path
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          renderPdfThumbnail(pdfUrl, canvas);
        }
      };
      script.onerror = function() {
        console.error('Failed to load PDF.js');
        showPdfError(canvas);
      };
      document.head.appendChild(script);
    } else {
      renderPdfThumbnail(pdfUrl, canvas);
    }
  }
  
  function showPdfError(canvas) {
    const ctx = canvas.getContext('2d');
    const maxWidth = 600;
    const maxHeight = 400;
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, maxWidth, maxHeight);
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Preview', maxWidth / 2, maxHeight / 2);
  }
  
  function renderPdfThumbnail(pdfUrl, canvas) {
    if (!window.pdfjsLib) {
      showPdfError(canvas);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const scale = 2; // Higher scale for better quality
    const maxWidth = 600; // Match image width in gallery
    const maxHeight = 800; // Match image max height
    
    // Show loading state
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, maxWidth, maxHeight);
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', maxWidth / 2, maxHeight / 2);
    
    window.pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
      return pdf.getPage(1); // Get first page
    }).then(function(page) {
      // Get the viewport at scale 1 to get the natural page dimensions
      const naturalViewport = page.getViewport({ scale: 1 });
      const naturalWidth = naturalViewport.width;
      const naturalHeight = naturalViewport.height;
      const aspectRatio = naturalWidth / naturalHeight;
      
      // Calculate dimensions to fit in maxWidth x maxHeight while maintaining aspect ratio
      let canvasWidth = naturalWidth;
      let canvasHeight = naturalHeight;
      
      // Fit to max dimensions while maintaining aspect ratio
      if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
        if (canvasWidth / maxWidth > canvasHeight / maxHeight) {
          canvasWidth = maxWidth;
          canvasHeight = canvasWidth / aspectRatio;
        } else {
          canvasHeight = maxHeight;
          canvasWidth = canvasHeight * aspectRatio;
        }
      }
      
      // Set canvas size to match the calculated dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Calculate the scale needed to render the page at the canvas size
      const renderScale = canvasWidth / naturalWidth;
      
      // Create viewport at the correct scale to fit the canvas
      const renderViewport = page.getViewport({ scale: renderScale });
      
      // Render the page
      const renderContext = {
        canvasContext: ctx,
        viewport: renderViewport
      };
      
      return page.render(renderContext).promise;
    }).catch(function(error) {
      console.error('Error loading PDF thumbnail:', error);
      showPdfError(canvas);
    });
  }
  
  // Load media (images only)
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
    
    // Add cache busting to prevent stale cache on mobile browsers
    const cacheBuster = '?t=' + Date.now();
    fetch(pageBasePath + 'static/media-index.json' + cacheBuster, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      }
    })
      .then(function(response) {
        if (!response.ok) throw new Error('No media index');
        return response.json();
      })
      .then(function(data) {
        const images = data.images[profileId] || [];
        
        console.log('[ProfileTabs] Found', images.length, 'images');
        
        if (images.length === 0) {
          mediaContent.innerHTML = '<div class="empty-message">No images available</div>';
          return;
        }
        
        mediaContent.innerHTML = '';
        
        // Add images section
        const imagesSection = document.createElement('div');
        imagesSection.className = 'media-section';
        imagesSection.innerHTML = '<h3>Images</h3><div class="gallery-grid"></div>';
        mediaContent.appendChild(imagesSection);
        
        const galleryGrid = imagesSection.querySelector('.gallery-grid');
        
        images.forEach(function(img) {
          const item = document.createElement('div');
          item.className = 'gallery-item';
          
          // Build the correct path for the image
          let imagePath;
          if (img.path) {
            // img.path is like "/static/documents/ID/filename.jpg"
            // Remove leading slash and prepend pageBasePath
            imagePath = pageBasePath + (img.path.startsWith('/') ? img.path.substring(1) : img.path);
          } else {
            // Fallback to constructing from filename (for images without path)
            imagePath = documentsBasePath + img.filename;
          }
          const imageAlt = img.caption ? img.caption.replace(/<[^>]*>/g, '') : ''; // Strip HTML for alt text
          // Convert newlines to <br> tags for line breaks in caption
          const newlineChar = String.fromCharCode(10);
          let formattedCaption = img.caption ? img.caption.split(newlineChar).join('<br>') : '';
          
          // Fix profile links in caption to include base path (for GitHub Pages)
          // Use pageBasePath which is already available and correct
          // Remove trailing slash from pageBasePath if present (links already start with /)
          var basePathForLinks = pageBasePath;
          if (basePathForLinks && basePathForLinks.endsWith('/')) {
            basePathForLinks = basePathForLinks.substring(0, basePathForLinks.length - 1);
          }
          
          // Fix absolute profile links in caption HTML by adding base path
          // Pattern: href="/profiles/something" -> add base path before /profiles
          if (formattedCaption && basePathForLinks) {
            var linkPattern = new RegExp('href="(\\\\/profiles\\\\/[^"]+)"', 'g');
            formattedCaption = formattedCaption.replace(linkPattern, function(match, path) {
              return 'href="' + basePathForLinks + path + '"';
            });
          }
          
          // Create image element
          const imgElement = document.createElement('img');
          imgElement.src = imagePath;
          imgElement.alt = imageAlt;
          
          item.appendChild(imgElement);
          if (formattedCaption) {
            const captionDiv = document.createElement('div');
            captionDiv.className = 'image-caption';
            captionDiv.innerHTML = formattedCaption;
            item.appendChild(captionDiv);
          }
          
          // Click to open full size
          item.addEventListener('click', function(e) {
            // Don't open if clicking on a link in the caption
            if (e.target.tagName.toLowerCase() === 'a') {
              return;
            }
            window.open(imagePath, '_blank');
          });
          
          galleryGrid.appendChild(item);
        });
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Media loading error:', err);
        mediaContent.innerHTML = '<div class="empty-message">Error loading gallery</div>';
      });
  }
  
  // Load documents (non-image files)
  function loadDocuments(profileId) {
    console.log('[ProfileTabs] Loading documents for profile:', profileId);
    // Find documents-content within the documents tab pane
    const documentsPane = document.querySelector('[data-tab-content="documents"]');
    const documentsContent = documentsPane ? documentsPane.querySelector('#documents-content') : document.getElementById('documents-content');
    if (!documentsContent) {
      console.log('[ProfileTabs] documents-content not found');
      return;
    }
    
    const profileTabs = document.querySelector('.profile-tabs');
    let pageBasePath = profileTabs ? profileTabs.getAttribute('data-base-path') || '' : '';
    // Ensure pageBasePath ends with / if it's not empty
    if (pageBasePath && !pageBasePath.endsWith('/')) {
      pageBasePath = pageBasePath + '/';
    }
    const documentsBasePath = pageBasePath + 'static/documents/' + profileId + '/';
    
    // Add cache busting to prevent stale cache on mobile browsers
    const cacheBuster = '?t=' + Date.now();
    fetch(pageBasePath + 'static/media-index.json' + cacheBuster, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      }
    })
      .then(function(response) {
        if (!response.ok) throw new Error('No media index');
        return response.json();
      })
      .then(function(data) {
        const documents = data.documents[profileId] || [];
        
        console.log('[ProfileTabs] Found', documents.length, 'documents');
        
        if (documents.length === 0) {
          documentsContent.innerHTML = '<div class="empty-message">No documents available</div>';
          return;
        }
        
        documentsContent.innerHTML = '';
        
        // Add documents section
        const docsSection = document.createElement('div');
        docsSection.className = 'media-section';
        docsSection.innerHTML = '<h3>Documents</h3><div class="gallery-grid"></div>';
        documentsContent.appendChild(docsSection);
        
        const docsGrid = docsSection.querySelector('.gallery-grid');
        
        documents.forEach(function(doc) {
          const item = document.createElement('div');
          item.className = 'gallery-item';
          
          const documentUrl = documentsBasePath + doc.filename;
          const isPdf = doc.filename.toLowerCase().endsWith('.pdf');
          
          // Create preview container (like image)
          if (isPdf) {
            // For PDFs, create a canvas for thumbnail
            const canvas = document.createElement('canvas');
            canvas.className = 'document-thumbnail';
            item.appendChild(canvas);
            
            // Load PDF.js and render first page
            loadPdfThumbnail(documentUrl, canvas);
          } else {
            // For other documents, show icon as image-like element
            const iconDiv = document.createElement('div');
            iconDiv.className = 'document-icon-preview';
            iconDiv.textContent = getDocumentIcon(doc.filename);
            item.appendChild(iconDiv);
          }
          
          // Add caption (like image caption)
          const captionText = doc.title || doc.filename;
          if (captionText) {
            const captionDiv = document.createElement('div');
            captionDiv.className = 'image-caption';
            captionDiv.textContent = captionText;
            if (doc.description) {
              captionDiv.innerHTML = '<strong>' + captionText + '</strong><br>' + doc.description;
            }
            item.appendChild(captionDiv);
          }
          
          // Click to open document
          item.addEventListener('click', function(e) {
            // Don't open if clicking on a link in the caption
            if (e.target.tagName.toLowerCase() === 'a') {
              return;
            }
            window.open(documentUrl, '_blank');
          });
          
          docsGrid.appendChild(item);
        });
      })
      .catch(function(err) {
        console.log('[ProfileTabs] Documents loading error:', err);
        documentsContent.innerHTML = '<div class="empty-message">Error loading documents</div>';
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
      'gif': '🖼️',
      'wma': '🎵',
      'mp3': '🎵',
      'wav': '🎵',
      'mp4': '🎬',
      'avi': '🎬',
      'mov': '🎬'
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
      
      if (tabName === 'documents' && !documentsLoaded && profileId) {
        loadDocuments(profileId);
        documentsLoaded = true;
      }
      
      // Update URL hash to preserve tab state
      const currentHash = window.location.hash;
      let newHash = '';
      
      // Parse current hash to extract chapter if exists
      let chapterSlug = null;
      if (currentHash) {
        const chapterMatch = currentHash.match(/[#&]chapter=([^&]+)/);
        if (chapterMatch) {
          chapterSlug = chapterMatch[1];
        }
      }
      
      // Build new hash: if there's a chapter, include it, otherwise just tab
      if (chapterSlug) {
        newHash = '#chapter=' + chapterSlug + '&tab=' + tabName;
      } else {
        newHash = '#tab=' + tabName;
      }
      
      // Update URL without triggering navigation
      history.pushState({ tab: tabName }, '', window.location.pathname + newHash);
    };
    
      button.addEventListener('click', clickHandler);
      tabButtonCleanups.push(function() {
        button.removeEventListener('click', clickHandler);
      });
    });
    
    // Handle browser back/forward button for chapter tabs and gallery tab
    // Use a flag to prevent duplicate handling
    let isHandlingPopstate = false;
    const popstateHandler = function(event) {
      if (isHandlingPopstate) {
        console.log('[ProfileTabs] Already handling popstate, skipping');
        return;
      }
      
      console.log('[ProfileTabs] Popstate event:', event.state, 'hash:', window.location.hash);
      
      // Check if we're still on the same profile
      const currentProfileTabs = document.querySelector('.profile-tabs');
      if (!currentProfileTabs) {
        console.log('[ProfileTabs] No profile-tabs element found, skipping popstate');
        return;
      }
      
      const currentProfileId = currentProfileTabs.getAttribute('data-profile-id');
      console.log('[ProfileTabs] Current profileId from DOM:', currentProfileId, 'Cached profileId:', profileId);
      
      // If profile changed, let the 'nav' event handler deal with it
      if (currentProfileId !== profileId) {
        console.log('[ProfileTabs] Profile changed! Skipping popstate, letting nav event handle it');
        return;
      }
      
      isHandlingPopstate = true;
      
      const hash = window.location.hash;
      
      // Parse hash for tab and chapter
      let tabName = null;
      let chapterSlug = null;
      
      if (hash) {
        // Check for tab parameter - support both #tab=media and #tabmedia formats
        const tabMatchWithEquals = hash.match(/[&?#]tab=([^&]+)/);
        if (tabMatchWithEquals) {
          tabName = tabMatchWithEquals[1];
        } else {
          // Check for format without equals: #tabbiography
          const tabMatchWithoutEquals = hash.match(/[#&]tab([^&]+)/);
          if (tabMatchWithoutEquals) {
            tabName = tabMatchWithoutEquals[1];
          }
        }
        
        // Check for chapter parameter (e.g., #chapter=slug or #chapter=slug&tab=biography)
        const chapterMatch = hash.match(/[#&]chapter=([^&]+)/);
        if (chapterMatch) {
          // Clean the chapter slug - remove any trailing parameters or hash fragments
          chapterSlug = chapterMatch[1].split('&')[0].split('#')[0].trim();
        }
      }
      
      // Restore tab state
      if (tabName === 'media') {
        console.log('[ProfileTabs] Restoring gallery tab from popstate');
        // Switch to gallery tab
        const mediaButton = document.querySelector('[data-tab="media"]');
        const mediaPane = document.querySelector('[data-tab-content="media"]');
        
        if (mediaButton && mediaPane) {
          // Remove active from all tabs
          tabButtons.forEach(function(btn) {
            btn.classList.remove('active');
          });
          tabPanes.forEach(function(pane) {
            pane.classList.remove('active');
          });
          
          // Activate gallery tab
          mediaButton.classList.add('active');
          mediaPane.classList.add('active');
          
          // Load media if not already loaded
          // Check if media content is empty or just has loading message
          const mediaContent = mediaPane.querySelector('#media-content');
          const hasContent = mediaContent && mediaContent.innerHTML && 
                            !mediaContent.innerHTML.includes('Loading') &&
                            !mediaContent.innerHTML.includes('Loading gallery') &&
                            !mediaContent.innerHTML.includes('empty-message');
          
          if (!hasContent && profileId) {
            console.log('[ProfileTabs] Loading media for gallery tab from popstate');
            loadMedia(profileId);
            mediaLoaded = true;
          }
        }
        
        // Don't restore chapters when in gallery tab
        return;
      } else if (tabName === 'documents') {
        console.log('[ProfileTabs] Restoring documents tab from popstate');
        // Switch to documents tab
        const documentsButton = document.querySelector('[data-tab="documents"]');
        const documentsPane = document.querySelector('[data-tab-content="documents"]');
        
        if (documentsButton && documentsPane) {
          // Remove active from all tabs
          tabButtons.forEach(function(btn) {
            btn.classList.remove('active');
          });
          tabPanes.forEach(function(pane) {
            pane.classList.remove('active');
          });
          
          // Activate documents tab
          documentsButton.classList.add('active');
          documentsPane.classList.add('active');
          
          // Load documents if not already loaded
          const documentsContent = documentsPane.querySelector('#documents-content');
          const hasContent = documentsContent && documentsContent.innerHTML && 
                            !documentsContent.innerHTML.includes('Loading') &&
                            !documentsContent.innerHTML.includes('Loading documents') &&
                            !documentsContent.innerHTML.includes('empty-message');
          
          if (!hasContent && profileId) {
            console.log('[ProfileTabs] Loading documents for documents tab from popstate');
            loadDocuments(profileId);
            documentsLoaded = true;
          }
        }
        
        // Don't restore chapters when in documents tab
        return;
      } else if (tabName === 'biography' || !tabName) {
        // Switch to biography tab (default)
        const biographyButton = document.querySelector('[data-tab="biography"]');
        const biographyPane = document.querySelector('[data-tab-content="biography"]');
        
        if (biographyButton && biographyPane) {
          // Remove active from all tabs
          tabButtons.forEach(function(btn) {
            btn.classList.remove('active');
          });
          tabPanes.forEach(function(pane) {
            pane.classList.remove('active');
          });
          
          // Activate biography tab
          biographyButton.classList.add('active');
          biographyPane.classList.add('active');
        }
      }
      
      // Handle chapter navigation (only if we're in biography tab, NOT in media or documents tab)
      // Don't restore chapters if we're in media or documents tab
      if (tabName !== 'media' && tabName !== 'documents') {
        if (chapterSlug) {
          // Validate that the chapter belongs to the current profile
          let isValidChapter = false;
          if (chaptersData) {
            // Check if chapter slug matches main chapter
            if (chaptersData.main && chaptersData.main.slug === chapterSlug) {
              isValidChapter = true;
            } else {
              // Check if chapter slug matches any other chapter
              for (let i = 0; i < chaptersData.chapters.length; i++) {
                if (chaptersData.chapters[i].slug === chapterSlug) {
                  isValidChapter = true;
                  break;
                }
              }
            }
          }
          
          if (isValidChapter) {
            console.log('[ProfileTabs] Restoring chapter from popstate:', chapterSlug);
            switchToChapter(chapterSlug, true);
          } else {
            console.log('[ProfileTabs] Chapter', chapterSlug, 'does not belong to current profile, showing default chapter');
            // Chapter doesn't belong to this profile - clear hash and show default
            if (chaptersData && chaptersData.main) {
              // Update URL to remove invalid chapter hash
              const newUrl = window.location.pathname + '#tab=biography';
              history.replaceState({ tab: 'biography' }, '', newUrl);
              // Show default chapter
              switchToChapter(chaptersData.main.slug, true);
            }
          }
        } else if (!hash || hash === '#' || hash === '#tab=biography' || hash === '#tabbiography') {
          // No chapter hash - go back to introduction if we have chapters
          if (chaptersData && chaptersData.main) {
            console.log('[ProfileTabs] No chapter hash, showing introduction');
            switchToChapter(chaptersData.main.slug, true);
          }
        }
      }
      
      // Reset flag after a short delay
      setTimeout(function() {
        isHandlingPopstate = false;
      }, 100);
    };
    
    window.addEventListener('popstate', popstateHandler);
    tabButtonCleanups.push(function() {
      window.removeEventListener('popstate', popstateHandler);
    });
    
    // Restore tab state from hash after initialization
    // Use longer timeout to ensure createChapterTabs has finished
    setTimeout(function() {
      restoreTabFromHash();
      // Also restore again after a bit more time in case createChapterTabs was delayed
      setTimeout(function() {
        const hash = window.location.hash;
        if (hash && (hash.includes('tab=media') || hash.includes('tabmedia') || 
                     hash.includes('tab=documents') || hash.includes('tabdocuments'))) {
          restoreTabFromHash();
        }
      }, 300);
    }, 500);
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

