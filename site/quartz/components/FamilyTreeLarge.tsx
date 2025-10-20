import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

export default (() => {
  const FamilyTreeLarge: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // Only show on profile pages
    const isProfile = fileData.frontmatter?.type === "profile"
    
    if (!isProfile) {
      return null
    }

    return (
      <div class={classNames(displayClass, "family-tree-large")}>
        <h3>🌳 עץ משפחתי גדול</h3>
        
        <div class="tree-controls">
          <select id="generations-select">
            <option value="2">2 דורות</option>
            <option value="3" selected>3 דורות</option>
            <option value="4">4 דורות</option>
            <option value="5">5 דורות</option>
            <option value="all">הכל</option>
          </select>
          
          <button id="zoom-in">🔍+</button>
          <button id="zoom-out">🔍-</button>
          <button id="reset-view">↺ איפוס</button>
        </div>
        
        <div class="tree-container">
          <div class="tree-placeholder">
            <p>עץ משפחתי מלא</p>
            <small>יושלם בשבוע 5-6<br />יכלול את כל המשפחה עם אינטראקציה מלאה</small>
          </div>
        </div>
      </div>
    )
  }

  FamilyTreeLarge.css = `
.family-tree-large {
  position: sticky;
  top: 1rem;
  
  h3 {
    margin: 0 0 1rem 0;
    color: var(--darkgray);
  }
  
  .tree-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    
    select, button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--lightgray);
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.9rem;
      
      &:hover {
        background: var(--lightgray);
      }
    }
    
    select {
      flex: 1;
      min-width: 120px;
    }
  }
  
  .tree-container {
    width: 100%;
    overflow: auto;
    max-height: calc(100vh - 200px);
    border: 1px solid var(--lightgray);
    border-radius: 6px;
    background: white;
  }
  
  .tree-placeholder {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--gray);
    
    p {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }
    
    small {
      color: var(--darkgray);
      line-height: 1.6;
    }
  }
}

@media (max-width: 1024px) {
  .family-tree-large {
    position: relative;
    margin-top: 2rem;
  }
}
`

  FamilyTreeLarge.afterDOMLoaded = `
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetBtn = document.getElementById('reset-view');
const treeContainer = document.querySelector('.tree-container');

let currentZoom = 1;

if (zoomInBtn && treeContainer) {
  zoomInBtn.addEventListener('click', function() {
    currentZoom = Math.min(currentZoom + 0.2, 2);
    const svg = treeContainer.querySelector('svg');
    if (svg) {
      svg.style.transform = 'scale(' + currentZoom + ')';
    }
  });
}

if (zoomOutBtn && treeContainer) {
  zoomOutBtn.addEventListener('click', function() {
    currentZoom = Math.max(currentZoom - 0.2, 0.5);
    const svg = treeContainer.querySelector('svg');
    if (svg) {
      svg.style.transform = 'scale(' + currentZoom + ')';
    }
  });
}

if (resetBtn && treeContainer) {
  resetBtn.addEventListener('click', function() {
    currentZoom = 1;
    const svg = treeContainer.querySelector('svg');
    if (svg) {
      svg.style.transform = 'scale(1)';
    }
  });
}

const genSelect = document.getElementById('generations-select');
if (genSelect) {
  genSelect.addEventListener('change', function(e) {
    const generations = e.target.value;
    console.log('Selected generations:', generations);
    // TODO: שבוע 5-6 - regenerate tree
  });
}
`

  return FamilyTreeLarge
}) satisfies QuartzComponentConstructor

