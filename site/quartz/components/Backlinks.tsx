import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/backlinks.scss"
import { resolveRelative, simplifySlug, pathToRoot } from "../util/path"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"
import { concatenateResources } from "../util/resources"
import OverflowListFactory from "./OverflowList"

interface BacklinksOptions {
  hideWhenEmpty: boolean
}

interface ChapterBacklink {
  profileId: string
  profileSlug: string
  chapterSlug: string
  chapterTitle: string
  profileName: string
}

const defaultOptions: BacklinksOptions = {
  hideWhenEmpty: true,
}

export default ((opts?: Partial<BacklinksOptions>) => {
  const options: BacklinksOptions = { ...defaultOptions, ...opts }
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()

  const Backlinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!)
    const backlinkFiles = allFiles.filter((file) => file.links?.includes(slug))
    
    // Check if this is a profile page
    const isProfile = fileData.frontmatter?.type === "profile"
    const profileId = fileData.frontmatter?.ID as string | undefined
    const basePath = pathToRoot(fileData.slug!)
    
    // For profile pages, filter out backlinks from other profile pages
    // (keep only backlinks from non-profile pages like content/pages/)
    const filteredBacklinkFiles = isProfile
      ? backlinkFiles.filter((file) => file.frontmatter?.type !== "profile")
      : backlinkFiles
    
    // Determine if we should show the component
    const hasRegularBacklinks = filteredBacklinkFiles.length > 0
    const hasChapterBacklinks = isProfile && profileId !== undefined
    
    if (options.hideWhenEmpty && !hasRegularBacklinks && !hasChapterBacklinks) {
      return null
    }
    
    return (
      <div class={classNames(displayClass, "backlinks")} 
           data-profile-id={profileId || ""} 
           data-base-path={basePath}>
        <h3>{i18n(cfg.locale).components.backlinks.title}</h3>
        <OverflowList>
          {hasRegularBacklinks || hasChapterBacklinks ? (
            <>
              {/* Regular Quartz backlinks (excluding profile-to-profile links) */}
              {filteredBacklinkFiles.map((f) => (
                <li>
                  <a href={resolveRelative(fileData.slug!, f.slug!)} class="internal">
                    {f.frontmatter?.title}
                  </a>
                </li>
              ))}
              {/* Chapter backlinks - will be populated by JavaScript */}
              {/* Chapter backlinks will be inserted here via JavaScript */}
            </>
          ) : (
            <li>{i18n(cfg.locale).components.backlinks.noBacklinksFound}</li>
          )}
        </OverflowList>
      </div>
    )
  }

  Backlinks.css = style
  
  // Load and display chapter backlinks
  const chapterBacklinksScript = `
    // Function to load chapter backlinks
    let isLoadingBacklinks = false;
    
    function loadChapterBacklinks() {
      // Prevent multiple simultaneous calls
      if (isLoadingBacklinks) {
        console.log('[Backlinks] Already loading, skipping duplicate call');
        return;
      }
      
      const backlinksContainer = document.querySelector('.backlinks[data-profile-id]');
      if (!backlinksContainer) return;
      
      const profileId = backlinksContainer.getAttribute('data-profile-id');
      const basePath = backlinksContainer.getAttribute('data-base-path') || '';
      
      if (!profileId) return;
      
      isLoadingBacklinks = true;
      
      // Remove existing chapter backlinks to avoid duplicates
      const existingChapterBacklinks = backlinksContainer.querySelectorAll('.chapter-backlink');
      existingChapterBacklinks.forEach(function(link) {
        link.parentElement.remove();
      });
      
      // Ensure basePath ends with / if it's not empty
      const normalizedBasePath = basePath && !basePath.endsWith('/') ? basePath + '/' : basePath;
      
      // Load backlinks index
      fetch(normalizedBasePath + 'static/backlinks-index.json')
        .then(function(response) {
          if (!response.ok) {
            console.log('[Backlinks] No backlinks index found');
            return null;
          }
          return response.json();
        })
        .then(function(backlinksIndex) {
          if (!backlinksIndex) {
            isLoadingBacklinks = false;
            return;
          }
          
          const chapterBacklinks = backlinksIndex[profileId];
          if (!chapterBacklinks || chapterBacklinks.length === 0) {
            isLoadingBacklinks = false;
            return;
          }
          
          // Find the overflow list (ul element)
          const overflowList = backlinksContainer.querySelector('ul.overflow');
          if (!overflowList) {
            isLoadingBacklinks = false;
            return;
          }
          
          // Create list items for each chapter backlink
          chapterBacklinks.forEach(function(backlink) {
            const li = document.createElement('li');
            const link = document.createElement('a');
            
            // Build the URL with chapter hash fragment
            const profileUrl = normalizedBasePath + 'profiles/' + encodeURIComponent(backlink.profileSlug);
            const chapterHash = '#chapter=' + backlink.chapterSlug + '&tab=biography';
            link.href = profileUrl + chapterHash;
            link.className = 'internal chapter-backlink';
            
            // Format: Just the chapter title
            link.textContent = backlink.chapterTitle;
            
            li.appendChild(link);
            // Insert before the overflow-end element if it exists, otherwise append
            const overflowEnd = overflowList.querySelector('.overflow-end');
            if (overflowEnd) {
              overflowList.insertBefore(li, overflowEnd);
            } else {
              overflowList.appendChild(li);
            }
          });
          
          console.log('[Backlinks] Loaded', chapterBacklinks.length, 'chapter backlinks for', profileId);
          isLoadingBacklinks = false;
        })
        .catch(function(err) {
          console.log('[Backlinks] Error loading backlinks index:', err);
          isLoadingBacklinks = false;
        });
    }
    
    // Load on navigation event (covers both initial load and SPA navigation)
    document.addEventListener('nav', function() {
      loadChapterBacklinks();
    });
  `
  
  Backlinks.afterDOMLoaded = concatenateResources(overflowListAfterDOMLoaded, chapterBacklinksScript)

  return Backlinks
}) satisfies QuartzComponentConstructor
