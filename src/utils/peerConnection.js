import Peer from 'peerjs';

// Singleton peer connection manager
class PeerConnectionManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.roomCode = null;
        this.onStateChangeCallback = null;
        this.onConnectionCallback = null;
        this.onDisconnectCallback = null;
        this.onErrorCallback = null;
    }

    // Generate a readable room code
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, I, 1
        let code = 'RR-'; // RR = Russian Roulette
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Host creates a room
    async createRoom() {
        return new Promise((resolve, reject) => {
            this.isHost = true;
            this.roomCode = this.generateRoomCode();

            // Create peer with custom ID (room code)
            this.peer = new Peer(this.roomCode, {
                debug: 2, // Enable debug logs
            });

            this.peer.on('open', (id) => {
                console.log('Room created with code:', id);
                resolve(this.roomCode);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (this.onErrorCallback) {
                    this.onErrorCallback(err);
                }
                reject(err);
            });

            // Listen for incoming connections (guest joining)
            this.peer.on('connection', (conn) => {
                console.log('Guest connected!');
                this.connection = conn;
                this.setupConnectionHandlers();
                
                if (this.onConnectionCallback) {
                    this.onConnectionCallback();
                }
            });
        });
    }

    // Guest joins a room
    async joinRoom(roomCode) {
        return new Promise((resolve, reject) => {
            this.isHost = false;
            this.roomCode = roomCode;

            // Create peer with random ID
            this.peer = new Peer({
                debug: 2,
            });

            this.peer.on('open', (id) => {
                console.log('Peer opened with ID:', id);
                
                // Connect to host
                this.connection = this.peer.connect(roomCode);
                this.setupConnectionHandlers();

                this.connection.on('open', () => {
                    console.log('Connected to host!');
                    if (this.onConnectionCallback) {
                        this.onConnectionCallback();
                    }
                    resolve();
                });

                this.connection.on('error', (err) => {
                    console.error('Connection error:', err);
                    if (this.onErrorCallback) {
                        this.onErrorCallback(err);
                    }
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (this.onErrorCallback) {
                    this.onErrorCallback(err);
                }
                reject(err);
            });
        });
    }

    // Setup handlers for the connection
    setupConnectionHandlers() {
        if (!this.connection) return;

        this.connection.on('data', (data) => {
            console.log('Received data:', data);
            
            if (data.type === 'gameState' && this.onStateChangeCallback) {
                this.onStateChangeCallback(data.state);
            }
        });

        this.connection.on('close', () => {
            console.log('Connection closed');
            if (this.onDisconnectCallback) {
                this.onDisconnectCallback();
            }
        });

        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
            if (this.onErrorCallback) {
                this.onErrorCallback(err);
            }
        });
    }

    // Send game state to peer
    sendGameState(state) {
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'gameState',
                state: state,
                timestamp: Date.now(),
            });
        } else {
            console.warn('Cannot send state: connection not open');
        }
    }

    // Register callback for receiving game state
    onGameState(callback) {
        this.onStateChangeCallback = callback;
    }

    // Register callback for connection established
    onConnection(callback) {
        this.onConnectionCallback = callback;
    }

    // Register callback for disconnection
    onDisconnect(callback) {
        this.onDisconnectCallback = callback;
    }

    // Register callback for errors
    onError(callback) {
        this.onErrorCallback = callback;
    }

    // Check if connected
    isConnected() {
        return this.connection && this.connection.open;
    }

    // Disconnect and cleanup
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.isHost = false;
        this.roomCode = null;
        this.onStateChangeCallback = null;
        this.onConnectionCallback = null;
        this.onDisconnectCallback = null;
        this.onErrorCallback = null;
    }
}

// Export singleton instance
export const peerManager = new PeerConnectionManager();

