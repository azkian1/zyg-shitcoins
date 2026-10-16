/* A single decoded buffer keeps the music continuous across every lap. */
(function (root) {
  'use strict';

  class ZYGMusicLoop {
    constructor(src) {
      this._volume = 1;
      this._muted = false;
      this._wanted = false;
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
      if (this._source) return;
      if (!context || !this._bytes) return this._fallback.play();
      this._context = context;
      if (!this._decoded) {
        this._decoded = this._bytes.then(bytes => bytes && context.decodeAudioData(bytes)).catch(() => null);
      }
      this._buffer = await this._decoded;
      if (!this._wanted || this._source) return;
      if (!this._buffer) return this._fallback.play();
      this._fallback.pause();
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

    pause() {
      this._wanted = false;
      this._fallback.pause();
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
