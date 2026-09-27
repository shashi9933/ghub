/**
 * GameHub Arcade — Global Party & Multiplayer Lounge Engine
 * Manages active party sessions, player seats, AI bots, invite codes, and game launches.
 */

const PartyManager = (() => {
  const STORAGE_KEY = 'arcade_party_session';

  const BOT_ROSTER = [
    { name: 'RoboAce', avatar: '🤖' },
    { name: 'FoxyKing', avatar: '🦊' },
    { name: 'PandaPro', avatar: '🐼' },
    { name: 'LuckyCat', avatar: '🐱' },
    { name: 'CyberLion', avatar: '🦁' },
    { name: 'MagicBunny', avatar: '🐰' }
  ];

  function getParty() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse party session:', e);
    }
    return initDefaultParty();
  }

  function saveParty(party) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(party));
    window.dispatchEvent(new CustomEvent('party_updated', { detail: party }));
  }

  function initDefaultParty() {
    const prof = (window.Profile && window.Profile.get) ? window.Profile.get() : { id: 'p_host', name: 'Player', avatar: '🦊' };
    const party = {
      code: 'PARTY-' + Math.floor(1000 + Math.random() * 9000),
      isHost: true,
      members: [
        { id: prof.id || 'p_host', name: prof.name || 'You', avatar: prof.avatar || '🦊', isHost: true, isBot: false },
        { id: 'bot_1', name: 'RoboAce', avatar: '🤖', isHost: false, isBot: true },
        { id: 'bot_2', name: 'FoxyKing', avatar: '🦊', isHost: false, isBot: true },
        { id: 'bot_3', name: 'PandaPro', avatar: '🐼', isHost: false, isBot: true }
      ]
    };
    saveParty(party);
    return party;
  }

  function addBot() {
    const party = getParty();
    if (party.members.length >= 8) {
      if (window.Toast) window.Toast.show('Party is full! (Max 8 players)', 'wa');
      return party;
    }
    // Pick an unused bot name from roster
    const usedNames = new Set(party.members.map(m => m.name));
    const available = BOT_ROSTER.filter(b => !usedNames.has(b.name));
    const botTemplate = available.length > 0 ? available[0] : { name: `Bot ${party.members.length + 1}`, avatar: '🤖' };

    const newBot = {
      id: 'bot_' + Date.now() + '_' + Math.floor(Math.random() * 100),
      name: botTemplate.name,
      avatar: botTemplate.avatar,
      isHost: false,
      isBot: true
    };
    party.members.push(newBot);
    saveParty(party);
    if (window.Toast) window.Toast.show(`Added ${newBot.name} to party!`, 'ok');
    return party;
  }

  function removeMember(memberId) {
    const party = getParty();
    if (party.members.length <= 1) {
      if (window.Toast) window.Toast.show('Cannot remove the host!', 'wa');
      return party;
    }
    const idx = party.members.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      const removed = party.members.splice(idx, 1)[0];
      saveParty(party);
      if (window.Toast) window.Toast.show(`Removed ${removed.name} from party.`, 'inf');
    }
    return party;
  }

  function setMemberName(memberId, newName) {
    const party = getParty();
    const member = party.members.find(m => m.id === memberId);
    if (member && newName && newName.trim()) {
      member.name = newName.trim().slice(0, 15);
      saveParty(party);
    }
    return party;
  }

  function joinParty(code) {
    const prof = (window.Profile && window.Profile.get) ? window.Profile.get() : { id: 'p_' + Date.now(), name: 'Player', avatar: '🦊' };
    const party = {
      code: code.toUpperCase(),
      isHost: false,
      members: [
        { id: 'p_remote_host', name: 'Party Leader', avatar: '👑', isHost: true, isBot: false },
        { id: prof.id || 'p_me', name: prof.name || 'You', avatar: prof.avatar || '🦊', isHost: false, isBot: false },
        { id: 'bot_1', name: 'RoboAce', avatar: '🤖', isHost: false, isBot: true },
        { id: 'bot_2', name: 'FoxyKing', avatar: '🦊', isHost: false, isBot: true }
      ]
    };
    saveParty(party);
    if (window.Toast) window.Toast.show(`Joined party ${party.code}!`, 'ok');
    return party;
  }

  function copyInviteLink() {
    const party = getParty();
    const url = `${window.location.origin}${window.location.pathname}?party=${party.code}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.Toast) window.Toast.show('📋 Party invite link copied to clipboard!', 'ok');
      }).catch(() => {
        prompt('Copy your Party Invite Link:', url);
      });
    } else {
      prompt('Copy your Party Invite Link:', url);
    }
  }

  function launchGame(gamePage) {
    const party = getParty();
    saveParty(party);
    const target = `${gamePage}?party=${party.code}&partySize=${party.members.length}`;
    if (window.SFX && window.SFX.tap) window.SFX.tap();
    window.location.href = target;
  }

  return {
    getParty,
    saveParty,
    addBot,
    removeMember,
    setMemberName,
    joinParty,
    copyInviteLink,
    launchGame
  };
})();

if (typeof window !== 'undefined') {
  window.PartyManager = PartyManager;
}
