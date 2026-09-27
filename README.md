# 🎮 GameHub — Multiplayer Party Arcade

An All-in-One Instant Web Arcade featuring real-time multiplayer card and board games with vibrant Fall Guys-inspired party aesthetics. Play online with friends via instant room codes or play offline against smart AI bots. Zero downloads, zero accounts required.

---

## 🕹️ Games Included

### 🎴 1. Uno Party (`uno.html`)
- Classic 108-card Uno matching game (Red, Blue, Green, Yellow).
- Action cards: Skip (🚫), Reverse (🔄), Draw Two (+2).
- Wild cards: Wild (🌈), Wild Draw Four (+4) with interactive color selection.
- Tactical **UNO!** call button when down to 1 card.
- 2–4 Players with smart AI bots and room code multiplayer.

### ♠️ 2. Callbreak (कॉल ब्रेक - `callbreak.html`)
- Authentic South Asian 4-player trick-taking card game.
- **Spades (♠️)** are permanent trumps.
- Bidding phase: Predict exact tricks to win (1–13).
- Strict legal-move enforcement: Must follow led suit, beat highest card, or trump with Spade.
- Comprehensive 5-round scoreboard tracking running scores.

### 🃏 3. Texas Hold'em Poker (`poker.html`)
- Tournament No-Limit Texas Hold'em on a realistic green felt oval table.
- Secret 2-card hole hands + 5 community cards (Flop, Turn, River).
- Blinds (Small / Big), chip slider, Check, Call, Raise, Fold.
- Real-time 5-card poker hand strength evaluator (Flush, Straight, Full House, Two Pair, etc.).
- Bot AI with bluffing probabilities.

### 🪙 4. Blackjack 21 (`blackjack.html`)
- Casino classic table game against the dealer.
- Actions: Hit, Stand, Double Down.
- Chip trays ($25, $50, $100, $500).
- Natural Blackjack pays 3:2; Dealer stands on 17.

### 🔴 5. Connect 4 (`connect4.html`)
- 7 columns × 6 rows tactile vertical disc drop grid.
- Smooth gravity drop animations with physics clink SFX.
- Smart Minimax AI with alpha-beta pruning.
- 2-Player local pass & play.

---

## 🎨 Visual Design & Features

- **Fall Guys Party Aesthetic**: Chunky pill badges, bouncy candy buttons, vibrant gradients, and celebratory confetti.
- **Shared Player Profile (`shared/profile.js`)**: 16 customizable bean avatars (🦊, 🦁, 🐼, 🤖, 👑, etc.), custom nicknames, and cross-game coin bank.
- **Pure WebAudio Synthesizer (`shared/sfx.js`)**: Tactile card slides, chip clinks, disc drop clonks, victory fanfares, and Uno trumpet alerts without any external audio files.
- **Clean URL Routing (`vercel.json`)**: Direct routes for `/uno`, `/callbreak`, `/poker`, `/blackjack`, `/connect4`.

---

## 🚀 Running Locally

Open `index.html` in any web browser, or run a local dev server:
```bash
npx serve .
```
Or deploy instantly on Vercel:
```bash
vercel
```
