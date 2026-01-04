# Online Multiplayer Guide

## Overview
Your Russian Roulette game now supports **online PvP multiplayer** using peer-to-peer WebRTC connections via PeerJS. No server setup required!

## How It Works

### Architecture
- **PeerJS**: Handles WebRTC signaling and peer-to-peer connections
- **Host-Guest Model**: One player hosts, the other joins
- **Host as Authority**: The host controls game state (bullet position, deck order) to prevent cheating
- **Direct P2P**: Game data flows directly between browsers (low latency)

### Game Flow

1. **Start Screen**: Players choose "VS VLAD" (solo) or "VS FRIEND" (multiplayer)

2. **Multiplayer Lobby**:
   - **Host**: Click "CREATE ROOM" → Get a room code (e.g., `RR-ABC123`) → Share with friend
   - **Guest**: Enter room code → Click "JOIN ROOM"
   - Both players see "Connected!" status
   - Host clicks "START GAME" when ready

3. **Gameplay**:
   - Players take turns guessing Hi-Lo on cards
   - Wrong guess = you pull the trigger
   - Right guess = opponent pulls the trigger
   - **Single elimination**: First to get shot loses
   - Game state syncs automatically between players

4. **Game Over**:
   - Winner sees "VICTORY! 🏆"
   - Loser sees "DEFEAT 💀"
   - Click "BACK TO MENU" to play again

## Key Features

### Room Codes
- Format: `RR-XXXXXX` (6 random characters)
- Easy to share via Discord, text, etc.
- No confusing characters (no 0/O, I/1)

### Synchronization
- Host controls all randomness (bullet position, card deck)
- Guest sends moves to host
- Host broadcasts full game state to guest
- Automatic sync on every state change

### UI Updates
- "YOU" vs "OPPONENT" labels in PvP mode
- "Waiting for opponent..." when it's their turn
- No lives display (single elimination)
- Victory/defeat screens with unique messages

## Files Created/Modified

### New Files
- `src/utils/peerConnection.js` - PeerJS wrapper for WebRTC
- `src/components/ui/MultiplayerLobby.jsx` - Room creation/joining UI
- `src/components/ui/MultiplayerLobby.css` - Lobby styling

### Modified Files
- `src/stores/gameStore.js` - Added PvP state and sync logic
- `src/components/ui/StartScreen.jsx` - Added mode selection buttons
- `src/components/ui/StartScreen.css` - Styled multiplayer button
- `src/components/ui/GamePanel.jsx` - PvP labels and waiting states
- `src/components/ui/GameOverScreen.jsx` - Victory/defeat display
- `src/components/ui/GameOverScreen.css` - PvP result styling
- `src/App.jsx` - Added MultiplayerLobby component

## Testing

### Local Testing
1. Open two browser windows/tabs
2. Window 1: Click "VS FRIEND" → "CREATE ROOM"
3. Copy the room code
4. Window 2: Click "VS FRIEND" → Enter code → "JOIN ROOM"
5. Window 1: Click "START GAME"
6. Play!

### Remote Testing (with friend)
1. Both players open the game URL
2. One creates a room, shares code via Discord/text
3. Other joins with the code
4. Host starts the game

## Troubleshooting

### Connection Issues
- **"Failed to connect"**: Check if both players have stable internet
- **"Opponent disconnected"**: Connection dropped - refresh and try again
- **Room code not working**: Make sure it's entered exactly (case-insensitive)

### Firewall/Network
- PeerJS uses WebRTC which works through most firewalls
- If issues persist, try a different network or use a VPN

### Browser Compatibility
- Works best in Chrome, Firefox, Edge
- Safari may have WebRTC limitations

## Future Enhancements (Optional)
- Player names in lobby
- Rematch button
- Chat system
- Spectator mode
- Multiple rounds (best of 3)
- Connection quality indicator

## Technical Notes

### Why Host-Authority?
Prevents cheating - guest can't manipulate bullet position or card order. Host computes all randomness and syncs results.

### Why PeerJS?
- Free public signaling server
- Simple API
- Reliable WebRTC abstraction
- No backend required

### State Sync Strategy
- Host sends full state on every change
- Guest receives and applies state
- Guest only sends their moves (guesses)
- Trigger sequences sync phase-by-phase for dramatic effect

Enjoy playing with your friends! 🎲🔫

