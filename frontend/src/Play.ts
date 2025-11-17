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
let canvasManager: CanvasOrientationManager | null = null;

// Window interface'ini genişletin
declare global {
    interface Window {
        roomSocket?: WebSocketClient;
        app?: App;
        canvasManager?: CanvasOrientationManager;
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
    const nextRoundPairsSection = document.getElementById('next-round-pairs-section');
    const nextRoundContainer = document.getElementById('next-round-pairs-container');

    // next-round-pairs-section görünürse next round, yoksa ilk round
    const isNextRound = nextRoundPairsSection && nextRoundPairsSection.style.display !== 'none';

    const container = isNextRound ? nextRoundContainer : matchPairsContainer;

    if (!container) {
        console.error('❌ Match pairs container not found!');
        console.error('   matchPairsContainer:', matchPairsContainer);
        console.error('   nextRoundContainer:', nextRoundContainer);
        console.error('   isNextRound:', isNextRound);
        return;
    }

    console.log(`✅ Using container: ${isNextRound ? 'next-round-pairs-container' : 'match-pairs-container'}`);
    console.log(`✅ Match pairs section display: ${matchPairsSection?.style.display}`);
    console.log(`✅ Next round section display: ${nextRoundPairsSection?.style.display}`);

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

        // Player names
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

        // İlk oyuncu
        const player1 = document.createElement('div');
        player1.className = 'match-player';
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

        // İkinci oyuncu
        const player2 = document.createElement('div');
        player2.className = 'match-player';
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

    console.log(`✅ ${pairs.length} match pairs displayed in ${isNextRound ? 'next-round' : 'first-round'}`);

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
    console.log('Started payload:', message.payload);

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

    const statusDisplay = document.getElementById('tournament-status-display') as HTMLElement;
    if (statusDisplay) {
        statusDisplay.textContent = payload.tournamentStatus || 'Eşleşmeler Hazır';
    }

    const isHost = payload.players && payload.players.some(player => player.id === currentUserId && player.isHost);

    console.log('👤 Current User ID:', currentUserId);
    console.log('🏠 Is Host:', isHost);
    console.log('📋 Players:', payload.players);

    // ===== DEBUG: Butonları kontrol et =====
    const waitingBtn = document.getElementById('waiting-players-btn') as HTMLButtonElement;
    const matchBtn = document.getElementById('match-players-btn') as HTMLButtonElement;
    const startBtn = document.getElementById('start-tournament-btn') as HTMLButtonElement;

    console.log('=== BUTTON CHECK ===');
    console.log('Waiting btn exists:', !!waitingBtn);
    console.log('Match btn exists:', !!matchBtn);
    console.log('Start btn exists:', !!startBtn);

    if (startBtn) {
        console.log('Start btn display BEFORE:', window.getComputedStyle(startBtn).display);
        console.log('Start btn parent:', startBtn.parentElement?.id || startBtn.parentElement?.className);
    }

    if (isHost) {

        if (waitingBtn) {
            waitingBtn.style.display = 'none';
        }

        if (matchBtn) {
            matchBtn.style.display = 'none';
        }

        if (startBtn) {
            startBtn.style.display = 'block';
            startBtn.disabled = false;

            console.log('=== START BUTTON SHOWN ===');
            console.log('Start btn display AFTER:', window.getComputedStyle(startBtn).display);
            console.log('Start btn disabled:', startBtn.disabled);
            console.log('Start btn offsetHeight:', startBtn.offsetHeight);
            console.log('Start btn offsetWidth:', startBtn.offsetWidth);
        } else {
            console.error('❌ START BUTTON NOT FOUND IN DOM!');
        }
    } else {
        console.log('❌ NOT HOST - Hiding start button');
        if (startBtn) {
            startBtn.style.display = 'none';
        }
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

  if (data.match && Array.isArray(data.match))
    matches = data.match;
  else if (data.rounds && Array.isArray(data.rounds)) {
    const currentRoundIndex = data.currentRound ?? 0;
    const currentRound =
      data.rounds.find((r) => r.round === currentRoundIndex) || data.rounds[0];
    matches = currentRound?.matchs || [];
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

  console.log('Match pairs transformed:', matchPairs);

  return {
    matchPairs,
    players: allPlayers,
    tournamentStatus:
      data.status === 'ready2start' ? 'Eşleşmeler Hazır' : 'Hazırlanıyor',
  };
}

function handleRoomCreated(payload) {
    console.log('Room created:', payload);
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
    currentRoomId = payload.roomId;
    showNotification(`Odaya katıldınız: ${payload.roomId}`, 'success');

    // Show appropriate waiting room
    if (payload.gameMode === 'tournament') {
        showTournamentWaitingRoom(payload);
    } else {
        showCustomWaitingRoom(payload);
    }
}

function updateRoundWaitingRoomButtons(players: any[]): void {
  console.log('🔄 Updating round waiting room buttons...');

  // Host kontrolü
  const isHost = players.some(player => {
    const playerId = player.userId || player.id;
    const playerIsHost = player.isHost === true;

    console.log(`Checking: ${player.name}, ID: ${playerId}, isHost: ${playerIsHost}, currentUserId: ${currentUserId}`);

    return playerId === currentUserId && playerIsHost;
  });

  console.log(`Host status updated: ${isHost}`);

  const roundWaitingBtn = document.getElementById('round-waiting-btn') as HTMLButtonElement | null;
  const nextRoundBtn = document.getElementById('next-round-btn') as HTMLButtonElement | null;
  const finalRoundBtn = document.getElementById('final-round-btn') as HTMLButtonElement | null;

  if (isHost) {
    console.log('✅ User is NOW HOST - showing host buttons');

    if (roundWaitingBtn) {
      roundWaitingBtn.style.display = 'none';
      roundWaitingBtn.classList.remove('active');
    }

    // Turnuva round bilgisini al
    const currentRound = tournamentData?.currentRoundNumber || 1;
    const totalRounds = tournamentData?.maxRounds || 3;
    const nextRound = currentRound + 1;

    // Final round mu?
    if (nextRound === totalRounds) {
      console.log('🏆 Showing FINAL ROUND button');
      if (nextRoundBtn) {
        nextRoundBtn.style.display = 'none';
        nextRoundBtn.classList.remove('active');
      }
      if (finalRoundBtn) {
        finalRoundBtn.style.cssText = 'display: block !important;';
        finalRoundBtn.classList.add('active');
        finalRoundBtn.disabled = false;
      }
    }
    // Normal round
    else {
      console.log('▶️ Showing NEXT ROUND button');
      if (finalRoundBtn) {
        finalRoundBtn.style.display = 'none';
        finalRoundBtn.classList.remove('active');
      }
      if (nextRoundBtn) {
        nextRoundBtn.style.cssText = 'display: block !important;';
        nextRoundBtn.classList.add('active');
        nextRoundBtn.disabled = false;
      }
    }
  } else {
    console.log('❌ User is NOT HOST - showing waiting button');

    if (nextRoundBtn) {
      nextRoundBtn.style.display = 'none';
      nextRoundBtn.classList.remove('active');
    }
    if (finalRoundBtn) {
      finalRoundBtn.style.display = 'none';
      finalRoundBtn.classList.remove('active');
    }

    if (roundWaitingBtn) {
      roundWaitingBtn.style.cssText = 'display: block !important;';
      roundWaitingBtn.classList.add('active');
      roundWaitingBtn.textContent = '⏳ Host Bekleniyor...';
    }
  }
}

// handleRoomUpdate fonksiyonunu güncelle
export function handleRoomUpdate(payload: MatchmakingData): void {
  console.log('🔄 Room update:', payload);

  if (!payload.players) return;

  const playerCount = payload.players.length;
  const maxPlayers = payload.maxPlayers ?? 2;

    // ✅ Eğer round waiting room aktifse, room update'i işleme
	const roundWaitingRoom = document.getElementById('round-waiting-room');
	if (roundWaitingRoom && roundWaitingRoom.classList.contains('active')) {
		console.log('📋 Round waiting room is active, updating buttons for host change');

		// Tournament data'yı güncelle
		if (tournamentData) {
			tournamentData.winners = payload.players;
		}

		// Butonları güncelle
		updateRoundWaitingRoomButtons(payload.players);
		return;
	}

  if (currentGameMode === 'tournament') {
    const playerCountElem = document.getElementById('players-count');
    if (playerCountElem) playerCountElem.textContent = `${playerCount}/${maxPlayers}`;

    // Eğer eşleşmeler hazırsa
    if (payload.status === 'ready2start' && payload.match) {
      console.log('🎲 Matches are ready, transforming data...');
      const transformedData = transformMatchmakingData(payload);

      const matchPairsContainer = document.getElementById('match-pairs-container');
      if (matchPairsContainer) {
        matchPairsContainer.innerHTML = '';
      }

      displayMatchPairs(transformedData.matchPairs, transformedData.players);

      const statusDisplay = document.getElementById('tournament-status-display');
      if (statusDisplay) statusDisplay.textContent = transformedData.tournamentStatus;

      const isHost = payload.players.some(
        (player) => player.id === currentUserId && player.isHost
      );

      const waitingBtn = document.getElementById('waiting-players-btn');
      const matchBtn = document.getElementById('match-players-btn');
      const startBtn = document.getElementById('start-tournament-btn') as HTMLButtonElement;

      const matchPairsSection = document.getElementById('match-pairs-section');
      if (matchPairsSection) {
        matchPairsSection.style.display = 'block';
      }

      if (isHost) {
        if (waitingBtn) waitingBtn.style.display = 'none';
        if (matchBtn) matchBtn.style.display = 'none';
        if (startBtn) {
          startBtn.style.display = 'block';
          startBtn.disabled = false;
        }
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

      const matchPairsSection = document.getElementById('match-pairs-section');
      if (matchPairsSection) {
        matchPairsSection.style.display = 'none';
      }

      const isHost = payload.players.some(
        (player) => player.id === currentUserId && player.isHost
      );

      const waitingBtn = document.getElementById('waiting-players-btn');
      const matchBtn = document.getElementById('match-players-btn') as HTMLButtonElement;
      const startBtn = document.getElementById('start-tournament-btn');
      const statusDisplay = document.getElementById('tournament-status-display');

      if (isHost) {
        // maxPlayers'ı kullan, sabit 4 yerine
        if (playerCount >= maxPlayers && playerCount % 2 === 0) {
          if (waitingBtn) waitingBtn.style.display = 'none';
          if (matchBtn) {
            matchBtn.style.display = 'block';
            matchBtn.disabled = false;
          }
          if (startBtn) startBtn.style.display = 'none';
          if (statusDisplay) statusDisplay.textContent = 'Eşleştirme Bekleniyor';
        } else {
          // Mesajı dinamik yap
          let message = '';
          if (playerCount < maxPlayers) {
            message = `Daha ${maxPlayers - playerCount} oyuncu gerekli`;
          } else if (playerCount % 2 !== 0) {
            message = 'Çift sayıda oyuncu gerekli';
          }

          if (waitingBtn) {
            waitingBtn.style.display = 'block';
            waitingBtn.textContent = message;
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

    if (payload.gameMode === 'multiplayer' || payload.gameMode === '2vs2') {
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
    gameMode: '1v1' | '2vs2' | 'classic' | 'local' | 'multiplayer' | 'tournament' | 'ai';
    gameSettings: GameSettings;
}

function handleGameStarted(payload: GameStartPayload): void {
    console.log('Payload gameSettings:', payload.gameSettings);
    console.log('Payload keys:', Object.keys(payload));
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

    if (canvasManager) {
        console.log('🎮 Canvas manager found, setting game running...');
        canvasManager.setGameRunning(true);
    } else if (window.canvasManager) {
        console.log('🎮 Canvas manager found on window, setting game running...');
        window.canvasManager.setGameRunning(true);
    } else {
        console.warn('⚠️ Canvas manager not found!');
    }
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

    if (canvasManager) {
        canvasManager.setGameRunning(false);
    } else if (window.canvasManager) {
        window.canvasManager.setGameRunning(false);
    }

    // Destroy game
    if (app) {
        app.destroy();
        app = null;
    }

    // Null kontrolü ekleyerek gameContainer'ı güvenle kullanın
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }

    // Hızlı oyun için kontrol
    const loadingScreen = document.getElementById('loading-screen');
    const gamePage = document.getElementById('game-page');

    if (loadingScreen && loadingScreen.classList.contains('active')) {
        loadingScreen.classList.remove('active');

        if (gamePage) {
            gamePage.classList.remove('hidden');
        }
    }

    if (currentGameMode === 'tournament') {
        console.log('🏆 Tournament game finished, status:', payload.status);

        // Status 'finished' veya isFinal true ise turnuva bitti demektir
        if (payload.status === 'finished' || payload.isFinal === true) {
            console.log('🏆 TOURNAMENT COMPLETED!');
            showNotification('🏆 Turnuva tamamlandı!', 'success');

            // Kazananı göster
            if (payload.winner) {
                showNotification(`🎉 Kazanan: ${payload.winner.name}`, 'success');
            } else if (payload.players && payload.players.length === 1) {
                showNotification(`🎉 Kazanan: ${payload.players[0].name}`, 'success');
            }

            // Tüm butonları gizle ve waiting room'u kapat
            const roundWaitingBtn = document.getElementById('round-waiting-btn') as HTMLButtonElement | null;
            const nextRoundBtn = document.getElementById('next-round-btn') as HTMLButtonElement | null;
            const finalRoundBtn = document.getElementById('final-round-btn') as HTMLButtonElement | null;

            if (roundWaitingBtn) roundWaitingBtn.style.display = 'none';
            if (nextRoundBtn) nextRoundBtn.style.display = 'none';
            if (finalRoundBtn) finalRoundBtn.style.display = 'none';

            // Waiting room'u kapat
            const roundWaitingRoom = document.getElementById('round-waiting-room');
            if (roundWaitingRoom) {
                roundWaitingRoom.classList.remove('active');
            }

            // Game page'i göster
            if (gamePage) {
                gamePage.classList.remove('hidden');
            }

            // Tournament data'yı sıfırla
            tournamentData = null;

            return;
        }

        // Status 'next_round' ise bir sonraki round var demektir
        if (payload.status === 'next_round') {
            console.log('🏆 Tournament round finished, showing round waiting room');
            handleRoundFinished(payload);
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
    const matchPlayersBtn = document.getElementById('match-players-btn') as HTMLButtonElement;
    const startTournamentBtn = document.getElementById('start-tournament-btn');
    const matchPairsSection = document.getElementById('match-pairs-section');

    // Null kontrolleri ile sınıf ve stil güncellemeleri
    if (gamePage) gamePage.classList.add('hidden');
    if (waitingRoom) waitingRoom.classList.add('active');
    if (backArrow) backArrow.classList.add('active');

    // Room code display
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = data.roomId || 'TOUR-XXXXX';
    }

    const playerCount = data.players?.length || 0;
    const maxPlayers = data.maxPlayers || 8;

    // Players count
    if (playersCount) {
        playersCount.textContent = `${playerCount}/${maxPlayers}`;
    }

    // Tournament status
    if (tournamentStatusDisplay) {
        const statusText = data.status === 'ready2start' ? 'Eşleştirmeler Hazır' : 'Oyuncular Bekleniyor';
        tournamentStatusDisplay.textContent = statusText;
    }

    if (data.players) {
        const isHost = data.players.some(player => player.id === currentUserId && player.isHost);

        // Eğer status 'ready2start' ise ve match varsa eşleştirmeleri göster
        if (data.status === 'ready2start' && data.match) {
            console.log('🎲 Showing match pairs...');
            const transformedData = transformMatchmakingData(data);

            // match-pairs-section'ı göster
            if (matchPairsSection) {
                matchPairsSection.style.display = 'block';
            }

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
            // match-pairs-section'ı gizle
            if (matchPairsSection) {
                matchPairsSection.style.display = 'none';
            }

            updateParticipants(data.players, 'participants-grid');

            if (isHost) {
                // maxPlayers'ı kullan, sabit 4 yerine
                if (playerCount >= maxPlayers && playerCount % 2 === 0) {
                    if (waitingPlayersBtn) waitingPlayersBtn.style.display = 'none';
                    if (matchPlayersBtn) {
                        matchPlayersBtn.style.display = 'block';
                        matchPlayersBtn.disabled = false;
                    }
                    if (startTournamentBtn) startTournamentBtn.style.display = 'none';
                    if (tournamentStatusDisplay) tournamentStatusDisplay.textContent = 'Eşleştirme Bekleniyor';
                } else {
                    // Mesajı dinamik yap
                    let message = '';
                    if (playerCount < maxPlayers) {
                        message = `En az ${maxPlayers - playerCount} oyuncu daha gerekli`;
                    } else if (playerCount % 2 !== 0) {
                        message = 'Çift sayıda oyuncu gerekli';
                    }

                    if (waitingPlayersBtn) {
                        waitingPlayersBtn.style.display = 'block';
                        waitingPlayersBtn.textContent = message;
                    }
                    if (matchPlayersBtn) matchPlayersBtn.style.display = 'none';
                    if (startTournamentBtn) startTournamentBtn.style.display = 'none';
                    if (tournamentStatusDisplay) tournamentStatusDisplay.textContent = 'Oyuncular Bekleniyor';
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
    gameMode: '1v1' | '2vs2' | 'classic' | 'multiplayer' | 'local';
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
        '1v1': '1 vs 1',
        '2vs2': '2 vs 2',
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
        if (data.gameMode === "multiplayer" || data.gameMode === '2vs2') {
            updateParticipants(data.players, 'custom-participants-grid', null, true);
        } else {
            updateParticipants(data.players, 'custom-participants-grid');
        }
    }

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
type GameMode =  '1v1' | '2vs2' | 'classic' | 'multiplayer' | 'local' | 'custom' | 'tournament' | 'ai';
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
            const formattedValue = formatter
                ? formatter(this.value)
                : this.value;

            display.textContent = formattedValue;
        });
    }
}

function updateSliderValue(sliderId: string, valueId: string, suffix: string = ''): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement | null;
    const valueDisplay = document.getElementById(valueId) as HTMLElement | null;

    if (!slider || !valueDisplay) return;

    slider.addEventListener('input', function () {
        let value: string | number = slider.value;

        if (sliderId.includes('corner-boost')) {
            if (sliderId.includes('ai-')) {
                value = parseFloat(value).toFixed(1) + 'x';
            } else {
                value = value.toString();
            }
        } else if (sliderId.includes('target-win-rate')) {
            value = (parseInt(value) * 10) + '%';
        } else {
            value += suffix;
        }

        valueDisplay.style.transform = 'scale(1.1)';
        valueDisplay.textContent = value.toString();

        setTimeout(() => {
            valueDisplay.style.transform = 'scale(1)';
        }, 200);
    });
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

function connectWebSocket() {
	// Generate user credentials
	currentUserId = localStorage.getItem("userName") ?? "Player";
	// currentUserName = generateRandomName();
    // displayname gelicek VVVVVVVV
	currentUserName = localStorage.getItem("userName") ?? "Player";

	// Initialize WebSocket
	roomSocket = new WebSocketClient(window.location.hostname, 3030);

	// WebSocket event handlers
	roomSocket.onConnect(() => {
		console.log('Connected to room server');
	});

	roomSocket.onMessage((message) => {
		try {
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
	});

	roomSocket.onError((error) => {
		console.error('❌ Room server connection error:', error);
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
}

// DOM Elements
const gameModeCards = document.querySelectorAll<HTMLElement>('.game-mode-card');
const settingsPanels = document.querySelectorAll<HTMLElement>('.settings-panel');
const aiDifficultyRadios = document.querySelectorAll<HTMLInputElement>('input[name="ai-difficulty"]');
const aiCustomSettings = document.getElementById('ai-custom-settings') as HTMLElement | null;

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

    const currentRound = data.currentRoundNumber || 1;
    const totalRounds = data.maxRounds || 3;
    const winnersCount = data.winners ? data.winners.length : 0;

    if (currentRoundDisplay) currentRoundDisplay.textContent = currentRound;
    if (totalRoundsDisplay) totalRoundsDisplay.textContent = totalRounds;
    if (remainingPlayersDisplay) remainingPlayersDisplay.textContent = winnersCount;

    // Next round bilgisi
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
            displayMatchPairs(data.nextMatches, data.winners);
        }
    } else {
        if (nextRoundPairsSection) {
            nextRoundPairsSection.style.display = 'none';
        }
    }

    // Host kontrolü
    const isHost = data.winners && data.winners.some(player => {
        const playerId = player.userId || player.id;
        const playerIsHost = player.isHost === true;

        console.log(`Checking player: ${player.name}, ID: ${playerId}, isHost: ${playerIsHost}, currentUserId: ${currentUserId}`);

        return playerId === currentUserId && playerIsHost;
    });

    console.log(`=== HOST CHECK RESULT ===`);
    console.log(`Host check - isHost: ${isHost}, currentUserId: ${currentUserId}`);
    console.log(`Winners:`, data.winners);

    // Butonları ayarla
    const roundWaitingBtn = document.getElementById('round-waiting-btn') as HTMLButtonElement | null;
    const nextRoundBtn = document.getElementById('next-round-btn') as HTMLButtonElement | null;
    const finalRoundBtn = document.getElementById('final-round-btn') as HTMLButtonElement | null;

    console.log('=== BUTTON ELEMENTS ===');
    console.log('roundWaitingBtn exists:', !!roundWaitingBtn);
    console.log('nextRoundBtn exists:', !!nextRoundBtn);
    console.log('finalRoundBtn exists:', !!finalRoundBtn);

    // ✅ DÜZELTME: display yerine classList kullan ve !important ekle
    if (isHost) {
        console.log('✅ User is HOST - showing appropriate button');

        // Önce tüm butonları gizle
        if (roundWaitingBtn) {
            roundWaitingBtn.style.display = 'none';
            roundWaitingBtn.classList.remove('active');
        }

        // Turnuva bitti mi kontrol et
        if (currentRound >= totalRounds) {
            console.log('🏆 Tournament completed - no buttons shown');
            showNotification('🏆 Turnuva tamamlandı!', 'success');
            if (nextRoundBtn) nextRoundBtn.style.display = 'none';
            if (finalRoundBtn) finalRoundBtn.style.display = 'none';
            return;
        }
        // Final round mu?
        else if (nextRound === totalRounds) {
            console.log('🏆 Showing FINAL ROUND button');
            if (nextRoundBtn) {
                nextRoundBtn.style.display = 'none';
                nextRoundBtn.classList.remove('active');
            }
            if (finalRoundBtn) {
                finalRoundBtn.style.cssText = 'display: block !important;';
                finalRoundBtn.classList.add('active');
                finalRoundBtn.disabled = false;
                console.log('Final round button display:', window.getComputedStyle(finalRoundBtn).display);
                console.log('Final round button classList:', finalRoundBtn.classList);
            }
        }
        // Normal round
        else {
            console.log('▶️ Showing NEXT ROUND button');
            if (finalRoundBtn) {
                finalRoundBtn.style.display = 'none';
                finalRoundBtn.classList.remove('active');
            }
            if (nextRoundBtn) {
                // ✅ !important ile zorla göster
                nextRoundBtn.style.cssText = 'display: block !important;';
                nextRoundBtn.classList.add('active');
                nextRoundBtn.disabled = false;

                console.log('Next round button display:', window.getComputedStyle(nextRoundBtn).display);
                console.log('Next round button classList:', nextRoundBtn.classList);
                console.log('Next round button offsetHeight:', nextRoundBtn.offsetHeight);
                console.log('Next round button offsetWidth:', nextRoundBtn.offsetWidth);
            }
        }
    } else {
        console.log('❌ User is NOT HOST - showing waiting button');

        // Önce host butonlarını gizle
        if (nextRoundBtn) {
            nextRoundBtn.style.display = 'none';
            nextRoundBtn.classList.remove('active');
        }
        if (finalRoundBtn) {
            finalRoundBtn.style.display = 'none';
            finalRoundBtn.classList.remove('active');
        }

        // Turnuva bitti mi kontrol et
        if (currentRound >= totalRounds) {
            console.log('🏆 Tournament completed - no waiting button');
            if (roundWaitingBtn) roundWaitingBtn.style.display = 'none';
            return;
        }

        if (roundWaitingBtn) {
            roundWaitingBtn.style.cssText = 'display: block !important;';
            roundWaitingBtn.classList.add('active');
            roundWaitingBtn.textContent = '⏳ Host Bekleniyor...';
            console.log('Waiting button display:', window.getComputedStyle(roundWaitingBtn).display);
        }
    }
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
function handleRoundFinished(payload: RoundFinishedPayload): void {
    console.log('🏁 Round finished:', payload);

    if (!payload) {
        console.error('Invalid round data: payload is null');
        showNotification('Round verisi geçersiz!', 'error');
        return;
    }

    const currentRound = payload.currentRound || 1;
    const maxRound = payload.maxRound || payload.totalRounds || 3;

    console.log(`Round finished - Current: ${currentRound}, Max: ${maxRound}`);

    // ✅ DÜZELTME: players = kazananlar (payload.players kullan)
    const winners = payload.players || [];
    const eliminated = payload.losers || payload.eliminated || [];

    console.log(`Winners: ${winners.length}, Eliminated: ${eliminated.length}`);
    console.log('Winners data:', winners);

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
        winners: winners,  // ✅ Bu artık payload.players'dan geliyor
        eliminated: eliminated,
        nextMatches: nextMatches
    };

    console.log('Tournament data updated:', tournamentData);

    // Round arası bekleme odasını göster
    showRoundWaitingRoom(tournamentData);

    showNotification(`Round ${currentRound} tamamlandı!`, 'success');
}

// ============================================================================
// CANVAS ORIENTATION LOCK - LANDSCAPE ONLY
// ============================================================================

class CanvasOrientationManager {
    private canvas: HTMLCanvasElement | null;
    private resizeObserver: ResizeObserver | null = null;
    private portraitWarning: HTMLElement | null = null;
    private isResizing: boolean = false;
    private resizeTimeout: number | null = null;
    private hasTouchCapability: boolean = false;
    private isCanvasReady: boolean = false;
    private isGameRunning: boolean = false;
    private keyboardListener: ((e: KeyboardEvent) => void) | null = null;
    private directionButtonsContainer: HTMLElement | null = null;

    constructor(canvasId: string = 'renderCanvas') {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.hasTouchCapability = this.detectTouchCapability();

        console.log(`🔍 DETECTION RESULT:`);
        console.log(`   Touch Capability: ${this.hasTouchCapability}`);
        console.log(`   maxTouchPoints: ${navigator.maxTouchPoints}`);
        console.log(`   ontouchstart: ${'ontouchstart' in window}`);

        if (this.canvas) {
            this.waitForCanvasReady();
        } else {
            console.error('Canvas element not found!');
        }
    }

    public setGameRunning(isRunning: boolean): void {
        console.log(`🎮 Game running state changed: ${isRunning}`);
        this.isGameRunning = isRunning;

        if (isRunning) {
            this.checkOrientation();
            this.setupKeyboardControls();
        } else {
            this.hidePortraitWarning();
            this.hideDirectionButtons();
            this.removeKeyboardControls();
        }
    }

    private setupKeyboardControls(): void {
        if (this.keyboardListener) return; // Zaten kuruluysa tekrar kurma

        this.keyboardListener = (e: KeyboardEvent) => {
            const isPortrait = window.innerHeight > window.innerWidth;

            // Sadece portrait modda ve touch cihazda çalış
            if (!isPortrait || !this.hasTouchCapability) return;

            // Arrow Up / Arrow Down tuşlarını yakala
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault(); // Varsayılan davranışı engelle

                // Custom event oluştur ve gönder
                const direction = e.key === 'ArrowUp' ? 'up' : 'down';
                console.log(`⬆️ Portrait mode key pressed: ${direction}`);

                window.dispatchEvent(new CustomEvent('portraitKeyPress', {
                    detail: { direction }
                }));
            }
        };

        // Event listener'ı ekle
        window.addEventListener('keydown', this.keyboardListener);
        console.log('⌨️ Portrait mode keyboard controls enabled');
    }

    private removeKeyboardControls(): void {
        if (this.keyboardListener) {
            window.removeEventListener('keydown', this.keyboardListener);
            this.keyboardListener = null;
            console.log('⌨️ Portrait mode keyboard controls disabled');
        }
    }

    private waitForCanvasReady(): void {
        if (!this.canvas) return;

        const checkCanvasReady = () => {
            if (this.canvas!.width > 0 && this.canvas!.height > 0) {
                console.log('Canvas is ready!');
                this.isCanvasReady = true;

                if (this.hasTouchCapability) {
                    this.init();
                } else {
                    this.initDesktopMode();
                }
            } else {
                requestAnimationFrame(checkCanvasReady);
            }
        };

        checkCanvasReady();
    }

    private detectTouchCapability(): boolean {
        const maxTouchPoints = navigator.maxTouchPoints ?? 0;
        const hasOnTouchStart = 'ontouchstart' in window;
        const hasMsMaxTouchPoints = ((navigator as any).msMaxTouchPoints ?? 0) > 0;

        let hasTouchEvent = false;
        try {
            new TouchEvent('test');
            hasTouchEvent = true;
        } catch (e) {
            hasTouchEvent = false;
        }

        const result = maxTouchPoints > 0 || hasOnTouchStart || hasMsMaxTouchPoints || hasTouchEvent;

        console.log(`🔍 Touch Detection Details:`);
        console.log(`   - maxTouchPoints: ${maxTouchPoints} (MOST RELIABLE)`);
        console.log(`   - ontouchstart: ${hasOnTouchStart}`);
        console.log(`   - msMaxTouchPoints: ${hasMsMaxTouchPoints}`);
        console.log(`   - TouchEvent: ${hasTouchEvent}`);
        console.log(`   - FINAL RESULT: ${result}`);

        return result;
    }

    private initDesktopMode(): void {
        if (!this.canvas) return;

        console.log('💻 DESKTOP MODE - No touch capability detected');

        this.updateCanvasLayout();
        window.addEventListener('resize', () => this.throttledHandleResize());
        this.setupResizeObserver();
    }

    private init(): void {
        if (!this.canvas) return;

        console.log('📱 MOBILE MODE - Touch capability detected');

        this.updateCanvasLayout();
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        window.addEventListener('resize', () => this.throttledHandleResize());
        this.setupResizeObserver();
        this.ensureViewportMeta();
        this.createPortraitWarning();
		this.createDirectionButtons();
        this.checkOrientation();
    }

    private throttledHandleResize(): void {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            this.handleResize();
            this.resizeTimeout = null;
        }, 100);
    }

    public handleOrientationChange(): void {
        setTimeout(() => {
            this.checkOrientation();
            this.updateCanvasLayout();
            this.dispatchCanvasResizeEvent();
        }, 100);
    }

    private handleResize(): void {
        if (this.isResizing) return;

        this.isResizing = true;

        this.checkOrientation();
        this.updateCanvasLayout();
        this.dispatchCanvasResizeEvent();

        this.isResizing = false;
    }

    private checkOrientation(): void {
        // Sadece canvas hazırsa, touch cihazsa VE oyun çalışıyorsa kontrol et
        if (!this.isCanvasReady || !this.hasTouchCapability || !this.isGameRunning) {
            return;
        }

        const isPortrait = window.innerHeight > window.innerWidth;

        console.log(`📐 Mobile Orientation: ${isPortrait ? 'PORTRAIT' : 'LANDSCAPE'}`);

    if (isPortrait) {
        this.showPortraitWarning();
        this.hideDirectionButtons();
    } else {
        this.hidePortraitWarning();
        this.showDirectionButtons();
    }
    }

    private createPortraitWarning(): void {
        if (document.getElementById('portrait-warning')) return;

        this.portraitWarning = document.createElement('div');
        this.portraitWarning.id = 'portrait-warning';
        this.portraitWarning.innerHTML = `
            <div class="portrait-warning-content">
                <svg class="rotate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 4v6h6M23 20v-6h-6"></path>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64"></path>
                    <path d="M3.51 15A9 9 0 0 0 18.36 18.36"></path>
                </svg>
                <h2>Lütfen Cihazınızı Döndürün</h2>
                <p>Bu oyun yatay (landscape) modda oynanmalıdır</p>
                <div class="device-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="2" y1="20" x2="22" y2="20"></line>
                    </svg>
                </div>
            </div>
        `;

        // Canvas'ın üzerine yazdır - z-index yüksek tut
        this.portraitWarning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background:
                radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
                linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 0;
            overflow: hidden;
            pointer-events: none;
        `;

        document.body.appendChild(this.portraitWarning);
        this.addPortraitWarningStyles();
        this.createDirectionButtons();
    }

    private createDirectionButtons(): void {
        if (document.getElementById('direction-buttons')) return;

        this.directionButtonsContainer = document.createElement('div');
        this.directionButtonsContainer.id = 'direction-buttons';
        this.directionButtonsContainer.innerHTML = `
            <button id="btn-up" class="direction-btn">▲</button>
            <button id="btn-down" class="direction-btn">▼</button>
        `;
        document.body.appendChild(this.directionButtonsContainer);

        const style = document.createElement('style');
        style.id = 'direction-buttons-style';
        style.textContent = `
            #direction-buttons {
                position: fixed;
                bottom: 10vh;
                right: 5vw;
                display: none; /* Başta görünmesin */
                flex-direction: column;
                gap: 20px;
                z-index: 11000;
                pointer-events: auto;
            }

            .direction-btn {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                border: 2px solid #00ffff;
                background-color: transparent;
                color: #00ffff;
                font-size: 32px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }

            .direction-btn:active {
                transform: scale(0.9);
                background-color: rgba(0, 255, 255, 0.1);
                box-shadow: 0 0 20px #00ffff;
            }

            @media (max-width: 768px) {
                .direction-btn {
                    width: 60px;
                    height: 60px;
                    font-size: 28px;
                }
            }
        `;
        document.head.appendChild(style);

        // Event binding
        const upBtn = document.getElementById('btn-up');
        const downBtn = document.getElementById('btn-down');

		downBtn?.addEventListener('touchstart',
			() =>
			{
				const e = new KeyboardEvent('keydown', { key: 's' });
				document.dispatchEvent(e);
			}
		);

		downBtn?.addEventListener('touchend',
			() =>
			{
				const e = new KeyboardEvent('keyup', { key: 's' });
				document.dispatchEvent(e);
			}
		);

		upBtn?.addEventListener('touchstart',
			() =>
			{
				const e = new KeyboardEvent('keydown', { key: 'w' });
				document.dispatchEvent(e);
			}
		);

		upBtn?.addEventListener('touchend',
			() =>
			{
				const e = new KeyboardEvent('keyup', { key: 'w' });
				document.dispatchEvent(e);
			}
		);

    }

    private showDirectionButtons(): void {
        const container = document.getElementById('direction-buttons');
        if (container) container.style.display = 'flex';
    }

    private hideDirectionButtons(): void {
        const container = document.getElementById('direction-buttons');
        if (container) container.style.display = 'none';
    }

    private addPortraitWarningStyles(): void {
        if (document.getElementById('portrait-warning-styles')) return;

        const style = document.createElement('style');
        style.id = 'portrait-warning-styles';
        style.textContent = `
            #portrait-warning {
                animation: fadeIn 0.3s ease-in-out;
            }

            #portrait-warning.show {
                display: flex !important;
                pointer-events: auto;
            }

            #portrait-warning.hide {
                display: none !important;
                pointer-events: none;
            }

            .portrait-warning-content {
                text-align: center;
                animation: slideUp 0.5s ease-out;
                pointer-events: auto;
            }

            .portrait-warning-content h2 {
                font-size: 28px;
                margin: 20px 0 10px 0;
                font-weight: 600;
                letter-spacing: -0.5px;
            }

            .portrait-warning-content p {
                font-size: 16px;
                color: rgba(255, 255, 255, 0.7);
                margin: 0 0 40px 0;
                line-height: 1.5;
            }

            .rotate-icon {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
                animation: rotate 2s linear infinite;
            }

            .device-icon {
                margin-top: 40px;
                animation: pulse 2s ease-in-out infinite;
            }

            .device-icon svg {
                width: 120px;
                height: 80px;
                stroke: rgba(255, 255, 255, 0.5);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from {
                    transform: translateY(30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes pulse {
                0%, 100% {
                    opacity: 0.5;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.05);
                }
            }

            @media (max-width: 768px) {
                .portrait-warning-content h2 {
                    font-size: 24px;
                }

                .portrait-warning-content p {
                    font-size: 14px;
                }

                .rotate-icon {
                    width: 60px;
                    height: 60px;
                }

                .device-icon svg {
                    width: 100px;
                    height: 70px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    private showPortraitWarning(): void {
        if (this.portraitWarning) {
            this.portraitWarning.classList.remove('hide');
            this.portraitWarning.classList.add('show');
        }
    }

    private hidePortraitWarning(): void {
        if (this.portraitWarning) {
            this.portraitWarning.classList.remove('show');
            this.portraitWarning.classList.add('hide');
        }
    }

    private updateCanvasLayout(): void {
        if (!this.canvas) return;

        // Canvas'ı her zaman göster
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            border: none;
            display: block;
            transform: none;
            z-index: 1000;
        `;

        // Body ve HTML'i düzenle
        document.body.style.cssText = `
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            position: fixed;
        `;

        document.documentElement.style.cssText = `
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        `;
    }

    private setupResizeObserver(): void {
        if (!this.canvas || !('ResizeObserver' in window)) return;

        this.resizeObserver = new ResizeObserver(() => {
            this.throttledHandleResize();
        });

        this.resizeObserver.observe(this.canvas);
    }

    private dispatchCanvasResizeEvent(): void {
        window.dispatchEvent(new Event('resize'));

        window.dispatchEvent(new CustomEvent('canvasResize', {
            detail: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        }));
    }

    private ensureViewportMeta(): void {
        let viewportMeta = document.querySelector('meta[name="viewport"]');

        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.setAttribute('name', 'viewport');
            document.head.appendChild(viewportMeta);
        }

        viewportMeta.setAttribute('content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
    }

    public destroy(): void {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.portraitWarning && this.portraitWarning.parentNode) {
            this.portraitWarning.parentNode.removeChild(this.portraitWarning);
        }

        const styleTag = document.getElementById('portrait-warning-styles');
        if (styleTag && styleTag.parentNode) {
            styleTag.parentNode.removeChild(styleTag);
        }

        this.removeKeyboardControls();

        const btnContainer = document.getElementById('direction-buttons');
        const btnStyle = document.getElementById('direction-buttons-style');
        if (btnContainer) btnContainer.remove();
        if (btnStyle) btnStyle.remove();
    }
}

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

        // Sayfa yüklendiğinde "Oyun" sekmesini aç
        requestAnimationFrame(() => {
            const customModeCard = document.getElementById('custom-mode');
            const customSettings = document.getElementById('custom-settings');

            if (customModeCard && customSettings) {
                // Tüm mod kartlarını ve ayar panellerini kapat
                document.querySelectorAll('.game-mode-card').forEach(card => {
                    card.classList.remove('active');
                });
                document.querySelectorAll('.settings-panel').forEach(panel => {
                    panel.classList.remove('active');
                });

                // Custom Game sekmesini aç
                customModeCard.classList.add('active');
                customSettings.classList.add('active');

                // Geçerli oyun modunu güncelle
                currentGameMode = 'custom';
            }
			// handleOrientation();
        });
	}

	async setDynamicContent() {
		connectWebSocket();

		// Canvas manager'ı başlat
		canvasManager = new CanvasOrientationManager('renderCanvas');
		window.canvasManager = canvasManager;
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

			// Oyun tipine göre gameMode'u belirle
			let gameMode: string;
			switch (gameTypeElement.value) {
				case '1vs1':
					gameMode = 'classic';
					break;
				case '2vs2':
					gameMode = 'multiplayer';
					break;
				case 'local':
					gameMode = 'local';
					break;
				default:
					gameMode = 'classic';
			}

			// Data objesi oluştur
			const data = {
				gameType: gameTypeElement.value,
				gameMode: gameMode,
				gameSettings: {
					...gameConfig.gameSettings,
					paddleHeight: parseInt(paddleHeightEl.value, 10),
					ballRadius: parseInt(ballRadiusEl.value, 10),
					ballSpeedIncrease: parseFloat(cornerBoostEl.value),
					maxScore: parseInt(winningScoreEl.value, 10),
					ballSpeed: 5, // Varsayılan değer
					paddleWidth: 15, // Varsayılan değer
					paddleSpeed: 6, // Varsayılan değer
				}
			};

			roomSocket.send("create", data);
			showNotification('Oda oluşturuluyor...', 'info');
		});

		document.getElementById('custom-winning-score')?.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				document.getElementById('custom-create-btn')?.click();
			}
		});

		document.getElementById('custom-room-code')?.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				document.getElementById('custom-join-btn')?.click();
			}
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
			roomSocket.send("join", { roomId: roomCode, gameMode: 'classic' });
			showNotification(`${roomCode} kodlu odaya katılıyorsunuz...`, 'info');
		});

		// Custom Game - Start Game
		document.getElementById('custom-start-game-btn')?.addEventListener('click', function() {
		    if (!currentRoomId || !roomSocket) {
		        showNotification('Bağlantı hatası!', 'error');
		        return;
		    }
		    const startButton = this as HTMLButtonElement;
		    startButton.disabled = true;
		    startButton.innerHTML = '<div class="loading"></div> Başlatılıyor...';
		    roomSocket.send("start", {
		        roomId: currentRoomId,
		        gameMode: 'classic'
		    });
		    console.log(`Start message sent for room: ${currentRoomId}`);
		    showNotification('🚀 Oyun başlatılıyor!', 'success');
		    // Timeout - eğer yanıt gelmezse butonu tekrar etkinleştir
		    setTimeout(() => {
		        if (startButton.disabled) {
		            startButton.disabled = false;
		            startButton.innerHTML = '🚀 Oyunu Başlat';
		            showNotification('⚠️ Oyun başlatma zaman aşımına uğradı', 'warning');
		        }
		    }, 10000);
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

			const data = {
				gameMode: 'tournament',
				gameType: 'tournament',
				tournamentSettings: {
					...tournamentConfig.tournamentSettings,
					name: tournamentName,
					maxPlayers: tournamentSize
				}
			};

			// Global değişken ataması
			currentGameMode = 'tournament';

			// Güvenli socket gönderimi
			if (roomSocket) {
				console.log(`🏆 Creating tournament: "${tournamentName}" with ${tournamentSize} players`);
				roomSocket.send("create", data);
				showNotification(`"${tournamentName}" turnuvası oluşturuluyor...`, 'info');
			} else {
				showNotification('Soket bağlantısı hatası!', 'error');
			}
		});

		document.getElementById('tournament-name')?.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				document.getElementById('tournament-create-btn')?.click();
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

		document.getElementById('tournament-code')?.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				document.getElementById('tournament-join-btn')?.click();
			}
		});

		// Tournament start button
        document.getElementById('start-tournament-btn')?.addEventListener('click', function() {
            console.log("TOURNAMENT START BUTTON CLICKED!");

            const startButton = this as HTMLButtonElement;

            // Null kontrolü
            if (!currentRoomId) {
                showNotification('Oda ID\'si bulunamadı!', 'error');
                return;
            }

            if (!roomSocket) {
                showNotification('WebSocket bağlantısı yok!', 'error');
                return;
            }

            // Butonu devre dışı bırak
            startButton.disabled = true;
            startButton.innerHTML = '<div class="loading"></div> Başlatılıyor...';

            // WebSocket mesajı gönder - roomId'yi ekle
            roomSocket.send("start", {
                roomId: currentRoomId,
                gameMode: 'tournament'
            });

            console.log(`Start message sent for room: ${currentRoomId}`);
            showNotification('🚀 Turnuva başlatılıyor!', 'success');

            // Timeout - eğer yanıt gelmezse butonu tekrar etkinleştir
            setTimeout(() => {
                if (startButton.disabled) {
                    startButton.disabled = false;
                    startButton.innerHTML = '🚀 Turnuvayı Başlat';
                    showNotification('⚠️ Turnuva başlatma zaman aşımına uğradı', 'warning');
                }
            }, 10000);
        });

        // Next Round Button
        document.getElementById('next-round-btn')?.addEventListener('click', function() {
            console.log("NEXT ROUND BUTTON CLICKED!");

            const nextRoundBtn = this as HTMLButtonElement;

            if (!currentRoomId) {
                showNotification('Oda ID\'si bulunamadı!', 'error');
                return;
            }

            if (!roomSocket) {
                showNotification('WebSocket bağlantısı yok!', 'error');
                return;
            }

            nextRoundBtn.disabled = true;
            nextRoundBtn.innerHTML = '<div class="loading"></div> Başlatılıyor...';

            const currentRound = tournamentData?.currentRoundNumber ?? 1;

            roomSocket.send("start", {
                roomId: currentRoomId,
                round: currentRound + 1,
                gameMode: 'tournament'
            });

            showNotification('🎮 Sonraki round başlatılıyor!', 'success');

            setTimeout(() => {
                if (nextRoundBtn.disabled) {
                    nextRoundBtn.disabled = false;
                    nextRoundBtn.innerHTML = '▶️ Start Next Round';
                }
            }, 10000);
        });

		document.getElementById('next-round-btn')?.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				(this as HTMLElement).click();
			}
		});

        // Final Round butonuna event listener ekle
        const finalRoundBtn = document.getElementById('final-round-btn') as HTMLButtonElement | null;
        if (finalRoundBtn) {
            finalRoundBtn.addEventListener('click', () => {
                if (!currentRoomId || !roomSocket) {
                    showNotification('Bağlantı hatası!', 'error');
                    return;
                }

                finalRoundBtn.disabled = true;
                finalRoundBtn.innerHTML = '<div class="loading"></div> Başlatılıyor...';

                const currentRound = tournamentData?.currentRoundNumber ?? 1;

                roomSocket.send("start", {
                    roomId: currentRoomId,
                    round: currentRound + 1,
                    isFinal: true,
                    gameMode: 'tournament'
                });
                showNotification('🏆 Final round başlatılıyor!', 'success');

                setTimeout(() => {
                    if (finalRoundBtn.disabled) {
                        finalRoundBtn.disabled = false;
                        finalRoundBtn.innerHTML = '🏆 Final Turunu Başlat';
                    }
                }, 10000);
            });
            finalRoundBtn.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    finalRoundBtn.click();
                }
        });
        }

		document.getElementById('match-players-btn')?.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				(this as HTMLElement).click();
			}
		});

        // Kişileri eşleştir butonu
        document.getElementById('match-players-btn')?.addEventListener('click', function() {
            if (!currentRoomId || !roomSocket) {
                showNotification('Bağlantı hatası!', 'error');
                return;
            }

            console.log(`🎲 Matching players for room: ${currentRoomId}`);
            roomSocket.send("matchTournament", { roomId: currentRoomId });
            showNotification('Eşleştirmeler yapılıyor...', 'info');
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
		const backArrowBtn = document.getElementById('back-arrow');

		if (backArrowBtn) {
			backArrowBtn.addEventListener('click', () => {
				console.log('Back arrow clicked!');
				// Leave room if in one
				if (currentRoomId && roomSocket) {
					console.log(`Leaving room: ${currentRoomId}`);
					roomSocket.send("leave", { roomId: currentRoomId });
					currentRoomId = null;
				}
				// Hide all waiting rooms
				document.querySelectorAll('.waiting-room').forEach((room: Element) => {
					(room as HTMLElement).classList.remove('active');
				});
				// Hide game container
				const gameContainer = document.getElementById('gameContainer');
				if (gameContainer) {
					gameContainer.style.display = 'none';
				}
				// Show game mode selection
				const gameModeSelection = document.getElementById('game-page');
				if (gameModeSelection) {
					gameModeSelection.classList.remove('hidden');
				}
				// Hide back arrow
				backArrowBtn.classList.remove('active');
				// Reset tournament data
				tournamentData = null;
				showNotification('Odadan ayrıldınız', 'info');
			});
		} else {
			console.error('❌ Back arrow button not found!');
		}
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
	    updateSliderDisplay('custom-corner-boost', 'custom-corner-boost-value', (value) => `${value}`);
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
	        ['custom-corner-boost', 'custom-corner-boost-value', ''],
	        ['custom-winning-score', 'custom-winning-score-value', ''],
	        ['ai-paddle-height', 'ai-paddle-height-value', 'px'],
	        ['ai-ball-radius', 'ai-ball-radius-value', 'px'],
	        ['ai-corner-boost', 'ai-corner-boost-value', 'x'],
	        ['ai-reaction-time', 'ai-reaction-time-value', ''],
	        ['ai-prediction-accuracy', 'ai-prediction-accuracy-value', ''],
	        ['ai-general-accuracy', 'ai-general-accuracy-value', ''],
	        ['ai-learning-speed', 'ai-learning-speed-value', ''],
	        ['ai-preparation-distance', 'ai-preparation-distance-value', ''],
	        ['ai-freeze-distance', 'ai-freeze-distance-value', ''],
	        ['ai-target-win-rate', 'ai-target-win-rate-value', ''],
	        ['ai-fairness-level', 'ai-fairness-level-value', ''],
	        ['ai-max-consecutive-wins', 'ai-max-consecutive-wins-value', '']
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
		if (canvasManager) {
			canvasManager?.destroy();
			canvasManager = null;
		}
		roomSocket.disconnect();
	}
}
