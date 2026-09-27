/* ==========================================================================
   GAMEHUB UNIVERSAL WEBRTC PEERJS NETWORKING - NETWORK.JS
   Seamless P2P room hosting, client auto-joining, and state broadcasting
   ========================================================================== */
const Network = (() => {
  let peer = null;
  let connections = []; // For host: array of DataConnection to clients
  let hostConn = null;  // For client: DataConnection to host
  let roomCode = null;
  let isHost = false;
  let myPeerId = null;

  // Event handlers
  let onPlayerJoinCb = null;
  let onPlayerLeaveCb = null;
  let onDataCb = null;
  let onConnectedCb = null;

  function initPeer(customId = null) {
    return new Promise((resolve, reject) => {
      if (peer && !peer.destroyed) {
        return resolve(peer);
      }

      const id = customId || ('gh_' + Math.random().toString(36).substring(2, 8));
      peer = new Peer(id, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('open', (id) => {
        myPeerId = id;
        resolve(peer);
      });

      peer.on('error', (err) => {
        console.warn('Peer error:', err);
        // If ID taken, retry with randomized ID
        if (err.type === 'unavailable-id') {
          setTimeout(() => initPeer().then(resolve).catch(reject), 500);
        } else {
          reject(err);
        }
      });
    });
  }

  // Host creates a room code like "UNO-9281"
  async function createRoom(gamePrefix = 'GH') {
    isHost = true;
    connections = [];
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    roomCode = `${gamePrefix}-${randDigits}`;
    const peerId = `gh_${roomCode.toLowerCase()}`;

    await initPeer(peerId);

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        connections.push(conn);
        conn.on('data', (data) => {
          if (data && data.type === 'player_profile') {
            if (onPlayerJoinCb) onPlayerJoinCb(conn, data.profile);
          } else {
            if (onDataCb) onDataCb(conn, data);
          }
        });
        conn.on('close', () => {
          connections = connections.filter(c => c !== conn);
          if (onPlayerLeaveCb) onPlayerLeaveCb(conn);
        });
      });
    });

    return roomCode;
  }

  // Guest joins a room code
  async function joinRoom(targetCode) {
    isHost = false;
    roomCode = targetCode.toUpperCase().trim();
    const hostPeerId = `gh_${roomCode.toLowerCase()}`;

    await initPeer();

    return new Promise((resolve, reject) => {
      const conn = peer.connect(hostPeerId, { reliable: true });
      const timeout = setTimeout(() => {
        reject(new Error('Connection timed out. Check room code.'));
      }, 9000);

      conn.on('open', () => {
        clearTimeout(timeout);
        hostConn = conn;

        // Send local player profile to host
        const prof = Profile.get();
        conn.send({ type: 'player_profile', profile: prof });

        conn.on('data', (data) => {
          if (onDataCb) onDataCb(null, data);
        });

        conn.on('close', () => {
          Toast.show('⚠️ Disconnected from host room.', 'er');
          if (onPlayerLeaveCb) onPlayerLeaveCb(null);
        });

        if (onConnectedCb) onConnectedCb();
        resolve(conn);
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  // Broadcast data (Host sends to all guests; Guest sends to host)
  function send(data) {
    if (isHost) {
      connections.forEach(conn => {
        if (conn.open) conn.send(data);
      });
    } else if (hostConn && hostConn.open) {
      hostConn.send(data);
    }
  }

  function getShareLink() {
    if (!roomCode) return window.location.href;
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    return url.toString();
  }

  return {
    createRoom,
    joinRoom,
    send,
    getShareLink,
    getRoomCode: () => roomCode,
    isHost: () => isHost,
    onPlayerJoin: (cb) => { onPlayerJoinCb = cb; },
    onPlayerLeave: (cb) => { onPlayerLeaveCb = cb; },
    onData: (cb) => { onDataCb = cb; },
    onConnected: (cb) => { onConnectedCb = cb; }
  };
})();
