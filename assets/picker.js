(function () {
  'use strict';

  if (window.__ALP_DQM_BOOT_STATE__) return;
  window.__ALP_DQM_BOOT_STATE__ = 'booting';

  function getAvailableConfig() {
    if (window.ALPDiviQuickModules) return window.ALPDiviQuickModules;

    try {
      if (window.top && window.top !== window && window.top.ALPDiviQuickModules) {
        return window.top.ALPDiviQuickModules;
      }
    } catch (e) {}

    return null;
  }

  function getAjaxUrl() {
    if (typeof window.ajaxurl === 'string' && window.ajaxurl) return window.ajaxurl;

    try {
      if (window.top && typeof window.top.ajaxurl === 'string' && window.top.ajaxurl) {
        return window.top.ajaxurl;
      }
    } catch (e) {}

    // Last-resort same-origin discovery for WordPress installations in a subdirectory.
    const nodes = Array.from(document.querySelectorAll('script[src], link[href]'));
    for (const node of nodes) {
      const raw = node.getAttribute('src') || node.getAttribute('href') || '';
      const marker = raw.indexOf('/wp-admin/');
      if (marker < 0) continue;

      try {
        const resolved = new URL(raw, window.location.href);
        const pathMarker = resolved.pathname.indexOf('/wp-admin/');
        if (pathMarker < 0) continue;
        return resolved.origin + resolved.pathname.slice(0, pathMarker) + '/wp-admin/admin-ajax.php';
      } catch (e) {}
    }

    return null;
  }

  function start(cfg) {
    if (!cfg || window.__ALP_DQM_BOOT_STATE__ === 'active') return;
    window.__ALP_DQM_BOOT_STATE__ = 'active';
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();

    const cleanStoredList = (items) => {
      const clean = [];
      (Array.isArray(items) ? items : []).forEach((item) => {
        const name = normalize(item).replace(/\s*[★☆]+\s*$/g, '').trim();
        if (name && !clean.includes(name)) clean.push(name);
      });
      return clean;
    };

    const savedSchemaVersion = Number(cfg.schemaVersionSaved || 0);
    const rawFavorites = Array.isArray(cfg.favorites) ? cfg.favorites.slice() : [];
    const rawRecent = Array.isArray(cfg.recent) ? cfg.recent.slice() : [];
    let migratedFavorites = cleanStoredList(rawFavorites);
    const migratedRecent = cleanStoredList(rawRecent);

    if (savedSchemaVersion < 3 && migratedFavorites.length > 1) {
      migratedFavorites = migratedFavorites.reverse();
    }

    const state = {
      favorites: migratedFavorites,
      recent: migratedRecent,
      needsMigration: savedSchemaVersion < 3 || rawFavorites.join('\u0000') !== migratedFavorites.join('\u0000') || rawRecent.join('\u0000') !== migratedRecent.join('\u0000'),
      modal: null,
      activeQuickTab: null,
      saveTimer: null,
      feedbackTimer: null,
      enhanceQueued: false,
      pointerDrag: null,
      suppressNextShortcutClick: false,
      quickUiBound: false,
      launchLocked: false,
    };

    function format(template, value) {
      return String(template || '').replace('%s', value);
    }

    function save() {
      clearTimeout(state.saveTimer);
      state.saveTimer = setTimeout(() => {
        const body = new URLSearchParams();
        body.set('action', 'alp_dqm_save_preferences');
        body.set('nonce', cfg.nonce);
        body.set('favorites', JSON.stringify(state.favorites));
        body.set('recent', JSON.stringify(state.recent));

        fetch(cfg.ajaxUrl, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: body.toString(),
        }).catch(() => {});
      }, 160);
    }


    function parseColor(color) {
      const match = String(color || '').match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*([\d.]+))?\s*\)/i);
      if (!match) return null;
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] === undefined ? 1 : Number(match[4]),
      };
    }

    function colorBrightness(color) {
      const rgb = parseColor(color);
      if (!rgb) return null;
      return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }

    function hasUsableBackground(el) {
      if (!(el instanceof HTMLElement)) return null;
      const parsed = parseColor(getComputedStyle(el).backgroundColor);
      if (!parsed || parsed.a < .18) return null;
      return (parsed.r * 299 + parsed.g * 587 + parsed.b * 114) / 1000;
    }

    function detectLightTheme(modal) {
      if (!(modal instanceof HTMLElement)) return false;

      // Divi 5 may put the visible background on an inner wrapper while the
      // dialog itself remains transparent. Inspect the dialog, search field,
      // header-ish children and ancestors instead of trusting one element.
      const probes = [modal];
      const input = getSearchInput(modal);
      if (input) {
        probes.push(input);
        if (input.parentElement) probes.push(input.parentElement);
      }

      Array.from(modal.children).slice(0, 8).forEach((el) => {
        if (el instanceof HTMLElement) probes.push(el);
      });

      let ancestor = modal.parentElement;
      for (let i = 0; ancestor && i < 3; i += 1, ancestor = ancestor.parentElement) probes.push(ancestor);

      const backgrounds = probes.map(hasUsableBackground).filter((value) => value !== null);
      if (backgrounds.some((value) => value >= 190)) return true;
      if (backgrounds.some((value) => value <= 85)) return false;

      // Fallback: light Divi mode uses dark interface text, dark mode uses light text.
      const textCandidates = [modal, input].filter(Boolean);
      for (const el of textCandidates) {
        const brightness = colorBrightness(getComputedStyle(el).color);
        if (brightness !== null) {
          if (brightness <= 135) return true;
          if (brightness >= 185) return false;
        }
      }

      // Last fallback: inspect a few visible text-bearing descendants.
      const descendants = Array.from(modal.querySelectorAll('button, input, span, div')).slice(0, 30);
      let darkText = 0;
      let lightText = 0;
      descendants.forEach((el) => {
        if (!(el instanceof HTMLElement) || !normalize(el.innerText || el.value || '')) return;
        const brightness = colorBrightness(getComputedStyle(el).color);
        if (brightness === null) return;
        if (brightness <= 135) darkText += 1;
        if (brightness >= 185) lightText += 1;
      });
      return darkText > lightText;
    }

    function syncTheme(modal, ui) {
      if (!(modal instanceof HTMLElement)) return;
      const isLight = detectLightTheme(modal);
      modal.classList.toggle('alp-dqm-theme-light', isLight);
      modal.classList.toggle('alp-dqm-theme-dark', !isLight);
      modal.dataset.alpDqmTheme = isLight ? 'light' : 'dark';
      if (ui instanceof HTMLElement) {
        ui.classList.toggle('alp-dqm-theme-light', isLight);
        ui.classList.toggle('alp-dqm-theme-dark', !isLight);
        ui.dataset.alpDqmTheme = isLight ? 'light' : 'dark';
      }
    }

    function looksLikeModuleModal(el) {
      if (!(el instanceof HTMLElement)) return false;
      const text = normalize(el.innerText);
      if (!/Insert Module Or Row/i.test(text)) return false;
      return !!el.querySelector('input[placeholder*="module" i], input[type="search"], input');
    }

    function findModal() {
      const candidates = Array.from(document.querySelectorAll('[role="dialog"], body > div, body *'));
      let best = null;
      let bestArea = Infinity;

      for (const el of candidates) {
        if (!looksLikeModuleModal(el)) continue;
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (r.width > 280 && r.height > 260 && area < bestArea) {
          best = el;
          bestArea = area;
        }
      }
      return best;
    }

    function getSearchInput(modal) {
      return modal.querySelector('input[placeholder*="module" i], input[type="search"], input');
    }

    function getSearchBlock(modal) {
      const input = getSearchInput(modal);
      if (!input) return null;

      let node = input.parentElement;
      let best = node;
      const modalRect = modal.getBoundingClientRect();

      while (node && node !== modal) {
        const rect = node.getBoundingClientRect();
        if (rect.width >= modalRect.width * 0.55 && rect.height <= 90) best = node;
        if (rect.height > 110) break;
        node = node.parentElement;
      }

      return best;
    }

    function getCardName(el) {
      if (!(el instanceof HTMLElement)) return '';
      const stored = normalize(el.dataset.alpDqmName || '');
      if (stored && !/[★☆]\s*$/.test(stored)) return stored;

      const clone = el.cloneNode(true);
      clone.querySelectorAll('.alp-dqm-star, .alp-dqm-ui').forEach((node) => node.remove());
      return normalize(clone.innerText).replace(/\s*[★☆]+\s*$/g, '').trim();
    }

    function isClickable(el) {
      if (!(el instanceof HTMLElement)) return false;
      const style = getComputedStyle(el);
      return el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || el.tabIndex >= 0 || style.cursor === 'pointer';
    }

    function getModuleCards(modal) {
      if (!modal) return [];
      const modalRect = modal.getBoundingClientRect();
      const all = Array.from(modal.querySelectorAll('button, [role="button"], [tabindex], div'));
      const seen = new Set();
      const cards = [];

      for (const el of all) {
        if (!(el instanceof HTMLElement) || el.closest('.alp-dqm-ui')) continue;
        const text = getCardName(el);
        if (!text || text.length > 70) continue;
        if (/^(New Module|New Row|Add From Library|Favorites|Recent)$/i.test(text)) continue;
        if (/Search for a module/i.test(text)) continue;

        const r = el.getBoundingClientRect();
        if (r.width < 70 || r.width > Math.min(250, modalRect.width * 0.52)) continue;
        if (r.height < 48 || r.height > 180) continue;
        if (r.left < modalRect.left - 2 || r.right > modalRect.right + 2) continue;

        const hasVisual = !!el.querySelector('svg, img, [class*="icon" i]');
        if (!hasVisual && !isClickable(el)) continue;

        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push({ el, name: text });
      }

      return cards;
    }

    function findCardByName(modal, name) {
      const wanted = normalize(name).toLowerCase();
      return getModuleCards(modal).find((card) => card.name.toLowerCase() === wanted) || null;
    }

    function resolveNativeCardFromTarget(target) {
      if (!state.modal || !(target instanceof Element) || !state.modal.contains(target)) return null;

      const decorated = target.closest('[data-alp-dqm-card="1"]');
      if (decorated) {
        return { el: decorated, name: decorated.dataset.alpDqmName || getCardName(decorated) };
      }

      const containing = getModuleCards(state.modal)
        .filter((card) => card.el.contains(target) || target.contains(card.el))
        .sort((a, b) => {
          const ar = a.el.getBoundingClientRect();
          const br = b.el.getBoundingClientRect();
          return (ar.width * ar.height) - (br.width * br.height);
        });

      return containing[0] || null;
    }

    function addRecent(name) {
      name = normalize(name).replace(/\s*[★☆]+\s*$/g, '').trim();
      if (!name) return;

      const next = [name].concat(state.recent.filter((item) => item !== name)).slice(0, Number(cfg.maxRecent) || 8);
      if (next.join('\u0000') === state.recent.join('\u0000')) return;

      state.recent = next;
      save();
      renderQuickUI(state.modal);
    }

    function showFeedback(message, type) {
      if (!state.modal || !document.contains(state.modal)) return;
      const feedback = state.modal.querySelector('.alp-dqm-feedback');
      if (!feedback) return;

      clearTimeout(state.feedbackTimer);
      feedback.textContent = message;
      feedback.classList.remove('is-success', 'is-error');
      if (type === 'success') feedback.classList.add('is-success');
      if (type === 'error') feedback.classList.add('is-error');
      feedback.classList.add('is-visible');
      state.feedbackTimer = setTimeout(() => {
        feedback.classList.remove('is-visible', 'is-success', 'is-error');
      }, 1900);
    }

    function removeFavorite(name) {
      name = normalize(name);
      if (!name || !state.favorites.includes(name)) return;

      state.favorites = state.favorites.filter((item) => item !== name);
      save();
      enhanceModal(state.modal);
      showFeedback(format(cfg.strings.removedFavorite, name), 'error');
    }

    function toggleFavorite(name) {
      name = normalize(name);
      if (!name) return;

      if (state.favorites.includes(name)) {
        removeFavorite(name);
        return;
      }

      state.favorites.push(name);
      state.activeQuickTab = 'favorites';
      save();
      enhanceModal(state.modal);
      showFeedback(format(cfg.strings.addedFavorite, name), 'success');
    }

    function reorderFavorite(sourceName, targetName, placeAfter) {
      const sourceIndex = state.favorites.indexOf(sourceName);
      const targetIndex = state.favorites.indexOf(targetName);
      if (sourceIndex < 0 || targetIndex < 0 || sourceName === targetName) return;

      const next = state.favorites.slice();
      next.splice(sourceIndex, 1);
      let insertIndex = next.indexOf(targetName);
      if (placeAfter) insertIndex += 1;
      next.splice(insertIndex, 0, sourceName);

      if (next.join('\u0000') === state.favorites.join('\u0000')) return;
      state.favorites = next;
      save();
      renderQuickUI(state.modal);
    }

    function setInputValue(input, value) {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (descriptor && descriptor.set) descriptor.set.call(input, value);
      else input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function getActivationTarget(card) {
      if (!card || !(card.el instanceof HTMLElement)) return null;

      // Prefer the element that is physically under the middle of the Divi tile.
      // This is more reliable with Divi 5 than guessing which wrapper owns React's
      // click/pointer handler, because the event can bubble to the correct wrapper.
      const rect = card.el.getBoundingClientRect();
      const points = [
        [rect.left + rect.width * 0.50, rect.top + rect.height * 0.58],
        [rect.left + rect.width * 0.50, rect.top + rect.height * 0.42],
        [rect.left + rect.width * 0.35, rect.top + rect.height * 0.55],
      ];

      for (const point of points) {
        let hit = document.elementFromPoint(Math.round(point[0]), Math.round(point[1]));
        if (!(hit instanceof Element) || hit.closest('.alp-dqm-star, .alp-dqm-ui')) continue;
        if (!(card.el.contains(hit) || hit.contains(card.el))) continue;

        while (hit && !(hit instanceof HTMLElement)) hit = hit.parentElement;
        if (hit instanceof HTMLElement) return hit;
      }

      const child = Array.from(card.el.querySelectorAll('button, [role="button"], [tabindex]'))
        .find((el) => el instanceof HTMLElement && !el.closest('.alp-dqm-star'));
      return child instanceof HTMLElement ? child : card.el;
    }

    function dispatchDiviActivation(target) {
      if (!(target instanceof HTMLElement)) return false;

      try { target.focus({ preventScroll: true }); } catch (e) {}

      // A single synthetic click is enough for Divi's React onClick handler.
      // Earlier builds replayed pointerdown/mousedown/pointerup/mouseup *and* click,
      // which can cause Divi 5 to treat one shortcut activation as two insertions.
      try {
        target.click();
        return true;
      } catch (e) {
        try {
          target.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            button: 0,
          }));
          return true;
        } catch (ignored) {
          return false;
        }
      }
    }

    function activateNativeCard(card, name) {
      const target = getActivationTarget(card);
      if (!(target instanceof HTMLElement)) return false;

      addRecent(name);
      return dispatchDiviActivation(target);
    }

    function waitForCard(name, timeout) {
      const started = performance.now();
      return new Promise((resolve) => {
        const check = () => {
          if (!state.modal || !document.contains(state.modal)) return resolve(null);
          const card = findCardByName(state.modal, name);
          if (card) return resolve(card);
          if (performance.now() - started >= timeout) return resolve(null);
          setTimeout(check, 45);
        };
        check();
      });
    }

    async function clickModuleByName(name) {
      if (!state.modal || !document.contains(state.modal) || state.launchLocked) return;

      state.launchLocked = true;
      const unlock = () => {
        setTimeout(() => { state.launchLocked = false; }, 350);
      };

      let activated = false;

      try {
        let card = findCardByName(state.modal, name);
        if (card && activateNativeCard(card, name)) {
          activated = true;
          return;
        }

        const input = getSearchInput(state.modal);
        if (!input) return;
        const oldValue = input.value;
        setInputValue(input, name);

        card = await waitForCard(name, 1200);
        if (card && activateNativeCard(card, name)) {
          activated = true;
          return;
        }

        setInputValue(input, oldValue || '');
        showFeedback(format(cfg.strings.moduleNotFound || 'Could not find %s in the current module list.', name), 'error');
      } finally {
        // Keep a brief lock after activation so a pointer/click sequence, keyboard
        // repeat, or a fast double click cannot insert the same module twice.
        unlock();
        if (!activated && state.modal && document.contains(state.modal)) scheduleEnhance();
      }
    }

    function makeFavoriteShortcut(name) {
      const item = document.createElement('div');
      item.className = 'alp-dqm-shortcut alp-dqm-favorite-shortcut';
      item.dataset.alpDqmFavoriteItem = name;
      item.dataset.alpDqmAction = 'launch-favorite';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', name);

      const handle = document.createElement('span');
      handle.className = 'alp-dqm-drag-handle';
      handle.dataset.alpDqmDragHandle = '1';
      handle.setAttribute('aria-hidden', 'true');
      handle.textContent = '⋮⋮';
      handle.title = cfg.strings.dragFavorite || 'Drag to reorder';

      const label = document.createElement('span');
      label.className = 'alp-dqm-shortcut-label';
      label.textContent = name;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'alp-dqm-remove-favorite';
      remove.dataset.alpDqmAction = 'remove-favorite';
      remove.dataset.alpDqmName = name;
      remove.textContent = '★';
      remove.title = format(cfg.strings.removeFavoriteNamed || 'Remove %s from favorites', name);
      remove.setAttribute('aria-label', remove.title);

      item.appendChild(handle);
      item.appendChild(label);
      item.appendChild(remove);
      return item;
    }


    function setClockIcon(container) {
      if (!(container instanceof HTMLElement)) return;
      container.innerHTML = '<svg class="alp-dqm-clock-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5v5l3.25 2"></path></svg>';
    }

    function makeRecentShortcut(name) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'alp-dqm-shortcut alp-dqm-recent-shortcut';
      button.dataset.alpDqmAction = 'launch-recent';
      button.dataset.alpDqmName = name;
      button.title = name;

      const icon = document.createElement('span');
      icon.className = 'alp-dqm-shortcut-icon';
      icon.setAttribute('aria-hidden', 'true');
      setClockIcon(icon);

      const label = document.createElement('span');
      label.className = 'alp-dqm-shortcut-label';
      label.textContent = name;

      button.appendChild(icon);
      button.appendChild(label);
      return button;
    }

    function makeQuickTab(key, label, count) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'alp-dqm-tab';
      button.dataset.alpDqmAction = 'quick-tab';
      button.dataset.alpDqmTab = key;
      button.setAttribute('aria-pressed', state.activeQuickTab === key ? 'true' : 'false');

      const icon = document.createElement('span');
      icon.className = 'alp-dqm-tab-icon';
      icon.setAttribute('aria-hidden', 'true');
      if (key === 'favorites') {
        icon.textContent = '★';
      } else {
        setClockIcon(icon);
      }

      const text = document.createElement('span');
      text.textContent = label;

      const badge = document.createElement('span');
      badge.className = 'alp-dqm-count';
      badge.textContent = String(count);

      button.appendChild(icon);
      button.appendChild(text);
      button.appendChild(badge);
      return button;
    }

    function syncUiWidth(modal, ui) {
      const searchBlock = getSearchBlock(modal);
      if (!searchBlock || !ui) return;
      const rect = searchBlock.getBoundingClientRect();
      if (rect.width > 250) {
        ui.style.width = Math.floor(rect.width) + 'px';
        ui.style.maxWidth = Math.floor(rect.width) + 'px';
      }
    }

    function bindQuickUI(ui) {
      if (!ui || ui.dataset.alpDqmBound === '1') return;
      ui.dataset.alpDqmBound = '1';

      // These listeners live on our persistent wrapper instead of document capture.
      // That keeps Divi's React event delegation away from our controls while still
      // allowing normal browser click synthesis for buttons.
      ui.addEventListener('mousedown', (event) => event.stopPropagation());
      ui.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });

      ui.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        if (event.button !== 0) return;

        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (target.closest('.alp-dqm-remove-favorite, .alp-dqm-tab, .alp-dqm-recent-shortcut')) return;

        const item = target.closest('.alp-dqm-favorite-shortcut');
        if (!item) return;
        state.pointerDrag = {
          sourceEl: item,
          sourceName: item.dataset.alpDqmFavoriteItem || '',
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
          targetName: null,
          placeAfter: false,
        };
      });

      ui.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();

        const tab = target.closest('[data-alp-dqm-action="quick-tab"]');
        if (tab) {
          const key = tab.dataset.alpDqmTab || '';
          state.activeQuickTab = state.activeQuickTab === key ? null : key;
          renderQuickUI(state.modal, true);
          return;
        }

        const remove = target.closest('[data-alp-dqm-action="remove-favorite"]');
        if (remove) {
          removeFavorite(remove.dataset.alpDqmName || '');
          return;
        }

        const recent = target.closest('[data-alp-dqm-action="launch-recent"]');
        if (recent) {
          clickModuleByName(recent.dataset.alpDqmName || '');
          return;
        }

        const favorite = target.closest('[data-alp-dqm-action="launch-favorite"]');
        if (favorite) {
          if (state.suppressNextShortcutClick) {
            state.suppressNextShortcutClick = false;
            return;
          }
          clickModuleByName(favorite.dataset.alpDqmFavoriteItem || '');
        }
      });

      ui.addEventListener('keydown', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        const favorite = target.closest('.alp-dqm-favorite-shortcut');
        if (favorite && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          event.stopPropagation();
          clickModuleByName(favorite.dataset.alpDqmFavoriteItem || '');
        }
      });
    }

    function ensureUI(modal) {
      let ui = modal.querySelector(':scope .alp-dqm-ui');
      if (ui) {
        bindQuickUI(ui);
        syncUiWidth(modal, ui);
        syncTheme(modal, ui);
        return ui;
      }

      ui = document.createElement('div');
      ui.className = 'alp-dqm-ui';

      const tabs = document.createElement('div');
      tabs.className = 'alp-dqm-tabs';
      tabs.setAttribute('aria-label', 'Quick Modules for Divi');

      const feedback = document.createElement('div');
      feedback.className = 'alp-dqm-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');

      const panel = document.createElement('div');
      panel.className = 'alp-dqm-panel';

      ui.appendChild(tabs);
      ui.appendChild(feedback);
      ui.appendChild(panel);

      const searchBlock = getSearchBlock(modal);
      if (searchBlock && searchBlock.parentElement) searchBlock.insertAdjacentElement('beforebegin', ui);
      else modal.prepend(ui);

      bindQuickUI(ui);
      syncUiWidth(modal, ui);
      syncTheme(modal, ui);
      return ui;
    }

    function renderQuickUI(modal, force) {
      if (!modal || !document.contains(modal)) return;

      const ui = ensureUI(modal);
      syncTheme(modal, ui);
      const tabs = ui.querySelector('.alp-dqm-tabs');
      const panel = ui.querySelector('.alp-dqm-panel');
      if (!tabs || !panel) return;

      const signature = [
        state.activeQuickTab || '',
        state.favorites.join('\u0001'),
        state.recent.join('\u0001'),
      ].join('\u0002');

      // The Divi modal mutates frequently. Rebuilding our buttons on every Divi
      // mutation can replace the element between pointerdown and click, causing a
      // perfectly visible control to appear dead. Only rebuild when our own state
      // actually changed.
      if (!force && ui.dataset.alpDqmSignature === signature) {
        syncUiWidth(modal, ui);
        return;
      }
      ui.dataset.alpDqmSignature = signature;

      tabs.innerHTML = '';
      tabs.appendChild(makeQuickTab('favorites', cfg.strings.favorites, state.favorites.length));
      tabs.appendChild(makeQuickTab('recent', cfg.strings.recent, state.recent.length));

      panel.innerHTML = '';
      panel.classList.toggle('is-open', !!state.activeQuickTab);
      if (!state.activeQuickTab) return;

      const items = state.activeQuickTab === 'favorites' ? state.favorites : state.recent;
      const emptyText = state.activeQuickTab === 'favorites' ? cfg.strings.emptyFav : cfg.strings.emptyRecent;

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'alp-dqm-empty';
        empty.textContent = emptyText;
        panel.appendChild(empty);
        return;
      }

      const list = document.createElement('div');
      list.className = 'alp-dqm-list';
      list.dataset.alpDqmList = state.activeQuickTab;
      items.forEach((name) => list.appendChild(state.activeQuickTab === 'favorites' ? makeFavoriteShortcut(name) : makeRecentShortcut(name)));
      panel.appendChild(list);
    }

    function decorateCards(modal) {
      getModuleCards(modal).forEach(({ el, name }) => {
        el.dataset.alpDqmCard = '1';
        el.dataset.alpDqmName = name;
        el.classList.add('alp-dqm-card');

        const existingStars = Array.from(el.querySelectorAll(':scope > .alp-dqm-star'));
        let star = existingStars.shift() || null;
        existingStars.forEach((extra) => extra.remove());
        const active = state.favorites.includes(name);

        if (!star) {
          star = document.createElement('button');
          star.type = 'button';
          star.className = 'alp-dqm-star';
          star.textContent = '★';
          el.appendChild(star);
        }

        star.dataset.alpDqmFavorite = name;
        star.classList.toggle('is-active', active);
        star.setAttribute('aria-label', active ? cfg.strings.unfavorite : cfg.strings.favorite);
        star.setAttribute('aria-pressed', active ? 'true' : 'false');
        star.title = active ? cfg.strings.unfavorite : cfg.strings.favorite;
      });
    }

    function primeModal(modal) {
      if (!modal || !document.contains(modal)) return null;

      // Apply the final dialog width synchronously, before the next browser paint.
      // Previously this class was first added inside requestAnimationFrame(), which
      // allowed Divi's native narrower dialog to be visible for a frame and made the
      // picker appear to grow / show a transparent strip on the right.
      modal.classList.add('alp-dqm-modal');
      return modal;
    }

    function primeCurrentModal() {
      return primeModal(findModal());
    }

    function enhanceModal(modal) {
      modal = primeModal(modal);
      if (!modal) return;
      renderQuickUI(modal);
      decorateCards(modal);
    }

    function scheduleEnhance() {
      if (state.enhanceQueued) return;
      state.enhanceQueued = true;

      requestAnimationFrame(() => {
        state.enhanceQueued = false;
        const modal = findModal();

        if (!modal) {
          state.modal = null;
          state.activeQuickTab = null;
          return;
        }

        if (state.modal !== modal) {
          state.modal = modal;
          state.activeQuickTab = state.favorites.length ? 'favorites' : (state.recent.length ? 'recent' : null);
        }

        enhanceModal(modal);
      });
    }

    function clearDragClasses() {
      document.querySelectorAll('.alp-dqm-favorite-shortcut').forEach((node) => {
        node.classList.remove('is-dragging', 'drop-before', 'drop-after');
      });
    }

    function updatePointerDrag(event) {
      const drag = state.pointerDrag;
      if (!drag) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      drag.sourceEl.classList.add('is-dragging');

      clearDragClasses();
      drag.sourceEl.classList.add('is-dragging');

      const underPointer = document.elementFromPoint(event.clientX, event.clientY);
      const target = underPointer instanceof Element ? underPointer.closest('.alp-dqm-favorite-shortcut') : null;
      if (!target || target === drag.sourceEl) {
        drag.targetName = null;
        return;
      }

      const rect = target.getBoundingClientRect();
      const after = event.clientX > rect.left + rect.width / 2;
      target.classList.add(after ? 'drop-after' : 'drop-before');
      drag.targetName = target.dataset.alpDqmFavoriteItem || '';
      drag.placeAfter = after;
    }

    function finishPointerDrag() {
      const drag = state.pointerDrag;
      if (!drag) return;
      state.pointerDrag = null;

      if (drag.moved && drag.targetName) {
        reorderFavorite(drag.sourceName, drag.targetName, drag.placeAfter);
        state.suppressNextShortcutClick = true;
        setTimeout(() => { state.suppressNextShortcutClick = false; }, 250);
      }
      clearDragClasses();
    }

    // Keep clicks on the native module-card star from reaching Divi's tile and
    // inserting the module. Quick Modules' own UI is handled on its wrapper above.
    ['pointerdown', 'mousedown', 'touchstart'].forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const moduleStar = target.closest('.alp-dqm-star');
        if (!moduleStar) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
    });

    document.addEventListener('pointermove', (event) => {
      if (!state.pointerDrag) return;
      event.preventDefault();
      event.stopPropagation();
      updatePointerDrag(event);
    }, true);

    document.addEventListener('pointerup', (event) => {
      if (!state.pointerDrag) return;
      if (state.pointerDrag.moved) event.preventDefault();
      event.stopPropagation();
      finishPointerDrag();
    }, true);

    document.addEventListener('pointercancel', () => {
      state.pointerDrag = null;
      clearDragClasses();
    }, true);

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      // Our persistent quick wrapper has its own click handler. Do not intercept it
      // at document capture, otherwise browsers can lose the click after a Divi render.
      if (target.closest('.alp-dqm-ui')) return;

      const moduleStar = target.closest('.alp-dqm-star');
      if (moduleStar) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleFavorite(moduleStar.dataset.alpDqmFavorite || '');
        return;
      }

      const card = resolveNativeCardFromTarget(target);
      if (card) addRecent(card.name);
    }, true);

    // Native Divi tabs collapse our quick panel without clearing data.
    document.addEventListener('click', (event) => {
      if (!state.modal || !(event.target instanceof Element) || !state.modal.contains(event.target)) return;
      if (event.target.closest('.alp-dqm-ui')) return;

      const candidate = event.target.closest('button, [role="tab"], [role="button"], a, div');
      if (!candidate) return;
      const text = normalize(candidate.innerText);
      if (/^(New Module|New Row|Add From Library)$/i.test(text) && state.activeQuickTab) {
        state.activeQuickTab = null;
        renderQuickUI(state.modal);
      }
    }, false);

    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((mutation) => {
        const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        return !(target instanceof Element) || !target.closest('.alp-dqm-ui');
      });
      if (!relevant) return;

      // MutationObserver callbacks run before paint. Prime the modal here instead
      // of waiting for requestAnimationFrame(), so users never see Divi's original
      // narrow dialog before Quick Modules applies its final width.
      primeCurrentModal();
      scheduleEnhance();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('resize', scheduleEnhance, { passive: true });

    if (state.needsMigration) setTimeout(save, 80);

    // Handle the uncommon case where the picker already exists when our script
    // finishes loading, without imposing the old 450 ms bootstrap delay.
    primeCurrentModal();
    scheduleEnhance();
  }

  const availableConfig = getAvailableConfig();
  if (availableConfig) {
    start(availableConfig);
    return;
  }

  const ajaxUrl = getAjaxUrl();
  if (!ajaxUrl) {
    window.__ALP_DQM_BOOT_STATE__ = null;
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(ajaxUrl, window.location.href);
    requestUrl.searchParams.set('action', 'alp_dqm_bootstrap');
  } catch (e) {
    window.__ALP_DQM_BOOT_STATE__ = null;
    return;
  }

  fetch(requestUrl.toString(), {
    method: 'GET',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' },
  })
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => {
      if (!payload || !payload.success || !payload.data) {
        window.__ALP_DQM_BOOT_STATE__ = null;
        return;
      }
      start(payload.data);
    })
    .catch(() => {
      window.__ALP_DQM_BOOT_STATE__ = null;
    });
})();
