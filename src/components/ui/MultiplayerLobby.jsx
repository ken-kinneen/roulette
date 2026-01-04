import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './MultiplayerLobby.css';

export function MultiplayerLobby() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const roomCode = useGameStore((state) => state.roomCode);
  const opponentConnected = useGameStore((state) => state.opponentConnected);
  const connectionError = useGameStore((state) => state.connectionError);
  const isHost = useGameStore((state) => state.isHost);
  const createRoom = useGameStore((state) => state.createRoom);
  const joinRoom = useGameStore((state) => state.joinRoom);
  const startPvpGame = useGameStore((state) => state.startPvpGame);
  const leaveLobby = useGameStore((state) => state.leaveLobby);

  const [view, setView] = useState('menu'); // 'menu', 'host', 'join'
  const [joinCode, setJoinCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (gamePhase !== 'lobby') return null;

  const handleCreateRoom = async () => {
    setIsConnecting(true);
    try {
      await createRoom();
      setView('host');
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    
    setIsConnecting(true);
    try {
      await joinRoom(joinCode.trim().toUpperCase());
      setView('join');
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    if (isHost && opponentConnected) {
      startPvpGame();
    }
  };

  const handleBack = () => {
    if (view === 'menu') {
      leaveLobby();
    } else {
      setView('menu');
      leaveLobby();
    }
  };

  return (
    <div className="multiplayer-lobby">
      <div className="lobby-container">
        <h1 className="lobby-title">MULTIPLAYER</h1>

        {/* Menu View */}
        {view === 'menu' && (
          <div className="lobby-menu">
            <button 
              className="lobby-btn create-btn" 
              onClick={handleCreateRoom}
              disabled={isConnecting}
            >
              <span className="btn-icon">🎲</span>
              <span className="btn-text">CREATE ROOM</span>
              <span className="btn-subtitle">Host a game</span>
            </button>

            <div className="lobby-divider">
              <span>OR</span>
            </div>

            <div className="join-section">
              <input
                type="text"
                className="room-code-input"
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                maxLength={9}
              />
              <button 
                className="lobby-btn join-btn" 
                onClick={handleJoinRoom}
                disabled={isConnecting || !joinCode.trim()}
              >
                <span className="btn-text">JOIN ROOM</span>
              </button>
            </div>

            {connectionError && (
              <div className="error-message">{connectionError}</div>
            )}
          </div>
        )}

        {/* Host View */}
        {view === 'host' && (
          <div className="lobby-host">
            <div className="room-code-display">
              <span className="code-label">ROOM CODE</span>
              <div className="code-value">{roomCode}</div>
              <button 
                className="copy-btn" 
                onClick={handleCopyCode}
              >
                {copied ? '✓ COPIED' : '📋 COPY CODE'}
              </button>
            </div>

            <div className="connection-status">
              {opponentConnected ? (
                <>
                  <span className="status-icon connected">✓</span>
                  <span className="status-text">Opponent connected!</span>
                </>
              ) : (
                <>
                  <span className="status-icon waiting">⏳</span>
                  <span className="status-text">Waiting for opponent...</span>
                </>
              )}
            </div>

            {opponentConnected && (
              <button 
                className="lobby-btn start-btn" 
                onClick={handleStartGame}
              >
                <span className="btn-text">START GAME</span>
              </button>
            )}

            {connectionError && (
              <div className="error-message">{connectionError}</div>
            )}
          </div>
        )}

        {/* Join View */}
        {view === 'join' && (
          <div className="lobby-join">
            <div className="connection-status">
              {opponentConnected ? (
                <>
                  <span className="status-icon connected">✓</span>
                  <span className="status-text">Connected to host!</span>
                  <span className="status-subtext">Waiting for host to start...</span>
                </>
              ) : (
                <>
                  <span className="status-icon waiting">⏳</span>
                  <span className="status-text">Connecting...</span>
                </>
              )}
            </div>

            {connectionError && (
              <div className="error-message">{connectionError}</div>
            )}
          </div>
        )}

        <button className="back-btn" onClick={handleBack}>
          ← BACK
        </button>
      </div>
    </div>
  );
}

