/**
 * Overlay Manager - Manages visual overlays on the page
 * 
 * Handles:
 * - Object/tool highlighting
 * - Focus mode dimming
 * - Bounding boxes
 */

export class OverlayManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.highlights = [];
    this.focusOverlay = null;
    // We'll create four panels that surround the video to simulate a cutout
    this.focusPanels = [];
    this.isFocusModeActive = false;
  }

  /**
   * Draw a highlight box around an object
   */
  drawHighlight(boundingBox, label) {
    const videoPos = this.getVideoPosition();
    
    // Scale bounding box to match video display size
    const scaleX = videoPos.width / this.video.videoWidth;
    const scaleY = videoPos.height / this.video.videoHeight;
    
    // Create highlight element
    const highlight = document.createElement('div');
    highlight.className = 'pvl-highlight-box';
    highlight.style.left = `${videoPos.x + (boundingBox.x * scaleX)}px`;
    highlight.style.top = `${videoPos.y + (boundingBox.y * scaleY)}px`;
    highlight.style.width = `${boundingBox.width * scaleX}px`;
    highlight.style.height = `${boundingBox.height * scaleY}px`;
    
    // Create label
    if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'pvl-highlight-label';
      labelEl.textContent = label;
      highlight.appendChild(labelEl);
    }
    
    document.body.appendChild(highlight);
    this.highlights.push(highlight);
    
    // Auto-remove after 5 seconds
    setTimeout(() => this.removeHighlight(highlight), 5000);
    
    return highlight;
  }

  /**
   * Remove a specific highlight
   */
  removeHighlight(highlight) {
    if (highlight && highlight.parentNode) {
      highlight.parentNode.removeChild(highlight);
    }
    this.highlights = this.highlights.filter(h => h !== highlight);
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    this.highlights.forEach(highlight => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    });
    this.highlights = [];
  }

  /**
   * Toggle focus mode (dim everything except video)
   */
  toggleFocusMode() {
    if (this.isFocusModeActive) {
      this.disableFocusMode();
    } else {
      this.enableFocusMode();
    }
  }

  /**
   * Enable focus mode
   */
  enableFocusMode() {
    if (this.isFocusModeActive) return;
    // Create four panels (top, left, right, bottom) positioned fixed to dim
    // the page around the video. This approach leaves the video visible and
    // interactive because the panels do not cover the video region.
    const videoPos = this.getVideoPositionViewport();

    const createPanel = (styles) => {
      const el = document.createElement('div');
      el.className = 'pvl-focus-panel';
      Object.assign(el.style, {
        position: 'fixed',
        background: 'rgba(0,0,0,0.7)',
        zIndex: '1000000',
        pointerEvents: 'auto',
        ...styles
      });
      document.body.appendChild(el);
      return el;
    };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const topH = Math.max(0, videoPos.top);
    const bottomTop = Math.min(vh, videoPos.top + videoPos.height);
    const leftW = Math.max(0, videoPos.left);
    const rightLeft = Math.min(vw, videoPos.left + videoPos.width);

    // top
    this.focusPanels.push(createPanel({ left: '0px', top: '0px', width: '100vw', height: `${topH}px` }));
    // bottom
    this.focusPanels.push(createPanel({ left: '0px', top: `${bottomTop}px`, width: '100vw', height: `${Math.max(0, vh - bottomTop)}px` }));
    // left (beside video)
    this.focusPanels.push(createPanel({ left: '0px', top: `${topH}px`, width: `${leftW}px`, height: `${Math.max(0, videoPos.height)}px` }));
    // right
    this.focusPanels.push(createPanel({ left: `${rightLeft}px`, top: `${topH}px`, width: `${Math.max(0, vw - rightLeft)}px`, height: `${Math.max(0, videoPos.height)}px` }));

    this.isFocusModeActive = true;

    // Update panels on scroll/resize
    this.updateCutoutPosition = this.updateCutoutPosition.bind(this);
    window.addEventListener('scroll', this.updateCutoutPosition);
    window.addEventListener('resize', this.updateCutoutPosition);

    console.log('[OverlayManager] Focus mode enabled (panels)');
  }

  /**
   * Disable focus mode
   */
  disableFocusMode() {
    if (!this.isFocusModeActive) return;
    // Remove any panels
    if (this.focusPanels && this.focusPanels.length > 0) {
      this.focusPanels.forEach(p => { if (p && p.parentNode) p.parentNode.removeChild(p); });
    }
    this.focusPanels = [];
    this.isFocusModeActive = false;
    
    window.removeEventListener('scroll', this.updateCutoutPosition);
    window.removeEventListener('resize', this.updateCutoutPosition);
    
    console.log('[OverlayManager] Focus mode disabled');
  }

  /**
   * Update video cutout position (on scroll/resize)
   */
  updateCutoutPosition() {
    if (!this.isFocusModeActive) return;

    const vp = this.getVideoPositionViewport();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const topH = Math.max(0, vp.top);
    const bottomTop = Math.min(vh, vp.top + vp.height);
    const leftW = Math.max(0, vp.left);
    const rightLeft = Math.min(vw, vp.left + vp.width);

    // Update top
    if (this.focusPanels[0]) {
      this.focusPanels[0].style.height = `${topH}px`;
    }
    // bottom
    if (this.focusPanels[1]) {
      this.focusPanels[1].style.top = `${bottomTop}px`;
      this.focusPanels[1].style.height = `${Math.max(0, vh - bottomTop)}px`;
    }
    // left
    if (this.focusPanels[2]) {
      this.focusPanels[2].style.top = `${topH}px`;
      this.focusPanels[2].style.width = `${leftW}px`;
      this.focusPanels[2].style.height = `${Math.max(0, vp.height)}px`;
    }
    // right
    if (this.focusPanels[3]) {
      this.focusPanels[3].style.left = `${rightLeft}px`;
      this.focusPanels[3].style.top = `${topH}px`;
      this.focusPanels[3].style.width = `${Math.max(0, vw - rightLeft)}px`;
      this.focusPanels[3].style.height = `${Math.max(0, vp.height)}px`;
    }
  }

  /**
   * Get video element position
   */
  getVideoPosition() {
    const rect = this.video.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Return video position relative to the viewport (no scroll offsets)
   * used for fixed-position overlay panels
   */
  getVideoPositionViewport() {
    const rect = this.video.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Cleanup - remove all overlays
   */
  cleanup() {
    this.clearHighlights();
    this.disableFocusMode();
  }
}
