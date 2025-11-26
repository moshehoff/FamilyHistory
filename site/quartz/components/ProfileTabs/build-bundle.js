/**
 * Build Script for ProfileTabs
 * Bundles all modules into a single JavaScript file for easier integration
 */

const fs = require('fs')
const path = require('path')

const MODULES_ORDER = [
  // Constants and Types first (no dependencies)
  'constants.ts',
  'types.ts',
  
  // Utils (depend on constants)
  'utils/DebugLogger.ts',
  'utils/DomUtils.ts',
  'utils/HashUtils.ts',
  'utils/MobileUtils.ts',
  
  // Core (depend on utils)
  'core/StateManager.ts',
  'core/EventManager.ts',
  
  // Content (depend on utils and core)
  'content/MermaidInitializer.ts',
  'content/MarkdownParser.ts',
  'content/ContentMover.ts',
  
  // Media (depend on utils)
  'media/MediaLoader.ts',
  'media/GalleryRenderer.ts',
  
  // Chapters (depend on everything)
  'chapters/ChapterLoader.ts',
  'chapters/ChapterNavigator.ts',
  'chapters/ChapterManager.ts',
  
  // Main (depend on everything)
  'core/TabManager.ts',
  'ProfileTabsManager.ts',
]

console.log('🔨 Building ProfileTabs bundle...\n')

// Check if all files exist
console.log('📋 Checking files...')
const missingFiles = []
MODULES_ORDER.forEach(file => {
  const fullPath = path.join(__dirname, file)
  if (!fs.existsSync(fullPath)) {
    missingFiles.push(file)
  }
})

if (missingFiles.length > 0) {
  console.error('❌ Missing files:')
  missingFiles.forEach(file => console.error(`   - ${file}`))
  process.exit(1)
}
console.log(`✅ All ${MODULES_ORDER.length} files found\n`)

// Read and combine files
console.log('📦 Bundling modules...')
let bundle = `/**
 * ProfileTabs Bundle
 * Generated: ${new Date().toISOString()}
 * Modules: ${MODULES_ORDER.length}
 */

(function() {
  'use strict';
  
`

MODULES_ORDER.forEach((file, index) => {
  console.log(`   ${index + 1}/${MODULES_ORDER.length} ${file}`)
  
  const fullPath = path.join(__dirname, file)
  const content = fs.readFileSync(fullPath, 'utf8')
  
  // Remove imports/exports (we're bundling)
  let processed = content
    .replace(/^import\s+.*from\s+['"].*['"]/gm, '// $&') // Comment out imports
    .replace(/^export\s+/gm, '') // Remove export keywords
    .replace(/^export\s+default\s+/gm, '') // Remove export default
  
  bundle += `\n/* ============================================\n`
  bundle += `   Module: ${file}\n`
  bundle += `   ============================================ */\n\n`
  bundle += processed
  bundle += '\n\n'
})

// Add initialization code
bundle += `
/* ============================================
   Auto-initialization
   ============================================ */

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    runOnLoad()
  })
} else {
  runOnLoad()
}

// Handle navigation (SPA)
document.addEventListener('nav', function() {
  initProfileTabs()
})

// Expose API
window.__profileTabs = {
  reinit: forceReinitialize,
  getState: getProfileTabsState,
  setDebug: setDebugMode,
  logger: logger,
  stateManager: stateManager,
  eventManager: eventManager,
}

console.log('[ProfileTabs] Bundle loaded and initialized')

})();
`

// Write bundle
const outputPath = path.join(__dirname, 'dist', 'profile-tabs-bundle.js')
const distDir = path.join(__dirname, 'dist')

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir)
}

fs.writeFileSync(outputPath, bundle, 'utf8')

const stats = fs.statSync(outputPath)
const sizeKB = (stats.size / 1024).toFixed(2)

console.log(`\n✅ Bundle created successfully!`)
console.log(`   Output: ${outputPath}`)
console.log(`   Size: ${sizeKB} KB`)
console.log(`   Modules: ${MODULES_ORDER.length}`)

// Also create a minified note
const noteContent = `
ProfileTabs Bundle
==================

Generated: ${new Date().toISOString()}
Modules: ${MODULES_ORDER.length}
Size: ${sizeKB} KB

To minify:
  npx terser dist/profile-tabs-bundle.js -o dist/profile-tabs-bundle.min.js

To use:
  <script src="dist/profile-tabs-bundle.js"></script>
  
Or in Quartz:
  ProfileTabs.afterDOMLoaded = fs.readFileSync('./ProfileTabs/dist/profile-tabs-bundle.js', 'utf8')
`

fs.writeFileSync(path.join(__dirname, 'dist', 'README.txt'), noteContent, 'utf8')

console.log('\n🎉 Build complete!')

