/* Zygote vs Shitcoins. Standalone, dependency-free game and deterministic simulation. */
(function (root) {
  'use strict';

  const W = 1280, H = 720, CX = 640, FEET = 587;
  const RECOVERY_SECONDS = .1;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const MOVE_DEFAULTS = {
    punch: { duration: .56, start: .14, end: .36, reach: 180, type: 'light', name: 'УДАР РУКОЙ' },
    kick: { duration: .72, start: .20, end: .46, reach: 220, type: 'heavy', name: 'УДАР НОГОЙ' },
    palm: { duration: .74, start: .16, end: .53, reach: 185, type: 'light', name: 'ДВОЙНАЯ ЛАДОНЬ' },
    jumpkick: { duration: .88, start: .28, end: .61, reach: 235, type: 'heavy', name: 'УДАР В ПРЫЖКЕ' },
    break: { duration: 1.02, start: .20, end: .79, reach: 285, type: 'all', name: 'БРЕЙК · ЗАЧИСТКА' }
  };

  function motionSpecs(manifest) {
    const specs = {};
    for (const [name, base] of Object.entries(MOVE_DEFAULTS)) {
      const motion = manifest && manifest.motions && (manifest.motions[name] || (name === 'palm' && manifest.motions.palms));
      const fps = motion && motion.fps || 30;
      const duration = motion && motion.frames && motion.frames.length ? motion.frames.length / fps : base.duration;
      let start = duration * base.start / base.duration, end = duration * base.end / base.duration;
      if (motion && Array.isArray(motion.impact)) {
        start = Math.max(0, motion.impact[0] / fps);
        end = Math.min(duration, (motion.impact[1] + 1) / fps);
      }
      const windows = motion && motion.impactWindows ? motion.impactWindows.map(([a, b]) => [a / fps, (b + 1) / fps]) : [[start, end]];
      specs[name] = { ...base, duration, start, end, windows };
    }
    return specs;
  }

  class FighterSimulation {
    constructor(options = {}) {
      this.random = options.random || Math.random;
      this.logoCount = options.logoCount || (root.ZYG_SHITCOINS || []).length || 1;
      this.specs = motionSpecs(options.manifest);
      this.best = options.best || 0;
      this.events = [];
      this.phase = 'menu';
      this.reset();
    }
    reset() {
      Object.assign(this, { elapsed: 0, score: 0, lives: 3, combo: 0, difficulty: 1, portfolio: [],
        direction: 1, attack: null, recovery: 0, breakCharge: 0, breakCooldown: 0, queued: null,
        nextWave: 1.1, nextId: 1, waveId: 0, objects: [], damagedWaves: new Set(), events: [] });
    }
    get breakReady() { return this.breakCharge >= 100; }
    get multiplier() { return Math.min(3, 1 + Math.floor(this.combo / 10) * .25); }
    get comboTier() { return this.combo >= 50 ? 3 : this.combo >= 25 ? 2 : this.combo >= 10 ? 1 : 0; }
    get comboTitle() { return ['', 'НЕ ПОКУПАЮ', 'НЕ ПОДДАЛСЯ НА SHILL', 'ПОРТФЕЛЬ ЧИСТ'][this.comboTier]; }
    start() { this.reset(); this.phase = 'playing'; this.emit('start'); }
    emit(kind, data = {}) { this.events.push({ kind, ...data }); }
    setPaused(paused) {
      if (paused && this.phase === 'playing') this.phase = 'paused';
      else if (!paused && this.phase === 'paused') this.phase = 'playing';
    }
    action(move, side, queue = true) {
      move = move === 'palms' ? 'palm' : move;
      if (this.phase !== 'playing' || !this.specs[move]) return false;
      if (move === 'break' && !this.breakReady) {
        this.emit('unavailable', { text: 'БРЕЙК · ' + Math.floor(this.breakCharge) + '% · ЗАРЯЖАЙ УДАРАМИ', textKey: 'dynamic.breakUnavailable', textParams: { charge: Math.floor(this.breakCharge) } }); return false;
      }
      if (this.attack || this.recovery > 0) {
        if (queue && !this.attack && this.recovery <= RECOVERY_SECONDS) this.queued = { move, side };
        return false;
      }
      side = side < 0 ? -1 : 1;
      if (move !== 'break') this.direction = side;
      this.attack = { move, side, t: 0, hitIds: new Set(), clangIds: new Set(), hadHit: false, sounded: false };
      this.queued = null;
      if (move === 'break') this.breakCharge = 0;
      this.emit('attack', { move, side });
      return true;
    }
    flowSpeed() { return 200 + 280 * (1 - Math.exp(-this.elapsed / 45)); }
    emissionInterval() {
      const longestNormal = Math.max(this.specs.punch.duration, this.specs.kick.duration, this.specs.palm.duration);
      return Math.max(.85, longestNormal + RECOVERY_SECONDS + .03, 1.45 - this.elapsed * .014);
    }
    spawn({ side = -1, type = 'light', distance = 642, speed = 180, wave, variant, flow = false } = {}) {
      const item = { id: this.nextId++, side: side < 0 ? -1 : 1, type,
        distance, previousDistance: distance, speed, flow,
        wave: wave === undefined ? ++this.waveId : wave,
        variant: variant === undefined ? Math.floor(this.random() * this.logoCount) : variant,
        diameter: type === 'heavy' ? 78 + this.random() * 18 : 44 + this.random() * 16,
        // Positive canvas rotation is clockwise, on both sides of the fighter.
        angle: this.random() * Math.PI * 2, spin: .65 + this.random() * 1.35,
        bob: this.random() * Math.PI * 2, clang: 0 };
      this.objects.push(item); return item;
    }
    spawnWave() {
      const side = this.random() < .5 ? -1 : 1;
      const type = this.random() < (.29 + Math.min(.19, this.elapsed / 350)) ? 'heavy' : 'light';
      const speed = this.flowSpeed();
      const wave = ++this.waveId;
      this.spawn({ side, type, distance: 642, speed, wave, flow: true });
      this.emit('wave', { side, type, count: 1 });
      // One emission is one independently chosen item. Shared flow velocity keeps
      // the growing stream separated even while the whole stream accelerates.
      this.nextWave += this.emissionInterval();
    }
    update(dt) {
      if (this.phase !== 'playing' || dt <= 0) return;
      dt = Math.min(dt, .05);
      this.elapsed += dt;
      this.difficulty = 1 + Math.floor(this.elapsed / 20);
      this.nextWave -= dt;
      if (this.nextWave <= 0) this.spawnWave();
      const flowSpeed = this.flowSpeed();
      for (const object of this.objects) {
        object.previousDistance = object.distance;
        if (object.flow) object.speed = flowSpeed;
        object.distance -= object.speed * dt;
        object.angle += object.spin * dt;
        object.clang = Math.max(0, object.clang - dt);
      }
      if (this.attack) {
        const a = this.attack, spec = this.specs[a.move], previousTime = a.t;
        a.t += dt;
        const active = spec.windows.some(([start, end]) => a.t >= start && previousTime < end);
        if (active && !a.sounded) { a.sounded = true; this.emit('swing', { move: a.move, side: a.side }); }
        if (active) {
          for (const object of this.objects) {
            if (object.dead || a.hitIds.has(object.id) || (a.move !== 'break' && object.side !== a.side)) continue;
            if (object.distance > spec.reach || object.previousDistance < 72) continue;
            if (spec.type !== 'all' && spec.type !== object.type) {
              if (!a.clangIds.has(object.id)) {
                a.clangIds.add(object.id); object.clang = .2;
                this.emit('clang', { object: { ...object }, text: object.type === 'heavy' ? 'КРУПНЫЙ — НОГОЙ!' : 'МЕЛКИЙ — РУКАМИ!', textKey: object.type === 'heavy' ? 'dynamic.clangHeavy' : 'dynamic.clangLight' });
              }
              continue;
            }
            a.hitIds.add(object.id); a.hadHit = true; object.dead = true;
            const perfect = Math.abs(object.distance - (object.type === 'heavy' ? 165 : 140)) < 32;
            this.combo++;
            const multiplier = this.multiplier;
            const points = Math.round(((object.type === 'heavy' ? 160 : 100) + (perfect ? 50 : 0)) * (a.move === 'jumpkick' ? 2 : 1) * multiplier);
            this.score += points; this.best = Math.max(this.best, this.score);
            if (a.move !== 'break') this.breakCharge = clamp(this.breakCharge + (perfect ? 16 : 9), 0, 100);
            this.emit('hit', { object: { ...object }, move: a.move, perfect, points, combo: this.combo,
              multiplier, tier: this.comboTier, breakCharge: this.breakCharge });
            if (this.combo === 10 || this.combo === 25 || this.combo === 50) {
              this.emit('comboMilestone', { combo: this.combo, tier: this.comboTier, title: this.comboTitle, textKey: 'combo.' + this.comboTier, multiplier });
            }
          }
        }
        if (a.t >= spec.duration) {
          if (!a.hadHit) this.emit('whiff', { move: a.move });
          this.recovery = Math.max(0, RECOVERY_SECONDS - (a.t - spec.duration));
          this.attack = null;
        }
      } else if (this.recovery > 0) {
        this.recovery = Math.max(0, this.recovery - dt);
        if (this.recovery === 0 && this.queued) {
          const queued = this.queued; this.queued = null;
          this.action(queued.move, queued.side, false);
        }
      }
      for (const object of this.objects) {
        if (object.dead || object.distance > 69) continue;
        object.dead = true;
        if (!this.damagedWaves.has(object.wave)) {
          this.damagedWaves.add(object.wave); this.lives = Math.max(0, this.lives - 1); this.combo = 0;
          this.portfolio.push({ ...object });
          this.emit('damage', { object: { ...object }, lives: this.lives, portfolio: this.portfolio.map(coin => ({ ...coin })) });
          if (this.lives <= 0) {
            this.phase = 'gameover'; this.attack = null; this.queued = null;
            this.emit('gameover', { score: this.score, best: this.best, portfolio: this.portfolio.map(coin => ({ ...coin })) });
            break;
          }
        }
      }
      this.objects = this.objects.filter(o => !o.dead);
      if (this.damagedWaves.size > 80) {
        const active = new Set(this.objects.map(o => o.wave));
        this.damagedWaves = new Set([...this.damagedWaves].filter(id => active.has(id)));
      }
    }
    snapshot() {
      return { phase: this.phase, score: this.score, best: this.best, lives: this.lives,
        elapsed: this.elapsed, difficulty: this.difficulty, direction: this.direction,
        recovery: this.recovery, breakCooldown: this.breakCooldown, breakCharge: this.breakCharge, breakReady: this.breakReady,
        combo: this.combo, multiplier: this.multiplier, comboTier: this.comboTier, comboTitle: this.comboTitle,
        portfolio: this.portfolio.map(coin => ({ ...coin })),
        attack: this.attack && { move: this.attack.move, side: this.attack.side, t: this.attack.t, duration: this.specs[this.attack.move].duration },
        objects: this.objects.map(({ id, side, type, distance, speed, wave, variant, diameter, angle, spin }) => ({ id, side, type, distance, speed, wave, variant, diameter, angle, spin })) };
    }
  }

  const exported = { FighterSimulation, motionSpecs, MOVE_DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id);
  const canvas = $('arena');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = W; canvas.height = H;
  const manifest = root.ZYG_FIGHTER_ASSETS || {};
  let savedBest = 0, muted = false;
  try { savedBest = Number(localStorage.getItem('zyg-junkfu-best')) || 0; muted = localStorage.getItem('zyg-junkfu-muted') === '1'; } catch (_) {}
  const sim = new FighterSimulation({ manifest, best: savedBest });
  sim.phase = 'loading';
  const coinManifest = root.ZYG_SHITCOINS || [];
  const coinImages = [], atlases = [], particles = [], floaters = [], reflected = [], impacts = [], captures = [];
  let background = null, renderFrames = 0, shake = 0, damageFlash = 0, inputPulse = 0;
  let last = 0, accumulator = 0, visualTime = 0, audioContext = null, sfxGain = null;
  let statusMessage = null, calloutMessage = null, comboBannerMessage = null;
  let statusUntil = 0, loadingDone = 0, spriteError = false, logoError = false;
  let hitStop = 0, calloutUntil = 0, comboBannerUntil = 0, breakFlash = 0, hitStopCount = 0;
  const tierColors = ['#95ffda', '#e4f58b', '#7ce8ef', '#e8a2ff'];
  const music = new root.ZYGMusicLoop('assets/music-loop.wav?v=de1885295dd090fd');
  music.volume = .42; music.muted = muted;
  const soundFiles = root.ZYG_SOUNDS || {};
  const soundPool = {};
  for (const [name, src] of Object.entries(soundFiles)) {
    const a = new Audio(src); a.preload = 'auto'; a.volume = name === 'junk' ? .20 : .48;
    soundPool[name] = a;
  }
  function playFile(name, volume = 1) {
    if (muted || !soundPool[name]) return false;
    const sound = soundPool[name].cloneNode(); sound.volume = soundPool[name].volume * volume;
    sound.play().catch(() => {}); return true;
  }
  function unlockAudio() {
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!audioContext && AC) {
      try { audioContext = new AC(); sfxGain = audioContext.createGain(); sfxGain.gain.value = muted ? 0 : .48; sfxGain.connect(audioContext.destination); } catch (_) {}
    }
    if (audioContext && audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    if (!muted) music.play(audioContext).catch(() => {});
  }
  function tone(freq, endFreq, duration, volume, type = 'sine', delay = 0) {
    if (!audioContext || muted) return;
    const t = audioContext.currentTime + delay;
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(Math.max(12, endFreq), t + duration);
    gain.gain.setValueAtTime(Math.max(.0001, volume), t); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(gain); gain.connect(sfxGain); osc.start(t); osc.stop(t + duration + .015);
  }
  function noise(duration, volume, cutoff = 1500, delay = 0) {
    if (!audioContext || muted) return;
    const length = Math.floor(audioContext.sampleRate * duration), buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 1.5);
    const source = audioContext.createBufferSource(), filter = audioContext.createBiquadFilter(), gain = audioContext.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = cutoff; gain.gain.value = volume;
    source.connect(filter); filter.connect(gain); gain.connect(sfxGain); source.start(audioContext.currentTime + delay);
  }
  function sound(kind, move) {
    if (muted) return;
    if (playFile(kind === 'hit' ? (move === 'kick' || move === 'jumpkick' ? 'kick' : 'punch') : kind)) return;
    if (kind === 'swing') { noise(.12, .24, move === 'break' ? 1100 : 2400); tone(300, 90, .1, .05); }
    else if (kind === 'hit') {
      const leg = move === 'kick' || move === 'jumpkick';
      tone(leg ? 98 : 175, leg ? 24 : 38, leg ? .27 : .14, leg ? .78 : .5, 'triangle');
      noise(leg ? .19 : .10, leg ? .56 : .37, leg ? 1800 : 3400);
      tone(leg ? 58 : 850, leg ? 27 : 260, leg ? .23 : .045, leg ? .32 : .08, leg ? 'sine' : 'square');
    }
    else if (kind === 'clang') { tone(760, 480, .28, .16, 'square'); tone(1130, 690, .2, .09, 'triangle'); }
    else if (kind === 'damage') { noise(.30, .50, 1300); tone(160, 30, .38, .5, 'sawtooth'); }
    else if (kind === 'wave') { tone(390, 520, .07, .05, 'sine'); noise(.1, .055, 4000); }
    else if (kind === 'gameover') { [180, 145, 95].forEach((f, i) => tone(f, f * .75, .35, .22, 'triangle', i * .13)); }
    else if (kind === 'super') { tone(65, 24, .65, .55, 'triangle'); noise(.48, .44, 1800); [220, 330, 440].forEach((f, i) => tone(f, f * 1.2, .22, .13, 'sine', i * .055)); }
  }
  function comboAccent(tier) {
    const base = [0, 330, 392, 440][tier] || 330;
    [1, 1.25, 1.5, 2].slice(0, tier + 1).forEach((ratio, i) => tone(base * ratio, base * ratio, .18, .12, 'triangle', i * .065));
  }
  function coinSound(object) {
    if (object.type === 'heavy') {
      if (object.variant === 2) { noise(.16, .2, 650, .025); tone(65, 28, .26, .25, 'sine', .025); }
      else { [330, 527, 910].forEach((f, i) => tone(f, f * .82, .29 - i * .045, .12 / (i + 1), 'triangle', .02 + i * .013)); noise(.11, .13, 3200, .025); }
    } else if (object.variant === 1) {
      // Glass has a short high clink, followed by two quieter fragments.
      [1860, 2840, 3720].forEach((f, i) => tone(f, f * .98, .19, .13 / (i + 1), 'sine', .015 + i * .027));
    } else if (object.variant === 0) {
      [790, 1117, 603].forEach((f, i) => tone(f, f * .85, .13, .10, 'triangle', .02 + i * .034));
    } else { noise(.09, .14, object.variant === 2 ? 2500 : 1200, .025); tone(430, 190, .08, .09, 'triangle', .02); }
  }
  // Keep semantic messages so an active callout or status changes language in place.
  // Russian fallback also lets the standalone engine/browser QA run without i18n.js.
  const fallbackText = {
    'moves.punch': 'УДАР РУКОЙ', 'moves.kick': 'УДАР НОГОЙ', 'moves.palm': 'ДВОЙНАЯ ЛАДОНЬ',
    'moves.jumpkick': 'УДАР В ПРЫЖКЕ', 'moves.break': 'БРЕЙК · ЗАЧИСТКА',
    'combo.1': 'НЕ ПОКУПАЮ', 'combo.2': 'НЕ ПОДДАЛСЯ НА SHILL', 'combo.3': 'ПОРТФЕЛЬ ЧИСТ',
    'dynamic.breakUnavailable': 'БРЕЙК · {charge}% · ЗАРЯЖАЙ УДАРАМИ',
    'dynamic.intro': 'Мелкие — руками. Красные — ногами. Не покупай.', 'dynamic.keepCombo': 'ДЕРЖИ СЕРИЮ',
    'dynamic.portfolioAria': 'Портфель: {count} из 3. Третья монета завершает раунд.',
    'dynamic.portfolioCount': '{count} / 3', 'dynamic.slotFilled': 'Слот {slot}: {name}', 'dynamic.slotEmpty': 'Слот {slot}: пусто',
    'dynamic.breakReady': 'ГОТОВ', 'dynamic.breakPercent': '{charge}%', 'dynamic.recovery': 'БОЕВАЯ СТОЙКА · {seconds} С',
    'dynamic.neutral': 'НЕЙТРАЛЬ · ГОТОВ К УДАРУ', 'dynamic.queued': 'ПРИЁМ В ОЧЕРЕДИ', 'dynamic.idle': 'ЛОВИ МОМЕНТ. ДЕРЖИ ЦЕНТР.',
    'dynamic.unmute': 'Включить звук (M)', 'dynamic.mute': 'Выключить звук (M)', 'dynamic.resumeAria': 'Продолжить (Esc)', 'dynamic.pauseAria': 'Пауза (Esc)',
    'dynamic.loadingTitle': 'СОБИРАЕМ БОЙЦА', 'dynamic.loadingCopy': 'Готовим спрайты и ставим музыку на повтор.',
    'dynamic.pausedTitle': 'Перекур.', 'dynamic.pausedCopy': 'Enter или Esc — продолжить.',
    'dynamic.gameoverTitle': 'Ты стал exit liquidity',
    'dynamic.bagholder': 'Теперь ты бегхолдер.', 'dynamic.retryQuestion': 'Пробуем без покупок?',
    'dynamic.gameoverScore': 'Очки: {score}', 'dynamic.gameoverScoreLabel': 'ТВОИ ОЧКИ',
    'dynamic.gameoverPortfolioAria': 'Купленные Shitcoins: {count} из 3.',
    'dynamic.menuTitle': 'Zygote vs Shitcoins', 'dynamic.menuCopy': 'Отбивай монеты. Береги портфель.', 'dynamic.assetError': 'Часть изображений не загрузилась. Обнови страницу.',
    'dynamic.breakClean': 'ПОРТФЕЛЬ ЧИСТ', 'dynamic.breakNoBuy': 'БРЕЙК · НИ ОДНОЙ ПОКУПКИ',
    'dynamic.perfect': 'NO FOMO', 'dynamic.deflected': 'ОТБИТО', 'dynamic.perfectCharge': 'ТОЧНЫЙ УДАР · +16% К БРЕЙКУ', 'dynamic.deflectedCharge': 'ОТБИТО · +9% К БРЕЙКУ',
    'dynamic.clangHeavy': 'КРУПНЫЙ — НОГОЙ!', 'dynamic.clangLight': 'МЕЛКИЙ — РУКАМИ!', 'dynamic.clang': 'ЛЯЗГ!', 'dynamic.bought': 'ПОКУПКА В ПОРТФЕЛЕ · {count}/3',
    'dynamic.kickHint': 'НОГОЙ', 'dynamic.handsHint': 'РУКАМИ', 'dynamic.loadingSprites': 'СОБИРАЕМ СПРАЙТЫ…', 'dynamic.spriteError': 'СПРАЙТЫ НЕ ЗАГРУЗИЛИСЬ',
    'dynamic.legs': 'НОГИ', 'dynamic.hands': 'РУКИ', 'dynamic.pointsGain': '+{points}', 'dynamic.scoreDigits': '{score}'
  };
  function t(key, params = {}) {
    if (root.ZYG_I18N) return root.ZYG_I18N.t(key, params);
    return (fallbackText[key] || key).replace(/\{(\w+)\}/g, (_, name) => params[name] === undefined ? '{' + name + '}' : String(params[name]));
  }
  const numberFormats = new Map();
  function number(value, options = {}) {
    const language = root.ZYG_I18N && root.ZYG_I18N.language || 'ru';
    const cacheKey = language + JSON.stringify(options);
    if (!numberFormats.has(cacheKey)) numberFormats.set(cacheKey, new Intl.NumberFormat({ ru: 'ru-RU', en: 'en-US', zh: 'zh-CN' }[language] || 'ru-RU', options));
    return numberFormats.get(cacheKey).format(value);
  }
  function message(key, params = {}) { return { key, params }; }
  function translated(descriptor) { return descriptor ? t(descriptor.key, descriptor.params) : ''; }
  function setText(id, value) { const node = $(id); if (node && node.textContent !== String(value)) node.textContent = value; }
  function announce(key, duration = 1.5, params = {}) { statusMessage = message(key, params); statusUntil = visualTime + duration; }
  function save() { try { localStorage.setItem('zyg-junkfu-best', String(sim.best)); savedBest = sim.best; } catch (_) {} }
  function setMute(value) {
    muted = value; music.muted = muted;
    if (sfxGain) sfxGain.gain.value = muted ? 0 : .48;
    try { localStorage.setItem('zyg-junkfu-muted', muted ? '1' : '0'); } catch (_) {}
    if (!muted && sim.phase === 'playing') unlockAudio();
    updateHUD();
  }
  function start() {
    if (sim.phase === 'loading') return;
    unlockAudio(); sim.start(); particles.length = floaters.length = reflected.length = impacts.length = captures.length = 0;
    accumulator = shake = hitStop = breakFlash = calloutUntil = comboBannerUntil = hitStopCount = 0;
    statusMessage = calloutMessage = comboBannerMessage = null;
    announce('dynamic.intro', 4.5); updateHUD();
  }
  function pause(value) {
    sim.setPaused(value); accumulator = 0;
    if (sim.phase === 'paused') music.pause(); else if (sim.phase === 'playing') unlockAudio();
    updateHUD();
  }
  function requestMove(move, side) {
    if (sim.phase !== 'playing') return;
    unlockAudio();
    if (sim.action(move, side)) {
      document.querySelectorAll('[data-move]').forEach(button => {
        if (button.dataset.move === move && Number(button.dataset.side) === side) {
          button.classList.add('is-active'); button.setAttribute('aria-pressed', 'true'); setTimeout(() => { button.classList.remove('is-active'); button.setAttribute('aria-pressed', 'false'); }, 160);
        }
      });
      inputPulse = .25;
    }
  }
  const keys = {
    KeyW: ['jumpkick', -1], KeyA: ['punch', -1], KeyS: ['kick', -1], KeyD: ['palm', -1],
    KeyI: ['jumpkick', 1], KeyJ: ['punch', 1], KeyK: ['kick', 1], KeyL: ['palm', 1], Space: ['break', 0]
  };
  root.addEventListener('keydown', event => {
    if (event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.target && event.target.closest && event.target.closest('button[data-language]') && ['Enter', 'Space'].includes(event.code)) return;
    if (keys[event.code] || ['Enter', 'Escape', 'KeyM'].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    if (event.code === 'KeyM') { setMute(!muted); return; }
    if (event.code === 'Escape') { if (sim.phase === 'playing' || sim.phase === 'paused') pause(sim.phase === 'playing'); return; }
    if (event.code === 'Enter') { if (sim.phase === 'paused') pause(false); else if (sim.phase !== 'playing') start(); return; }
    const entry = keys[event.code];
    if (entry) requestMove(entry[0], entry[1]);
  });
  document.querySelectorAll('[data-move]').forEach(button => {
    button.addEventListener('pointerdown', event => { event.preventDefault(); requestMove(button.dataset.move, Number(button.dataset.side) || 0); });
    // Keyboard activation on a focused button still works; pointer clicks are handled above.
    button.addEventListener('click', event => { if (event.detail === 0) requestMove(button.dataset.move, Number(button.dataset.side) || 0); });
  });
  if ($('start-button')) $('start-button').addEventListener('click', start);
  if ($('restart-button')) $('restart-button').addEventListener('click', start);
  if ($('resume-button')) $('resume-button').addEventListener('click', () => pause(false));
  if ($('pause-button')) $('pause-button').addEventListener('click', () => pause(sim.phase === 'playing'));
  if ($('mute-button')) $('mute-button').addEventListener('click', () => setMute(!muted));
  document.addEventListener('visibilitychange', () => { if (document.hidden && sim.phase === 'playing') pause(true); last = 0; });
  root.addEventListener('blur', () => { if (sim.phase === 'playing') pause(true); });

  function updateGameoverPortfolio() {
    const portfolio = $('gameover-portfolio');
    if (!portfolio) return;
    if (sim.phase !== 'gameover') {
      if (portfolio.childElementCount) portfolio.replaceChildren();
      delete portfolio.dataset.coins;
      delete portfolio.dataset.locale;
      return;
    }
    const coins = sim.portfolio.slice(0, 3);
    const signature = coins.map(coin => coin.id + ':' + coin.variant).join('|');
    if (portfolio.dataset.coins !== signature) {
      const fragment = document.createDocumentFragment();
      for (const coin of coins) {
        const entry = coinManifest[coin.variant];
        const slot = document.createElement('span');
        slot.className = 'gameover-coin'; slot.setAttribute('role', 'listitem');
        slot.dataset.variant = String(coin.variant);
        if (entry) {
          const art = document.createElement('span'); art.className = 'gameover-coin-art';
          const image = document.createElement('img'); image.src = entry.src; image.dataset.variant = String(coin.variant);
          const [x, y, width, height] = entry.bounds || [0, 0, 512, 512];
          const side = Math.max(width, height), source = coinImages[coin.variant];
          // Match the arena's bounds crop, then clip the normalized art to a circle.
          image.style.width = ((source?.naturalWidth || 512) / side * 100) + '%';
          image.style.height = ((source?.naturalHeight || 512) / side * 100) + '%';
          image.style.left = (((side - width) / 2 - x) / side * 100) + '%';
          image.style.top = (((side - height) / 2 - y) / side * 100) + '%';
          art.appendChild(image); slot.appendChild(art);
        }
        fragment.appendChild(slot);
      }
      portfolio.replaceChildren(fragment); portfolio.dataset.coins = signature;
      delete portfolio.dataset.locale;
    }
    const locale = root.ZYG_I18N?.language || 'ru';
    if (portfolio.dataset.locale !== locale) {
      portfolio.setAttribute('aria-label', t('dynamic.gameoverPortfolioAria', { count: coins.length }));
      portfolio.querySelectorAll('.gameover-coin').forEach((slot, index) => {
        const entry = coinManifest[coins[index].variant], image = slot.querySelector('img');
        const label = t(entry ? 'dynamic.slotFilled' : 'dynamic.slotEmpty', { slot: index + 1, name: entry?.name || '' });
        if (image) image.alt = label;
        else slot.setAttribute('aria-label', label);
      });
      portfolio.dataset.locale = locale;
    }
  }

  function updateHUD() {
    document.body.dataset.phase = sim.phase;
    document.body.dataset.comboTier = String(sim.comboTier);
    const overlay = $('overlay'); if (overlay) overlay.hidden = sim.phase === 'playing';
    const gameoverSummary = $('gameover-summary'); if (gameoverSummary) gameoverSummary.hidden = sim.phase !== 'gameover';
    updateGameoverPortfolio();
    setText('score', t('dynamic.scoreDigits', { score: number(sim.score, { useGrouping: false, minimumIntegerDigits: 5 }) }));
    setText('best', t('dynamic.scoreDigits', { score: number(sim.best, { useGrouping: false, minimumIntegerDigits: 5 }) }));
    setText('combo', number(sim.combo, { useGrouping: false, minimumIntegerDigits: 2 }));
    setText('multiplier', '×' + number(sim.multiplier, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setText('combo-title', t(sim.comboTier ? 'combo.' + sim.comboTier : 'dynamic.keepCombo'));
    setText('level', number(sim.difficulty, { useGrouping: false, minimumIntegerDigits: 2 }));
    const portfolio = $('portfolio');
    if (portfolio) {
      const caption = document.querySelector('.portfolio-caption'); if (caption) caption.textContent = t('dynamic.portfolioCount', { count: sim.portfolio.length });
      portfolio.setAttribute('aria-label', t('dynamic.portfolioAria', { count: sim.portfolio.length }));
      portfolio.querySelectorAll('.portfolio-slot').forEach((slot, index) => {
        const coin = sim.portfolio[index], entry = coin && coinManifest[coin.variant];
        const capturing = captures.some(c => c.slot === index && c.life > 0);
        slot.classList.toggle('is-filled', !!coin); slot.classList.toggle('is-capturing', capturing);
        const icon = slot.querySelector('svg'); if (icon) icon.style.display = coin ? 'none' : '';
        let img = slot.querySelector('img');
        if (entry) {
          if (!img) { img = document.createElement('img'); slot.appendChild(img); }
          if (img.dataset.variant !== String(coin.variant)) { img.src = entry.src; img.alt = entry.symbol; img.dataset.variant = String(coin.variant); }
          img.style.opacity = capturing ? '0' : '1';
          slot.setAttribute('aria-label', t('dynamic.slotFilled', { slot: index + 1, name: entry.name }));
        } else {
          if (img) img.remove();
          slot.setAttribute('aria-label', t('dynamic.slotEmpty', { slot: index + 1 }));
        }
      });
    }
    setText('break-cooldown', sim.breakReady ? t('dynamic.breakReady') : t('dynamic.breakPercent', { charge: Math.floor(sim.breakCharge) }));
    const chargeFill = $('break-charge-fill'); if (chargeFill) chargeFill.style.width = sim.breakCharge + '%';
    const fill = $('recovery-fill');
    if (fill) fill.style.width = sim.attack ? '100%' : (sim.recovery / RECOVERY_SECONDS * 100) + '%';
    const attack = sim.attack, note = attack ? t('moves.' + attack.move) : sim.recovery > 0 ? t('dynamic.recovery', { seconds: number(sim.recovery, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }) : t('dynamic.neutral');
    setText('action-note', note);
    setText('status', visualTime < statusUntil ? translated(statusMessage) : t(sim.phase === 'loading' ? 'dynamic.loadingSprites' : sim.queued ? 'dynamic.queued' : 'dynamic.idle'));
    const muteButton = $('mute-button');
    if (muteButton) { muteButton.setAttribute('aria-pressed', String(muted)); muteButton.setAttribute('aria-label', t(muted ? 'dynamic.unmute' : 'dynamic.mute')); muteButton.dataset.muted = String(muted); }
    const pauseButton = $('pause-button'); if (pauseButton) { pauseButton.disabled = !['playing', 'paused'].includes(sim.phase); pauseButton.setAttribute('aria-label', t(sim.phase === 'paused' ? 'dynamic.resumeAria' : 'dynamic.pauseAria')); }
    const startButton = $('start-button'); if (startButton) startButton.disabled = sim.phase === 'loading';
    document.querySelectorAll('[data-move="break"]').forEach(b => {
      b.dataset.ready = String(sim.breakReady); b.style.setProperty('--charge', sim.breakCharge + '%');
      b.disabled = !sim.breakReady || sim.phase !== 'playing'; b.setAttribute('aria-disabled', String(b.disabled));
    });
    setText('combat-callout', translated(calloutMessage));
    setText('combo-banner-title', translated(comboBannerMessage));
    const callout = $('combat-callout'); if (callout) callout.classList.toggle('is-visible', visualTime < calloutUntil && ['playing', 'paused'].includes(sim.phase));
    const banner = $('combo-banner'); if (banner) banner.classList.toggle('is-visible', visualTime < comboBannerUntil && ['playing', 'paused'].includes(sim.phase));
    if (sim.phase === 'loading') { setText('overlay-title', t('dynamic.loadingTitle')); setText('overlay-copy', t('dynamic.loadingCopy')); }
    else if (sim.phase === 'paused') { setText('overlay-title', t('dynamic.pausedTitle')); setText('overlay-copy', t('dynamic.pausedCopy')); }
    else if (sim.phase === 'gameover') {
      setText('overlay-title', t('dynamic.gameoverTitle')); setText('overlay-copy', '');
      setText('gameover-bagholder', t('dynamic.bagholder'));
      setText('gameover-score', number(sim.score));
      setText('gameover-question', t('dynamic.retryQuestion'));
      const scoreCard = $('gameover-score-card');
      if (scoreCard) scoreCard.setAttribute('aria-label', t('dynamic.gameoverScore', { score: number(sim.score) }));
    }
    else if (sim.phase === 'menu') { setText('overlay-title', t('dynamic.menuTitle')); setText('overlay-copy', t(spriteError || logoError ? 'dynamic.assetError' : 'dynamic.menuCopy')); }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Image failed: ' + src)); img.src = src;
    });
  }
  const usedAtlasIds = new Set();
  for (const motion of Object.values(manifest.motions || {})) for (const frameId of motion.frames || []) {
    const frame = (manifest.frames || [])[frameId]; if (frame) usedAtlasIds.add(frame.atlas);
  }
  const assetEntries = [
    ...[...usedAtlasIds].map(id => ({ id, src: manifest.atlases[id].src, atlas: true })),
    ...coinManifest.map((coin, id) => ({ id, src: coin.src, atlas: false }))
  ];
  const ready = Promise.all(assetEntries.map(async entry => {
    try { (entry.atlas ? atlases : coinImages)[entry.id] = await loadImage(entry.src); }
    catch (_) { if (entry.atlas) spriteError = true; else logoError = true; }
    loadingDone++; const progress = $('load-progress'); if (progress) { const percentage = Math.round(loadingDone / Math.max(1, assetEntries.length) * 100); const fill = progress.querySelector('span'); if (fill) fill.style.width = percentage + '%'; progress.setAttribute('aria-valuenow', String(percentage)); }
  })).then(() => { sim.phase = 'menu'; updateHUD(); return true; });
  loadImage('assets/arena-bg.webp').then(img => { background = img; }).catch(() => {});

  function spawnParticles(x, y, color, amount, force = 1) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (70 + Math.random() * 240) * force;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 75,
        life: .30 + Math.random() * .4, max: .7, size: 1.8 + Math.random() * 4, color });
    }
  }
  function objectPoint(o) { return { x: CX + o.side * o.distance, y: FEET - 100 + Math.sin(o.bob + sim.elapsed * 4.4) * 8 }; }
  function combatCallout(key, perfect = false, duration = .6) {
    calloutMessage = message(key); setText('combat-callout', translated(calloutMessage)); calloutUntil = visualTime + duration;
    const node = $('combat-callout'); if (node) node.dataset.perfect = String(perfect);
  }
  function showCombo(key, tier) {
    comboBannerMessage = message(key); setText('combo-banner-title', translated(comboBannerMessage)); comboBannerUntil = visualTime + 1.8;
    const node = $('combo-banner'); if (node) node.dataset.tier = String(tier);
  }
  function consumeEvents() {
    for (const e of sim.events.splice(0)) {
      if (e.kind === 'attack' && e.move === 'break') {
        sound('super'); breakFlash = .72;
        impacts.push({ kind: 'break', x: CX, y: FEET - 95, life: .85, max: .85, color: '#d4a0ff', side: 1, power: 1 });
        spawnParticles(CX, FEET - 100, '#d4a0ff', 42, 1.8);
        combatCallout('dynamic.breakClean', true, 1.25);
        announce('dynamic.breakNoBuy', 1.8);
      }
      if (e.kind === 'swing') sound('swing', e.move);
      if (e.kind === 'hit') {
        const point = objectPoint(e.object), leg = e.move === 'kick' || e.move === 'jumpkick';
        const color = e.object.type === 'heavy' ? '#ff657a' : tierColors[e.tier || 0];
        hitStop = Math.max(hitStop, leg || e.move === 'break' ? .06 : .045); hitStopCount++;
        sound('hit', e.move); coinSound(e.object); shake = Math.max(shake, e.move === 'jumpkick' ? 10 : leg ? 7 : 4);
        spawnParticles(point.x, point.y, color, e.perfect ? 27 : 18, leg ? 1.55 : 1);
        impacts.push({ kind: 'hit', ...point, side: e.object.side, power: leg ? 1.4 : 1, color, life: .28, max: .28 });
        reflected.push({ ...e.object, x: point.x, y: point.y, vx: e.object.side * ((leg ? 860 : 560) + Math.random() * 200), vy: -(leg ? 340 : 220) - Math.random() * 110, life: 1.1 });
        floaters.push({ x: point.x, y: point.y - 43, message: message('dynamic.pointsGain', { points: e.points }), color, life: .9 });
        if (e.move !== 'break') combatCallout(e.perfect ? 'dynamic.perfect' : 'dynamic.deflected', e.perfect);
        announce(e.move === 'break' ? 'dynamic.breakClean' : e.perfect ? 'dynamic.perfectCharge' : 'dynamic.deflectedCharge', 1.0);
      }
      if (e.kind === 'comboMilestone') { showCombo(e.textKey || 'combo.' + e.tier, e.tier); comboAccent(e.tier); }
      if (e.kind === 'clang') { const p = objectPoint(e.object); sound('clang'); spawnParticles(p.x, p.y, '#ff755d', 8, .6); announce(e.textKey || (e.object.type === 'heavy' ? 'dynamic.clangHeavy' : 'dynamic.clangLight'), 1.5); floaters.push({ x: p.x, y: p.y - 48, message: message('dynamic.clang'), color: '#ff816a', life: .75 }); }
      if (e.kind === 'damage') {
        sound('damage'); shake = 12; damageFlash = .35; comboBannerUntil = calloutUntil = 0;
        spawnParticles(CX + e.object.side * 50, FEET - 140, '#ff705d', 25);
        const point = objectPoint(e.object);
        captures.push({ ...e.object, fromX: point.x, fromY: point.y, slot: 2 - e.lives, life: .52, max: .52 });
        announce('dynamic.bought', 2, { count: 3 - e.lives });
      }
      if (e.kind === 'wave') sound('wave');
      if (e.kind === 'gameover') { sound('gameover'); save(); music.pause(); }
      if (e.kind === 'unavailable') announce(e.textKey || 'dynamic.breakUnavailable', .9, e.textParams || { charge: Math.floor(sim.breakCharge) });
    }
    if (sim.best > savedBest) save();
  }

  function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function drawBackground(t) {
    if (background) {
      const scale = Math.max(W / background.width, H / background.height), dw = background.width * scale, dh = background.height * scale;
      ctx.drawImage(background, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const wash = ctx.createLinearGradient(0, 0, 0, H); wash.addColorStop(0, '#060f17a0'); wash.addColorStop(.55, '#05101138'); wash.addColorStop(1, '#02090ce8'); ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#091521'); sky.addColorStop(.64, '#19352e'); sky.addColorStop(1, '#08100e'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#cad6b0'; ctx.shadowColor = '#ceecb9'; ctx.shadowBlur = 65; ctx.beginPath(); ctx.arc(1005, 128, 42, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      for (let layer = 0; layer < 3; layer++) {
        ctx.fillStyle = ['#12262a', '#102020', '#071715'][layer];
        for (let i = 0; i < 12; i++) { const x = i * 125 + (layer % 2) * 63, top = 95 + ((i * 71 + layer * 81) % 225); ctx.fillRect(x, top, 16 + layer * 4, 610 - top); ctx.beginPath(); ctx.moveTo(x - 55, top + 150); ctx.lineTo(x + 8, top - 60); ctx.lineTo(x + 85, top + 180); ctx.fill(); }
      }
    }
    // The light band follows the impact plane; the floor stays legible on dark displays.
    const mist = ctx.createLinearGradient(0, 390, 0, 640); mist.addColorStop(0, '#71c7b000'); mist.addColorStop(.48, '#71c7b015'); mist.addColorStop(1, '#71c7b000'); ctx.fillStyle = mist; ctx.fillRect(0, 390, W, 250);
    ctx.fillStyle = '#07110de0'; ctx.beginPath(); ctx.moveTo(0, 595); ctx.bezierCurveTo(280, 567, 400, 626, 650, 601); ctx.bezierCurveTo(930, 579, 1110, 583, 1280, 599); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    for (let i = 0; i < 18; i++) { const x = (i * 79.63 + Math.sin(t * .17 + i) * 35 + W) % W, y = 230 + ((i * 67.2) % 340) + Math.sin(t * .5 + i) * 10; ctx.globalAlpha = .20 + Math.sin(t * 1.2 + i) * .14; ctx.fillStyle = '#b3e8b0'; ctx.beginPath(); ctx.arc(x, y, i % 3 === 0 ? 2 : 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function drawPlatform() {
    ctx.save();
    const glow = ctx.createRadialGradient(CX, FEET + 16, 0, CX, FEET + 16, 260); glow.addColorStop(0, '#b9d58126'); glow.addColorStop(1, '#b9d58100'); ctx.fillStyle = glow; ctx.fillRect(350, 495, 580, 225);
    ctx.fillStyle = '#0009'; ctx.beginPath(); ctx.ellipse(CX, 650, 235, 28, 0, 0, Math.PI * 2); ctx.fill();
    const face = ctx.createLinearGradient(0, 585, 0, 647); face.addColorStop(0, '#536359'); face.addColorStop(.4, '#303c35'); face.addColorStop(1, '#19231f');
    ctx.fillStyle = face; ctx.strokeStyle = '#111b17'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(416, 588); ctx.lineTo(442, 638); ctx.lineTo(610, 659); ctx.lineTo(827, 637); ctx.lineTo(866, 586); ctx.closePath(); ctx.fill(); ctx.stroke();
    const top = ctx.createLinearGradient(0, 559, 0, 608); top.addColorStop(0, '#87917b'); top.addColorStop(1, '#4d5b4c');
    ctx.fillStyle = top; ctx.strokeStyle = '#a6b18a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(416, 588); ctx.lineTo(463, 558); ctx.lineTo(818, 558); ctx.lineTo(866, 587); ctx.lineTo(811, 610); ctx.lineTo(468, 610); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#202e24'; ctx.lineWidth = 2; [[498, 560, 517, 584, 505, 608], [767, 560, 743, 582, 754, 607], [611, 658, 624, 630, 612, 612]].forEach(a => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.lineTo(a[4], a[5]); ctx.stroke(); });
    ctx.strokeStyle = '#b9d59e36'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(CX, FEET + 4, 125, 13, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function drawHitZones(time) {
    if (!['playing', 'paused'].includes(sim.phase)) return;
    const next = sim.objects.reduce((a, b) => !a || b.distance < a.distance ? b : a, null);
    for (const side of [-1, 1]) {
      const incoming = next && next.side === side, color = incoming ? next.type === 'heavy' ? '255,65,88' : '115,242,206' : '154,185,165';
      const reach = incoming && next.type === 'heavy' ? 220 : 180;
      const x = CX + side * reach, opacity = incoming ? .28 + Math.sin(time * 7) * .07 : .10;
      ctx.strokeStyle = `rgba(${color},${opacity})`; ctx.lineWidth = 2;
      ctx.setLineDash([5, 8]); ctx.beginPath(); ctx.moveTo(x, FEET - 240); ctx.lineTo(x, FEET - 32); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${color},${opacity * .13})`; ctx.fillRect(side < 0 ? CX - reach : CX + 80, FEET - 230, reach - 80, 190);
      if (incoming && next.distance < 390 && next.distance > 80) {
        ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(${color},.9)`;
        ctx.fillText(t(next.type === 'heavy' ? 'dynamic.kickHint' : 'dynamic.handsHint'), x, FEET - 254);
      }
    }
  }
  function drawShitcoin(o, x, y, alpha = 1) {
    const heavy = o.type === 'heavy', diameter = o.diameter || (heavy ? 86 : 52);
    const radius = diameter / 2, color = heavy ? '#ff4158' : '#93efce';
    const index = ((o.variant % coinManifest.length) + coinManifest.length) % coinManifest.length;
    const logo = coinImages[index], entry = coinManifest[index];
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
    // A steady red ring and broad halo identify foot targets even for red logos.
    if (heavy) {
      const halo = ctx.createRadialGradient(0, 0, radius * .6, 0, 0, radius + 28);
      halo.addColorStop(0, '#ff20382e'); halo.addColorStop(.58, '#ff20384c'); halo.addColorStop(1, '#ff203800');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, radius + 28, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowColor = o.clang > 0 ? '#ff4158' : color; ctx.shadowBlur = heavy ? 23 : 8;
    ctx.fillStyle = '#10231dec'; ctx.strokeStyle = heavy ? '#ff5367' : '#93efce90'; ctx.lineWidth = heavy ? 2.5 : 1.2;
    ctx.beginPath(); ctx.arc(0, 0, radius + 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    // Clip only the rotating logo; keep the target ring and glow outside it.
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.clip();
    ctx.rotate(o.angle || 0);
    if (logo && entry) {
      const [sx, sy, sw, sh] = entry.bounds;
      const scale = diameter / Math.max(sw, sh), width = sw * scale, height = sh * scale;
      ctx.drawImage(logo, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = color; ctx.font = `800 ${Math.round(diameter * .48)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
    }
    ctx.restore();
    if (alpha > .7 && !o.captured) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, radius + 13, heavy ? 3.6 : 2.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function getMotionFrame() {
    const name = sim.attack ? sim.attack.move : sim.recovery > 0 ? 'stance' : 'idle';
    const motion = manifest.motions && (manifest.motions[name] || (name === 'palm' && manifest.motions.palms) || manifest.motions.idle);
    if (!motion || !motion.frames || !motion.frames.length) return null;
    const clock = sim.attack ? sim.attack.t : sim.recovery > 0 ? RECOVERY_SECONDS - sim.recovery : sim.elapsed || visualTime;
    let index = Math.floor(clock * (motion.fps || 24));
    if (sim.attack) index = Math.min(motion.frames.length - 1, index);
    else if (motion.loop === 'pingpong') { const period = Math.max(1, motion.frames.length * 2 - 2); index %= period; if (index >= motion.frames.length) index = period - index; }
    else index %= motion.frames.length;
    return (manifest.frames || [])[motion.frames[index]];
  }
  function drawCharacter() {
    ctx.save();
    ctx.fillStyle = '#07110b72'; ctx.beginPath(); ctx.ellipse(CX, FEET + 5, 67, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (sim.attack && sim.attack.t >= sim.specs[sim.attack.move].start && sim.attack.t <= sim.specs[sim.attack.move].end) {
      const side = sim.attack.side, both = sim.attack.move === 'break', tier = sim.comboTier;
      const color = both ? '#d4a0ff' : tier > 0 ? tierColors[tier] : sim.specs[sim.attack.move].type === 'light' ? '#a4ffe0' : '#ff5367';
      ctx.globalAlpha = .48; ctx.strokeStyle = color; ctx.lineWidth = both ? 12 : 8 + tier * 3; ctx.shadowColor = color; ctx.shadowBlur = 15 + tier * 7;
      const radius = both ? 235 : sim.specs[sim.attack.move].type === 'light' ? 145 : 180;
      ctx.beginPath(); ctx.ellipse(CX, FEET - (both ? 80 : 110), radius, both ? 50 : 115, -.12 * side, both ? 0 : side > 0 ? -.95 : 2.15, both ? Math.PI * 2 : side > 0 ? .95 : 4.05); ctx.stroke();
      if (tier > 0 || both) {
        ctx.globalAlpha = .22; ctx.lineWidth = 3;
        for (let k = 1; k <= (both ? 3 : tier); k++) { ctx.beginPath(); ctx.ellipse(CX, FEET - (both ? 80 : 110), radius + k * 13, both ? 50 + k * 9 : 115 + k * 8, -.12 * side, both ? 0 : side > 0 ? -.95 : 2.15, both ? Math.PI * 2 : side > 0 ? .95 : 4.05); ctx.stroke(); }
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    const frame = getMotionFrame();
    if (frame && atlases[frame.atlas]) {
      const activeMotion = manifest.motions && manifest.motions[sim.attack ? sim.attack.move : sim.recovery > 0 ? 'stance' : 'idle'];
      const scale = (manifest.displayScale || .88), facing = activeMotion && activeMotion.baseFacing || manifest.baseFacing || manifest.defaultFacing || 1;
      ctx.translate(CX, FEET); ctx.scale(sim.direction * facing, 1);
      ctx.drawImage(atlases[frame.atlas], frame.x, frame.y, frame.w, frame.h,
        -(frame.anchorX === undefined ? frame.w / 2 : frame.anchorX) * scale,
        -(frame.anchorY === undefined ? frame.h * .91 : frame.anchorY) * scale, frame.w * scale, frame.h * scale);
    } else {
      // Only visible while the actual video sprites are loading or missing.
      ctx.fillStyle = '#a1b992'; ctx.textAlign = 'center'; ctx.font = '600 15px system-ui'; ctx.fillText(t(sim.phase === 'loading' ? 'dynamic.loadingSprites' : 'dynamic.spriteError'), CX, FEET - 125);
    }
    ctx.restore();
  }
  function drawTelegraphs() {
    if (sim.phase !== 'playing') return;
    for (const side of [-1, 1]) {
      const upcoming = sim.objects.filter(o => o.side === side).sort((a, b) => a.distance - b.distance)[0];
      if (!upcoming || upcoming.distance < 100) continue;
      const isHeavy = upcoming.type === 'heavy', x = side < 0 ? 64 : W - 64, color = isHeavy ? '#ff5367' : '#9affd9';
      ctx.save(); ctx.globalAlpha = clamp((upcoming.distance - 60) / 120, .3, 1);
      roundRect(x - 43, 322, 86, 64, 10, '#071612c9', color + '66');
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (const shift of [-7, 5]) { ctx.beginPath(); ctx.moveTo(x + shift - side * 4, 334); ctx.lineTo(x + shift + side * 3, 341); ctx.lineTo(x + shift - side * 4, 348); ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.font = '700 13px "Russo One",sans-serif'; ctx.fillText(t(isHeavy ? 'dynamic.legs' : 'dynamic.hands'), x, 373); ctx.restore();
    }
  }
  function drawImpacts(dt) {
    for (let i = impacts.length - 1; i >= 0; i--) {
      const impact = impacts[i], progress = 1 - impact.life / impact.max;
      ctx.save(); ctx.translate(impact.x, impact.y); ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = impact.color; ctx.shadowColor = impact.color; ctx.shadowBlur = 18;
      if (impact.kind === 'break') {
        for (let ring = 0; ring < 3; ring++) {
          const r = 35 + progress * (340 + ring * 32);
          ctx.strokeStyle = ['#94ffdb', '#ffd77c', '#d4a0ff'][ring]; ctx.lineWidth = (1 - progress) * 12 + 2;
          ctx.beginPath(); ctx.ellipse(0, 0, r, r * .42, ring * .12, ring * .8, Math.PI * 2 - .22 + ring * .8); ctx.stroke();
        }
      } else {
        ctx.rotate(impact.side < 0 ? Math.PI : 0);
        const reach = (26 + progress * 115) * impact.power;
        ctx.fillStyle = '#f6fff0'; ctx.beginPath();
        ctx.moveTo(-14, 0); ctx.lineTo(4, -10 * (1 - progress)); ctx.lineTo(reach, 0); ctx.lineTo(4, 10 * (1 - progress)); ctx.closePath(); ctx.fill();
        ctx.lineWidth = (1 - progress) * 5 + 1;
        ctx.beginPath(); ctx.arc(0, 0, 12 + progress * 64 * impact.power, -.95, .95); ctx.stroke();
        for (const sign of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, sign * 8); ctx.lineTo(reach * .65, sign * (14 + progress * 30)); ctx.stroke(); }
        if (progress < .22) { ctx.fillStyle = '#fffef1'; ctx.beginPath(); ctx.arc(0, 0, 12 * (1 - progress / .22), 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore(); impact.life -= dt;
      if (impact.life <= 0) impacts.splice(i, 1);
    }
  }
  function drawCaptures(dt) {
    const rect = canvas.getBoundingClientRect(), scale = Math.min(rect.width / W, rect.height / H);
    if (!scale) return;
    for (let i = captures.length - 1; i >= 0; i--) {
      const coin = captures[i], slot = document.querySelector(`.portfolio-slot[data-slot="${coin.slot}"]`);
      if (slot) {
        const destination = slot.getBoundingClientRect(), progress = 1 - coin.life / coin.max, ease = 1 - Math.pow(1 - progress, 3);
        const x = (destination.left + destination.width / 2 - rect.left - (rect.width - W * scale) / 2) / scale;
        const y = (destination.top + destination.height / 2 - rect.top - (rect.height - H * scale) / 2) / scale;
        const size = coin.diameter * (1 - ease) + (destination.width / scale * .62) * ease;
        drawShitcoin({ ...coin, captured: true, diameter: size, angle: coin.angle + progress * 5 }, coin.fromX + (x - coin.fromX) * ease, coin.fromY + (y - coin.fromY) * ease - Math.sin(progress * Math.PI) * 95);
      }
      coin.life -= dt; if (coin.life <= 0) captures.splice(i, 1);
    }
  }
  function render(dt) {
    renderFrames++; visualTime += dt; shake = Math.max(0, shake - dt * 30); damageFlash = Math.max(0, damageFlash - dt); inputPulse = Math.max(0, inputPulse - dt); breakFlash = Math.max(0, breakFlash - dt);
    ctx.save(); if (shake > 0 && sim.phase !== 'paused') ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake * .5);
    drawBackground(visualTime); drawPlatform(); drawHitZones(visualTime);
    sim.objects.forEach(o => { const p = objectPoint(o); drawShitcoin(o, p.x, p.y); });
    drawCharacter(); drawImpacts(dt);
    for (let i = reflected.length - 1; i >= 0; i--) { const o = reflected[i]; if (sim.phase !== 'paused') { o.life -= dt; o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 670 * dt; o.angle += o.spin * dt * 6; } drawShitcoin(o, o.x, o.y, clamp(o.life * 2, 0, 1)); if (o.life <= 0) reflected.splice(i, 1); }
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; if (sim.phase !== 'paused') { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 480 * dt; p.vx *= Math.pow(.2, dt); } ctx.globalAlpha = clamp(p.life / .3, 0, 1); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); if (p.life <= 0) particles.splice(i, 1); }
    ctx.globalAlpha = 1;
    for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; if (sim.phase !== 'paused') { f.life -= dt; f.y -= dt * 44; } const text = translated(f.message); ctx.globalAlpha = clamp(f.life * 3, 0, 1); ctx.textAlign = 'center'; ctx.font = '900 27px "Russo One",sans-serif'; ctx.fillStyle = '#04110e'; ctx.fillText(text, f.x + 1, f.y + 2); ctx.fillStyle = f.color; ctx.fillText(text, f.x, f.y); if (f.life <= 0) floaters.splice(i, 1); }
    ctx.globalAlpha = 1; drawTelegraphs();
    const vignette = ctx.createRadialGradient(CX, H * .47, 220, CX, H * .47, 770); vignette.addColorStop(0, '#0000'); vignette.addColorStop(1, '#000b'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    if (damageFlash > 0) { ctx.fillStyle = `rgba(235,65,45,${damageFlash * .28})`; ctx.fillRect(0, 0, W, H); }
    if (breakFlash > 0) { ctx.fillStyle = `rgba(184,115,255,${breakFlash * .10})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
    drawCaptures(dt);
  }
  function tick(timestamp) {
    const delta = last ? Math.min((timestamp - last) / 1000, .05) : 0; last = timestamp;
    const frozen = sim.phase === 'playing' ? Math.min(hitStop, delta) : 0;
    hitStop = Math.max(0, hitStop - frozen);
    const stepDelta = delta - frozen;
    if (sim.phase === 'playing') {
      accumulator += stepDelta;
      while (accumulator >= 1 / 120) {
        sim.update(1 / 120); accumulator -= 1 / 120; consumeEvents();
        if (sim.phase !== 'playing' || hitStop > 0) { accumulator = 0; break; }
      }
    }
    else accumulator = 0;
    consumeEvents(); render(sim.phase === 'paused' || hitStop > 0 ? 0 : stepDelta); updateHUD(); root.requestAnimationFrame(tick);
  }
  root.addEventListener('zygote:languagechange', () => { updateHUD(); render(0); });
  root.ZYG_FIGHTER = { ready, get state() { return { ...sim.snapshot(), language: root.ZYG_I18N && root.ZYG_I18N.language || 'ru', renderFrames, assetsLoaded: loadingDone, logosLoaded: coinImages.filter(Boolean).length, spriteError, logoError, muted, hitStop, hitStopCount, impactCount: impacts.length, reflectedCount: reflected.length }; } };
  // Deterministic browser QA is explicitly opt-in and never present in normal play.
  if (new URLSearchParams(root.location.search).get('test') === '1') {
    root.ZYG_FIGHTER.test = {
      start, spawn: data => sim.spawn(data), clear: () => { sim.objects.length = 0; sim.nextWave = 999; },
      advance: seconds => { for (let t = 0; t < seconds; t += 1 / 120) sim.update(Math.min(1 / 120, seconds - t)); consumeEvents(); updateHUD(); },
      action: (move, side) => sim.action(move, side), pause,
      setElapsed: seconds => { sim.elapsed = seconds; sim.difficulty = 1 + Math.floor(seconds / 20); }
    };
  }
  updateHUD(); root.requestAnimationFrame(tick);
})(typeof window !== 'undefined' ? window : globalThis);
