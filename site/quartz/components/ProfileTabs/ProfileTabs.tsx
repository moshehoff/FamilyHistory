/**
 * ProfileTabs Component - גרסה מרופקטרת
 * קובץ זה מכיל רק את ה-TSX component ללא לוגיקה
 * כל הלוגיקה הועברה למודולים נפרדים
 */

import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
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
            {/* Biography content - will be populated by JavaScript */}
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

  // CSS imported from separate file
  ProfileTabs.css = './ProfileTabs.css'

  // Main initialization script
  // NOTE: This will need to be bundled/compiled - the actual implementation
  // will be loaded from the compiled ProfileTabsManager
  ProfileTabs.afterDOMLoaded = `
// This is a placeholder - the actual initialization code is in ProfileTabsManager.ts
// which needs to be compiled and imported properly.
// For now, we'll need to manually include the compiled JavaScript.

console.log('[ProfileTabs] Component loaded - initialization code should be injected here')

// TODO: Inject compiled ProfileTabsManager code here or load it as a separate bundle
`

  return ProfileTabs
}) satisfies QuartzComponentConstructor

