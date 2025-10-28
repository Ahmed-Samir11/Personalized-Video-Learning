/**
 * Behavior Tracker - Monitors user behavior to detect confusion
 * 
 * Tracks:
 * - Rewind count and patterns
 * - Pause frequency
 * - Playback speed changes
 * - Time spent on segments
 */

export class BehaviorTracker {
  constructor(videoController) {
    this.video = videoController;
    this.listeners = {};
    this.data = {
      rewindCount: 0,
      pauseCount: 0,
      playbackSpeedChanges: 0,
      segmentWatchTimes: {},
      lastPosition: 0,
      rewindThreshold: 5 // seconds - consider it a rewind if jumped back > 5s
    };
    this.isTracking = false;
    this.confusionCheckInterval = null;
  }

  /**
   * Start tracking user behavior
   */
  start() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    // Track time updates
    this.video.on('timeupdate', this.handleTimeUpdate.bind(this));
    
    // Track pause events
    this.video.on('pause', this.handlePause.bind(this));
    
    // Track play events
    this.video.on('play', this.handlePlay.bind(this));
    
    // Track rate changes
    this.video.on('ratechange', this.handleRateChange.bind(this));
    
    // Check for confusion patterns every 10 seconds
    this.confusionCheckInterval = setInterval(() => {
      this.checkForConfusion();
    }, 10000);
    
    console.log('[BehaviorTracker] Started tracking');
  }

  /**
   * Stop tracking
   */
  stop() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    if (this.confusionCheckInterval) {
      clearInterval(this.confusionCheckInterval);
    }
    
    console.log('[BehaviorTracker] Stopped tracking');
  }

  /**
   * Handle time update event
   */
  handleTimeUpdate() {
    const currentTime = this.video.getCurrentTime();
    
    // Detect rewinds
    const timeDiff = currentTime - this.data.lastPosition;
    if (timeDiff < -this.data.rewindThreshold) {
      this.data.rewindCount++;
      console.log('[BehaviorTracker] Rewind detected:', this.data.rewindCount);
      
      // Emit rewind event
      this.emit('rewind', {
        from: this.data.lastPosition,
        to: currentTime,
        count: this.data.rewindCount
      });
    }
    
    // Track segment watch times
    const segment = Math.floor(currentTime / 10) * 10; // 10-second segments
    if (!this.data.segmentWatchTimes[segment]) {
      this.data.segmentWatchTimes[segment] = 0;
    }
    this.data.segmentWatchTimes[segment]++;
    
    this.data.lastPosition = currentTime;
  }

  /**
   * Handle pause event
   */
  handlePause() {
    this.data.pauseCount++;
    console.log('[BehaviorTracker] Pause detected:', this.data.pauseCount);
    
    this.emit('pause', {
      time: this.video.getCurrentTime(),
      count: this.data.pauseCount
    });
  }

  /**
   * Handle play event
   */
  handlePlay() {
    this.emit('play', {
      time: this.video.getCurrentTime()
    });
  }

  /**
   * Handle playback rate change
   */
  handleRateChange() {
    this.data.playbackSpeedChanges++;
    
    this.emit('rate-change', {
      rate: this.video.getPlaybackRate(),
      count: this.data.playbackSpeedChanges
    });
  }

  /**
   * Check for confusion patterns
   */
  checkForConfusion() {
    const recentRewinds = this.data.rewindCount;
    const recentPauses = this.data.pauseCount;
    
    // Simple heuristic: 3+ rewinds or 5+ pauses in recent history
    if (recentRewinds >= 3 || recentPauses >= 5) {
      console.log('[BehaviorTracker] Confusion pattern detected');
      
      this.emit('confusion-detected', {
        rewindCount: recentRewinds,
        pauseCount: recentPauses,
        currentTimestamp: this.video.getCurrentTime(),
        watchedSegments: this.data.segmentWatchTimes
      });
      
      // Reset counters after detection
      this.resetCounters();
    }
  }

  /**
   * Reset behavior counters
   */
  resetCounters() {
    this.data.rewindCount = 0;
    this.data.pauseCount = 0;
    this.data.playbackSpeedChanges = 0;
  }

  /**
   * Get current behavior data
   */
  getBehaviorData() {
    return {
      ...this.data,
      currentTime: this.video.getCurrentTime(),
      isPlaying: this.video.isPlaying()
    };
  }

  /**
   * Event emitter pattern
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}
