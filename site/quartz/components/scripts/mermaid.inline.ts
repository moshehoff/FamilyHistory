import { registerEscapeHandler, removeAllChildren } from "./util"

interface Position {
  x: number
  y: number
}

class DiagramPanZoom {
  private isDragging = false
  private startPan: Position = { x: 0, y: 0 }
  private currentPan: Position = { x: 0, y: 0 }
  private scale = 1
  private readonly MIN_SCALE = 0.5
  private readonly MAX_SCALE = 3

  cleanups: (() => void)[] = []

  constructor(
    private container: HTMLElement,
    private content: HTMLElement,
  ) {
    this.setupEventListeners()
    this.setupNavigationControls()
    this.resetTransform()
  }

  private setupEventListeners() {
    // Mouse drag events
    const mouseDownHandler = this.onMouseDown.bind(this)
    const mouseMoveHandler = this.onMouseMove.bind(this)
    const mouseUpHandler = this.onMouseUp.bind(this)
    const resizeHandler = this.resetTransform.bind(this)

    this.container.addEventListener("mousedown", mouseDownHandler)
    document.addEventListener("mousemove", mouseMoveHandler)
    document.addEventListener("mouseup", mouseUpHandler)
    window.addEventListener("resize", resizeHandler)

    // Touch drag events for mobile
    const touchStartHandler = this.onTouchStart.bind(this)
    const touchMoveHandler = this.onTouchMove.bind(this)
    const touchEndHandler = this.onTouchEnd.bind(this)

    this.container.addEventListener("touchstart", touchStartHandler, { passive: false })
    document.addEventListener("touchmove", touchMoveHandler, { passive: false })
    document.addEventListener("touchend", touchEndHandler)

    this.cleanups.push(
      () => this.container.removeEventListener("mousedown", mouseDownHandler),
      () => document.removeEventListener("mousemove", mouseMoveHandler),
      () => document.removeEventListener("mouseup", mouseUpHandler),
      () => window.removeEventListener("resize", resizeHandler),
      () => this.container.removeEventListener("touchstart", touchStartHandler),
      () => document.removeEventListener("touchmove", touchMoveHandler),
      () => document.removeEventListener("touchend", touchEndHandler),
    )
  }

  cleanup() {
    for (const cleanup of this.cleanups) {
      cleanup()
    }
  }

  private setupNavigationControls() {
    const controls = document.createElement("div")
    controls.className = "mermaid-controls"

    // Zoom controls - faster zoom steps (0.25 instead of 0.1)
    const zoomIn = this.createButton("+", () => this.zoom(0.25))
    const zoomOut = this.createButton("-", () => this.zoom(-0.25))
    const resetBtn = this.createButton("Reset", () => this.resetTransform())

    controls.appendChild(zoomOut)
    controls.appendChild(resetBtn)
    controls.appendChild(zoomIn)

    this.container.appendChild(controls)
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button")
    button.textContent = text
    button.className = "mermaid-control-button"
    button.addEventListener("click", onClick)
    window.addCleanup(() => button.removeEventListener("click", onClick))
    return button
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return // Only handle left click
    this.isDragging = true
    this.startPan = { x: e.clientX - this.currentPan.x, y: e.clientY - this.currentPan.y }
    this.container.style.cursor = "grabbing"
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return
    e.preventDefault()

    this.currentPan = {
      x: e.clientX - this.startPan.x,
      y: e.clientY - this.startPan.y,
    }

    this.updateTransform()
  }

  private onMouseUp() {
    this.isDragging = false
    this.container.style.cursor = "grab"
  }

  // Pinch-to-zoom support
  private isPinching = false
  private initialPinchDistance = 0
  private lastPinchCenter: Position = { x: 0, y: 0 }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      // Two-finger pinch
      this.isPinching = true
      this.isDragging = false
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      this.initialPinchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      // Store the center point between the two fingers
      this.lastPinchCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      }
      
      e.preventDefault()
    } else if (e.touches.length === 1 && !this.isPinching) {
      // Single touch for panning
      this.isDragging = true
      const touch = e.touches[0]
      this.startPan = { x: touch.clientX - this.currentPan.x, y: touch.clientY - this.currentPan.y }
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2 && this.isPinching) {
      // Handle pinch-to-zoom
      e.preventDefault()
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      // Calculate current center point between fingers
      const currentCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      }
      
      // Calculate scale change
      const scaleChange = currentDistance / this.initialPinchDistance
      const newScale = this.scale * scaleChange
      
      // Limit scale
      const limitedScale = Math.min(Math.max(newScale, this.MIN_SCALE), this.MAX_SCALE)
      
      // Get container position
      const containerRect = this.container.getBoundingClientRect()
      
      // Calculate pinch center relative to container
      const pinchX = this.lastPinchCenter.x - containerRect.left
      const pinchY = this.lastPinchCenter.y - containerRect.top
      
      // Calculate the point in content space before zoom
      const contentX = (pinchX - this.currentPan.x) / this.scale
      const contentY = (pinchY - this.currentPan.y) / this.scale
      
      // Apply new scale
      const scaleDiff = limitedScale - this.scale
      this.scale = limitedScale
      
      // Adjust pan to keep the pinch point stable
      this.currentPan.x = pinchX - contentX * this.scale
      this.currentPan.y = pinchY - contentY * this.scale
      
      // Update for next move
      this.initialPinchDistance = currentDistance
      this.lastPinchCenter = currentCenter
      
      this.updateTransform()
    } else if (this.isDragging && e.touches.length === 1 && !this.isPinching) {
      // Handle single-touch drag
      e.preventDefault()

      const touch = e.touches[0]
      this.currentPan = {
        x: touch.clientX - this.startPan.x,
        y: touch.clientY - this.startPan.y,
      }

      this.updateTransform()
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      // All touches ended
      this.isDragging = false
      this.isPinching = false
    } else if (e.touches.length === 1 && this.isPinching) {
      // Went from 2 touches to 1 touch - restart as drag
      this.isPinching = false
      this.isDragging = true
      const touch = e.touches[0]
      this.startPan = { x: touch.clientX - this.currentPan.x, y: touch.clientY - this.currentPan.y }
    }
  }

  private zoom(delta: number) {
    const newScale = Math.min(Math.max(this.scale + delta, this.MIN_SCALE), this.MAX_SCALE)

    // Zoom around center
    const rect = this.content.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const scaleDiff = newScale - this.scale
    this.currentPan.x -= centerX * scaleDiff
    this.currentPan.y -= centerY * scaleDiff

    this.scale = newScale
    this.updateTransform()
  }

  private updateTransform() {
    this.content.style.transform = `translate(${this.currentPan.x}px, ${this.currentPan.y}px) scale(${this.scale})`
  }

  private resetTransform() {
    const svg = this.content.querySelector("svg")!
    const svgRect = svg.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    this.scale = 1

    // Center the diagram in the container
    const scaledWidth = svgRect.width * this.scale
    const scaledHeight = svgRect.height * this.scale

    this.currentPan = {
      x: (containerRect.width - scaledWidth) / 2,
      y: (containerRect.height - scaledHeight) / 2,
    }
    this.updateTransform()
  }
}

const cssVars = [
  "--secondary",
  "--tertiary",
  "--gray",
  "--light",
  "--lightgray",
  "--highlight",
  "--dark",
  "--darkgray",
  "--codeFont",
] as const

let mermaidImport = undefined
document.addEventListener("nav", async () => {
  const center = document.querySelector(".center") as HTMLElement
  const nodes = center.querySelectorAll("code.mermaid") as NodeListOf<HTMLElement>
  if (nodes.length === 0) return

  mermaidImport ||= await import(
    // @ts-ignore
    "https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.esm.min.mjs"
  )
  const mermaid = mermaidImport.default

  const textMapping: WeakMap<HTMLElement, string> = new WeakMap()
  for (const node of nodes) {
    textMapping.set(node, node.innerText)
  }

  async function renderMermaid() {
    // de-init any other diagrams
    for (const node of nodes) {
      node.removeAttribute("data-processed")
      const oldText = textMapping.get(node)
      if (oldText) {
        node.innerHTML = oldText
      }
    }

    const computedStyleMap = cssVars.reduce(
      (acc, key) => {
        acc[key] = window.getComputedStyle(document.documentElement).getPropertyValue(key)
        return acc
      },
      {} as Record<(typeof cssVars)[number], string>,
    )

    const darkMode = document.documentElement.getAttribute("saved-theme") === "dark"
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: darkMode ? "dark" : "base",
      themeVariables: {
        fontFamily: computedStyleMap["--codeFont"],
        primaryColor: computedStyleMap["--light"],
        primaryTextColor: computedStyleMap["--darkgray"],
        primaryBorderColor: computedStyleMap["--tertiary"],
        lineColor: computedStyleMap["--darkgray"],
        secondaryColor: computedStyleMap["--secondary"],
        tertiaryColor: computedStyleMap["--tertiary"],
        clusterBkg: computedStyleMap["--light"],
        edgeLabelBackground: computedStyleMap["--highlight"],
      },
    })

    await mermaid.run({ nodes })
  }

  await renderMermaid()
  document.addEventListener("themechange", renderMermaid)
  window.addCleanup(() => document.removeEventListener("themechange", renderMermaid))

  // Add drag-to-scroll to all mermaid diagrams AFTER rendering
  function addDragToScroll() {
    for (const node of nodes) {
      const pre = node.parentElement as HTMLPreElement
      if (!pre) continue
      
      let isDragging = false
      let startX = 0
      let startY = 0
      let scrollLeft = 0
      let scrollTop = 0
      
      const mouseDownHandler = (e: MouseEvent) => {
        // Only handle left click and not on links/buttons
        const target = e.target as HTMLElement
        if (e.button !== 0 || target.tagName === 'A' || target.closest('button')) return
        
        isDragging = true
        startX = e.clientX
        startY = e.clientY
        scrollLeft = pre.scrollLeft
        scrollTop = pre.scrollTop
        pre.style.cursor = 'grabbing'
        e.preventDefault()
      }
      
      const mouseMoveHandler = (e: MouseEvent) => {
        if (!isDragging) return
        e.preventDefault()
        
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        pre.scrollLeft = scrollLeft - dx
        pre.scrollTop = scrollTop - dy
      }
      
      const mouseUpHandler = () => {
        if (isDragging) {
          isDragging = false
          pre.style.cursor = 'grab'
        }
      }
      
      const mouseLeaveHandler = () => {
        if (isDragging) {
          isDragging = false
          pre.style.cursor = 'grab'
        }
      }
      
      // Touch support for mobile (drag and pinch-to-zoom)
      let initialPinchDistance = 0
      let currentScale = 1
      let isPinching = false
      
      const touchStartHandler = (e: TouchEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'A' || target.closest('button')) return
        
        // Check if it's a pinch gesture (2 fingers)
        if (e.touches.length === 2) {
          isPinching = true
          isDragging = false
          
          // Calculate initial distance between two fingers
          const touch1 = e.touches[0]
          const touch2 = e.touches[1]
          initialPinchDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          )
          e.preventDefault()
        } else if (e.touches.length === 1) {
          // Single finger - drag
          const touch = e.touches[0]
          isDragging = true
          isPinching = false
          startX = touch.clientX
          startY = touch.clientY
          scrollLeft = pre.scrollLeft
          scrollTop = pre.scrollTop
        }
      }
      
      const touchMoveHandler = (e: TouchEvent) => {
        // Handle pinch-to-zoom
        if (e.touches.length === 2 && isPinching) {
          e.preventDefault()
          
          const touch1 = e.touches[0]
          const touch2 = e.touches[1]
          const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          )
          
          // Calculate scale factor
          const scaleChange = currentDistance / initialPinchDistance
          const newScale = currentScale * scaleChange
          
          // Limit scale between 0.5x and 3x
          const limitedScale = Math.min(Math.max(newScale, 0.5), 3)
          
          // Find the SVG element inside the code block
          const svg = node.querySelector('svg') as SVGElement
          if (svg) {
            svg.style.transform = `scale(${limitedScale})`
            svg.style.transformOrigin = 'center center'
            svg.style.transition = 'none' // Disable transition during pinch
          }
          
          // Update for next move
          initialPinchDistance = currentDistance
          currentScale = limitedScale
          
          return
        }
        
        // Handle drag with single finger
        if (!isDragging || e.touches.length !== 1) return
        e.preventDefault()
        
        const touch = e.touches[0]
        const dx = touch.clientX - startX
        const dy = touch.clientY - startY
        pre.scrollLeft = scrollLeft - dx
        pre.scrollTop = scrollTop - dy
      }
      
      const touchEndHandler = () => {
        isDragging = false
        
        // If pinching ended, keep the current scale
        if (isPinching) {
          isPinching = false
          // Scale is already applied, just reset the flag
        }
      }
      
      pre.addEventListener('mousedown', mouseDownHandler)
      document.addEventListener('mousemove', mouseMoveHandler)
      document.addEventListener('mouseup', mouseUpHandler)
      pre.addEventListener('mouseleave', mouseLeaveHandler)
      pre.addEventListener('touchstart', touchStartHandler, { passive: false })
      pre.addEventListener('touchmove', touchMoveHandler, { passive: false })
      pre.addEventListener('touchend', touchEndHandler)
      pre.style.cursor = 'grab'
      
      window.addCleanup(() => {
        pre.removeEventListener('mousedown', mouseDownHandler)
        document.removeEventListener('mousemove', mouseMoveHandler)
        document.removeEventListener('mouseup', mouseUpHandler)
        pre.removeEventListener('mouseleave', mouseLeaveHandler)
        pre.removeEventListener('touchstart', touchStartHandler)
        pre.removeEventListener('touchmove', touchMoveHandler)
        pre.removeEventListener('touchend', touchEndHandler)
      })
    }
  }

  addDragToScroll()

  for (let i = 0; i < nodes.length; i++) {
    const codeBlock = nodes[i] as HTMLElement
    const pre = codeBlock.parentElement as HTMLPreElement
    const clipboardBtn = pre.querySelector(".clipboard-button") as HTMLButtonElement
    const expandBtn = pre.querySelector(".expand-button") as HTMLButtonElement

    const clipboardStyle = window.getComputedStyle(clipboardBtn)
    const clipboardWidth =
      clipboardBtn.offsetWidth +
      parseFloat(clipboardStyle.marginLeft || "0") +
      parseFloat(clipboardStyle.marginRight || "0")

    // Set expand button position
    expandBtn.style.right = `calc(${clipboardWidth}px + 0.3rem)`
    pre.prepend(expandBtn)

    // query popup container
    const popupContainer = pre.querySelector("#mermaid-container") as HTMLElement
    if (!popupContainer) return

    let panZoom: DiagramPanZoom | null = null
    function showMermaid() {
      const container = popupContainer.querySelector("#mermaid-space") as HTMLElement
      const content = popupContainer.querySelector(".mermaid-content") as HTMLElement
      if (!content) return
      removeAllChildren(content)

      // Clone the mermaid content
      const mermaidContent = codeBlock.querySelector("svg")!.cloneNode(true) as SVGElement
      content.appendChild(mermaidContent)

      // Show container
      popupContainer.classList.add("active")
      container.style.cursor = "grab"
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"

      // Initialize pan-zoom after showing the popup
      panZoom = new DiagramPanZoom(container, content)
    }

    function hideMermaid() {
      popupContainer.classList.remove("active")
      panZoom?.cleanup()
      panZoom = null
      
      // Restore body scroll
      document.body.style.overflow = ""
    }

    expandBtn.addEventListener("click", showMermaid)
    registerEscapeHandler(popupContainer, hideMermaid)
    
    // Close modal when clicking on the overlay (outside the diagram)
    const overlayClickHandler = (e: MouseEvent) => {
      // Only close if clicking directly on the overlay, not on the content
      if (e.target === popupContainer) {
        hideMermaid()
      }
    }
    popupContainer.addEventListener("click", overlayClickHandler)

    window.addCleanup(() => {
      panZoom?.cleanup()
      expandBtn.removeEventListener("click", showMermaid)
      popupContainer.removeEventListener("click", overlayClickHandler)
    })
  }
})
