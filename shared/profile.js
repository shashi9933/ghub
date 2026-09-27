/* ==========================================================================
   PARTY ARCADE SHARED PLAYER PROFILE & PERSISTENCE - PROFILE.JS
   ========================================================================== */
const AVATARS = ['🦊', '🐱', '🐼', '🦁', '🐸', '🦄', '🤖', '👑', '🐙', '🦖', '🐻', '🐵', '🚀', '⚡', '🍉', '🍕'];

const Profile = (() => {
  const STORAGE_KEY = 'arcade_party_profile';

  function init() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch(e) {}

    if (!p || typeof p !== 'object') {
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const randomNum = Math.floor(100 + Math.random() * 900);
      p = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        name: 'Player' + randomNum,
        avatar: randomAvatar,
        coins: 10000,
        stats: {
          unoWins: 0,
          callbreakWins: 0,
          pokerWins: 0,
          blackjackWins: 0,
          connect4Wins: 0
        }
      };
      save(p);
    }
    return p;
  }

  function get() {
    return init();
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      updateNavPills();
    } catch(e) {}
  }

  function addCoins(amount) {
    const p = get();
    p.coins = Math.max(0, (p.coins || 0) + amount);
    save(p);
    return p.coins;
  }

  function recordWin(gameKey) {
    const p = get();
    if (!p.stats) p.stats = {};
    p.stats[gameKey] = (p.stats[gameKey] || 0) + 1;
    p.coins += 500; // Reward 500 arcade coins per win!
    save(p);
  }

  function updateNavPills() {
    const p = get();
    document.querySelectorAll('.profile-avatar-display').forEach(el => {
      el.textContent = p.avatar;
    });
    document.querySelectorAll('.profile-name-display').forEach(el => {
      el.textContent = p.name;
    });
    document.querySelectorAll('.profile-coins-display').forEach(el => {
      el.textContent = (p.coins || 0).toLocaleString();
    });
  }

  function showProfileModal() {
    const p = get();
    document.querySelectorAll('.profile-modal-overlay').forEach(e => e.remove());

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay profile-modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <button class="modal-close-btn" id="closeProfileBtn">&times;</button>
        <h2 class="modal-title">Customize Your Player</h2>
        
        <div class="input-group">
          <label class="input-label">Pick Your Avatar</label>
          <div class="avatar-grid" id="avatarGrid">
            ${AVATARS.map(av => `
              <div class="avatar-choice ${av === p.avatar ? 'selected' : ''}" data-avatar="${av}">
                ${av}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">Your Nickname</label>
          <input type="text" class="form-input" id="profileNameInput" maxlength="15" value="${p.name}" />
        </div>

        <div style="display: flex; gap: 10px; margin-top: 24px;">
          <button class="candy-btn btn-lime" style="flex:1;" id="saveProfileBtn">Save Profile</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let selectedAvatar = p.avatar;
    overlay.querySelectorAll('.avatar-choice').forEach(el => {
      el.addEventListener('click', () => {
        SFX.pop();
        overlay.querySelectorAll('.avatar-choice').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        selectedAvatar = el.dataset.avatar;
      });
    });

    const closeBtn = overlay.querySelector('#closeProfileBtn');
    closeBtn.addEventListener('click', () => overlay.remove());

    overlay.querySelector('#saveProfileBtn').addEventListener('click', () => {
      const nameInput = overlay.querySelector('#profileNameInput');
      const val = (nameInput.value || '').trim() || p.name;
      p.avatar = selectedAvatar;
      p.name = val;
      save(p);
      SFX.win();
      overlay.remove();
      Toast.show('Profile updated! Welcome ' + p.name + ' ' + p.avatar, 'ok');
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });
  }

  return {
    get,
    save,
    addCoins,
    recordWin,
    updateNavPills,
    showProfileModal
  };
})();

// Simple Toast Helper
const Toast = (() => {
  let container = null;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  return {
    show(msg, type = 'ok') {
      const c = getContainer();
      const el = document.createElement('div');
      el.className = `candy-toast toast-${type}`;
      el.innerHTML = msg;
      c.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        el.style.transition = 'all 0.2s';
        setTimeout(() => el.remove(), 250);
      }, 3000);
    }
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  Profile.updateNavPills();
  document.querySelectorAll('.nav-profile-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.tap();
      Profile.showProfileModal();
    });
  });
});
