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
      <div class={classNames(displayClass, "profile-tabs")}>
        <div class="tabs-header">
          <button class="tab-button active" data-tab="biography">
            📖 קורות חיים
          </button>
          <button class="tab-button" data-tab="gallery">
            🖼️ תמונות
          </button>
          <button class="tab-button" data-tab="documents">
            📄 מסמכים
          </button>
        </div>
        
        <div class="tabs-content">
          <div class="tab-pane active" data-tab-content="biography">
            {/* Biography content - rendered by Quartz */}
          </div>
          
          <div class="tab-pane" data-tab-content="gallery">
            <div class="gallery-placeholder">
              <p>גלריית תמונות נוספות</p>
              <small>יושלם בשבוע 3-4 עם מערכת מסמכים ותמונות</small>
            </div>
          </div>
          
          <div class="tab-pane" data-tab-content="documents">
            <div class="documents-placeholder">
              <p>מסמכים</p>
              <small>יושלם בשבוע 3-4 עם מערכת מסמכים ותמונות</small>
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

.gallery-placeholder,
.documents-placeholder {
  text-align: center;
  padding: 3rem;
  background: var(--light);
  border-radius: 8px;
  color: var(--gray);
  
  p {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
  
  small {
    color: var(--darkgray);
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

tabButtons.forEach(function(button) {
  button.addEventListener('click', function() {
    const tabName = button.getAttribute('data-tab');
    
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
  });
});
`

  return ProfileTabs
}) satisfies QuartzComponentConstructor

