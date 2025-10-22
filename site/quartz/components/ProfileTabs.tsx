import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

export default (() => {
  const ProfileTabs: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // Extract profile ID from frontmatter
    const profileId = fileData.frontmatter?.ID as string | undefined
    
    // Check if this is a profile page
    const isProfile = fileData.frontmatter?.type === "profile"
    
    if (!isProfile || !profileId) {
      return null
    }

    return (
      <div class={classNames(displayClass, "profile-tabs")} data-profile-id={profileId}>
        <div class="tabs-header">
          <button class="tab-button active" data-tab="biography">
            📖 קורות חיים
          </button>
          <button class="tab-button" data-tab="media">
            🖼️ 📄 גלריה
          </button>
        </div>
        
        <div class="tabs-content">
          <div class="tab-pane active" data-tab-content="biography">
            {/* Biography content - rendered by Quartz */}
          </div>
          
          <div class="tab-pane" data-tab-content="media">
            <div id="media-content">
              <div class="loading-message">טוען גלריה...</div>
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
`

  ProfileTabs.afterDOMLoaded = `
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const profileTabs = document.querySelector('.profile-tabs');
const profileId = profileTabs ? profileTabs.getAttribute('data-profile-id') : null;

let mediaLoaded = false;

console.log('[ProfileTabs] Initializing, profileId:', profileId);

// Move all article content into the biography tab
function moveContentToTabs() {
  const biographyPane = document.querySelector('[data-tab-content="biography"]');
  if (!biographyPane) {
    console.log('[ProfileTabs] Cannot find biography pane');
    return;
  }
  
  // Find the article element (contains all the profile content)
  const article = document.querySelector('article');
  if (!article) {
    console.log('[ProfileTabs] Cannot find article element');
    return;
  }
  
  // Get all children of article
  const contentToMove = Array.from(article.children);
  
  console.log('[ProfileTabs] Found', contentToMove.length, 'elements to move from article');
  
  // Move all content into biography tab
  contentToMove.forEach(function(element) {
    biographyPane.appendChild(element);
  });
  
  console.log('[ProfileTabs] Content moved to biography tab');
}

// Run on load
moveContentToTabs();

// Tab switching
tabButtons.forEach(function(button) {
  button.addEventListener('click', function() {
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
  });
});

// Load media (images and documents combined)
function loadMedia(profileId) {
  console.log('[ProfileTabs] Loading media for profile:', profileId);
  const mediaContent = document.getElementById('media-content');
  if (!mediaContent) return;
  
  const basePath = '/static/documents/' + profileId + '/';
  
  fetch('/static/media-index.json')
    .then(function(response) {
      if (!response.ok) throw new Error('No media index');
      return response.json();
    })
    .then(function(data) {
      const images = data.images[profileId] || [];
      const documents = data.documents[profileId] || [];
      
      console.log('[ProfileTabs] Found', images.length, 'images and', documents.length, 'documents');
      
      if (images.length === 0 && documents.length === 0) {
        mediaContent.innerHTML = '<div class="empty-message">אין תמונות או מסמכים זמינים</div>';
        return;
      }
      
      mediaContent.innerHTML = '';
      
      // Add images section
      if (images.length > 0) {
        const imagesSection = document.createElement('div');
        imagesSection.className = 'media-section';
        imagesSection.innerHTML = '<h3>תמונות</h3><div class="gallery-grid"></div>';
        mediaContent.appendChild(imagesSection);
        
        const galleryGrid = imagesSection.querySelector('.gallery-grid');
        images.forEach(function(img) {
          const item = document.createElement('div');
          item.className = 'gallery-item';
          item.innerHTML = '<img src="' + basePath + img.filename + '" alt="' + (img.caption || '') + '">' +
                          (img.caption ? '<div class="image-caption">' + img.caption + '</div>' : '');
          
          // Click to open full size
          item.addEventListener('click', function() {
            window.open(basePath + img.filename, '_blank');
          });
          
          galleryGrid.appendChild(item);
        });
      }
      
      // Add documents section
      if (documents.length > 0) {
        const docsSection = document.createElement('div');
        docsSection.className = 'media-section';
        docsSection.innerHTML = '<h3>מסמכים</h3><div class="documents-list"></div>';
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
                          '<a href="' + basePath + doc.filename + '" download class="document-download">הורד</a>';
          
          docsList.appendChild(item);
        });
      }
    })
    .catch(function(err) {
      console.log('[ProfileTabs] Media loading error:', err);
      mediaContent.innerHTML = '<div class="empty-message">שגיאה בטעינת גלריה</div>';
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
`

  return ProfileTabs
}) satisfies QuartzComponentConstructor

