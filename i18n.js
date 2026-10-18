/* Zygote vs Shitcoins — local, dependency-free interface translations. */
(function (root) {
  'use strict';

  const messages = {
    ru: {
      'meta.description': 'Zygote vs Shitcoins. Отбивай монеты, заряжай брейк и сохраняй портфель чистым. Аркадный кунг-фу на очки.',
      'ui.brandHome': 'Zygote vs Shitcoins, начало',
      'ui.language': 'Язык игры',
      'ui.keepPortfolio': 'ДЕРЖИ ПОРТФЕЛЬ ЧИСТЫМ',
      'ui.pause': 'Пауза', 'ui.pauseLower': 'пауза', 'ui.pauseTitle': 'Пауза · Esc',
      'ui.sound': 'Звук', 'ui.soundLower': 'звук', 'ui.soundTitle': 'Звук · M',
      'ui.playArea': 'Арена — отбивай Shitcoins слева и справа',
      'ui.arena': 'Игровая арена: Zygote на платформе, Shitcoins летят слева и справа',
      'ui.hud': 'Счёт и состояние игры',
      'ui.score': 'ОЧКИ', 'ui.combo': 'СЕРИЯ', 'ui.portfolio': 'ПОРТФЕЛЬ',
      'ui.tempo': 'ТЕМП', 'ui.best': 'РЕКОРД', 'ui.personalBest': 'ТВОЯ ПЛАНКА',
      'ui.eyebrow': 'ZYGOTE / ЗАЩИТА ПОРТФЕЛЯ',
      'ui.smallCoins': 'МЕЛКИЕ МОНЕТЫ', 'ui.largeCoins': 'КРУПНЫЕ МОНЕТЫ',
      'ui.handAttacks': 'Кулак / ладонь', 'ui.kickAttacks': 'Удары ногами',
      'ui.loading': 'Загрузка спрайтов',
      'ui.start': 'В БОЙ', 'ui.resume': 'ПРОДОЛЖИТЬ', 'ui.restart': 'ЕЩЁ РАУНД',
      'ui.touchHint': 'или кнопки внизу', 'ui.fomo': 'НЕ ПОДДАВАЙСЯ FOMO',
      'ui.controls': 'Управление персонажем', 'ui.left': 'ВЛЕВО', 'ui.right': 'ВПРАВО',
      'ui.jumpkick': 'В прыжке', 'ui.punch': 'Кулак', 'ui.kick': 'Нога', 'ui.palm': 'Ладонь',
      'ui.jumpkickLeft': 'Удар ногой в прыжке влево, клавиша W',
      'ui.punchLeft': 'Кулак влево, клавиша A',
      'ui.kickLeft': 'Обычный удар ногой влево, клавиша S',
      'ui.palmLeft': 'Ладонь влево, клавиша D',
      'ui.jumpkickRight': 'Удар ногой в прыжке вправо, клавиша I',
      'ui.punchRight': 'Кулак вправо, клавиша J',
      'ui.kickRight': 'Обычный удар ногой вправо, клавиша K',
      'ui.palmRight': 'Ладонь вправо, клавиша L',
      'ui.breakAria': 'Брейк: круговая зачистка, клавиша Пробел',
      'ui.break': 'БРЕЙК', 'ui.breakHint': 'ЗАЧИСТКА С ОБЕИХ СТОРОН',
      'ui.lightLegend': 'Мелкие — руками', 'ui.heavyLegend': 'Крупные — ногами',
      'ui.footer': 'ТРИ МОНЕТЫ В ПОРТФЕЛЕ — ТЫ EXIT LIQUIDITY.',
      'ui.noscript': 'Для игры нужен JavaScript. Включи его в настройках браузера.',
      'moves.punch': 'УДАР РУКОЙ', 'moves.kick': 'УДАР НОГОЙ',
      'moves.palm': 'ДВОЙНАЯ ЛАДОНЬ', 'moves.jumpkick': 'УДАР В ПРЫЖКЕ',
      'moves.break': 'БРЕЙК · ЗАЧИСТКА',
      'combo.1': 'НЕ ПОКУПАЮ', 'combo.2': 'НЕ ПОДДАЛСЯ НА SHILL', 'combo.3': 'ПОРТФЕЛЬ ЧИСТ',
      'dynamic.breakUnavailable': 'БРЕЙК · {charge}% · ЗАРЯЖАЙ УДАРАМИ',
      'dynamic.intro': 'Мелкие — руками. Красные — ногами. Не покупай.',
      'dynamic.keepCombo': 'ДЕРЖИ СЕРИЮ',
      'dynamic.portfolioAria': 'Портфель: {count} из 3. Третья монета завершает раунд.',
      'dynamic.portfolioCount': '{count} / 3',
      'dynamic.slotFilled': 'Слот {slot}: {name}', 'dynamic.slotEmpty': 'Слот {slot}: пусто',
      'dynamic.breakReady': 'ГОТОВ', 'dynamic.breakPercent': '{charge}%',
      'dynamic.recovery': 'ВОЗВРАТ В НЕЙТРАЛЬ · {seconds} С',
      'dynamic.guard': 'КУНГ-ФУ СТОЙКА · ПОСЛЕДНЯЯ ЖИЗНЬ', 'dynamic.guardExit': 'ВЫХОД ИЗ СТОЙКИ',
      'dynamic.neutral': 'НЕЙТРАЛЬ · ГОТОВ К УДАРУ', 'dynamic.queued': 'ПРИЁМ В ОЧЕРЕДИ',
      'dynamic.idle': 'ЛОВИ МОМЕНТ. ДЕРЖИ ЦЕНТР.',
      'dynamic.unmute': 'Включить звук (M)', 'dynamic.mute': 'Выключить звук (M)',
      'dynamic.resumeAria': 'Продолжить (Esc)', 'dynamic.pauseAria': 'Пауза (Esc)',
      'dynamic.loadingTitle': 'СОБИРАЕМ БОЙЦА',
      'dynamic.loadingCopy': 'Готовим спрайты и ставим музыку на повтор.',
      'dynamic.pausedTitle': 'Перекур.', 'dynamic.pausedCopy': 'Enter или Esc — продолжить.',
      'dynamic.gameoverTitle': 'Ты стал exit liquidity',
      'dynamic.bagholder': 'Теперь ты бегхолдер.',
      'dynamic.retryQuestion': 'Пробуем без покупок?',
      'dynamic.gameoverScore': 'Очки: {score}',
      'dynamic.gameoverScoreLabel': 'ТВОИ ОЧКИ',
      'dynamic.gameoverPortfolioAria': 'Купленные Shitcoins: {count} из 3.',
      'dynamic.menuTitle': 'Zygote vs Shitcoins',
      'dynamic.menuCopy': 'Отбивай монеты. Береги портфель.',
      'dynamic.assetError': 'Часть изображений не загрузилась. Обнови страницу.',
      'dynamic.breakClean': 'ПОРТФЕЛЬ ЧИСТ', 'dynamic.breakNoBuy': 'БРЕЙК · НИ ОДНОЙ ПОКУПКИ',
      'dynamic.perfect': 'NO FOMO', 'dynamic.deflected': 'ОТБИТО',
      'dynamic.perfectCharge': 'ТОЧНЫЙ УДАР · +16% К БРЕЙКУ',
      'dynamic.deflectedCharge': 'ОТБИТО · +9% К БРЕЙКУ',
      'dynamic.clangHeavy': 'КРУПНЫЙ — НОГОЙ!', 'dynamic.clangLight': 'МЕЛКИЙ — РУКАМИ!',
      'dynamic.clang': 'ЛЯЗГ!', 'dynamic.bought': 'ПОКУПКА В ПОРТФЕЛЕ · {count}/3',
      'dynamic.purchaseFirst': 'Поверил в технологии',
      'dynamic.purchaseSecondA': 'Точно взлетит!',
      'dynamic.purchaseSecondB': 'Это инвестиция в долгую',
      'dynamic.purchased': 'КУПЛЕНО', 'dynamic.stopLoss': 'Сработал stop loss',
      'dynamic.kickHint': 'НОГОЙ', 'dynamic.handsHint': 'РУКАМИ',
      'dynamic.loadingSprites': 'СОБИРАЕМ СПРАЙТЫ…', 'dynamic.spriteError': 'СПРАЙТЫ НЕ ЗАГРУЗИЛИСЬ',
      'dynamic.legs': 'НОГИ', 'dynamic.hands': 'РУКИ',
      'dynamic.pointsGain': '+{points}', 'dynamic.scoreDigits': '{score}'
    },
    en: {
      'meta.description': 'Zygote vs Shitcoins. Deflect coins, charge your Break and keep your portfolio clean. A kung-fu score attack arcade game.',
      'ui.brandHome': 'Zygote vs Shitcoins, home',
      'ui.language': 'Game language',
      'ui.keepPortfolio': 'KEEP YOUR PORTFOLIO CLEAN',
      'ui.pause': 'Pause', 'ui.pauseLower': 'pause', 'ui.pauseTitle': 'Pause · Esc',
      'ui.sound': 'Sound', 'ui.soundLower': 'sound', 'ui.soundTitle': 'Sound · M',
      'ui.playArea': 'Arena — deflect Shitcoins from the left and right',
      'ui.arena': 'Game arena: Zygote stands on a platform as Shitcoins fly in from both sides',
      'ui.hud': 'Score and game status',
      'ui.score': 'SCORE', 'ui.combo': 'COMBO', 'ui.portfolio': 'PORTFOLIO',
      'ui.tempo': 'TEMPO', 'ui.best': 'BEST', 'ui.personalBest': 'YOUR HIGH SCORE',
      'ui.eyebrow': 'ZYGOTE / PORTFOLIO DEFENCE',
      'ui.smallCoins': 'SMALL COINS', 'ui.largeCoins': 'LARGE COINS',
      'ui.handAttacks': 'Punch / palm', 'ui.kickAttacks': 'Kick attacks',
      'ui.loading': 'Loading sprites',
      'ui.start': 'FIGHT', 'ui.resume': 'RESUME', 'ui.restart': 'ANOTHER ROUND',
      'ui.touchHint': 'or use the buttons below', 'ui.fomo': 'DON’T GIVE IN TO FOMO',
      'ui.controls': 'Character controls', 'ui.left': 'LEFT', 'ui.right': 'RIGHT',
      'ui.jumpkick': 'Jump kick', 'ui.punch': 'Punch', 'ui.kick': 'Kick', 'ui.palm': 'Palm',
      'ui.jumpkickLeft': 'Jump kick left, W key', 'ui.punchLeft': 'Punch left, A key',
      'ui.kickLeft': 'Kick left, S key', 'ui.palmLeft': 'Palm strike left, D key',
      'ui.jumpkickRight': 'Jump kick right, I key', 'ui.punchRight': 'Punch right, J key',
      'ui.kickRight': 'Kick right, K key', 'ui.palmRight': 'Palm strike right, L key',
      'ui.breakAria': 'Break: clear both sides, Space key',
      'ui.break': 'BREAK', 'ui.breakHint': 'CLEAR BOTH SIDES',
      'ui.lightLegend': 'Small coins — hands', 'ui.heavyLegend': 'Large coins — kicks',
      'ui.footer': 'THREE COINS IN YOUR PORTFOLIO. YOU’RE EXIT LIQUIDITY.',
      'ui.noscript': 'This game needs JavaScript. Enable it in your browser settings.',
      'moves.punch': 'PUNCH', 'moves.kick': 'KICK', 'moves.palm': 'DOUBLE PALM',
      'moves.jumpkick': 'JUMP KICK', 'moves.break': 'BREAK · CLEAR THE ARENA',
      'combo.1': 'NOT BUYING', 'combo.2': 'RESISTED THE SHILL', 'combo.3': 'PORTFOLIO CLEAN',
      'dynamic.breakUnavailable': 'BREAK · {charge}% · CHARGE WITH HITS',
      'dynamic.intro': 'Small coins: hands. Red coins: kicks. Don’t buy.',
      'dynamic.keepCombo': 'KEEP THE COMBO',
      'dynamic.portfolioAria': 'Portfolio: {count} of 3. The third coin ends the round.',
      'dynamic.portfolioCount': '{count} / 3',
      'dynamic.slotFilled': 'Slot {slot}: {name}', 'dynamic.slotEmpty': 'Slot {slot}: empty',
      'dynamic.breakReady': 'READY', 'dynamic.breakPercent': '{charge}%',
      'dynamic.recovery': 'RETURNING TO NEUTRAL · {seconds} S',
      'dynamic.guard': 'KUNG FU GUARD · LAST LIFE', 'dynamic.guardExit': 'LEAVING GUARD',
      'dynamic.neutral': 'READY TO STRIKE', 'dynamic.queued': 'ATTACK QUEUED',
      'dynamic.idle': 'TIME YOUR HITS. HOLD THE CENTRE.',
      'dynamic.unmute': 'Turn sound on (M)', 'dynamic.mute': 'Turn sound off (M)',
      'dynamic.resumeAria': 'Resume (Esc)', 'dynamic.pauseAria': 'Pause (Esc)',
      'dynamic.loadingTitle': 'GEARING UP',
      'dynamic.loadingCopy': 'Preparing sprites and putting the music on repeat.',
      'dynamic.pausedTitle': 'Take a breather.', 'dynamic.pausedCopy': 'Enter or Esc to resume.',
      'dynamic.gameoverTitle': 'You’re exit liquidity',
      'dynamic.bagholder': 'You’re a bagholder now.',
      'dynamic.retryQuestion': 'Try a no-buy run?',
      'dynamic.gameoverScore': 'Score: {score}',
      'dynamic.gameoverScoreLabel': 'YOUR SCORE',
      'dynamic.gameoverPortfolioAria': 'Collected Shitcoins: {count} of 3.',
      'dynamic.menuTitle': 'Zygote vs Shitcoins',
      'dynamic.menuCopy': 'Deflect the coins. Protect your portfolio.',
      'dynamic.assetError': 'Some images didn’t load. Refresh the page.',
      'dynamic.breakClean': 'PORTFOLIO CLEAN', 'dynamic.breakNoBuy': 'BREAK · ZERO BUYS',
      'dynamic.perfect': 'NO FOMO', 'dynamic.deflected': 'DEFLECTED',
      'dynamic.perfectCharge': 'PERFECT HIT · +16% BREAK',
      'dynamic.deflectedCharge': 'DEFLECTED · +9% BREAK',
      'dynamic.clangHeavy': 'LARGE COIN — KICK!', 'dynamic.clangLight': 'SMALL COIN — HANDS!',
      'dynamic.clang': 'CLANG!', 'dynamic.bought': 'ADDED TO PORTFOLIO · {count}/3',
      'dynamic.purchaseFirst': 'Believed in the tech',
      'dynamic.purchaseSecondA': 'It’ll definitely moon!',
      'dynamic.purchaseSecondB': 'It’s a long-term investment',
      'dynamic.purchased': 'BOUGHT', 'dynamic.stopLoss': 'Stop loss triggered',
      'dynamic.kickHint': 'KICK', 'dynamic.handsHint': 'HANDS',
      'dynamic.loadingSprites': 'LOADING SPRITES…', 'dynamic.spriteError': 'SPRITES DIDN’T LOAD',
      'dynamic.legs': 'KICKS', 'dynamic.hands': 'HANDS',
      'dynamic.pointsGain': '+{points}', 'dynamic.scoreDigits': '{score}'
    },
    zh: {
      'meta.description': 'Zygote vs Shitcoins。击飞垃圾币，蓄满爆发能量，守护你的投资组合。挑战高分的功夫街机游戏。',
      'ui.brandHome': 'Zygote vs Shitcoins，首页',
      'ui.language': '游戏语言',
      'ui.keepPortfolio': '守住持仓，拒绝垃圾币',
      'ui.pause': '暂停', 'ui.pauseLower': '暂停', 'ui.pauseTitle': '暂停 · Esc',
      'ui.sound': '声音', 'ui.soundLower': '声音', 'ui.soundTitle': '声音 · M',
      'ui.playArea': '竞技场：击飞左右两侧的垃圾币',
      'ui.arena': '游戏场景：Zygote 站在平台上，垃圾币从左右两侧飞来',
      'ui.hud': '得分与游戏状态',
      'ui.score': '得分', 'ui.combo': '连击', 'ui.portfolio': '持仓',
      'ui.tempo': '节奏', 'ui.best': '最高分', 'ui.personalBest': '个人纪录',
      'ui.eyebrow': 'ZYGOTE / 持仓保卫战',
      'ui.smallCoins': '小型垃圾币', 'ui.largeCoins': '大型垃圾币',
      'ui.handAttacks': '拳击 / 掌击', 'ui.kickAttacks': '腿部攻击',
      'ui.loading': '正在加载角色动画',
      'ui.start': '开战', 'ui.resume': '继续', 'ui.restart': '再来一局',
      'ui.touchHint': '或点击下方按钮', 'ui.fomo': '别让 FOMO 带偏你',
      'ui.controls': '角色操作', 'ui.left': '向左', 'ui.right': '向右',
      'ui.jumpkick': '飞踢', 'ui.punch': '拳击', 'ui.kick': '踢击', 'ui.palm': '掌击',
      'ui.jumpkickLeft': '向左飞踢，W 键', 'ui.punchLeft': '向左拳击，A 键',
      'ui.kickLeft': '向左踢击，S 键', 'ui.palmLeft': '向左掌击，D 键',
      'ui.jumpkickRight': '向右飞踢，I 键', 'ui.punchRight': '向右拳击，J 键',
      'ui.kickRight': '向右踢击，K 键', 'ui.palmRight': '向右掌击，L 键',
      'ui.breakAria': '爆发：清空两侧垃圾币，空格键',
      'ui.break': '爆发', 'ui.breakHint': '一招清空两侧',
      'ui.lightLegend': '小币用手', 'ui.heavyLegend': '大币用腿',
      'ui.footer': '持仓集齐三枚垃圾币，你就成了接盘侠。',
      'ui.noscript': '此游戏需要 JavaScript。请在浏览器设置中启用。',
      'moves.punch': '拳击', 'moves.kick': '踢击', 'moves.palm': '双掌出击',
      'moves.jumpkick': '飞踢', 'moves.break': '爆发 · 全场清空',
      'combo.1': '拒绝接盘', 'combo.2': '抵住喊单诱惑', 'combo.3': '持仓清净',
      'dynamic.breakUnavailable': '爆发 · {charge}% · 命中即可充能',
      'dynamic.intro': '小币用手，红币用腿。拒绝买入。',
      'dynamic.keepCombo': '保持连击',
      'dynamic.portfolioAria': '持仓：{count} 枚，共 3 格。收下第三枚币时本局结束。',
      'dynamic.portfolioCount': '{count} / 3',
      'dynamic.slotFilled': '第 {slot} 格：{name}', 'dynamic.slotEmpty': '第 {slot} 格：空',
      'dynamic.breakReady': '就绪', 'dynamic.breakPercent': '{charge}%',
      'dynamic.recovery': '回归待机 · {seconds} 秒',
      'dynamic.guard': '功夫架势 · 最后一次机会', 'dynamic.guardExit': '收起架势',
      'dynamic.neutral': '准备出击', 'dynamic.queued': '招式已排队',
      'dynamic.idle': '看准时机，守住中心。',
      'dynamic.unmute': '开启声音（M）', 'dynamic.mute': '关闭声音（M）',
      'dynamic.resumeAria': '继续（Esc）', 'dynamic.pauseAria': '暂停（Esc）',
      'dynamic.loadingTitle': '拳脚就位',
      'dynamic.loadingCopy': '正在准备角色动画和循环音乐。',
      'dynamic.pausedTitle': '歇口气。', 'dynamic.pausedCopy': '按 Enter 或 Esc 继续。',
      'dynamic.gameoverTitle': '你成了接盘侠',
      'dynamic.bagholder': '现在你成了套牢侠。',
      'dynamic.retryQuestion': '再试一局，坚持不买？',
      'dynamic.gameoverScore': '得分：{score}',
      'dynamic.gameoverScoreLabel': '本局得分',
      'dynamic.gameoverPortfolioAria': '已买入的垃圾币：{count} 枚，共 3 枚。',
      'dynamic.menuTitle': 'Zygote vs Shitcoins',
      'dynamic.menuCopy': '击飞垃圾币，守住你的持仓。',
      'dynamic.assetError': '部分图片加载失败，请刷新页面。',
      'dynamic.breakClean': '持仓清净', 'dynamic.breakNoBuy': '爆发 · 零买入',
      'dynamic.perfect': 'NO FOMO', 'dynamic.deflected': '成功击飞',
      'dynamic.perfectCharge': '精准命中 · 爆发能量 +16%',
      'dynamic.deflectedCharge': '成功击飞 · 爆发能量 +9%',
      'dynamic.clangHeavy': '大币要用腿！', 'dynamic.clangLight': '小币要用手！',
      'dynamic.clang': '铛！', 'dynamic.bought': '已加入持仓 · {count}/3',
      'dynamic.purchaseFirst': '相信了技术',
      'dynamic.purchaseSecondA': '这次肯定起飞！',
      'dynamic.purchaseSecondB': '这是长期投资',
      'dynamic.purchased': '已买入', 'dynamic.stopLoss': '止损已触发',
      'dynamic.kickHint': '用腿', 'dynamic.handsHint': '用手',
      'dynamic.loadingSprites': '正在加载角色动画…', 'dynamic.spriteError': '角色动画加载失败',
      'dynamic.legs': '腿击', 'dynamic.hands': '手击',
      'dynamic.pointsGain': '+{points}', 'dynamic.scoreDigits': '{score}'
    }
  };

  const supported = new Set(['ru', 'en', 'zh']);
  const storageKey = 'zygote-language';
  function exactLanguage(value) { return supported.has(value) ? value : null; }
  function initialLanguage() {
    let query, saved;
    try { query = exactLanguage(new URL(root.location.href).searchParams.get('lang')); } catch (_) {}
    if (query) return query;
    try { saved = exactLanguage(root.localStorage.getItem(storageKey)); } catch (_) {}
    if (saved) return saved;
    const browser = (root.navigator.language || '').toLowerCase();
    return browser.startsWith('ru') ? 'ru' : browser.startsWith('zh') ? 'zh' : 'en';
  }

  let language = initialLanguage();
  function t(key, vars = {}) {
    const template = messages[language][key] ?? messages.en[key] ?? key;
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match);
  }
  function applyDOM() {
    const doc = root.document;
    doc.documentElement.lang = language === 'zh' ? 'zh-Hans' : language;
    doc.documentElement.dataset.language = language;
    doc.title = 'Zygote vs Shitcoins';
    const description = doc.querySelector('meta[name="description"]');
    if (description) description.content = t('meta.description');
    doc.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    ['aria-label', 'title'].forEach(attribute => {
      doc.querySelectorAll(`[data-i18n-${attribute}]`).forEach(node => {
        node.setAttribute(attribute, t(node.getAttribute(`data-i18n-${attribute}`)));
      });
    });
    doc.querySelectorAll('[data-language]').forEach(button => {
      if (button.matches('button')) button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
  }
  function setLanguage(value) {
    const next = exactLanguage(value);
    if (!next) return false;
    const previousLanguage = language;
    language = next;
    try { root.localStorage.setItem(storageKey, language); } catch (_) {}
    try {
      const url = new URL(root.location.href);
      url.searchParams.set('lang', language);
      root.history.replaceState(root.history.state, '', url);
    } catch (_) {}
    applyDOM();
    root.dispatchEvent(new CustomEvent('zygote:languagechange', { detail: { language, previousLanguage } }));
    return true;
  }

  root.ZYG_I18N = Object.freeze({ t, setLanguage, applyDOM, get language() { return language; } });
  root.document.querySelectorAll('button[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  applyDOM();
})(globalThis);
