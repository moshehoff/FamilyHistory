import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"

export default (() => {
  const FamilyTreeLarge: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // Only show on profile pages
    const isProfile = fileData.frontmatter?.type === "profile"
    const profileId = fileData.frontmatter?.ID as string | undefined
    const basePath = pathToRoot(fileData.slug!)
    
    if (!isProfile) {
      return null
    }

    return (
      <div class={classNames(displayClass, "family-tree-large")} data-profile-id={profileId} data-base-path={basePath}>
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
          <div id="family-tree-diagram" class="mermaid">טוען עץ משפחתי...</div>
        </div>
        
        <script type="module" dangerouslySetInnerHTML={{__html: `
console.log('[TREE DEBUG 1] FamilyTreeLarge script loaded');

const profileId = '${profileId}';
let basePath = '${basePath}';
// Ensure basePath ends with / if it's not empty
if (basePath && !basePath.endsWith('/')) {
  basePath = basePath + '/';
}
console.log('[TREE DEBUG 2] Profile ID:', profileId, 'basePath:', basePath);

async function loadAndRenderTree() {
  console.log('[TREE DEBUG 3] Starting loadAndRenderTree');
  
  try {
    console.log('[TREE DEBUG 4] Fetching', basePath + 'static/family-data.json');
    const response = await fetch(basePath + 'static/family-data.json');
    console.log('[TREE DEBUG 5] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    
    const familyData = await response.json();
    console.log('[TREE DEBUG 6] Data loaded. People:', familyData.people.length);
    
    // Build tree as array then join
    const lines = [];
    lines.push('flowchart TD');
    lines.push('classDef person fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;');
    
    familyData.people.forEach(person => {
      const nodeId = 'id' + person.id;
      const name = person.name.replace(/"/g, "'");
      
      lines.push(nodeId + '["' + name + '"]');
      lines.push('class ' + nodeId + ' person');
    });
    
    familyData.families.forEach(fam => {
      if (!fam.husband && !fam.wife) return;
      const mNode = 'marriage_' + fam.id;
      lines.push(mNode + '((" "))');
      if (fam.husband) lines.push('id' + fam.husband + ' --- ' + mNode);
      if (fam.wife) lines.push('id' + fam.wife + ' --- ' + mNode);
      fam.children.forEach(child => {
        lines.push(mNode + ' --> id' + child);
      });
    });
    
    // Join with actual newline using template literal
    //const diagram = \`\${lines.join('\\n')}\`;
    const diagram = lines.join('\\n'); // This creates actual newlines in the output
    
    console.log('[TREE DEBUG 7] Diagram built, length:', diagram.length);
    console.log('[TREE DEBUG 7.5] First 200 chars:', diagram.substring(0, 200));
    
    const treeDiv = document.getElementById('family-tree-diagram');
    if (treeDiv) {
      console.log('[TREE DEBUG 8] Setting diagram to div');

      // ננקה רווחים מיותרים ונשתמש ב-innerHTML עם <pre>
      const safeDiagram = diagram.trim();
      treeDiv.innerHTML = \`<pre class="mermaid">\${safeDiagram}</pre>\`;

      console.log('[TREE DEBUG 9] Loading Mermaid...');
      
      // Load Mermaid dynamically
      const mermaidModule = await import('https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.esm.min.mjs');
      const mermaid = mermaidModule.default;
      
      console.log('[TREE DEBUG 10] Mermaid loaded! Initializing...');
      
      // Initialize Mermaid
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base'
      });
      
      console.log('[TREE DEBUG 11] Rendering diagram...');
      const mermaidNode = treeDiv.querySelector('.mermaid');
      
      try {
        await mermaid.run({ nodes: [mermaidNode] });
        console.log('[TREE DEBUG 12] SUCCESS! Diagram rendered!');
      } catch (e) {
        console.error('[TREE DEBUG ERROR]', e);
        treeDiv.innerHTML = '<pre style="color:red">Error: ' + e + '</pre>';
      }
    } else {
      console.error('[TREE DEBUG ERROR] Div not found!');
    }
  } catch (error) {
    console.error('[TREE DEBUG ERROR] Load failed:', error);
    const treeDiv = document.getElementById('family-tree-diagram');
    if (treeDiv) {
      treeDiv.innerHTML = '<p style="color:red;padding:2rem;">ERROR: ' + error.message + '</p>';
    }
  }
}

setTimeout(loadAndRenderTree, 500);
        `}} />
      </div>
    )
  }
  
  FamilyTreeLarge.css = `
.family-tree-large {
  width: 100%;
  margin: 0 0 2rem 0;
  padding: 1.5rem;
  background: var(--light);
  border-radius: 8px;
  border: 1px solid var(--lightgray);
  
  h3 {
    margin: 0 0 1rem 0;
    color: var(--darkgray);
    font-size: 1.5rem;
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
    height: 500px;
    overflow: auto;
    border: 1px solid var(--lightgray);
    border-radius: 6px;
    background: white;
    padding: 1rem;
  }
  
  #family-tree-diagram {
    min-height: 300px;
  }
}

@media (max-width: 1024px) {
  .family-tree-large {
    position: relative;
    margin-top: 2rem;
  }
}
`

  return FamilyTreeLarge
}) satisfies QuartzComponentConstructor

