/* ==========================================================================
   GAMEHUB 5-THEME ENGINE & CARD BACK MANAGER - THEMES.JS
   Supports 5 distinct visual & animation themes + custom card back styles
   ========================================================================== */
const THEMES = [
  {
    id: 'theme-party',
    name: '🎪 Neon Party',
    desc: 'Bouncy Fall Guys candy colors with springy pop animations',
    cardBack: 'card-back-party',
    icon: '🎪'
  },
  {
    id: 'theme-cyber',
    name: '🌌 Cyberpunk',
    desc: 'Neon grid lines, laser glitch glow, and digital scanlines',
    cardBack: 'card-back-cyber',
    icon: '🌌'
  },
  {
    id: 'theme-casino',
    name: '🌿 Royal Velvet',
    desc: 'Luxurious emerald casino felt with metallic gold filigree',
    cardBack: 'card-back-casino',
    icon: '👑'
  },
  {
    id: 'theme-magma',
    name: '🔥 Volcanic Magma',
    desc: 'Molten obsidian fissures with intense flame ember pulses',
    cardBack: 'card-back-magma',
    icon: '🔥'
  },
  {
    id: 'theme-frost',
    name: '❄️ Glacial Frost',
    desc: 'Frozen crystal glass with shimmering arctic aurora drift',
    cardBack: 'card-back-frost',
    icon: '❄️'
  }
];

const CARD_BACKS = [
  { id: 'card-back-party', name: 'Candy Star (Default)', preview: '⭐', color: '#e6005c' },
  { id: 'card-back-cyber', name: 'Cyber Grid', preview: '⚡', color: '#5a189a' },
  { id: 'card-back-casino', name: 'Royal Gold', preview: '👑', color: '#134e2c' },
  { id: 'card-back-magma', name: 'Hellfire Flame', preview: '🔥', color: '#800f0f' },
  { id: 'card-back-frost', name: 'Arctic Ice', preview: '❄️', color: '#0077b6' }
];

const ThemeManager = (() => {
  const THEME_STORAGE_KEY = 'arcade_selected_theme';
  const CARDBACK_STORAGE_KEY = 'arcade_selected_cardback';

  function getSavedTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'theme-party';
  }

  function getSavedCardBack() {
    return localStorage.getItem(CARDBACK_STORAGE_KEY) || 'card-back-party';
  }

  function applyTheme(themeId, cardBackId = null) {
    const t = THEMES.find(item => item.id === themeId) || THEMES[0];
    const cb = cardBackId || getSavedCardBack();

    // Remove all previous theme classes from body
    THEMES.forEach(item => document.body.classList.remove(item.id));
    CARD_BACKS.forEach(item => document.body.classList.remove(item.id));

    // Add current theme & card back class to body
    document.body.classList.add(t.id);
    document.body.classList.add(cb);

    localStorage.setItem(THEME_STORAGE_KEY, t.id);
    localStorage.setItem(CARDBACK_STORAGE_KEY, cb);

    // Update active theme badge if exists
    const badge = document.getElementById('activeThemeBadge');
    if (badge) badge.textContent = `${t.icon} ${t.name}`;
  }

  function showThemeModal() {
    document.querySelectorAll('.theme-modal-overlay').forEach(el => el.remove());
    const currentTheme = getSavedTheme();
    const currentCardBack = getSavedCardBack();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay theme-modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width: 580px;">
        <button class="modal-close-btn" id="closeThemeModalBtn">&times;</button>
        <h2 class="modal-title">🎨 Arcade Themes & Card Styles</h2>
        
        <label class="input-label">Select Visual & Animation Theme</label>
        <div class="themes-selector-grid">
          ${THEMES.map(th => `
            <div class="theme-card-option ${th.id === currentTheme ? 'selected' : ''}" data-theme="${th.id}">
              <div style="font-size: 32px; margin-bottom: 6px;">${th.icon}</div>
              <div style="font-weight: 800; font-size: 15px; margin-bottom: 4px;">${th.name}</div>
              <div style="font-size: 11px; color: var(--text-sub); line-height: 1.3;">${th.desc}</div>
            </div>
          `).join('')}
        </div>

        <label class="input-label" style="margin-top: 18px;">Customize Card Back Design</label>
        <div class="cardbacks-selector-row">
          ${CARD_BACKS.map(cb => `
            <div class="cardback-chip-option ${cb.id === currentCardBack ? 'selected' : ''}" data-cardback="${cb.id}">
              <div class="cardback-mini-preview ${cb.id}">
                <span>${cb.preview}</span>
              </div>
              <span style="font-size: 12px; font-weight: 700;">${cb.name}</span>
            </div>
          `).join('')}
        </div>

        <button class="candy-btn btn-lime" id="saveThemeBtn" style="width: 100%; margin-top: 24px;">
          Apply Theme & Styles
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    let chosenTheme = currentTheme;
    let chosenCardBack = currentCardBack;

    overlay.querySelectorAll('.theme-card-option').forEach(card => {
      card.addEventListener('click', () => {
        SFX.pop();
        overlay.querySelectorAll('.theme-card-option').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        chosenTheme = card.dataset.theme;

        // Auto-match default card back of that theme
        const match = THEMES.find(t => t.id === chosenTheme);
        if (match) {
          chosenCardBack = match.cardBack;
          overlay.querySelectorAll('.cardback-chip-option').forEach(cb => {
            cb.classList.toggle('selected', cb.dataset.cardback === chosenCardBack);
          });
        }
      });
    });

    overlay.querySelectorAll('.cardback-chip-option').forEach(chip => {
      chip.addEventListener('click', () => {
        SFX.tap();
        overlay.querySelectorAll('.cardback-chip-option').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        chosenCardBack = chip.dataset.cardback;
      });
    });

    overlay.querySelector('#closeThemeModalBtn').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#saveThemeBtn').addEventListener('click', () => {
      applyTheme(chosenTheme, chosenCardBack);
      SFX.win();
      overlay.remove();
      Toast.show('✨ Theme & card back updated!', 'ok');
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });
  }

  return {
    init() {
      applyTheme(getSavedTheme(), getSavedCardBack());
      // Hook up any theme trigger buttons in nav
      document.querySelectorAll('.open-theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          SFX.tap();
          showThemeModal();
        });
      });
    },
    applyTheme,
    showThemeModal,
    getSavedTheme,
    getSavedCardBack
  };
})();

// Auto-initialize theme on load
window.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
});
