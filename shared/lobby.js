/* ==========================================================================
   GAMEHUB UNIVERSAL CUSTOMIZABLE ROOM LOBBY & SEAT MANAGER - LOBBY.JS
   Custom bots, online invite links, and house rules configuration
   ========================================================================== */
const Lobby = (() => {
  let modalEl = null;
  let gameConfig = null;
  let seats = [];
  let onStartCallback = null;

  const DEFAULT_BOT_NAMES = ['RoboBean 🤖', 'SpeedyFox 🦊', 'PandaPro 🐼', 'LionHeart 🦁', 'CoolCat 🐱', 'ZenMaster 🧘'];
  const BOT_AVATARS = ['🤖', '🦊', '🐼', '🦁', '🐱', '🐸', '🦄', '🦖'];

  function init({
    gameTitle = 'Game',
    gamePrefix = 'GH',
    minPlayers = 2,
    maxPlayers = 4,
    defaultPlayers = 4,
    customSettingsHTML = '',
    getCustomSettings = () => ({}),
    onStart = () => {}
  }) {
    gameConfig = { gameTitle, gamePrefix, minPlayers, maxPlayers, defaultPlayers, customSettingsHTML, getCustomSettings };
    onStartCallback = onStart;

    // Check URL parameters for ?room=CODE
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('room');
    const isSoloMode = urlParams.get('mode') === 'bot';

    // Initialize Host / Guest networking
    if (joinCode) {
      showGuestLobby(joinCode);
    } else {
      showHostLobby(isSoloMode);
    }
  }

  async function showHostLobby(isSolo = false) {
    const p = Profile.get();
    let roomCode = 'LOCAL';

    if (!isSolo) {
      try {
        roomCode = await Network.createRoom(gameConfig.gamePrefix);
      } catch(e) {
        console.warn('Network fallback to local:', e);
      }
    }

    // Initialize seats
    seats = [];
    // Seat 0 is always human host
    seats.push({
      type: 'human',
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: true
    });

    // Populate remaining default seats with bots or open slots
    for (let i = 1; i < gameConfig.defaultPlayers; i++) {
      seats.push({
        type: 'bot',
        name: DEFAULT_BOT_NAMES[(i - 1) % DEFAULT_BOT_NAMES.length],
        avatar: BOT_AVATARS[(i - 1) % BOT_AVATARS.length],
        difficulty: 'medium'
      });
    }

    renderLobbyModal(roomCode, true);

    // Listen for joining online players
    Network.onPlayerJoin((conn, guestProfile) => {
      SFX.join();
      // Find first bot or empty seat to replace
      const replaceIdx = seats.findIndex((s, idx) => idx > 0 && (s.type === 'bot' || s.type === 'open'));
      if (replaceIdx !== -1) {
        seats[replaceIdx] = {
          type: 'online',
          conn,
          id: guestProfile.id,
          name: guestProfile.name,
          avatar: guestProfile.avatar
        };
      } else if (seats.length < gameConfig.maxPlayers) {
        seats.push({
          type: 'online',
          conn,
          id: guestProfile.id,
          name: guestProfile.name,
          avatar: guestProfile.avatar
        });
      }
      Toast.show(`👋 ${guestProfile.name} joined the room!`, 'ok');
      updateSeatsUI();
      // Sync seat list to all clients
      Network.send({ type: 'lobby_sync', seats: sanitizeSeats(seats) });
    });

    Network.onPlayerLeave((conn) => {
      const idx = seats.findIndex(s => s.conn === conn);
      if (idx !== -1) {
        const leftName = seats[idx].name;
        // Turn seat back to a bot so game can still proceed seamlessly
        seats[idx] = {
          type: 'bot',
          name: DEFAULT_BOT_NAMES[(idx - 1) % DEFAULT_BOT_NAMES.length],
          avatar: BOT_AVATARS[(idx - 1) % BOT_AVATARS.length],
          difficulty: 'medium'
        };
        Toast.show(`🏃 ${leftName} left. Replaced with bot.`, 'wa');
        updateSeatsUI();
        Network.send({ type: 'lobby_sync', seats: sanitizeSeats(seats) });
      }
    });
  }

  async function showGuestLobby(code) {
    renderGuestWaitingModal(code);
    try {
      await Network.joinRoom(code);
      Toast.show('Connected to host room!', 'ok');
      SFX.join();

      Network.onData((_, data) => {
        if (data.type === 'lobby_sync') {
          seats = data.seats;
          updateGuestSeatsUI();
        } else if (data.type === 'game_start') {
          closeLobby();
          if (onStartCallback) onStartCallback({ seats: data.seats, settings: data.settings, isHost: false });
        }
      });
    } catch(err) {
      Toast.show('Could not join room: ' + err.message, 'er');
    }
  }

  function sanitizeSeats(seatList) {
    return seatList.map(s => ({
      type: s.type,
      name: s.name,
      avatar: s.avatar,
      difficulty: s.difficulty || 'medium',
      id: s.id || null,
      isHost: s.isHost || false
    }));
  }

  function renderLobbyModal(roomCode, isHost) {
    closeLobby();
    modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay';
    modalEl.id = 'arcadeLobbyModal';
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 620px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h2 class="modal-title" style="margin:0;">⚙️ ${gameConfig.gameTitle} Room Setup</h2>
          <span class="game-player-badge" style="background:var(--cyan-pop); color:#002233; font-weight:800;">
            ${roomCode === 'LOCAL' ? '🤖 Solo Mode' : '🌐 Online Room'}
          </span>
        </div>

        ${roomCode !== 'LOCAL' ? `
          <!-- Share Link Box -->
          <div style="background: rgba(0,0,0,0.35); border: 2px dashed var(--yellow-pop); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 18px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--yellow-pop); text-transform: uppercase;">Room Code</div>
              <div style="font-size: 22px; font-weight: 900; letter-spacing: 1px;">${roomCode}</div>
            </div>
            <button class="candy-btn btn-yellow" id="copyInviteLinkBtn" style="padding: 8px 18px; font-size: 13px;">
              📋 Copy Invite Link
            </button>
          </div>
        ` : ''}

        <!-- Seats Customizer -->
        <div style="margin-bottom: 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label class="input-label" style="margin:0;">Players & Seats (<span id="seatCountDisplay">4</span>)</label>
            ${seats.length < gameConfig.maxPlayers ? `
              <button class="candy-btn btn-ghost" id="addBotSeatBtn" style="padding: 4px 12px; font-size: 12px;">+ Add Bot</button>
            ` : ''}
          </div>
          <div class="seats-list-grid" id="seatsListContainer">
            <!-- Injected Seat cards -->
          </div>
        </div>

        <!-- Custom House Rules Section -->
        ${gameConfig.customSettingsHTML ? `
          <div style="background: rgba(255,255,255,0.03); border: 2px solid var(--border-card); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px;">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 10px; color: var(--text-sub);">🛠️ Game Rules & Options</div>
            ${gameConfig.customSettingsHTML}
          </div>
        ` : ''}

        <div style="display:flex; gap:12px;">
          <button class="candy-btn btn-lime" id="startLobbyGameBtn" style="flex:1; padding:14px; font-size:18px;">
            🚀 Start Game
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
    updateSeatsUI();

    // Copy link handler
    const copyBtn = modalEl.querySelector('#copyInviteLinkBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const link = Network.getShareLink();
        navigator.clipboard.writeText(link).then(() => {
          SFX.pop();
          Toast.show('📋 Invite link copied to clipboard! Send to friends.', 'ok');
        }).catch(() => {
          prompt('Copy this invite link:', link);
        });
      });
    }

    // Add bot seat handler
    const addBotBtn = modalEl.querySelector('#addBotSeatBtn');
    if (addBotBtn) {
      addBotBtn.addEventListener('click', () => {
        if (seats.length < gameConfig.maxPlayers) {
          const nextIdx = seats.length;
          seats.push({
            type: 'bot',
            name: DEFAULT_BOT_NAMES[nextIdx % DEFAULT_BOT_NAMES.length],
            avatar: BOT_AVATARS[nextIdx % BOT_AVATARS.length],
            difficulty: 'medium'
          });
          SFX.pop();
          updateSeatsUI();
        }
      });
    }

    // Start game button
    modalEl.querySelector('#startLobbyGameBtn').addEventListener('click', () => {
      if (seats.length < gameConfig.minPlayers) {
        Toast.show(`Need at least ${gameConfig.minPlayers} players to start!`, 'er');
        return;
      }
      SFX.win();
      const settings = gameConfig.getCustomSettings();
      const finalSeats = sanitizeSeats(seats);

      // Broadcast start to online guests
      Network.send({ type: 'game_start', seats: finalSeats, settings });
      closeLobby();

      if (onStartCallback) {
        onStartCallback({ seats: finalSeats, settings, isHost: true });
      }
    });
  }

  function renderGuestWaitingModal(code) {
    closeLobby();
    modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay';
    modalEl.id = 'arcadeLobbyModal';
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 480px; text-align: center;">
        <h2 class="modal-title">Connecting to Room...</h2>
        <div style="font-size: 32px; font-weight: 900; color: var(--yellow-pop); margin-bottom: 12px;">${code}</div>
        <p style="color: var(--text-sub); margin-bottom: 20px;">Waiting for host to configure rules and start match...</p>
        
        <div class="seats-list-grid" id="guestSeatsList">
          <div style="color: var(--text-muted); padding: 20px;">Loading players...</div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  function updateGuestSeatsUI() {
    const cont = document.getElementById('guestSeatsList');
    if (!cont) return;
    cont.innerHTML = seats.map((s, idx) => `
      <div class="lobby-seat-card">
        <span style="font-size: 24px;">${s.avatar}</span>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:14px;">${s.name} ${s.isHost ? '👑 (Host)' : ''}</div>
          <div style="font-size:12px; color:var(--text-muted);">${s.type === 'bot' ? '🤖 Bot' : '👤 Player'}</div>
        </div>
      </div>
    `).join('');
  }

  function updateSeatsUI() {
    const cont = document.getElementById('seatsListContainer');
    if (!cont) return;
    document.getElementById('seatCountDisplay').textContent = seats.length;

    cont.innerHTML = seats.map((s, idx) => {
      const isHostSeat = (idx === 0);
      return `
        <div class="lobby-seat-card">
          <span style="font-size: 28px;">${s.avatar}</span>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 15px;">
              ${s.name} ${isHostSeat ? '<span style="color:var(--yellow-pop);">👑 (You)</span>' : ''}
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              ${s.type === 'bot' ? `🤖 Bot (${s.difficulty})` : (s.type === 'online' ? '🌐 Online Friend' : '👤 Local Host')}
            </div>
          </div>

          ${!isHostSeat ? `
            <div style="display:flex; gap:6px;">
              ${s.type === 'bot' ? `
                <select class="seat-diff-select" data-idx="${idx}" style="background:var(--bg-deep); color:#fff; border:1px solid var(--border-card); border-radius:6px; padding:4px 8px; font-size:12px;">
                  <option value="easy" ${s.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                  <option value="medium" ${s.difficulty === 'medium' ? 'selected' : ''}>Normal</option>
                  <option value="hard" ${s.difficulty === 'hard' ? 'selected' : ''}>Pro</option>
                </select>
              ` : ''}
              ${seats.length > gameConfig.minPlayers ? `
                <button class="remove-seat-btn" data-idx="${idx}" style="background:rgba(255,20,147,0.15); border:1px solid var(--pink-pop); color:var(--pink-pop); border-radius:6px; padding:4px 8px; font-size:12px; cursor:pointer;">❌</button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach difficulty changers
    cont.querySelectorAll('.seat-diff-select').forEach(sel => {
      sel.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        seats[idx].difficulty = e.target.value;
      });
    });

    // Attach remove seat buttons
    cont.querySelectorAll('.remove-seat-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(btn.dataset.idx);
        seats.splice(idx, 1);
        SFX.pop();
        updateSeatsUI();
      });
    });
  }

  function closeLobby() {
    if (modalEl) {
      modalEl.remove();
      modalEl = null;
    }
  }

  return {
    init,
    closeLobby,
    getSeats: () => seats
  };
})();
