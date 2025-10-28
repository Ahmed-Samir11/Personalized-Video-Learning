/**
 * Video Controller - Controls video playback and captures frames
 */

export class VideoController {
  constructor(videoElement) {
    this.video = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Play the video
   */
  play() {
    return this.video.play();
  }

  /**
   * Pause the video
   */
  pause() {
    this.video.pause();
  }

  /**
   * Toggle play/pause
   */
  togglePause() {
    if (this.video.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  /**
   * Seek to specific timestamp
   */
  seekTo(timestamp) {
    this.video.currentTime = timestamp;
  }

  /**
   * Get current playback time
   */
  getCurrentTime() {
    return this.video.currentTime;
  }

  /**
   * Get video duration
   */
  getDuration() {
    return this.video.duration;
  }

  /**
   * Check if video is playing
   */
  isPlaying() {
    return !this.video.paused && !this.video.ended && this.video.readyState > 2;
  }

  /**
   * Capture current video frame as base64 image
   */
  captureFrame() {
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Get video element position and size
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
   * Add event listener to video
   */
  on(event, callback) {
    this.video.addEventListener(event, callback);
  }

  /**
   * Remove event listener from video
   */
  off(event, callback) {
    this.video.removeEventListener(event, callback);
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate) {
    this.video.playbackRate = rate;
  }

  /**
   * Get playback rate
   */
  getPlaybackRate() {
    return this.video.playbackRate;
  }
}
