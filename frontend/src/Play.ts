// ============================================================================
// IMPORTS
// ============================================================================
import AView from "./AView.js";
import { showNotification } from '../dist/notification.js';
import App from '../dist/game/App.js';
import WebSocketClient from '../dist/game/network/WebSocketClient.js';
import gameConfig from '../dist/game/json/GameConfig.js';
import aiConfig from '../dist/game/json/AiConfig.js';
import tournamentConfig from '../dist/game/json/TournamentConfig.js';

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let app: App | null = null;
let roomSocket: any = null;
let currentUserId: string | null = null;
let currentUserName: string | null = null;

// Window interface'ini genişletin
declare global {
    interface Window {
        roomSocket?: WebSocketClient;
        app?: App;
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate random user ID for testing
function generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
}

// Generate random user name for testing
function generateRandomName() {
    const names = ['Ali', 'Ayşe', 'Mehmet', 'Fatma', 'Ahmet', 'Zeynep', 'Can', 'Elif', 'Burak', 'Selin',
                   'Ali1', 'Ayşe1', 'Mehmet1', 'Fatma1', 'Ahmet1', 'Zeynep1', 'Can1', 'Elif1', 'Burak1', 'Selin1',
                   'Ali2', 'Ayşe2', 'Mehmet2', 'Fatma2', 'Ahmet2', 'Zeynep2', 'Can2', 'Elif2', 'Burak2', 'Selin2',
                   'Ali3', 'Ayşe3', 'Mehmet3', 'Fatma3', 'Ahmet3', 'Zeynep3', 'Can3', 'Elif3', 'Burak3', 'Selin3'
	];
    return names[Math.floor(Math.random() * names.length)];
}

// displayMatchPairs fonksiyonunu güncelle
function displayMatchPairs(pairs, participants) {
    const matchPairsSection = document.getElementById('match-pairs-section');
    const matchPairsContainer = document.getElementById('match-pairs-container');

    // Eğer next-round-pairs-container varsa onu kullan
    const isNextRound = !matchPairsSection;
    const container = isNextRound ?
        document.getElementById('next-round-pairs-container') :
        matchPairsContainer;

    if (!container) {
        console.error('Match pairs container not found!');
        return;
    }

    if (matchPairsSection && !isNextRound) {
        matchPairsSection.style.display = 'block';
    }

    container.innerHTML = '';

    // Katılımcı bilgilerini ID'ye göre hızlı erişim için map'le
    const participantsMap = {};
    console.log('Participants for match pairs:', participants);

    if (participants && Array.isArray(participants)) {
        participants.forEach(p => {
            const playerId = p.userId || p.id;
            if (playerId) {
                participantsMap[playerId] = p;
            }
        });
    }

    console.log('Participants map:', participantsMap);
    console.log('Match pairs to display:', pairs);

    // Her eşleşme için kart oluştur
    pairs.forEach((pair, index) => {
        const colors = [
            { border: '#00ffff', bg: 'rgba(0, 255, 255, 0.1)' },
            { border: '#ff00ff', bg: 'rgba(255, 0, 255, 0.1)' },
            { border: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
            { border: '#ff8800', bg: 'rgba(255, 136, 0, 0.1)' }
        ];
        const color = colors[index % colors.length];

        const card = document.createElement('div');
        card.className = 'match-pair-card';
        card.style.borderColor = color.border;
        card.style.background = color.bg;

        // Maç başlığı
        const header = document.createElement('div');
        header.className = 'match-header';
        const matchNum = pair.matchNumber !== undefined ? pair.matchNumber + 1 : index + 1;
        header.innerHTML = `<div class="match-number">Maç ${matchNum}</div>`;

        // Oyuncular
        const players = document.createElement('div');
        players.className = 'match-players';

        // Player names - önce pair.playerNames'i kontrol et, yoksa participantsMap'ten al
        let player1Name = 'Unknown';
        let player2Name = 'Unknown';

        if (pair.playerNames && pair.playerNames.length >= 2) {
            player1Name = pair.playerNames[0];
            player2Name = pair.playerNames[1];
        } else if (pair.players && pair.players.length >= 2) {
            const p1 = participantsMap[pair.players[0]];
            const p2 = participantsMap[pair.players[1]];
            player1Name = p1 ? (p1.name || p1.userName || 'Unknown') : 'Unknown';
            player2Name = p2 ? (p2.name || p2.userName || 'Unknown') : 'Unknown';
        }

        console.log(`Match ${matchNum}: ${player1Name} vs ${player2Name}`);

        // İlk oyuncu - winner/loser durumuna göre stil ekle
        const player1 = document.createElement('div');
        player1.className = 'match-player';
        if (pair.winner === pair.players[0]) {
            player1.classList.add('winner');
            player1.style.borderColor = '#00ff88';
            player1.style.background = 'rgba(0, 255, 136, 0.2)';
        } else if (pair.loser === pair.players[0]) {
            player1.classList.add('loser');
            player1.style.opacity = '0.7';
        }

        player1.innerHTML = `
            <div class="match-player-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" fill="${color.border}">
                    <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM171.7 396.1C166 382 177.4 368 192.6 368L447.5 368C462.7 368 474.1 382 468.4 396.1C444.6 454.7 387.2 496 320.1 496C253 496 195.5 454.7 171.8 396.1zM186.7 207.3C191.2 200.5 200 198.1 207.3 201.8L286.9 241.8C292.3 244.5 295.7 250 295.7 256.1C295.7 262.2 292.3 267.7 286.9 270.4L207.3 310.4C200 314 191.2 311.7 186.7 304.9C182.2 298.1 183.6 289 189.8 283.8L223 256L189.8 228.3C183.6 223.1 182.2 214 186.7 207.2zM450.3 228.4L417 256L450.2 283.7C456.4 288.9 457.8 298 453.3 304.8C448.8 311.6 440 314 432.7 310.3L353.1 270.3C347.7 267.6 344.3 262.1 344.3 256C344.3 249.9 347.7 244.4 353.1 241.7L432.7 201.7C440 198.1 448.8 200.4 453.3 207.2C457.8 214 456.4 223.1 450.2 228.3z"/>
                </svg>
            </div>
            <div class="match-player-name">${player1Name}</div>
            ${pair.winner === pair.players[0] ? '<div class="winner-badge">🏆</div>' : ''}
        `;

        // VS yazısı
        const vs = document.createElement('div');
        vs.className = 'vs-divider';
        vs.innerHTML = `<span class="vs-text">VS</span>`;

        // İkinci oyuncu - winner/loser durumuna göre stil ekle
        const player2 = document.createElement('div');
        player2.className = 'match-player';
        if (pair.winner === pair.players[1]) {
            player2.classList.add('winner');
            player2.style.borderColor = '#00ff88';
            player2.style.background = 'rgba(0, 255, 136, 0.2)';
        } else if (pair.loser === pair.players[1]) {
            player2.classList.add('loser');
            player2.style.opacity = '0.7';
        }

        player2.innerHTML = `
            <div class="match-player-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" fill="${color.border}">
                    <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM171.7 396.1C166 382 177.4 368 192.6 368L447.5 368C462.7 368 474.1 382 468.4 396.1C444.6 454.7 387.2 496 320.1 496C253 496 195.5 454.7 171.8 396.1zM186.7 207.3C191.2 200.5 200 198.1 207.3 201.8L286.9 241.8C292.3 244.5 295.7 250 295.7 256.1C295.7 262.2 292.3 267.7 286.9 270.4L207.3 310.4C200 314 191.2 311.7 186.7 304.9C182.2 298.1 183.6 289 189.8 283.8L223 256L189.8 228.3C183.6 223.1 182.2 214 186.7 207.2zM450.3 228.4L417 256L450.2 283.7C456.4 288.9 457.8 298 453.3 304.8C448.8 311.6 440 314 432.7 310.3L353.1 270.3C347.7 267.6 344.3 262.1 344.3 256C344.3 249.9 347.7 244.4 353.1 241.7L432.7 201.7C440 198.1 448.8 200.4 453.3 207.2C457.8 214 456.4 223.1 450.2 228.3z"/>
                </svg>
            </div>
            <div class="match-player-name">${player2Name}</div>
            ${pair.winner === pair.players[1] ? '<div class="winner-badge">🏆</div>' : ''}
        `;

        players.appendChild(player1);
        players.appendChild(vs);
        players.appendChild(player2);

        card.appendChild(header);
        card.appendChild(players);
        container.appendChild(card);
    });

    // Katılımcıları eşleşme renklerine göre güncelle (sadece ilk eşleştirmede)
    if (!isNextRound && participants) {
        updateParticipants(participants, 'participants-grid', pairs);
    }
}

interface MatchPair {
  players: string[]; // veya number[] — senin verine göre değiştir
}

interface Participant {
    id: string;
    name: string;
    isHost?: boolean;
    isAI?: boolean;
    userId?: string; // Opsiyonel olarak eklendi
    userName?: string; // Opsiyonel olarak eklendi
}

// updateParticipants fonksiyonunu güncelle
function updateParticipants(
    participants: Participant[],
    gridId: string,
    matchPairs?: MatchPair[] | null,
    multiplayerMode?: boolean
): void {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '';

    // Eşleştirme yapıldıysa renk eşleştirmelerini oluştur
    const matchColors = {};

    if (matchPairs) {
        matchPairs.forEach((pair, index) => {
            const colors = [
                { border: '#00ffff', bg: 'rgba(0, 255, 255, 0.1)' },
                { border: '#ff00ff', bg: 'rgba(255, 0, 255, 0.1)' },
                { border: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
                { border: '#ff8800', bg: 'rgba(255, 136, 0, 0.1)' }
            ];
            const color = colors[index % colors.length];

            pair.players.forEach(playerId => {
                matchColors[playerId] = color;
            });
        });
    }

    if (multiplayerMode) {
        const team1 = [participants[0], participants[2]];
        const team2 = [participants[1], participants[3]];
        const teamColors = [
            { border: '#00ffff', bg: 'rgba(0, 255, 255, 0.1)' },
            { border: '#ff00ff', bg: 'rgba(255, 0, 255, 0.1)' }
        ];

        team1.forEach(p => {
            matchColors[p?.id] = teamColors[0];
        });
        team2.forEach(p => {
            matchColors[p?.id] = teamColors[1];
        });
    }

    // --- Katılımcıları oluştur ---
    participants.forEach((participant, index) => {
        const card = document.createElement('div');
        card.className = 'participant-card';

        // DÜZELTME: userId yerine id kullan
        const participantId = participant.userId || participant.id;

        // Eşleştirme yapıldıysa o rengi kullan, yoksa sırayla renk ver
        let color;
        if (matchColors[participantId]) {
            color = matchColors[participantId];
            card.classList.add('matched');
        } else {
            const colors = [
                { border: '#00ffff', bg: 'rgba(0, 255, 255, 0.1)' },
                { border: '#ff00ff', bg: 'rgba(255, 0, 255, 0.1)' },
                { border: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
                { border: '#ff8800', bg: 'rgba(255, 136, 0, 0.1)' }
            ];
            color = colors[index % colors.length];
        }

        card.style.borderColor = color.border;
        card.style.background = color.bg;

        // --- Katılımcı ikonu ---
        const icon = document.createElement('div');
        icon.className = 'participant-icon';

        if (participant.isAI) {
            icon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
                     width="26" height="26" fill="${color.border}">
                    <path d="M352 64C352 46.3 337.7 32 320 32C302.3 32 288 46.3 288 64L288 128L192 128C139 128 96 171 96 224L96 448C96 501 139 544 192 544L448 544C501 544 544 501 544 448L544 224C544 171 501 128 448 128L352 128L352 64zM160 432C160 418.7 170.7 408 184 408L216 408C229.3 408 240 418.7 240 432C240 445.3 229.3 456 216 456L184 456C170.7 456 160 445.3 160 432zM280 432C280 418.7 290.7 408 304 408L336 408C349.3 408 360 418.7 360 432C360 445.3 349.3 456 336 456L304 456C290.7 456 280 445.3 280 432zM400 432C400 418.7 410.7 408 424 408L456 408C469.3 408 480 418.7 480 432C480 445.3 469.3 456 456 456L424 456C410.7 456 400 445.3 400 432zM224 240C250.5 240 272 261.5 272 288C272 314.5 250.5 336 224 336C197.5 336 176 314.5 176 288C176 261.5 197.5 240 224 240zM368 288C368 261.5 389.5 240 416 240C442.5 240 464 261.5 464 288C464 314.5 442.5 336 416 336C389.5 336 368 314.5 368 288zM64 288C64 270.3 49.7 256 32 256C14.3 256 0 270.3 0 288L0 384C0 401.7 14.3 416 32 416C49.7 416 64 401.7 64 384L64 288zM608 256C590.3 256 576 270.3 576 288L576 384C576 401.7 590.3 416 608 416C625.7 416 640 401.7 640 384L640 288C640 270.3 625.7 256 608 256z"/>
                </svg>
            `;
        } else {
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="26" height="26" fill="${color.border}"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM171.7 396.1C166 382 177.4 368 192.6 368L447.5 368C462.7 368 474.1 382 468.4 396.1C444.6 454.7 387.2 496 320.1 496C253 496 195.5 454.7 171.8 396.1zM186.7 207.3C191.2 200.5 200 198.1 207.3 201.8L286.9 241.8C292.3 244.5 295.7 250 295.7 256.1C295.7 262.2 292.3 267.7 286.9 270.4L207.3 310.4C200 314 191.2 311.7 186.7 304.9C182.2 298.1 183.6 289 189.8 283.8L223 256L189.8 228.3C183.6 223.1 182.2 214 186.7 207.2zM450.3 228.4L417 256L450.2 283.7C456.4 288.9 457.8 298 453.3 304.8C448.8 311.6 440 314 432.7 310.3L353.1 270.3C347.7 267.6 344.3 262.1 344.3 256C344.3 249.9 347.7 244.4 353.1 241.7L432.7 201.7C440 198.1 448.8 200.4 453.3 207.2C457.8 214 456.4 223.1 450.2 228.3z"/></svg>`;
        }

        // --- Katılımcı ismi ---
        const name = document.createElement('div');
        name.className = 'participant-name';
        name.textContent = participant.name || participant.userName || 'Player';

        // --- Host tacı ekle ---
        if (participant.isHost === true) {
            const hostBadge = document.createElement('div');
            hostBadge.className = 'host-badge';
            hostBadge.style.cssText = `
                display: inline-flex;
                margin-left: 8px;
                vertical-align: middle;
            `;
            hostBadge.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="16" height="16" fill="${color.border}">
                    <path d="M345 151.2C354.2 143.9 360 132.6 360 120C360 97.9 342.1 80 320 80C297.9 80 280 97.9 280 120C280 132.6 285.9 143.9 295 151.2L226.6 258.8C216.6 274.5 195.3 278.4 180.4 267.2L120.9 222.7C125.4 216.3 128 208.4 128 200C128 177.9 110.1 160 88 160C65.9 160 48 177.9 48 200C48 221.8 65.5 239.6 87.2 240L119.8 457.5C124.5 488.8 151.4 512 183.1 512L456.9 512C488.6 512 515.5 488.8 520.2 457.5L552.8 240C574.5 239.6 592 221.8 592 200C592 177.9 574.1 160 552 160C529.9 160 512 177.9 512 200C512 208.4 514.6 216.3 519.1 222.7L459.7 267.3C444.8 278.5 423.5 274.6 413.5 258.9L345 151.2z"/>
                </svg>
            `;
            name.appendChild(hostBadge);

            // Add a tooltip for the crown
            const tooltip = document.createElement('span');
            tooltip.className = 'host-tooltip';
            tooltip.textContent = 'Oda Sahibi';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                pointer-events: none;
                z-index: 100;
            `;
            hostBadge.appendChild(tooltip);

            // Show tooltip on hover
            hostBadge.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            });

            hostBadge.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            });

            // Add a subtle glow effect to the host card
            card.style.boxShadow = `0 0 15px ${color.border}`;
        }

        card.appendChild(icon);
        card.appendChild(name);
        grid.appendChild(card);
    });
}

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

// handleWebSocketMessage fonksiyonunu güncelle
function handleWebSocketMessage(message) {
    console.log('📨 Received message:', message);

    switch (message.type) {
        case "created":
            handleRoomCreated(message.payload);
            break;

        case "joined":
            handleRoomJoined(message.payload);
            break;

        case "update":
            handleRoomUpdate(message.payload);
            break;

        case "started":
            handleGameStarted(message.payload);
            break;

        case "finished":
            // Tüm finished mesajları handleGameFinished'e gider
            // O fonksiyon içinde tournament kontrolü yapılır
            handleGameFinished(message.payload);
            break;

        case "matchReady":
            console.log('🎲 Match pairs ready message received');
            const transformedData = transformMatchmakingData(message.payload);
            handleMatchReady(transformedData);
            break;

        case "error":
            handleError(message.payload);
            break;

        default:
            console.warn('⚠️ Unhandled message type:', message.type);
    }
}

// handleMatchReady fonksiyonunu güncelle
function handleMatchReady(payload) {
    console.log('🎲 Match pairs ready:', payload);

    if (!payload.matchPairs || !Array.isArray(payload.matchPairs) || payload.matchPairs.length === 0) {
        console.error('Invalid match pairs data:', payload);
        showNotification('Eşleştirme verisi geçersiz!', 'error');
        return;
    }

    displayMatchPairs(payload.matchPairs, payload.players);

    const statusDisplay = document.getElementById('tournament-status-display');
    if (statusDisplay) {
        statusDisplay.textContent = payload.tournamentStatus || 'Eşleşmeler Hazır';
    }

    // DÜZELTME: id kullan, userId değil
    const isHost = payload.players && payload.players.some(player => player.id === currentUserId && player.isHost);

    const waitingBtn = document.getElementById('waiting-players-btn');
    const matchBtn = document.getElementById('match-players-btn');
    const startBtn = document.getElementById('start-tournament-btn');

    if (isHost) {
        if (waitingBtn) waitingBtn.style.display = 'none';
        if (matchBtn) matchBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'block';
    } else {
        if (waitingBtn) {
            waitingBtn.style.display = 'block';
            waitingBtn.textContent = '⏳ Turnuva Başlatılıyor...';
        }
        if (matchBtn) matchBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'none';
    }

    showNotification('Eşleştirmeler tamamlandı!', 'success');
}

// transformMatchmakingData

interface Player {
  id: string;
  name: string;
  isHost?: boolean;
}

interface Match {
  matchNumber?: number;
  player1?: Player | null;
  player2?: Player | null;
  winner?: string | null;
  loser?: string | null;
}

interface Round {
	round: number;
	matchs: Match[];
}

interface MatchmakingData {
	match?: Match[];
	rounds?: Round[];
	currentRound?: number;
	players?: Player[];
	status?: string;
	maxPlayers?: number;
	gameMode?: string;
}

interface TransformedMatchPair {
  matchNumber: number;
  players: string[];
  playerNames: string[];
  winner: string | null;
  loser: string | null;
}

interface TransformedData {
  matchPairs: TransformedMatchPair[];
  players: {
    userId: string;
    name: string;
    isHost: boolean;
  }[];
  tournamentStatus: string;
}

export function transformMatchmakingData(data: MatchmakingData | null | undefined): TransformedData {
  console.log('🔄 Transforming matchmaking data:', data);

  if (!data) {
    console.error('No data provided');
    return { matchPairs: [], players: [], tournamentStatus: 'Hazırlanıyor' };
  }

  // Match dizisini al
  let matches: Match[] = [];

  if (data.match && Array.isArray(data.match)) {
    matches = data.match;
    console.log('✅ Found direct match array:', matches);
  } else if (data.rounds && Array.isArray(data.rounds)) {
    const currentRoundIndex = data.currentRound ?? 0;
    const currentRound =
      data.rounds.find((r) => r.round === currentRoundIndex) || data.rounds[0];
    matches = currentRound?.matchs || [];
    console.log('✅ Found matches in rounds:', matches);
  }

  if (!matches || matches.length === 0) {
    console.error('No matches found in data');
    return { matchPairs: [], players: [], tournamentStatus: 'Hazırlanıyor' };
  }

  // Tüm oyuncuları topla
  const allPlayers: { userId: string; name: string; isHost: boolean }[] = [];
  const playerMap = new Map<string, { userId: string; name: string; isHost: boolean }>();

  // Players dizisinden oyuncuları al
  if (data.players && Array.isArray(data.players)) {
    data.players.forEach((player) => {
      if (player && player.id && !playerMap.has(player.id)) {
        const newPlayer = {
          userId: player.id,
          name: player.name,
          isHost: player.isHost ?? false,
        };
        playerMap.set(player.id, newPlayer);
        allPlayers.push(newPlayer);
      }
    });
  }

  // Match'lerden de oyuncuları ekle
  matches.forEach((match) => {
    const p1 = match.player1;
    const p2 = match.player2;

    if (p1 && p1.id && !playerMap.has(p1.id)) {
      const newPlayer = {
        userId: p1.id,
        name: p1.name,
        isHost: p1.isHost ?? false,
      };
      playerMap.set(p1.id, newPlayer);
      allPlayers.push(newPlayer);
    }

    if (p2 && p2.id && !playerMap.has(p2.id)) {
      const newPlayer = {
        userId: p2.id,
        name: p2.name,
        isHost: p2.isHost ?? false,
      };
      playerMap.set(p2.id, newPlayer);
      allPlayers.push(newPlayer);
    }
  });

  console.log('📋 All players collected:', allPlayers);

  // Eşleştirmeleri dönüştür
  const matchPairs: TransformedMatchPair[] = matches.map((match, index) => {
    const player1 = match.player1 || { id: 'unknown', name: 'Unknown' };
    const player2 = match.player2 || { id: 'unknown', name: 'Unknown' };

    return {
      matchNumber: match.matchNumber ?? index,
      players: [player1.id, player2.id],
      playerNames: [player1.name, player2.name],
      winner: match.winner ?? null,
      loser: match.loser ?? null,
    };
  });

  console.log('✅ Match pairs transformed:', matchPairs);

  return {
    matchPairs,
    players: allPlayers,
    tournamentStatus:
      data.status === 'ready2start' ? 'Eşleşmeler Hazır' : 'Hazırlanıyor',
  };
}

function handleRoomCreated(payload) {
    console.log('✅ Room created:', payload);
    currentRoomId = payload.roomId;

    showNotification(`Oda oluşturuldu: ${payload.roomId}`, 'success');

    // Show appropriate waiting room
    if (currentGameMode === 'tournament') {
        showTournamentWaitingRoom(payload);
    } else if (currentGameMode === 'ai') {
        showAIWaitingRoom(payload);
    } else {
        showCustomWaitingRoom(payload);
    }
}

function handleRoomJoined(payload) {
    console.log('✅ Joined room:', payload);
    currentRoomId = payload.roomId;

    showNotification(`Odaya katıldınız: ${payload.roomId}`, 'success');

    // Show appropriate waiting room
    if (payload.gameMode === 'tournament') {
        showTournamentWaitingRoom(payload);
    } else {
        showCustomWaitingRoom(payload);
    }
}

// handleRoomUpdate fonksiyonunu güncelle
export function handleRoomUpdate(payload: MatchmakingData): void {
  console.log('🔄 Room update:', payload);

  if (!payload.players) return;

  const playerCount = payload.players.length;
  const maxPlayers = payload.maxPlayers ?? 2;

  if (currentGameMode === 'tournament') {
    const playerCountElem = document.getElementById('players-count');
    if (playerCountElem) playerCountElem.textContent = `${playerCount}/${maxPlayers}`;

    // Eğer eşleşmeler hazırsa
    if (payload.status === 'ready2start' && payload.match) {
      console.log('🎲 Matches are ready, transforming data...');
      const transformedData = transformMatchmakingData(payload);

      displayMatchPairs(transformedData.matchPairs, transformedData.players);

      const statusDisplay = document.getElementById('tournament-status-display');
      if (statusDisplay) statusDisplay.textContent = transformedData.tournamentStatus;

      const isHost = payload.players.some(
        (player) => player.id === currentUserId && player.isHost
      );

      const waitingBtn = document.getElementById('waiting-players-btn');
      const matchBtn = document.getElementById('match-players-btn');
      const startBtn = document.getElementById('start-tournament-btn');

      if (isHost) {
        if (waitingBtn) waitingBtn.style.display = 'none';
        if (matchBtn) matchBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'block';
      } else {
        if (waitingBtn) {
          waitingBtn.style.display = 'block';
          waitingBtn.textContent = '⏳ Turnuva Başlatılıyor...';
        }
        if (matchBtn) matchBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'none';
      }

      showNotification('Eşleştirmeler tamamlandı!', 'success');
    } else {
      // Henüz eşleştirme yapılmamış
      updateParticipants(payload.players, 'participants-grid');

      const isHost = payload.players.some(
        (player) => player.id === currentUserId && player.isHost
      );

      const waitingBtn = document.getElementById('waiting-players-btn');
      const matchBtn = document.getElementById('match-players-btn');
      const startBtn = document.getElementById('start-tournament-btn');
      const statusDisplay = document.getElementById('tournament-status-display');

      if (isHost) {
        const minPlayers = 4;

        if (playerCount >= minPlayers && playerCount % 2 === 0) {
          if (waitingBtn) waitingBtn.style.display = 'none';
          if (matchBtn) matchBtn.style.display = 'block';
          if (startBtn) startBtn.style.display = 'none';
          if (statusDisplay) statusDisplay.textContent = 'Eşleştirme Bekleniyor';
        } else {
          if (waitingBtn) {
            waitingBtn.style.display = 'block';
            waitingBtn.textContent =
              minPlayers - playerCount > 0
                ? `En az ${minPlayers - playerCount} oyuncu daha gerekli`
                : 'Çift sayıda oyuncu gerekli';
          }
          if (matchBtn) matchBtn.style.display = 'none';
          if (startBtn) startBtn.style.display = 'none';
          if (statusDisplay) statusDisplay.textContent = 'Oyuncular Bekleniyor';
        }
      } else {
        if (waitingBtn) {
          waitingBtn.style.display = 'block';
          waitingBtn.textContent = '⏳ Eşleştirmeler Bekleniyor...';
        }
        if (matchBtn) matchBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'none';
      }
    }
  } else if (currentGameMode === 'ai') {
    updateParticipants(payload.players, 'ai-participants-grid');
  } else {
    const customCount = document.getElementById('custom-players-count');
    if (customCount) customCount.textContent = `${playerCount}/${maxPlayers}`;

    if (payload.gameMode === 'multiplayer') {
      updateParticipants(payload.players, 'custom-participants-grid', null, true);
    } else {
      updateParticipants(payload.players, 'custom-participants-grid');
    }

    const isHost = payload.players.some(
      (player) => player.id === currentUserId && player.isHost
    );

    const waitingBtn = document.getElementById('custom-waiting-players-btn');
    const startBtn = document.getElementById('custom-start-game-btn');

    if (isHost && playerCount >= maxPlayers) {
      if (waitingBtn) waitingBtn.style.display = 'none';
      if (startBtn) startBtn.style.display = 'block';
    }
  }
}

interface GameSettings {
    paddleWidth: number;
    paddleHeight?: number;
    paddleSpeed: number;
    ballRadius?: number;
	cornerBoost?: number;
    ballSpeed: number;
    ballSpeedIncrease?: number;
    maxScore?: number;
	[key: string]: any; // Diğer ayarları da kapsamak için
}

interface GameStartPayload {
    roomId: string;
    gameMode: 'classic' | 'local' | 'multiplayer' | 'tournament' | 'ai';
    gameSettings: GameSettings;
}

function handleGameStarted(payload: GameStartPayload): void {
    console.log('🎮 Game started:', payload);
    showNotification('Oyun başlıyor!', 'success');

    // Non-null assertion operator kullanarak kesin var olduğunu belirtiyoruz
    const waitingRoom = document.getElementById('waiting-room');
    const customWaitingRoom = document.getElementById('custom-waiting-room');
    const aiWaitingRoom = document.getElementById('ai-waiting-room');
    const gamePage = document.getElementById('game-page');
    const backArrow = document.getElementById('back-arrow');
    const gameContainer = document.getElementById('gameContainer');

    // Null kontrolü ekledik
    if (waitingRoom) waitingRoom.classList.remove('active');
    if (customWaitingRoom) customWaitingRoom.classList.remove('active');
    if (aiWaitingRoom) aiWaitingRoom.classList.remove('active');
    if (gamePage) gamePage.classList.add('hidden');

    // Back arrow kontrolü
    if (backArrow) backArrow.classList.remove('active');

    // Game container kontrolü
    if (gameContainer) {
        gameContainer.style.display = 'block';
    } else {
        console.error('Game container not found');
        return;
    }

    // currentUserId ve currentUserName'in null olmadığından emin olun
    if (!currentUserId || !currentUserName) {
        console.error('User ID or Name is missing');
        return;
    }

    // Payload'dan gelen oyun modunu ve ayarları logla
    console.log(`Starting game mode: ${payload.gameMode}`);
    console.log('Game settings:', payload.gameSettings);

    // App constructor'ına TypeScript desteği eklendiğini varsayarak
    app = new App(currentUserId, currentUserName);
    app.start(payload);
}

interface GameFinishPayload {
    status?: 'next_round' | 'finished';
    isFinal?: boolean;
    winner?: {
        name: string;
        id: string;
    };
    players?: Array<{
        name: string;
        id: string;
    }>;
}

function handleGameFinished(payload: GameFinishPayload): void {
    console.log('🏁 Game finished:', payload);

    // Destroy game
    if (app) {
        app.destroy();
        app = null;  // Null atamayı kaldırın veya tipi değiştirin
    }

    // Null kontrolü ekleyerek gameContainer'ı güvenle kullanın
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }

    // Hızlı oyun için kontrol - null kontrolü ekleyin
    const loadingScreen = document.getElementById('loading-screen');
    const gamePage = document.getElementById('game-page');

    if (loadingScreen && loadingScreen.classList.contains('active')) {
        loadingScreen.classList.remove('active');

        if (gamePage) {
            gamePage.classList.remove('hidden');
        }
    }

    // Tournament modunda round bitişi kontrolü
    if (currentGameMode === 'tournament') {
        // Status 'next_round' ise bir sonraki round var demektir
        if (payload.status === 'next_round') {
            console.log('🏆 Tournament round finished, showing round waiting room');
            handleRoundFinished(payload);
            return;
        }

        // Status 'finished' ise turnuva bitti demektir
        if (payload.status === 'finished' || payload.isFinal) {
            console.log('🏆 Tournament completed!');
            showNotification('🏆 Turnuva tamamlandı!', 'success');

            // Kazananı göster
            if (payload.winner) {
                showNotification(`🎉 Kazanan: ${payload.winner.name}`, 'success');
            } else if (payload.players && payload.players.length === 1) {
                showNotification(`🎉 Kazanan: ${payload.players[0].name}`, 'success');
            }

            return;
        }
    }

    // Normal oyun bitişi
    showNotification('Oyun bitti!', 'info');

    // Reset room state
    currentRoomId = null;
    currentGameMode = null;

    // Null kontrolü ekleyin
    if (gamePage) {
        gamePage.classList.remove('hidden');
    }
}

function handleError(payload) {
    console.error('❌ Error:', payload);
    const errorMessage = payload.message || payload.error || 'Bir hata oluştu';
    showNotification(errorMessage, 'error');
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

// showTournamentWaitingRoom fonksiyonunu güncelle
interface TournamentPlayer {
    id: string;
    name: string;
    isHost?: boolean;
}

interface TournamentData {
	currentRoundNumber?: number;
	maxRounds?: number;
    roomId?: string;
    players?: TournamentPlayer[];
    maxPlayers?: number;
    status?: 'waiting' | 'ready2start';
    match?: any; // Detaylı match tipi tanımlanabilir
    winners?: any[];
    eliminated?: any[];
    nextMatches?: any[];
}

let tournamentData: TournamentData | null = null;

function showTournamentWaitingRoom(data: TournamentData): void {
    console.log('🏠 Showing tournament waiting room:', data);

    // Null kontrolü ile DOM element seçimleri
    const gamePage = document.getElementById('game-page');
    const waitingRoom = document.getElementById('waiting-room');
    const backArrow = document.getElementById('back-arrow');
    const roomCodeDisplay = document.getElementById('room-code-display');
    const playersCount = document.getElementById('players-count');
    const tournamentStatusDisplay = document.getElementById('tournament-status-display');
    const waitingPlayersBtn = document.getElementById('waiting-players-btn');
    const matchPlayersBtn = document.getElementById('match-players-btn');
    const startTournamentBtn = document.getElementById('start-tournament-btn');

    // Null kontrolleri ile sınıf ve stil güncellemeleri
    if (gamePage) gamePage.classList.add('hidden');
    if (waitingRoom) waitingRoom.classList.add('active');
    if (backArrow) backArrow.classList.add('active');

    // Room code display
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = data.roomId || 'TOUR-XXXXX';
    }

    // Players count
    if (playersCount) {
        playersCount.textContent = `${data.players?.length || 0}/${data.maxPlayers || 8}`;
    }

    // Tournament status
    if (tournamentStatusDisplay) {
        const statusText = data.status === 'ready2start' ? 'Eşleşmeler Hazır' : 'Oyuncular Bekleniyor';
        tournamentStatusDisplay.textContent = statusText;
    }

    if (data.players) {
        // DÜZELTME: id kullan, userId değil
        const isHost = data.players.some(player => player.id === currentUserId && player.isHost);

        // Eğer status 'ready2start' ise ve match varsa eşleştirmeleri göster
        if (data.status === 'ready2start' && data.match) {
            console.log('🎲 Showing match pairs...');
            const transformedData = transformMatchmakingData(data);
            displayMatchPairs(transformedData.matchPairs, transformedData.players);

            // Host için buton kontrolleri
            if (isHost) {
                if (waitingPlayersBtn) waitingPlayersBtn.style.display = 'none';
                if (matchPlayersBtn) matchPlayersBtn.style.display = 'none';
                if (startTournamentBtn) startTournamentBtn.style.display = 'block';
            } else {
                if (waitingPlayersBtn) {
                    waitingPlayersBtn.style.display = 'block';
                    waitingPlayersBtn.textContent = '⏳ Turnuva Başlatılıyor...';
                }
                if (matchPlayersBtn) matchPlayersBtn.style.display = 'none';
                if (startTournamentBtn) startTournamentBtn.style.display = 'none';
            }
        } else {
            // Henüz eşleştirme yapılmamış
            updateParticipants(data.players, 'participants-grid');

            if (isHost) {
                const playerCount = data.players.length;
                const minPlayers = 4;

                if (playerCount >= minPlayers && playerCount % 2 === 0) {
                    if (waitingPlayersBtn) waitingPlayersBtn.style.display = 'none';
                    if (matchPlayersBtn) matchPlayersBtn.style.display = 'block';
                    if (startTournamentBtn) startTournamentBtn.style.display = 'none';
                } else {
                    if (waitingPlayersBtn) {
                        waitingPlayersBtn.style.display = 'block';
                        waitingPlayersBtn.textContent =
                            playerCount < minPlayers
                                ? `En az ${minPlayers - playerCount} oyuncu daha gerekli`
                                : 'Çift sayıda oyuncu gerekli';
                    }
                    if (matchPlayersBtn) matchPlayersBtn.style.display = 'none';
                    if (startTournamentBtn) startTournamentBtn.style.display = 'none';
                }
            } else {
                if (waitingPlayersBtn) {
                    waitingPlayersBtn.style.display = 'block';
                    waitingPlayersBtn.textContent = '⏳ Eşleştirmeler Bekleniyor...';
                }
                if (matchPlayersBtn) matchPlayersBtn.style.display = 'none';
                if (startTournamentBtn) startTournamentBtn.style.display = 'none';
            }
        }
    }
}

interface CustomRoomPlayer {
    id: string;
    name: string;
    isHost?: boolean;
}

interface CustomRoomData {
    roomId: string;
    gameMode: 'classic' | 'multiplayer' | 'local';
    players?: CustomRoomPlayer[];
    maxPlayers?: number;
    gameSettings?: GameSettings;
}

function showCustomWaitingRoom(data: CustomRoomData): void {
    // Null kontrolü ile DOM element seçimleri
    const gamePage = document.getElementById('game-page');
    const customWaitingRoom = document.getElementById('custom-waiting-room');
    const backArrow = document.getElementById('back-arrow');
    const roomCodeDisplay = document.getElementById('custom-room-code-display');
    const gameTypeDisplay = document.getElementById('custom-game-type-display');
    const playersCountDisplay = document.getElementById('custom-players-count');
    const paddleDisplay = document.getElementById('custom-paddle-display');
    const ballDisplay = document.getElementById('custom-ball-display');
    const cornerDisplay = document.getElementById('custom-corner-display');
    const scoreDisplay = document.getElementById('custom-score-display');
    const waitingPlayersBtn = document.getElementById('custom-waiting-players-btn');
    const startGameBtn = document.getElementById('custom-start-game-btn');

    // Null kontrolleri ile sınıf ve stil güncellemeleri
    if (gamePage) gamePage.classList.add('hidden');
    if (customWaitingRoom) customWaitingRoom.classList.add('active');
    if (backArrow) backArrow.classList.add('active');

    // Room code display
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = data.roomId;
    }

    // Game type display
    const gameTypeMap: Record<string, string> = {
        'classic': '1 vs 1',
        'multiplayer': '2 vs 2',
        'local': 'local'
    };
    if (gameTypeDisplay) {
        gameTypeDisplay.textContent = gameTypeMap[data.gameMode] || '1 vs 1';
    }

    // Players count
    const playerCount = data.players?.length || 1;
    const maxPlayers = data.maxPlayers || 2;
    if (playersCountDisplay) {
        playersCountDisplay.textContent = `${playerCount}/${maxPlayers}`;
    }

    // Update game settings display
    if (data.gameSettings) {
        if (paddleDisplay) {
            paddleDisplay.textContent = `${data.gameSettings.paddleHeight || 0}px`;
        }
        if (ballDisplay) {
            ballDisplay.textContent = `${data.gameSettings.ballRadius || 0}px`;
        }

        const cornerBoost = data.gameSettings.cornerBoost || data.gameSettings.ballSpeedIncrease || 1.0;
        if (cornerDisplay) {
            cornerDisplay.textContent = `${parseFloat(cornerBoost.toString()).toFixed(1)}x`;
        }

        if (scoreDisplay) {
            scoreDisplay.textContent = `${data.gameSettings.maxScore || 0}`;
        }
    }

    // Update participants
    if (data.players) {
        if (data.gameMode === "multiplayer") {
            updateParticipants(data.players, 'custom-participants-grid', null, true);
        } else {
            updateParticipants(data.players, 'custom-participants-grid');
        }
    }

    // DÜZELTME: id kullan, userId değil
    const isHost = data.players && data.players.some(player => player.id === currentUserId && player.isHost);

    // Show/hide buttons
    if (isHost) {
        if (playerCount >= maxPlayers) {
            if (waitingPlayersBtn) waitingPlayersBtn.style.display = 'none';
            if (startGameBtn) startGameBtn.style.display = 'block';
        } else {
            if (waitingPlayersBtn) waitingPlayersBtn.style.display = 'block';
            if (startGameBtn) startGameBtn.style.display = 'none';
        }
    } else {
        if (waitingPlayersBtn) {
            waitingPlayersBtn.style.display = 'block';
            waitingPlayersBtn.textContent = '⏳ Oda Sahibi Bekleniyor...';
        }
        if (startGameBtn) startGameBtn.style.display = 'none';
    }
}

interface AISettings {
    difficulty?: 'easy' | 'medium' | 'hard' | 'impossible' | 'custom';
    reactionSpeed?: number;
    predictionAccuracy?: number;
    generalAccuracy?: number;
    learningSpeed?: number;
}

interface GameSettings {
    paddleHeight?: number;
    ballRadius?: number;
    cornerBoost?: number;
    ballSpeedIncrease?: number;
    maxScore?: number;
}

interface AIWaitingRoomData {
    aiSettings?: AISettings;
    gameSettings?: GameSettings;
}

function showAIWaitingRoom(data: AIWaitingRoomData): void {
    // Null kontrolü ekleyelim
    const gamePage = document.getElementById('game-page');
    const aiWaitingRoom = document.getElementById('ai-waiting-room');
    const backArrow = document.getElementById('back-arrow');
    const aiDifficultyDisplay = document.getElementById('ai-difficulty-display');
    const aiTypeDisplay = document.getElementById('ai-type-display');
    const aiPaddleDisplay = document.getElementById('ai-paddle-display');
    const aiBallDisplay = document.getElementById('ai-ball-display');
    const aiCornerDisplay = document.getElementById('ai-corner-display');
    const aiScoreDisplay = document.getElementById('ai-score-display');
    const customSettingsDiv = document.getElementById('ai-custom-settings-display');
    const aiReactionDisplay = document.getElementById('ai-reaction-display');
    const aiPredictionDisplay = document.getElementById('ai-prediction-display');
    const aiAccuracyDisplay = document.getElementById('ai-accuracy-display');
    const aiLearningDisplay = document.getElementById('ai-learning-display');

    // Null kontrolü ile güvenli erişim
    if (gamePage) gamePage.classList.add('hidden');
    if (aiWaitingRoom) aiWaitingRoom.classList.add('active');
    if (backArrow) backArrow.classList.add('active');

    // Zorluk seviyesi haritası
    const difficultyMap: Record<string, string> = {
        'easy': 'Kolay',
        'medium': 'Orta',
        'hard': 'Zor',
        'impossible': 'İmkansız',
        'custom': 'Özel'
    };

    // Zorluk seviyesi için güvenli erişim
    const difficulty = data.aiSettings?.difficulty || 'medium';

    // Null kontrolü ile ekran güncelleme
    if (aiDifficultyDisplay) {
        aiDifficultyDisplay.textContent = difficultyMap[difficulty];
    }

    if (aiTypeDisplay) {
        aiTypeDisplay.textContent = difficulty === 'custom' ? 'Özelleştirilmiş' : 'Standart';
    }

    // Oyun ayarları için güvenli güncelleme
    if (data.gameSettings) {
        if (aiPaddleDisplay) {
            aiPaddleDisplay.textContent = `${data.gameSettings.paddleHeight || 0}px`;
        }

        if (aiBallDisplay) {
            aiBallDisplay.textContent = `${data.gameSettings.ballRadius || 0}px`;
        }

        // Corner boost için güvenli hesaplama
        const cornerBoost = data.gameSettings.cornerBoost ||
                            data.gameSettings.ballSpeedIncrease ||
                            1.0;

        if (aiCornerDisplay) {
            aiCornerDisplay.textContent = `${parseFloat(cornerBoost.toString()).toFixed(1)}x`;
        }

        if (aiScoreDisplay) {
            aiScoreDisplay.textContent = `${data.gameSettings.maxScore || 0}`;
        }
    }

    // Özel AI ayarları için güvenli görüntüleme
    if (difficulty === 'custom' && data.aiSettings) {
        if (customSettingsDiv) {
            customSettingsDiv.style.display = 'block';
        }

        if (aiReactionDisplay) {
            aiReactionDisplay.textContent = `${data.aiSettings.reactionSpeed || 5}`;
        }

        if (aiPredictionDisplay) {
            aiPredictionDisplay.textContent = `${data.aiSettings.predictionAccuracy || 5}`;
        }

        if (aiAccuracyDisplay) {
            aiAccuracyDisplay.textContent = `${data.aiSettings.generalAccuracy || 5}`;
        }

        if (aiLearningDisplay) {
            aiLearningDisplay.textContent = `${data.aiSettings.learningSpeed || 5}`;
        }
    }

    // Katılımcıları güncelle
    // currentUserName'in tanımlı olduğunu varsayıyoruz
    const players: Participant[] = [
        {
            id: 'current-user',
            name: currentUserName || 'Player',
            isAI: false
        },
        {
            id: 'ai-opponent',
            name: 'AI Opponent',
            isAI: true
        }
    ];

    // Katılımcıları güncelle
    updateParticipants(players, 'ai-participants-grid');
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// Oyun modu türlerini tanımlayan bir type
type GameMode =  'classic' | 'multiplayer' | 'local' | 'custom' | 'tournament' | 'ai';
type GameType = '1v1' | '2v2' | 'co-op';

// currentGameMode değişkenini doğru şekilde tanımlayın
let currentGameMode: GameMode | null = null;
let currentRoomId: string | null = null;

// Ortak işlevi çıkaralım
function setupGameModeSelection(
    modeCardId: string,
    settingsPanelId: string,
    mode: GameMode
): void {
    // Null kontrolü ekleyelim
    const modeCard = document.getElementById(modeCardId);
    const settingsPanel = document.getElementById(settingsPanelId);

    // Eğer elementler mevcut değilse, fonksiyondan çık
    if (!modeCard || !settingsPanel) {
        console.warn(`Element not found: ${modeCardId} or ${settingsPanelId}`);
        return;
    }

    // Tüm mod kartlarından 'active' sınıfını kaldır
    document.querySelectorAll('.game-mode-card').forEach(card => {
        card.classList.remove('active');
    });

    // Seçilen karta 'active' sınıfını ekle
    modeCard.classList.add('active');

    // Tüm ayar panellerinden 'active' sınıfını kaldır
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Seçilen ayar paneline 'active' sınıfını ekle
    settingsPanel.classList.add('active');

    // Geçerli oyun modunu güncelle
    currentGameMode = mode;
}

type AIDifficulty = 'easy' | 'medium' | 'hard' | 'impossible' | 'custom';

interface AISettings {
    difficulty?: AIDifficulty;
    reactionSpeed?: number;
    predictionAccuracy?: number;
    generalAccuracy?: number;
    learningSpeed?: number;
    preparationDistance?: number;
    freezeDistance?: number;
    targetWinRate?: number;
    fairnessLevel?: number;
    maxConsecutiveWins?: number;
    rageMode?: boolean;
    fatigueSystem?: boolean;
    focusMode?: boolean;
    adaptiveDifficulty?: boolean;
}

interface AIGameData {
    name: string;
    gameMode: string;
    gameSettings: GameSettings;
    aiSettings: AISettings;
}

// Type tanımlamaları
type TournamentSize = '4' | '8' | '16' | '32' | 'custom';

// ============================================================================
// SLIDER VALUE UPDATES
// ============================================================================

function updateSliderDisplay(
    sliderId: string,
    displayId: string,
    formatter?: (value: string) => string
): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const display = document.getElementById(displayId);

    if (slider && display) {
        slider.addEventListener('input', function() {
            // Varsayılan formatter kullanılmazsa direkt değeri göster
            const formattedValue = formatter
                ? formatter(this.value)
                : this.value;

            display.textContent = formattedValue;
        });
    }
}

// AI Custom Settings Sliders
const aiCustomSliderConfigs = [
    {
        sliderId: 'ai-reaction-speed',
        displayId: 'ai-reaction-speed-value'
    },
    {
        sliderId: 'ai-prediction-accuracy',
        displayId: 'ai-prediction-accuracy-value'
    },
    {
        sliderId: 'ai-general-accuracy',
        displayId: 'ai-general-accuracy-value'
    },
    {
        sliderId: 'ai-learning-speed',
        displayId: 'ai-learning-speed-value'
    },
    {
        sliderId: 'ai-preparation-distance',
        displayId: 'ai-preparation-distance-value'
    },
    {
        sliderId: 'ai-freeze-distance',
        displayId: 'ai-freeze-distance-value'
    },
    {
        sliderId: 'ai-fairness-level',
        displayId: 'ai-fairness-level-value'
    },
    {
        sliderId: 'ai-max-consecutive-wins',
        displayId: 'ai-max-consecutive-wins-value'
    }
];

// ============================================================================
// INITIALIZATION
// ============================================================================

// Generate user credentials
currentUserId = generateRandomId();
currentUserName = generateRandomName();
console.log(`🎮 User initialized - ID: ${currentUserId}, Name: ${currentUserName}`);

// Initialize WebSocket
roomSocket = new WebSocketClient(window.location.hostname, 3030);

// WebSocket event handlers
roomSocket.onConnect(() => {
    console.log('✅ Connected to room server');
    showNotification('Sunucuya bağlandı', 'success');
});

roomSocket.onMessage((message) => {
    try {
        console.log(`📥 Received WebSocket message:`, message);

        // Eğer matchReady mesajı gelirse özel işleme yap
        if (message.type === "matchReady") {
            const transformedData = transformMatchmakingData(message.payload);
            handleMatchReady(transformedData);
            return;
        }

        // Diğer mesajlar için normal işleme devam et
        handleWebSocketMessage(message);
    } catch (error) {
        console.error('Error processing WebSocket message:', error);
        showNotification('Mesaj işlenirken hata oluştu', 'error');
    }
});

roomSocket.onClose((error) => {
    console.log(`❌ Disconnected from room server: ${error.code} - ${error.reason}`);
    showNotification('Sunucu bağlantısı kesildi', 'error');
});

roomSocket.onError((error) => {
    console.error('❌ Room server connection error:', error);
    showNotification('Bağlantı hatası', 'error');
});

// Connect to server
roomSocket.connect("ws-room/client", {
    userID: currentUserId,
    userName: currentUserName
});

// Export for debugging
window.roomSocket = roomSocket;
if (app) {
    window.app = app;
}

console.log('🎮 Application initialized successfully!');
showNotification('Hoş geldiniz! ' + currentUserName, 'success');

// DOM Elements
const gameModeCards = document.querySelectorAll<HTMLElement>('.game-mode-card');
const settingsPanels = document.querySelectorAll<HTMLElement>('.settings-panel');
const aiDifficultyRadios = document.querySelectorAll<HTMLInputElement>('input[name="ai-difficulty"]');
const aiCustomSettings = document.getElementById('ai-custom-settings') as HTMLElement | null;

// Initialize all sliders
function updateSliderValue(sliderId: string, valueId: string, suffix: string = ''): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement | null;
    const valueDisplay = document.getElementById(valueId) as HTMLElement | null;

    if (!slider || !valueDisplay) return;

    slider.addEventListener('input', function () {
        let value: string | number = slider.value;

        if (sliderId.includes('corner-boost')) {
            value = parseFloat(value).toFixed(1) + 'x';
        } else if (sliderId.includes('target-win-rate')) {
            value = (parseInt(value) * 10) + '%';
        } else {
            value += suffix;
        }

        // Animate value change
        valueDisplay.style.transform = 'scale(1.1)';
        valueDisplay.textContent = value.toString();

        setTimeout(() => {
            valueDisplay.style.transform = 'scale(1)';
        }, 200);
    });
}


// Initialize all sliders (paddle-speed ve ball-speed çıkarıldı)
const sliders = [
    ['paddle-height', 'paddle-height-value', 'px'],
    ['ball-radius', 'ball-radius-value', 'px'],
    ['corner-boost', 'corner-boost-value'],
    ['ai-paddle-height', 'ai-paddle-height-value', 'px'],
    ['ai-ball-radius', 'ai-ball-radius-value', 'px'],
    ['ai-corner-boost', 'ai-corner-boost-value'],
    ['ai-reaction-speed', 'ai-reaction-speed-value'],
    ['ai-prediction-accuracy', 'ai-prediction-accuracy-value'],
    ['ai-general-accuracy', 'ai-general-accuracy-value'],
    ['ai-learning-speed', 'ai-learning-speed-value'],
    ['ai-preparation-distance', 'ai-preparation-distance-value'],
    ['ai-freeze-distance', 'ai-freeze-distance-value'],
    ['ai-target-win-rate', 'ai-target-win-rate-value'],
    ['ai-fairness-level', 'ai-fairness-level-value'],
    ['ai-max-consecutive-wins', 'ai-max-consecutive-wins-value']
];

sliders.forEach(([sliderId, valueId, suffix]) => {
    updateSliderValue(sliderId, valueId, suffix || '');
});

// Smooth transitions for all interactive elements
document.querySelectorAll<HTMLElement>('.btn, .input-field, .radio-option').forEach(element => {
    element.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
});

// Initialize tooltips
const tooltips = document.querySelectorAll<HTMLElement>('.difficulty-tooltip');
tooltips.forEach(tooltip => {
    tooltip.style.transition = 'all 0.3s ease';
});

// Sayfa yüklendikten sonra Custom Game sekmesini aç
const customModeCard = document.getElementById('custom-mode');
const customSettings = document.getElementById('custom-settings');

if (customModeCard && customSettings && !customModeCard.classList.contains('active')) {
    // Önce tüm sekmeleri kapat
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelectorAll('.game-settings').forEach(settings => {
        settings.classList.remove('active');
    });

    // Custom Game sekmesini aç
    customModeCard.classList.add('active');
    customSettings.classList.add('active');
}

// showRoundWaitingRoom fonksiyonunu güncelle
function showRoundWaitingRoom(data) {
    console.log('📋 Showing round waiting room with data:', data);

    // Tüm odaları gizle
    document.querySelectorAll('.waiting-room').forEach(room => room.classList.remove('active'));
    document.getElementById('game-page')?.classList.add('hidden');

    // Round waiting room'u göster
    const roundWaitingRoom = document.getElementById('round-waiting-room');
    if (!roundWaitingRoom) {
        console.error('Round waiting room element not found!');
        return;
    }

    roundWaitingRoom.classList.add('active');

    // Back arrow'u göster
    const backArrow = document.getElementById('back-arrow');
    if (backArrow) {
        backArrow.classList.add('active');
    }

    // Round bilgilerini güncelle
    const currentRoundDisplay = document.getElementById('round-current-display');
    const totalRoundsDisplay = document.getElementById('round-total-display');
    const remainingPlayersDisplay = document.getElementById('round-remaining-players');
    const nextRoundDisplay = document.getElementById('round-next-display');

    const currentRound = data.currentRound || 1;
    const totalRounds = data.totalRounds || data.maxRound || 3;
    const winnersCount = data.winners ? data.winners.length : 0;

    if (currentRoundDisplay) currentRoundDisplay.textContent = currentRound;
    if (totalRoundsDisplay) totalRoundsDisplay.textContent = totalRounds;
    if (remainingPlayersDisplay) remainingPlayersDisplay.textContent = winnersCount;

    // Next round bilgisi - DÜZELTİLDİ
    const nextRound = currentRound + 1;
    if (nextRoundDisplay) {
        if (nextRound > totalRounds) {
            nextRoundDisplay.textContent = 'Completed';
        } else if (nextRound === totalRounds) {
            nextRoundDisplay.textContent = 'Final';
        } else {
            nextRoundDisplay.textContent = `Round ${nextRound}`;
        }
    }

    console.log(`Round Info - Current: ${currentRound}, Total: ${totalRounds}, Next: ${nextRound}`);

    // Kazananları göster
    console.log('Displaying winners:', data.winners);
    if (data.winners && data.winners.length > 0) {
        updateParticipants(data.winners, 'round-winners-grid');
    }

    // Bir sonraki round eşleştirmelerini göster
    const nextRoundPairsSection = document.getElementById('next-round-pairs-section');
    if (data.nextMatches && data.nextMatches.length > 0) {
        console.log('Displaying next matches:', data.nextMatches);
        if (nextRoundPairsSection) {
            nextRoundPairsSection.style.display = 'block';
        }

        const nextRoundContainer = document.getElementById('next-round-pairs-container');
        if (nextRoundContainer) {
            nextRoundContainer.innerHTML = '';

            data.nextMatches.forEach((pair, index) => {
                const colors = [
                    { border: '#00ffff', bg: 'rgba(0, 255, 255, 0.1)' },
                    { border: '#ff00ff', bg: 'rgba(255, 0, 255, 0.1)' },
                    { border: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
                    { border: '#ff8800', bg: 'rgba(255, 136, 0, 0.1)' }
                ];
                const color = colors[index % colors.length];

                const card = document.createElement('div');
                card.className = 'match-pair-card';
                card.style.borderColor = color.border;
                card.style.background = color.bg;

                const header = document.createElement('div');
                header.className = 'match-header';
                const matchNum = pair.matchNumber !== undefined ? pair.matchNumber + 1 : index + 1;
                header.innerHTML = `<div class="match-number">Maç ${matchNum}</div>`;

                const players = document.createElement('div');
                players.className = 'match-players';

                const player1Name = pair.playerNames && pair.playerNames[0] ? pair.playerNames[0] : 'Unknown';
                const player2Name = pair.playerNames && pair.playerNames[1] ? pair.playerNames[1] : 'Unknown';

                const player1 = document.createElement('div');
                player1.className = 'match-player';
                player1.innerHTML = `
                    <div class="match-player-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" fill="${color.border}">
                            <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM171.7 396.1C166 382 177.4 368 192.6 368L447.5 368C462.7 368 474.1 382 468.4 396.1C444.6 454.7 387.2 496 320.1 496C253 496 195.5 454.7 171.8 396.1zM186.7 207.3C191.2 200.5 200 198.1 207.3 201.8L286.9 241.8C292.3 244.5 295.7 250 295.7 256.1C295.7 262.2 292.3 267.7 286.9 270.4L207.3 310.4C200 314 191.2 311.7 186.7 304.9C182.2 298.1 183.6 289 189.8 283.8L223 256L189.8 228.3C183.6 223.1 182.2 214 186.7 207.2zM450.3 228.4L417 256L450.2 283.7C456.4 288.9 457.8 298 453.3 304.8C448.8 311.6 440 314 432.7 310.3L353.1 270.3C347.7 267.6 344.3 262.1 344.3 256C344.3 249.9 347.7 244.4 353.1 241.7L432.7 201.7C440 198.1 448.8 200.4 453.3 207.2C457.8 214 456.4 223.1 450.2 228.3z"/>
                        </svg>
                    </div>
                    <div class="match-player-name">${player1Name}</div>
                `;

                const vs = document.createElement('div');
                vs.className = 'vs-divider';
                vs.innerHTML = `<span class="vs-text">VS</span>`;

                const player2 = document.createElement('div');
                player2.className = 'match-player';
                player2.innerHTML = `
                    <div class="match-player-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" fill="${color.border}">
                            <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM171.7 396.1C166 382 177.4 368 192.6 368L447.5 368C462.7 368 474.1 382 468.4 396.1C444.6 454.7 387.2 496 320.1 496C253 496 195.5 454.7 171.8 396.1zM186.7 207.3C191.2 200.5 200 198.1 207.3 201.8L286.9 241.8C292.3 244.5 295.7 250 295.7 256.1C295.7 262.2 292.3 267.7 286.9 270.4L207.3 310.4C200 314 191.2 311.7 186.7 304.9C182.2 298.1 183.6 289 189.8 283.8L223 256L189.8 228.3C183.6 223.1 182.2 214 186.7 207.2zM450.3 228.4L417 256L450.2 283.7C456.4 288.9 457.8 298 453.3 304.8C448.8 311.6 440 314 432.7 310.3L353.1 270.3C347.7 267.6 344.3 262.1 344.3 256C344.3 249.9 347.7 244.4 353.1 241.7L432.7 201.7C440 198.1 448.8 200.4 453.3 207.2C457.8 214 456.4 223.1 450.2 228.3z"/>
                        </svg>
                    </div>
                    <div class="match-player-name">${player2Name}</div>
                `;

                players.appendChild(player1);
                players.appendChild(vs);
                players.appendChild(player2);

                card.appendChild(header);
                card.appendChild(players);
                nextRoundContainer.appendChild(card);
            });
        }
    } else {
        if (nextRoundPairsSection) {
            nextRoundPairsSection.style.display = 'none';
        }
    }

    // Host kontrolü - DÜZELTME: id kullan, userId değil
    const isHost = data.winners && data.winners.some(player => player.id === currentUserId && player.isHost);

    console.log(`Host check - isHost: ${isHost}, currentUserId: ${currentUserId}`);

    // Butonları ayarla - DÜZELTİLDİ
    const roundWaitingBtn = document.getElementById('round-waiting-btn') as HTMLButtonElement | null;
    const nextRoundBtn = document.getElementById('next-round-btn') as HTMLButtonElement | null;
    const finalRoundBtn = document.getElementById('final-round-btn') as HTMLButtonElement | null;

    // Önce tüm butonları gizle
    if (roundWaitingBtn) roundWaitingBtn.style.display = 'none';
    if (nextRoundBtn) nextRoundBtn.style.display = 'none';
    if (finalRoundBtn) finalRoundBtn.style.display = 'none';

    if (isHost) {
        console.log('User is host, showing appropriate button');

        // Turnuva bitti mi kontrol et
        if (currentRound >= totalRounds) {
            console.log('Tournament completed');
            showNotification('🏆 Turnuva tamamlandı!', 'success');
        }
        // Final round mu?
        else if (nextRound === totalRounds) {
            console.log('Showing final round button');
            if (finalRoundBtn) {
                finalRoundBtn.style.display = 'block';
                finalRoundBtn.disabled = false;
            }
        }
        // Normal round
        else {
            console.log('Showing next round button');
            if (nextRoundBtn) {
                nextRoundBtn.style.display = 'block';
                nextRoundBtn.disabled = false;
            }
        }
    } else {
        console.log('User is not host, showing waiting button');
        if (roundWaitingBtn) {
            roundWaitingBtn.style.display = 'block';
            roundWaitingBtn.textContent = '⏳ Waiting for Host...';
        }
    }

    console.log('✅ Round waiting room displayed successfully');
}

interface RoundFinishedPayload {
    currentRound?: number;
    maxRound?: number;
    totalRounds?: number;
    players?: Player[];      // Kazananlar
    winners?: Player[];      // Alternatif
    spectators?: Player[];   // Alternatif
    eliminated?: Player[];
    match?: Match[];
    [key: string]: any;
}

// handleRoundFinished fonksiyonunu da güncelle
function handleRoundFinished(payload) {
    console.log('🏁 Round finished:', payload);

    // Payload kontrolü
    if (!payload) {
        console.error('Invalid round data: payload is null');
        showNotification('Round verisi geçersiz!', 'error');
        // returnToLobby();
        return;
    }

    // Round bilgilerini al
    const currentRound = payload.currentRound || 1;
    const maxRound = payload.maxRound || payload.totalRounds || 3;

    console.log(`Round finished - Current: ${currentRound}, Max: ${maxRound}`);

    // Kazananları ve bir sonraki eşleştirmeleri hazırla
    const winners = payload.players || payload.winners || [];
    const eliminated = payload.spectators || payload.eliminated || [];

    console.log(`Winners: ${winners.length}, Eliminated: ${eliminated.length}`);

    // Bir sonraki round'un eşleştirmelerini hazırla
    let nextMatches = [];
    if (payload.match && Array.isArray(payload.match)) {
        nextMatches = payload.match.map((match, index) => {
            return {
                matchNumber: match.matchNumber !== undefined ? match.matchNumber : index,
                players: [match.player1.id, match.player2.id],
                playerNames: [match.player1.name, match.player2.name],
                winner: match.winner || null,
                loser: match.loser || null
            };
        });
    }

    console.log(`Next matches prepared: ${nextMatches.length}`);

    // Round verilerini sakla
    tournamentData = {
        currentRoundNumber: currentRound,
        maxRounds: maxRound,
        winners: winners,
        eliminated: eliminated,
        nextMatches: nextMatches
    };

    console.log('Tournament data updated:', tournamentData);

    // Round arası bekleme odasını göster
    showRoundWaitingRoom(tournamentData);

    showNotification(`Round ${currentRound} tamamlandı!`, 'success');
}

// Back arrow'a round waiting room için de destek ekle
document.getElementById('back-arrow')?.addEventListener('click', function() {
    // Leave room if in one
    if (currentRoomId) {
        roomSocket.send("leave", { roomId: currentRoomId });
        currentRoomId = null;
    }

    // Reset tournament data
    tournamentData = null;
    showNotification('Odadan ayrıldınız', 'info');
});

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Play");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/play.html`);
		return await response.text();
	}

	async setEventHandlers() {
		this.initAllEventListeners();
	}
	async unsetEventHandlers() {}

	private initAllEventListeners(): void {
		// Game Mode Selection Listeners
		this.initGameModeListeners();

		// Custom Game Listeners
		this.initCustomGameListeners();

		// AI Game Listeners
		this.initAIGameListeners();

		// Tournament Listeners
		this.initTournamentListeners();

		// Navigation Listeners
		this.initNavigationListeners();

		// Settings and UI Listeners
		this.initSettingsListeners();

		// Slider Display Listeners
		this.initSliderListeners();

		// Keyboard and Quick Actions
		this.initKeyboardListeners();

		// Custom Game Sliders
        updateSliderDisplay('paddle-height', 'paddle-height-value', (value) => `${value}px`);
        updateSliderDisplay('ball-radius', 'ball-radius-value', (value) => `${value}px`);
        updateSliderDisplay('corner-boost', 'corner-boost-value', (value) => `${parseFloat(value).toFixed(1)}x`);
	}

	private initGameModeListeners(): void {
		// Custom Mode
		const customModeElement = document.getElementById('custom-mode');
		if (customModeElement) {
			customModeElement.addEventListener('click', () => {
				setupGameModeSelection('custom-mode', 'custom-settings', 'custom');
			});
		}

		// Tournament Mode
		const tournamentModeElement = document.getElementById('tournament-mode');
		if (tournamentModeElement) {
			tournamentModeElement.addEventListener('click', () => {
				setupGameModeSelection('tournament-mode', 'tournament-settings', 'tournament');
			});
		}

		// AI Mode
		const aiModeElement = document.getElementById('ai-mode');
		if (aiModeElement) {
			aiModeElement.addEventListener('click', () => {
				setupGameModeSelection('ai-mode', 'ai-settings', 'ai');
			});
		}

		// Sayfa yüklendiğinde listener'ları başlat
		document.addEventListener('DOMContentLoaded', this.initGameModeListeners.bind(this));
	}

	private initCustomGameListeners(): void {
		// Custom Game - Create Room
		document.getElementById('custom-create-btn')?.addEventListener('click', function() {
			// Null kontrolü ile radio button seçimini al
			const gameTypeElement = document.querySelector('input[name="custom-game-type"]:checked') as HTMLInputElement;

			if (!gameTypeElement) {
				showNotification('Lütfen oyun türünü seçin!', 'error');
				return;
			}

			// Game settings elementlerini al
			const paddleHeightEl = document.getElementById('custom-paddle-height') as HTMLInputElement;
			const ballRadiusEl = document.getElementById('custom-ball-radius') as HTMLInputElement;
			const cornerBoostEl = document.getElementById('custom-corner-boost') as HTMLInputElement;
			const winningScoreEl = document.getElementById('custom-winning-score') as HTMLInputElement;

			// Data objesi oluştur
			const data = {
				gameType: gameTypeElement.value,
				gameMode: 'local',
				gameSettings: {
					...gameConfig.gameSettings,
					paddleHeight: parseInt(paddleHeightEl.value, 10),
					ballRadius: parseInt(ballRadiusEl.value, 10),
					ballSpeedIncrease: parseFloat(cornerBoostEl.value),
					maxScore: parseInt(winningScoreEl.value, 10)
				}
			};

			roomSocket.send("create", data);
			showNotification('Oda oluşturuluyor...', 'info');
		});

		// Custom Game - Join Room
		document.getElementById('custom-join-btn')?.addEventListener('click', function() {
			const roomCodeEl = document.getElementById('custom-room-code') as HTMLInputElement;
			const roomCode = roomCodeEl.value.trim().toUpperCase();

			if (!roomCode) {
				showNotification('Lütfen oda kodunu girin!', 'error');
				return;
			}

			if (roomCode.length !== 6) {
				showNotification('Oda kodu 6 karakter olmalıdır!', 'error');
				return;
			}

			currentGameMode = 'custom';
			roomSocket.send("join", { roomId: roomCode, gameMode: 'play-page' });
			showNotification(`${roomCode} kodlu odaya katılıyorsunuz...`, 'info');
		});

		// Custom Game - Start Game
		document.getElementById('custom-start-game-btn')?.addEventListener('click', function() {
			roomSocket.send("start", {});
			showNotification('Oyun başlatılıyor...', 'info');
		});
	}

	private initAIGameListeners(): void {
		document.getElementById('ai-start-game-btn')?.addEventListener('click', function() {
			roomSocket.send("start", {});
			showNotification('Oyun başlatılıyor...', 'info');
		});

		// AI Difficulty - Custom Option
		document.querySelectorAll('input[name="ai-difficulty"]').forEach((radio: Element) => {
			radio.addEventListener('change', function() {
				// Type assertion ile input elementini al
				const radioInput = this as HTMLInputElement;

				// Custom settings elementini al
				const customSettings = document.getElementById('ai-custom-settings');

				if (radioInput.value === 'custom') {
					customSettings?.classList.add('active');
				} else {
					customSettings?.classList.remove('active');
				}
			});
		});

		// Fast Game Mode Button
		const fastGameBtn = document.getElementById('fast-game-mode');
		if (fastGameBtn) {
			fastGameBtn.addEventListener('click', () => {
				showNotification('Hızlı oyun başlatılıyor...', 'success');

				const loadingScreen = document.getElementById('loading-screen');
				const gamePage = document.getElementById('game-page');

				if (gamePage) gamePage.classList.add('hidden');
				if (loadingScreen) loadingScreen.classList.add('active');

				roomSocket.send('quickMatch');
			});
		}

		// Loading Back Arrow
		const loadingBackArrow = document.getElementById('loading-back-arrow');
		if (loadingBackArrow) {
			loadingBackArrow.addEventListener('click', () => {
				const loadingScreen = document.getElementById('loading-screen');
				const gamePage = document.getElementById('game-page');

				if (loadingScreen) loadingScreen.classList.remove('active');
				if (gamePage) gamePage.classList.remove('hidden');

				showNotification('Hızlı oyun iptal edildi', 'info');
			});
		}
	}

	private initTournamentListeners(): void {
		// Tournament Create Event Listener
		document.getElementById('tournament-create-btn')?.addEventListener('click', function() {
			// Null ve type assertion ile güvenli erişim
			const tournamentNameElement = document.getElementById('tournament-name') as HTMLInputElement;
			const tournamentName = tournamentNameElement.value.trim();

			// Turnuva boyutu seçimini al
			const tournamentSizeElement = document.querySelector('input[name="tournament-size"]:checked') as HTMLInputElement;

			if (!tournamentSizeElement) {
				showNotification('Lütfen turnuva boyutu seçin!', 'error');
				return;
			}

			let tournamentSize: number;
			if (tournamentSizeElement.value === 'custom') {
				const customSizeElement = document.getElementById('custom-tournament-size') as HTMLInputElement;
				const customSize = parseInt(customSizeElement.value, 10);

				if (!customSize || customSize < 4 || customSize > 64) {
					showNotification('Geçerli bir turnuva boyutu girin (4-64 arası)!', 'error');
					return;
				}

				if (customSize & (customSize - 1)) {
					showNotification('Turnuva boyutu 2\'nin kuvveti olmalıdır (4, 8, 16, 32, 64)!', 'error');
					return;
				}

				tournamentSize = customSize;
			} else {
				tournamentSize = parseInt(tournamentSizeElement.value, 10);
			}

			if (!tournamentName) {
				showNotification('Lütfen turnuva adını girin!', 'error');
				return;
			}

			// Turnuva verilerini hazırla
			const data = {
				gameMode: 'tournament',
				gameType: 'tournament',
				tournamentSettings: {
					name: tournamentName,
					maxPlayers: tournamentSize,
					...tournamentConfig.tournamentSettings
				}
			};

			// Global değişken ataması
			currentGameMode = 'tournament';

			// Güvenli socket gönderimi
			if (roomSocket) {
				roomSocket.send("create", data);
				showNotification('Turnuva oluşturuluyor...', 'info');
			} else {
				showNotification('Soket bağlantısı hatası!', 'error');
			}
		});

		// Tournament - Join
		document.getElementById('tournament-join-btn')?.addEventListener('click', function() {
			// Null ve type assertion ile güvenli erişim
			const tournamentCodeElement = document.getElementById('tournament-code') as HTMLInputElement;
			const tournamentCode = tournamentCodeElement.value.trim().toUpperCase();

			if (!tournamentCode) {
				showNotification('Lütfen turnuva kodunu girin!', 'error');
				return;
			}

			// Global değişken ataması
			currentGameMode = 'tournament';

			// Güvenli socket gönderimi
			if (roomSocket) {
				roomSocket.send("join", {
					roomId: tournamentCode,
					gameMode: 'tournament'
				});
				showNotification(`${tournamentCode} kodlu turnuvaya katılıyorsunuz...`, 'info');
			} else {
				showNotification('Soket bağlantısı hatası!', 'error');
			}
		});

		// Tournament start button
		document.getElementById('tournament-start-btn')?.addEventListener('click', function() {
			console.log("TOURNAMENT START!")
			const startButton = this as HTMLButtonElement;
			startButton.disabled = true;
			startButton.innerHTML = '<div class="loading"></div> Başlatılıyor...';

			if (roomSocket && currentRoomId) {
				roomSocket.send("start", { roomId: currentRoomId });
				showNotification('🚀 Turnuva başlatılıyor!', 'success');
			} else {
				showNotification('Soket bağlantısı hatası!', 'error');
			}

			// Eğer sunucudan yanıt gelmezse butonu 10 saniye sonra tekrar etkinleştir
			setTimeout(() => {
				if (startButton.disabled) {
					startButton.disabled = false;
					startButton.innerHTML = '🚀 Turnuvayı Başlat';
				}
			}, 10000);
		});

		// Final Round butonuna event listener ekle
		const finalRoundBtn1 = document.getElementById('final-round-btn') as HTMLButtonElement | null;
		if (finalRoundBtn1) {
			finalRoundBtn1.addEventListener('click', () => {
				finalRoundBtn1.disabled = true;
				finalRoundBtn1.innerHTML = '<div class="loading"></div> Starting Final Round...';

				// Safely access currentRoundNumber
				const currentRound = tournamentData?.currentRoundNumber ?? 1;

				roomSocket.send("start", {
					roomId: currentRoomId,
					round: currentRound + 1,
					isFinal: true
				});

				showNotification('🏆 Final round başlatılıyor!', 'success');

				setTimeout(() => {
					if (finalRoundBtn1.disabled) {
						finalRoundBtn1.disabled = false;
						finalRoundBtn1.innerHTML = '🏆 Start Final Round';
					}
				}, 10000);
			});
		}

		// Kişileri eşleştir butonu
		document.getElementById('match-players-btn')?.addEventListener('click', function() {
			if (!currentRoomId) return;

			// Güvenli socket gönderimi
			if (roomSocket) {
				roomSocket.send("matchTournament", { roomId: currentRoomId });
				showNotification('Eşleştirmeler yapılıyor...', 'info');
			} else {
				showNotification('Soket bağlantısı hatası!', 'error');
			}
		});

		// Tournament Size - Custom Option
		document.querySelectorAll('input[name="tournament-size"]').forEach((radio: Element) => {
			radio.addEventListener('change', function() {
				// Type assertion ile input elementini al
				const radioInput = this as HTMLInputElement;

				// Custom input elementini al
				const customInput = document.getElementById('custom-tournament-size') as HTMLInputElement;

				if (radioInput.value === 'custom') {
					customInput.style.display = 'block';
				} else {
					customInput.style.display = 'none';
				}
			});
		});
	}

	private initNavigationListeners(): void {
		// Back Arrow
		document.getElementById('back-arrow')?.addEventListener('click', function() {
			// Type assertion ile element tipini belirle
			const backArrow = this as HTMLElement;

			// Leave room if in one
			if (currentRoomId && roomSocket) {
				roomSocket.send("leave", { roomId: currentRoomId });
				currentRoomId = null;
			}

			// Hide all waiting rooms
			document.querySelectorAll('.waiting-room').forEach((room: Element) => {
				room.classList.remove('active');
			});

			// Show game mode selection
			document.getElementById('game-mode-selection')?.classList.add('active');

			// Hide back arrow
			backArrow.classList.remove('active');

			showNotification('Odadan ayrıldınız', 'info');
		});
	}

	private initSettingsListeners(): void {
		// Smooth transitions for all interactive elements
		document.querySelectorAll<HTMLElement>('.btn, .input-field, .radio-option').forEach(element => {
			element.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
		});

		// Initialize tooltips
		const tooltips = document.querySelectorAll<HTMLElement>('.difficulty-tooltip');
		tooltips.forEach(tooltip => {
			tooltip.style.transition = 'all 0.3s ease';
		});
	}

	private initSliderListeners(): void {
		// Custom Game Sliders
		updateSliderDisplay('custom-paddle-height', 'custom-paddle-height-value', (value) => `${value}px`);
		updateSliderDisplay('custom-ball-radius', 'custom-ball-radius-value', (value) => `${value}px`);
		updateSliderDisplay('custom-corner-boost', 'custom-corner-boost-value', (value) => `${parseFloat(value).toFixed(1)}x`);
		updateSliderDisplay('custom-winning-score', 'custom-winning-score-value');

		// AI Game Sliders
		updateSliderDisplay('ai-paddle-height', 'ai-paddle-height-value', (value) => `${value}px`);
		updateSliderDisplay('ai-ball-radius', 'ai-ball-radius-value', (value) => `${value}px`);
		updateSliderDisplay('ai-corner-boost', 'ai-corner-boost-value', (value) => `${parseFloat(value).toFixed(1)}x`);

		// AI Custom Settings Sliders
		this.setupAICustomSliderDisplay('ai-paddle-speed', 'ai-paddle-speed-value');
		this.setupAICustomSliderDisplay('ai-reaction-time', 'ai-reaction-time-value', (value) => `${value}ms`);
		this.setupAICustomSliderDisplay('ai-prediction-accuracy', 'ai-prediction-accuracy-value', (value) => `${value}%`);
		this.setupAICustomSliderDisplay('ai-error-rate', 'ai-error-rate-value', (value) => `${value}%`);
		this.setupAICustomSliderDisplay('ai-target-win-rate', 'ai-target-win-rate-value', (value) => `${value}%`);
		this.setupAICustomSliderDisplay('ai-fairness-level', 'ai-fairness-level-value');
		this.setupAICustomSliderDisplay('ai-max-consecutive-wins', 'ai-max-consecutive-wins-value');

		// Slider value updates
		const sliders: [string, string, string?][] = [
			['custom-paddle-height', 'custom-paddle-height-value', 'px'],
			['custom-ball-radius', 'custom-ball-radius-value', 'px'],
			['custom-corner-boost', 'custom-corner-boost-value', 'x'],
			['custom-winning-score', 'custom-winning-score-value'],
			['ai-paddle-height', 'ai-paddle-height-value', 'px'],
			['ai-ball-radius', 'ai-ball-radius-value', 'px'],
			['ai-corner-boost', 'ai-corner-boost-value', 'x'],
			['ai-paddle-speed', 'ai-paddle-speed-value'],
			['ai-reaction-time', 'ai-reaction-time-value', 'ms'],
			['ai-prediction-accuracy', 'ai-prediction-accuracy-value', '%'],
			['ai-error-rate', 'ai-error-rate-value', '%'],
			['ai-target-win-rate', 'ai-target-win-rate-value'],
			['ai-fairness-level', 'ai-fairness-level-value'],
			['ai-max-consecutive-wins', 'ai-max-consecutive-wins-value']
		];

		sliders.forEach(([sliderId, valueId, suffix]) => {
			updateSliderValue(sliderId, valueId, suffix || '');
		});
	}

	private setupAICustomSliderDisplay(
		sliderId: string,
		displayId: string,
		formatter?: (value: string) => string
	): void {
		const slider = document.getElementById(sliderId) as HTMLInputElement;
		const display = document.getElementById(displayId);

		if (slider && display) {
			slider.addEventListener('input', function() {
				const formattedValue = formatter
					? formatter(this.value)
					: this.value;

				display.textContent = formattedValue;
			});
		}
	}

	private initKeyboardListeners(): void {
		// Add keyboard shortcuts
		document.addEventListener('keydown', function(e) {
			// ESC to close active panels
			if (e.key === 'Escape') {
				const gameModeCards = document.querySelectorAll('.game-mode-card');
				const settingsPanels = document.querySelectorAll('.settings-panel');
				gameModeCards.forEach(c => c.classList.remove('active'));
				settingsPanels.forEach(p => p.classList.remove('active'));
			}
		});
	}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/play.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		const link = document.querySelector("link[href='styles/play.css']");
		document.head.removeChild(link);
	}
}
