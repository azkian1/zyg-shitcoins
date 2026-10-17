/* A single decoded buffer keeps the music continuous across every lap. */
(function (root) {
  'use strict';

  class ZYGMusicLoop {
    constructor(src) {
      this._volume = 1;
      this._muted = false;
      this._wanted = false;
      this._epoch = 0;
      this._usingFallback = false;
      this._fallbackActive = false;
      this._offset = 0;
      this._source = null;
      this._context = null;
      this._buffer = null;
      this._gain = null;
      this._fallback = new root.Audio(src);
      this._fallback.loop = true;
      const fromDisk = root.location && root.location.protocol === 'file:';
      this._fallback.preload = fromDisk ? 'auto' : 'none';
      // Browsers block fetch(file://). The processed WAV also loops through the
      // media element when the game is opened directly from disk.
      this._bytes = fromDisk ? null :
        root.fetch(src).then(response => {
          if (!response.ok) throw new Error('Music could not be loaded');
          return response.arrayBuffer();
        }).catch(() => null);
    }

    get volume() { return this._volume; }
    set volume(value) {
      this._volume = Math.max(0, Math.min(1, Number(value) || 0));
      this._fallback.volume = this._volume;
      this._updateGain();
    }
    get muted() { return this._muted; }
    set muted(value) {
      this._muted = !!value;
      this._fallback.muted = this._muted;
      this._updateGain();
    }

    _updateGain() {
      if (!this._gain) return;
      const now = this._context.currentTime;
      this._gain.gain.cancelScheduledValues(now);
      this._gain.gain.setTargetAtTime(this._muted ? 0 : this._volume, now, .008);
    }

    async play(context) {
      this._wanted = true;
      const epoch = this._epoch;
      if (this._source) return;
      if (!context || context.state === 'closed' || !this._bytes) return this._playFallback(epoch);
      if (!this._decoded) {
        // decodeAudioData may detach its input. Keep the fetched bytes intact
        // so the cached buffer can safely outlive an AudioContext.
        this._decoded = this._bytes.then(bytes => bytes && context.decodeAudioData(bytes.slice(0))).catch(() => null);
      }
      this._buffer = await this._decoded;
      if (!this._wanted || epoch !== this._epoch || this._source) return;
      if (!this._buffer || context.state === 'closed') return this._playFallback(epoch);
      if (this._usingFallback) {
        this._offset = (Number(this._fallback.currentTime) || 0) % this._buffer.duration;
        this._usingFallback = false;
      }
      this._fallback.pause();
      this._fallbackActive = false;
      this._context = context;
      const now = context.currentTime;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = this._buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = this._buffer.duration;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this._muted ? 0 : this._volume, now + .02);
      source.connect(gain);
      gain.connect(context.destination);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      this._source = source;
      this._gain = gain;
      this._startedAt = now;
      source.start(now, this._offset);
    }

    async _playFallback(epoch) {
      if (!this._wanted || epoch !== this._epoch) return;
      if (this._fallbackActive) return;
      this._usingFallback = true;
      this._fallbackActive = true;
      const duration = this._fallback.duration;
      if (this._offset && Number.isFinite(duration) && duration > 0) {
        this._fallback.currentTime = this._offset % duration;
      }
      try {
        await this._fallback.play();
      } catch (error) {
        if (epoch === this._epoch) this._fallbackActive = false;
        throw error;
      }
      // A media play promise can finish after pause(). Never resurrect audio
      // from an earlier request, including a decode/fallback race.
      if (!this._wanted && epoch !== this._epoch) this._fallback.pause();
    }

    pause() {
      this._wanted = false;
      this._epoch++;
      if (this._usingFallback) this._offset = Number(this._fallback.currentTime) || 0;
      this._fallback.pause();
      this._fallbackActive = false;
      if (!this._source) return;
      const now = this._context.currentTime;
      this._offset = (this._offset + now - this._startedAt) % this._buffer.duration;
      const gain = this._gain.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, now + .015);
      this._source.stop(now + .015);
      this._source = this._gain = null;
    }
  }

  root.ZYGMusicLoop = ZYGMusicLoop;
  if (typeof module !== 'undefined' && module.exports) module.exports = { ZYGMusicLoop };
})(typeof window !== 'undefined' ? window : globalThis);
