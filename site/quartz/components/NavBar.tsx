import { pathToRoot, joinSegments } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const NavBar: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)
  
  return (
    <nav class={classNames(displayClass, "navbar")}>
      <div class="navbar-container">
        <button class="navbar-toggle" aria-label="Toggle navigation menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <ul class="navbar-menu">
          <li><a href={baseDir}>Home</a></li>
          <li><a href={joinSegments(baseDir, "pages/all-profiles")}>All Profiles</a></li>
          <li><a href={joinSegments(baseDir, "pages/profiles-of-interest")}>Profiles of Interest</a></li>
          <li><a href={joinSegments(baseDir, "pages/about")}>About</a></li>
        </ul>
      </div>
    </nav>
  )
}

NavBar.css = `
.navbar {
  background: var(--light);
  border-bottom: 1px solid var(--lightgray);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  gap: 0.25rem;
}

.navbar-toggle span {
  display: block;
  width: 25px;
  height: 3px;
  background: var(--darkgray);
  border-radius: 3px;
  transition: all 0.3s ease;
}

.navbar-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.navbar-toggle.active span:nth-child(2) {
  opacity: 0;
}

.navbar-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
}

.navbar-menu li {
  margin: 0;
}

.navbar-menu a {
  color: #1a1a1a !important;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  padding: 0.5rem 0;
  transition: color 0.2s ease;
  display: block;
  background-color: transparent !important;
}

.navbar-menu a:hover {
  color: var(--tertiary) !important;
  text-decoration: none !important;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 1rem;
  }
  
  .navbar-toggle {
    display: flex;
    z-index: 101;
  }
  
  .navbar-menu {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    width: 100vw;
    background: var(--light);
    flex-direction: column;
    gap: 0;
    padding: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }
  
  .navbar-menu.active {
    max-height: 500px;
  }
  
  .navbar-menu li {
    padding: 0;
    width: 100%;
  }
  
  .navbar-menu a {
    padding: 1rem 1.5rem;
    width: 100%;
    box-sizing: border-box;
    display: block;
  }
  
  .navbar-menu a:hover {
    background: var(--lightgray);
  }
}
`

NavBar.afterDOMLoaded = `
const toggleButton = document.querySelector('.navbar-toggle');
const menu = document.querySelector('.navbar-menu');

if (toggleButton && menu) {
  toggleButton.addEventListener('click', function() {
    this.classList.toggle('active');
    menu.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    const isClickInside = toggleButton.contains(event.target) || menu.contains(event.target);
    if (!isClickInside && menu.classList.contains('active')) {
      toggleButton.classList.remove('active');
      menu.classList.remove('active');
    }
  });
  
  // Close menu when clicking on a link
  const menuLinks = menu.querySelectorAll('a');
  menuLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      toggleButton.classList.remove('active');
      menu.classList.remove('active');
    });
  });
}
`

export default (() => NavBar) satisfies QuartzComponentConstructor

