// ============================================================================
// IMPORTS
// ============================================================================
import App from './src/App.js';
import WebSocketClient from './src/network/WebSocketClient.js';
import gameConfig from './src/json/GameConfig.js';
import aiConfig from './src/json/AiConfig.js';
import tournamentConfig from './src/json/TournamentConfig.js';

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let app = null;
let roomSocket = null;
let currentUserId = null;
let currentUserName = null;
let currentRoomId = null;
let currentGameMode = null;

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

// Enhanced notification system with stacking
let notificationCount = 0;
const notificationContainer = createNotificationContainer();

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const notificationId = `notification-${notificationCount++}`;
    notification.id = notificationId;
    // Icon seçimi
    let icon = '';
    switch(type) {
        case 'success':
            icon = '✅';
            break;
        case 'error':
            icon = '❌';
            break;
        case 'info':
            icon = 'ℹ️';
            break;
        default:
            icon = '📢';
	}
    notification.style.cssText = `
        padding: 16px 24px;
        background: ${type === 'success' ? 'rgba(0, 255, 0, 0.1)' : type === 'error' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 255, 0.1)'};
        border: 1px solid ${type === 'success' ? 'rgba(0, 255, 0, 0.3)' : type === 'error' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(0, 255, 255, 0.3)'};
        color: white;
        border-radius: 12px;
        font-weight: 500;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        font-family: 'Inter', sans-serif;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 250px;
        max-width: 400px;
        pointer-events: auto;
        animation: slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform-origin: right center;
        backdrop-filter: blur(10px);
    `;

    notification.innerHTML = `
        <span style="font-size: 20px;">${icon}</span>
        <span style="flex: 1;">${message}</span>
    `;

    notificationContainer.appendChild(notification);

    // Auto remove after 3 seconds with fade out animation
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);

    // Click to dismiss
    notification.addEventListener('click', function() {
        this.style.animation = 'slideOutRight 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
        setTimeout(() => {
            if (this.parentNode) {
                this.remove();
            }
        }, 300);
    });

    // Hover pause
    notification.addEventListener('mouseenter', function() {
        this.style.animationPlayState = 'paused';
    });
    notification.addEventListener('mouseleave', function() {
        this.style.animationPlayState = 'running';
    });
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

// updateParticipants fonksiyonunu güncelle
function updateParticipants(participants, gridId, matchPairs = null, multiplayerMode = false) {
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

    document.getElementById('tournament-status-display').textContent =
        payload.tournamentStatus || 'Eşleşmeler Hazır';

    // DÜZELTME: id kullan, userId değil
    const isHost = payload.players && payload.players.some(player => player.id === currentUserId && player.isHost);

    if (isHost) {
        document.getElementById('waiting-players-btn').style.display = 'none';
        document.getElementById('match-players-btn').style.display = 'none';
        document.getElementById('start-tournament-btn').style.display = 'block';
    } else {
        document.getElementById('waiting-players-btn').style.display = 'block';
        document.getElementById('waiting-players-btn').textContent = '⏳ Turnuva Başlatılıyor...';
        document.getElementById('match-players-btn').style.display = 'none';
        document.getElementById('start-tournament-btn').style.display = 'none';
    }

    showNotification('Eşleştirmeler tamamlandı!', 'success');
}

// transformMatchmakingData - DÜZELTİLMİŞ
function transformMatchmakingData(data) {
    console.log('🔄 Transforming matchmaking data:', data);

    if (!data) {
        console.error('No data provided');
        return { matchPairs: [], players: [] };
    }

    // Match dizisini al
    let matches = [];

    if (data.match && Array.isArray(data.match)) {
        matches = data.match;
        console.log('✅ Found direct match array:', matches);
    } else if (data.rounds && Array.isArray(data.rounds)) {
        const currentRoundIndex = data.currentRound || 0;
        const currentRound = data.rounds.find(r => r.round === currentRoundIndex) || data.rounds[0];
        matches = currentRound?.matchs || [];
        console.log('✅ Found matches in rounds:', matches);
    }

    if (!matches || matches.length === 0) {
        console.error('No matches found in data');
        return { matchPairs: [], players: [] };
    }

    // Tüm oyuncuları topla
    const allPlayers = [];
    const playerMap = new Map();

    // Players dizisinden oyuncuları al
    if (data.players && Array.isArray(data.players)) {
        data.players.forEach(player => {
            if (player && player.id && !playerMap.has(player.id)) {
                playerMap.set(player.id, {
                    userId: player.id,
                    name: player.name,
                    isHost: player.isHost || false
                });
                allPlayers.push({
                    userId: player.id,
                    name: player.name,
                    isHost: player.isHost || false
                });
            }
        });
    }

    // Match'lerden de oyuncuları ekle
    matches.forEach(match => {
        if (match.player1 && !playerMap.has(match.player1.id)) {
            playerMap.set(match.player1.id, {
                userId: match.player1.id,
                name: match.player1.name,
                isHost: match.player1.isHost || false
            });
            allPlayers.push({
                userId: match.player1.id,
                name: match.player1.name,
                isHost: match.player1.isHost || false
            });
        }
        if (match.player2 && !playerMap.has(match.player2.id)) {
            playerMap.set(match.player2.id, {
                userId: match.player2.id,
                name: match.player2.name,
                isHost: match.player2.isHost || false
            });
            allPlayers.push({
                userId: match.player2.id,
                name: match.player2.name,
                isHost: match.player2.isHost || false
            });
        }
    });

    console.log('📋 All players collected:', allPlayers);

    // Eşleştirmeleri dönüştür
    const matchPairs = matches.map((match, index) => {
        const player1 = match.player1 || { id: 'unknown', name: 'Unknown' };
        const player2 = match.player2 || { id: 'unknown', name: 'Unknown' };

        return {
            matchNumber: match.matchNumber !== undefined ? match.matchNumber : index,
            players: [player1.id, player2.id],
            playerNames: [player1.name, player2.name],
            winner: match.winner || null,
            loser: match.loser || null
        };
    });

    console.log('✅ Match pairs transformed:', matchPairs);

    return {
        matchPairs: matchPairs,
        players: allPlayers,
        tournamentStatus: data.status === 'ready2start' ? 'Eşleşmeler Hazır' : 'Hazırlanıyor'
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
function handleRoomUpdate(payload) {
    console.log('🔄 Room update:', payload);

    if (payload.players) {
        const playerCount = payload.players.length;
        const maxPlayers = payload.maxPlayers || 2;

        if (currentGameMode === 'tournament') {
            document.getElementById('players-count').textContent = `${playerCount}/${maxPlayers}`;

            // Status 'ready2start' ise eşleştirmeler hazır
            if (payload.status === 'ready2start' && payload.match) {
                console.log('🎲 Matches are ready, transforming data...');
                const transformedData = transformMatchmakingData(payload);

                displayMatchPairs(transformedData.matchPairs, transformedData.players);

                document.getElementById('tournament-status-display').textContent =
                    transformedData.tournamentStatus;

                // DÜZELTME: id kullan, userId değil
                const isHost = payload.players.some(player => player.id === currentUserId && player.isHost);

                if (isHost) {
                    document.getElementById('waiting-players-btn').style.display = 'none';
                    document.getElementById('match-players-btn').style.display = 'none';
                    document.getElementById('start-tournament-btn').style.display = 'block';
                } else {
                    document.getElementById('waiting-players-btn').style.display = 'block';
                    document.getElementById('waiting-players-btn').textContent = '⏳ Turnuva Başlatılıyor...';
                    document.getElementById('match-players-btn').style.display = 'none';
                    document.getElementById('start-tournament-btn').style.display = 'none';
                }

                showNotification('Eşleştirmeler tamamlandı!', 'success');
            } else {
                // Henüz eşleştirme yapılmamış
                updateParticipants(payload.players, 'participants-grid');

                // DÜZELTME: id kullan, userId değil
                const isHost = payload.players.some(player => player.id === currentUserId && player.isHost);

                if (isHost) {
                    const minPlayers = 4;

                    if (playerCount >= minPlayers && playerCount % 2 === 0) {
                        document.getElementById('waiting-players-btn').style.display = 'none';
                        document.getElementById('match-players-btn').style.display = 'block';
                        document.getElementById('start-tournament-btn').style.display = 'none';
                        document.getElementById('tournament-status-display').textContent = 'Eşleştirme Bekleniyor';
                    } else {
                        document.getElementById('waiting-players-btn').style.display = 'block';
                        document.getElementById('waiting-players-btn').textContent =
                            `${minPlayers - playerCount > 0 ? `En az ${minPlayers - playerCount} oyuncu daha gerekli` : 'Çift sayıda oyuncu gerekli'}`;
                        document.getElementById('match-players-btn').style.display = 'none';
                        document.getElementById('start-tournament-btn').style.display = 'none';
                        document.getElementById('tournament-status-display').textContent = 'Oyuncular Bekleniyor';
                    }
                } else {
                    document.getElementById('waiting-players-btn').style.display = 'block';
                    document.getElementById('waiting-players-btn').textContent = '⏳ Eşleştirmeler Bekleniyor...';
                    document.getElementById('match-players-btn').style.display = 'none';
                    document.getElementById('start-tournament-btn').style.display = 'none';
                }
            }
        } else if (currentGameMode === 'ai') {
            updateParticipants(payload.players, 'ai-participants-grid');
        } else {
            document.getElementById('custom-players-count').textContent = `${playerCount}/${maxPlayers}`;
            if (payload.gameMode === 'multiplayer')
                updateParticipants(payload.players, 'custom-participants-grid', 0, 1);
            else
                updateParticipants(payload.players, 'custom-participants-grid');

            // DÜZELTME: id kullan, userId değil
            const isHost = payload.players.some(player => player.id === currentUserId && player.isHost);

            if (isHost && playerCount >= maxPlayers) {
                document.getElementById('custom-waiting-players-btn').style.display = 'none';
                document.getElementById('custom-start-game-btn').style.display = 'block';
            }
        }
    }
}

function handleGameStarted(payload) {
    console.log('🎮 Game started:', payload);
    showNotification('Oyun başlıyor!', 'success');

    // Hide all waiting rooms
    document.getElementById('waiting-room').classList.remove('active');
    document.getElementById('custom-waiting-room').classList.remove('active');
    document.getElementById('ai-waiting-room').classList.remove('active');
    document.getElementById('game-page').classList.add('hidden');

    // Hide back arrow
    document.getElementById('back-arrow').classList.remove('active');

    // Show game container
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'block';

    app = new App(currentUserId, currentUserName);
    app.start(payload);
}

// handleGameFinished fonksiyonunu güncelle
function handleGameFinished(payload) {
    console.log('🏁 Game finished:', payload);

    // Destroy game
    if (app) {
        app.destroy();
        app = null;
    }

    // Hide game container
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'none';

    // Hızlı oyun için kontrol
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen.classList.contains('active')) {
        loadingScreen.classList.remove('active');
        document.getElementById('game-page').classList.remove('hidden');
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

    // Show game page
    document.getElementById('game-page').classList.remove('hidden');
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
function showTournamentWaitingRoom(data) {
    console.log('🏠 Showing tournament waiting room:', data);

    document.getElementById('game-page').classList.add('hidden');
    document.getElementById('waiting-room').classList.add('active');
    document.getElementById('back-arrow').classList.add('active');

    document.getElementById('room-code-display').textContent = data.roomId || 'TOUR-XXXXX';
    document.getElementById('players-count').textContent = `${data.players?.length || 0}/${data.maxPlayers || 8}`;

    // Turnuva durumunu güncelle
    const statusText = data.status === 'ready2start' ? 'Eşleşmeler Hazır' : 'Oyuncular Bekleniyor';
    document.getElementById('tournament-status-display').textContent = statusText;

    if (data.players) {
        // DÜZELTME: id kullan, userId değil
        const isHost = data.players.some(player => player.id === currentUserId && player.isHost);

        // Eğer status 'ready2start' ise ve match varsa eşleştirmeleri göster
        if (data.status === 'ready2start' && data.match) {
            console.log('🎲 Showing match pairs...');
            const transformedData = transformMatchmakingData(data);
            displayMatchPairs(transformedData.matchPairs, transformedData.players);

            // Host için turnuvayı başlat butonunu göster
            if (isHost) {
                document.getElementById('waiting-players-btn').style.display = 'none';
                document.getElementById('match-players-btn').style.display = 'none';
                document.getElementById('start-tournament-btn').style.display = 'block';
            } else {
                document.getElementById('waiting-players-btn').style.display = 'block';
                document.getElementById('waiting-players-btn').textContent = '⏳ Turnuva Başlatılıyor...';
                document.getElementById('match-players-btn').style.display = 'none';
                document.getElementById('start-tournament-btn').style.display = 'none';
            }
        } else {
            // Henüz eşleştirme yapılmamış
            updateParticipants(data.players, 'participants-grid');

            if (isHost) {
                const playerCount = data.players.length;
                const minPlayers = 4;

                if (playerCount >= minPlayers && playerCount % 2 === 0) {
                    document.getElementById('waiting-players-btn').style.display = 'none';
                    document.getElementById('match-players-btn').style.display = 'block';
                    document.getElementById('start-tournament-btn').style.display = 'none';
                } else {
                    document.getElementById('waiting-players-btn').style.display = 'block';
                    document.getElementById('waiting-players-btn').textContent =
                        `${minPlayers - playerCount > 0 ? `En az ${minPlayers - playerCount} oyuncu daha gerekli` : 'Çift sayıda oyuncu gerekli'}`;
                    document.getElementById('match-players-btn').style.display = 'none';
                    document.getElementById('start-tournament-btn').style.display = 'none';
                }
            } else {
                document.getElementById('waiting-players-btn').style.display = 'block';
                document.getElementById('waiting-players-btn').textContent = '⏳ Eşleştirmeler Bekleniyor...';
                document.getElementById('match-players-btn').style.display = 'none';
                document.getElementById('start-tournament-btn').style.display = 'none';
            }
        }
    }
}

// showCustomWaitingRoom fonksiyonunu güncelle
function showCustomWaitingRoom(data) {
    document.getElementById('game-page').classList.add('hidden');
    document.getElementById('custom-waiting-room').classList.add('active');
    document.getElementById('back-arrow').classList.add('active');

    document.getElementById('custom-room-code-display').textContent = data.roomId;

    const gameTypeMap = {
        'classic': '1 vs 1',
        'multiplayer': '2 vs 2',
        'local': 'local'
    };
    document.getElementById('custom-game-type-display').textContent = gameTypeMap[data.gameMode] || '1 vs 1';

    const playerCount = data.players?.length || 1;
    const maxPlayers = data.maxPlayers || 2;
    document.getElementById('custom-players-count').textContent = `${playerCount}/${maxPlayers}`;

    // Update game settings display
    if (data.gameSettings) {
        document.getElementById('custom-paddle-display').textContent = `${data.gameSettings.paddleHeight}px`;
        document.getElementById('custom-ball-display').textContent = `${data.gameSettings.ballRadius}px`;

        const cornerBoost = data.gameSettings.cornerBoost || data.gameSettings.ballSpeedIncrease || 1.0;
        document.getElementById('custom-corner-display').textContent = `${parseFloat(cornerBoost).toFixed(1)}x`;

        document.getElementById('custom-score-display').textContent = data.gameSettings.maxScore;
    }

    if (data.players) {
        if (data.gameMode === "multiplayer")
            updateParticipants(data.players, 'custom-participants-grid', 0, 1);
        else
            updateParticipants(data.players, 'custom-participants-grid');
    }

    // DÜZELTME: id kullan, userId değil
    const isHost = data.players && data.players.some(player => player.id === currentUserId && player.isHost);

    // Show/hide buttons
    if (isHost) {
        if (playerCount >= maxPlayers) {
            document.getElementById('custom-waiting-players-btn').style.display = 'none';
            document.getElementById('custom-start-game-btn').style.display = 'block';
        } else {
            document.getElementById('custom-waiting-players-btn').style.display = 'block';
            document.getElementById('custom-start-game-btn').style.display = 'none';
        }
    } else {
        document.getElementById('custom-waiting-players-btn').style.display = 'block';
        document.getElementById('custom-waiting-players-btn').textContent = '⏳ Oda Sahibi Bekleniyor...';
        document.getElementById('custom-start-game-btn').style.display = 'none';
    }
}

function showAIWaitingRoom(data) {
    document.getElementById('game-page').classList.add('hidden');
    document.getElementById('ai-waiting-room').classList.add('active');
    document.getElementById('back-arrow').classList.add('active');

    // Update AI difficulty display
    const difficultyMap = {
        'easy': 'Kolay',
        'medium': 'Orta',
        'hard': 'Zor',
        'impossible': 'İmkansız',
        'custom': 'Özel'
    };

    const difficulty = data.aiSettings?.difficulty || 'medium';
    document.getElementById('ai-difficulty-display').textContent = difficultyMap[difficulty];
    document.getElementById('ai-type-display').textContent = difficulty === 'custom' ? 'Özelleştirilmiş' : 'Standart';

    // Update game settings display
    if (data.gameSettings) {
        document.getElementById('ai-paddle-display').textContent = `${data.gameSettings.paddleHeight}px`;
        document.getElementById('ai-ball-display').textContent = `${data.gameSettings.ballRadius}px`;

        // DÜZELTME: cornerBoost veya ballSpeedIncrease değerini kontrol et
        const cornerBoost = data.gameSettings.cornerBoost || data.gameSettings.ballSpeedIncrease || 1.0;
        document.getElementById('ai-corner-display').textContent = `${parseFloat(cornerBoost).toFixed(1)}x`;

        document.getElementById('ai-score-display').textContent = data.gameSettings.maxScore;
    }

    // Show custom AI settings if custom difficulty
    if (difficulty === 'custom' && data.aiSettings) {
        const customSettingsDiv = document.getElementById('ai-custom-settings-display');
        customSettingsDiv.style.display = 'block';

        document.getElementById('ai-reaction-display').textContent = data.aiSettings.reactionSpeed || 5;
        document.getElementById('ai-prediction-display').textContent = data.aiSettings.predictionAccuracy || 5;
        document.getElementById('ai-accuracy-display').textContent = data.aiSettings.generalAccuracy || 5;
        document.getElementById('ai-learning-display').textContent = data.aiSettings.learningSpeed || 5;
    }

    // Update participants
    const players = [
        { name: currentUserName, isAI: false },
        { name: 'AI Opponent', isAI: true }
    ];
    updateParticipants(players, 'ai-participants-grid');
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// Game Mode Selection
document.getElementById('custom-mode').addEventListener('click', function() {
    document.querySelectorAll('.game-mode-card').forEach(card => card.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('custom-settings').classList.add('active');

    currentGameMode = 'custom';
});

document.getElementById('tournament-mode').addEventListener('click', function() {
    document.querySelectorAll('.game-mode-card').forEach(card => card.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('tournament-settings').classList.add('active');

    currentGameMode = 'tournament';
});

document.getElementById('ai-mode').addEventListener('click', function() {
    document.querySelectorAll('.game-mode-card').forEach(card => card.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('ai-settings').classList.add('active');

    currentGameMode = 'ai';
});

// Custom Game - Create Room
document.getElementById('custom-create-btn').addEventListener('click', function() {
    const gameType = document.querySelector('input[name="custom-game-type"]:checked').value;

    let gameMode;
    if (gameType === '1v1') gameMode = 'classic';
    else if (gameType === '2v2') gameMode = 'multiplayer';
    else if (gameType === 'co-op') gameMode = 'local';

    const data = {
        name: `${currentUserName}'s Room`,
        gameMode: gameMode,
        gameSettings: {
			//!!
			...gameConfig.gameSettings,
            paddleHeight: parseInt(document.getElementById('paddle-height').value),
            ballRadius: parseInt(document.getElementById('ball-radius').value),
			// DEĞİŞECEK
            ballSpeedIncrease: parseFloat(document.getElementById('corner-boost').value),
            maxScore: parseInt(document.getElementById('winning-score').value)
        }
    };

    currentGameMode = 'custom';
    roomSocket.send("create", data);
    showNotification('Oda oluşturuluyor...', 'info');
});

// Custom Game - Join Room
document.getElementById('custom-join-btn').addEventListener('click', function() {
    const roomCode = document.getElementById('custom-room-code').value.trim().toUpperCase();

    if (!roomCode) {
        showNotification('Lütfen oda kodunu girin!', 'error');
        return;
    }

    if (roomCode.length !== 6) {
        showNotification('Oda kodu 6 karakter olmalıdır!', 'error');
        return;
    }

    currentGameMode = 'custom';
    roomSocket.send("join", { roomId: roomCode , gameMode: 'play-page'});
    showNotification(`${roomCode} kodlu odaya katılıyorsunuz...`, 'info');
});

// Custom Game - Start Game
document.getElementById('custom-start-game-btn').addEventListener('click', function() {
    roomSocket.send("start", {});
    showNotification('Oyun başlatılıyor...', 'info');
});

document.getElementById('ai-start-game-btn').addEventListener('click', function() {
    roomSocket.send("start", {});
    showNotification('Oyun başlatılıyor...', 'info');
});

// AI Game - Start
document.getElementById('ai-start-btn').addEventListener('click', function() {
    const difficulty = document.querySelector('input[name="ai-difficulty"]:checked').value;

    const data = {
        name: `${currentUserName}'s AI Room`,
        gameMode: "ai",
        gameSettings: {
			...gameConfig.gameSettings,
            paddleHeight: parseInt(document.getElementById('ai-paddle-height').value),
            ballRadius: parseInt(document.getElementById('ai-ball-radius').value),
            ballSpeedIncrease: parseFloat(document.getElementById('ai-corner-boost').value),
            maxScore: parseInt(document.getElementById('ai-winning-score').value)
        },
        aiSettings: {
            difficulty: difficulty
        }
    };

    // Custom AI settings
    if (difficulty === 'custom') {
        data.aiSettings = {
            ...data.aiSettings,
            reactionSpeed: parseInt(document.getElementById('ai-reaction-speed').value),
            predictionAccuracy: parseInt(document.getElementById('ai-prediction-accuracy').value),
            generalAccuracy: parseInt(document.getElementById('ai-general-accuracy').value),
            learningSpeed: parseInt(document.getElementById('ai-learning-speed').value),
            preparationDistance: parseInt(document.getElementById('ai-preparation-distance').value),
            freezeDistance: parseInt(document.getElementById('ai-freeze-distance').value),
            targetWinRate: parseInt(document.getElementById('ai-target-win-rate').value),
            fairnessLevel: parseInt(document.getElementById('ai-fairness-level').value),
            maxConsecutiveWins: parseInt(document.getElementById('ai-max-consecutive-wins').value),
            rageMode: document.getElementById('ai-rage-mode').checked,
            fatigueSystem: document.getElementById('ai-fatigue-system').checked,
            focusMode: document.getElementById('ai-focus-mode').checked,
            adaptiveDifficulty: document.getElementById('ai-adaptive-difficulty').checked
        };
    }

    currentGameMode = 'ai';
    roomSocket.send("create", data);
    showNotification('AI oyunu oluşturuluyor...', 'info');
});

// Tournament - Create
document.getElementById('tournament-create-btn').addEventListener('click', function() {
    const tournamentName = document.getElementById('tournament-name').value.trim();
    const tournamentSize = document.querySelector('input[name="tournament-size"]:checked').value;

    if (!tournamentName) {
        showNotification('Lütfen turnuva ismini girin!', 'error');
        return;
    }

    let maxPlayers = parseInt(tournamentSize);
    if (tournamentSize === 'custom') {
        maxPlayers = parseInt(document.getElementById('custom-tournament-size').value);
        if (isNaN(maxPlayers) || maxPlayers < 4) {
            showNotification('Lütfen 4 veya daha büyük bir sayı girin!', 'error');
            return;
        }
        // Check if power of 2
        if ((maxPlayers & (maxPlayers - 1)) !== 0) {
            showNotification('Kişi sayısı 2\'nin kuvveti olmalıdır! (4, 8, 16, 32...)', 'error');
            return;
        }
    }

    const data = {
        name: tournamentName,
        gameMode: "tournament",
		...gameConfig,
        tournamentSettings: {
            maxPlayers: maxPlayers
        }
    };

    currentGameMode = 'tournament';
    roomSocket.send("create", data);
    showNotification('Turnuva oluşturuluyor...', 'info');
});

// Tournament - Join
document.getElementById('tournament-join-btn').addEventListener('click', function() {
    const tournamentCode = document.getElementById('tournament-code').value.trim().toUpperCase();

    if (!tournamentCode) {
        showNotification('Lütfen turnuva kodunu girin!', 'error');
        return;
	}

    currentGameMode = 'tournament';
    roomSocket.send("join", {roomId: tournamentCode, gameMode: 'tournament-page'});
    showNotification(`${tournamentCode} kodlu turnuvaya katılıyorsunuz...`, 'info');
});

// Tournament - Start
document.getElementById('start-tournament-btn').addEventListener('click', function() {
    // Butonu devre dışı bırak ve yükleniyor göster
    this.disabled = true;
    this.innerHTML = '<div class="loading"></div> Turnuva Başlatılıyor...';

    // Turnuva başlatma isteği gönder
    roomSocket.send("start", { roomId: currentRoomId });
    showNotification('Turnuva başlatılıyor...', 'info');

    // Eğer sunucudan yanıt gelmezse butonu 10 saniye sonra tekrar etkinleştir
    setTimeout(() => {
        if (this.disabled) {
            this.disabled = false;
            this.innerHTML = '🚀 Turnuvayı Başlat';
        }
    }, 10000);
});

// Final Round butonuna event listener ekle
document.getElementById('final-round-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<div class="loading"></div> Starting Final Round...';

    roomSocket.send("start", {
        roomId: currentRoomId
    });

    showNotification('🏆 Final round başlatılıyor!', 'success');

    setTimeout(() => {
        if (this.disabled) {
            this.disabled = false;
            this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="white" style="margin-right: 8px;"><path d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"/></svg><span>Start Final Round</span>';
        }
    }, 10000);
});

// Kişileri eşleştir butonu
document.getElementById('match-players-btn').addEventListener('click', function() {
    if (!currentRoomId) return;

    // Eşleştirmeleri sunucuya gönder
    roomSocket.send("matchTournament", { roomId: currentRoomId });
    showNotification('Eşleştirmeler yapılıyor...', 'info');
});

// Back Arrow
document.getElementById('back-arrow').addEventListener('click', function() {
    // Leave room if in one
    if (currentRoomId) {
        roomSocket.send("leave", { roomId: currentRoomId });
        currentRoomId = null;
    }

    // Hide all waiting rooms
    document.querySelectorAll('.waiting-room').forEach(room => room.classList.remove('active'));

    // Show game page
    document.getElementById('game-page').classList.remove('hidden');

    // Hide back arrow
    this.classList.remove('active');

    showNotification('Odadan ayrıldınız', 'info');
});

// Tournament Size - Custom Option
document.querySelectorAll('input[name="tournament-size"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const customInput = document.getElementById('custom-tournament-size');
        if (this.value === 'custom') {
            customInput.style.display = 'block';
        } else {
            customInput.style.display = 'none';
        }
    });
});

// AI Difficulty - Custom Option
document.querySelectorAll('input[name="ai-difficulty"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const customSettings = document.getElementById('ai-custom-settings');
        if (this.value === 'custom') {
            customSettings.classList.add('active');
        } else {
            customSettings.classList.remove('active');
        }
    });
});

// ============================================================================
// SLIDER VALUE UPDATES
// ============================================================================

// Custom Game Sliders
document.getElementById('paddle-height').addEventListener('input', function() {
    document.getElementById('paddle-height-value').textContent = this.value + 'px';
});

document.getElementById('ball-radius').addEventListener('input', function() {
    document.getElementById('ball-radius-value').textContent = this.value + 'px';
});

document.getElementById('corner-boost').addEventListener('input', function() {
    document.getElementById('corner-boost-value').textContent = parseFloat(this.value).toFixed(1) + 'x';
});

// AI Game Sliders
document.getElementById('ai-paddle-height').addEventListener('input', function() {
    document.getElementById('ai-paddle-height-value').textContent = this.value + 'px';
});

document.getElementById('ai-ball-radius').addEventListener('input', function() {
    document.getElementById('ai-ball-radius-value').textContent = this.value + 'px';
});

document.getElementById('ai-corner-boost').addEventListener('input', function() {
    document.getElementById('ai-corner-boost-value').textContent = parseFloat(this.value).toFixed(1) + 'x';
});

// AI Custom Settings Sliders
document.getElementById('ai-reaction-speed').addEventListener('input', function() {
    document.getElementById('ai-reaction-speed-value').textContent = this.value;
});

document.getElementById('ai-prediction-accuracy').addEventListener('input', function() {
    document.getElementById('ai-prediction-accuracy-value').textContent = this.value;
});

document.getElementById('ai-general-accuracy').addEventListener('input', function() {
    document.getElementById('ai-general-accuracy-value').textContent = this.value;
});

document.getElementById('ai-learning-speed').addEventListener('input', function() {
    document.getElementById('ai-learning-speed-value').textContent = this.value;
});

document.getElementById('ai-preparation-distance').addEventListener('input', function() {
    document.getElementById('ai-preparation-distance-value').textContent = this.value;
});

document.getElementById('ai-freeze-distance').addEventListener('input', function() {
    document.getElementById('ai-freeze-distance-value').textContent = this.value;
});

document.getElementById('ai-target-win-rate').addEventListener('input', function() {
    document.getElementById('ai-target-win-rate-value').textContent = '%' + (this.value * 10);
});

document.getElementById('ai-fairness-level').addEventListener('input', function() {
    document.getElementById('ai-fairness-level-value').textContent = this.value;
});

document.getElementById('ai-max-consecutive-wins').addEventListener('input', function() {
    document.getElementById('ai-max-consecutive-wins-value').textContent = this.value;
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Generate user credentials
currentUserId = generateRandomId();
currentUserName = generateRandomName();
console.log(`🎮 User initialized - ID: ${currentUserId}, Name: ${currentUserName}`);

// Initialize WebSocket
roomSocket = new WebSocketClient(window.location.hostname, 3004);

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
roomSocket.connect("ws/client", {
    userID: currentUserId,
    userName: currentUserName
});

// Export for debugging
window.roomSocket = roomSocket;
window.app = app;

console.log('🎮 Application initialized successfully!');
showNotification('Hoş geldiniz! ' + currentUserName, 'success');

// Fast Game Event Handler - YENİ
document.getElementById('fast-game-mode').addEventListener('click', function() {
    showNotification('Hızlı oyun başlatılıyor...', 'success');

    // Show loading screen
    const loadingScreen = document.getElementById('loading-screen');
    const gamePage = document.getElementById('game-page');

    gamePage.classList.add('hidden');
    loadingScreen.classList.add('active');

    roomSocket.send("quickMatch");
});

// Loading Back Arrow
document.getElementById('loading-back-arrow').addEventListener('click', function() {
    const loadingScreen = document.getElementById('loading-screen');
    const gamePage = document.getElementById('game-page');

    loadingScreen.classList.remove('active');
    gamePage.classList.remove('hidden');

    showNotification('Hızlı oyun iptal edildi', 'info');
});

// DOM Elements
const gameModeCards = document.querySelectorAll('.game-mode-card');
const settingsPanels = document.querySelectorAll('.settings-panel');
const aiDifficultyRadios = document.querySelectorAll('input[name="ai-difficulty"]');
const aiCustomSettings = document.getElementById('ai-custom-settings');

// Initialize all sliders
function updateSliderValue(sliderId, valueId, suffix = '') {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);

    if (!slider || !valueDisplay) return;

    slider.addEventListener('input', function() {
        let value = this.value;
        if (sliderId.includes('corner-boost')) {
            value = parseFloat(value).toFixed(1) + 'x';
        } else if (sliderId.includes('target-win-rate')) {
            value = (parseInt(value) * 10) + '%';
        } else {
            value += suffix;
        }

        // Animate value change
        valueDisplay.style.transform = 'scale(1.1)';
        valueDisplay.textContent = value;

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
document.querySelectorAll('.btn, .input-field, .radio-option').forEach(element => {
    element.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close active panels
    if (e.key === 'Escape') {
        gameModeCards.forEach(c => c.classList.remove('active'));
        settingsPanels.forEach(p => p.classList.remove('active'));
    }
});

// Initialize tooltips
const tooltips = document.querySelectorAll('.difficulty-tooltip');
tooltips.forEach(tooltip => {
    tooltip.style.transition = 'all 0.3s ease';
});

// Add focus trap for accessibility
settingsPanels.forEach(panel => {
    panel.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const focusableElements = this.querySelectorAll(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
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


// Global değişkenler bölümüne ekle
let tournamentData = {
    currentRound: 0,
    totalRounds: 0,
    winners: [],
    nextMatches: []
};

// showRoundWaitingRoom fonksiyonunu güncelle
function showRoundWaitingRoom(data) {
    console.log('📋 Showing round waiting room with data:', data);

    // Tüm odaları gizle
    document.querySelectorAll('.waiting-room').forEach(room => room.classList.remove('active'));
    document.getElementById('game-page').classList.add('hidden');

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
    const roundWaitingBtn = document.getElementById('round-waiting-btn');
    const nextRoundBtn = document.getElementById('next-round-btn');
    const finalRoundBtn = document.getElementById('final-round-btn');

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

// Next Round butonuna event listener ekle
document.getElementById('next-round-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<div class="loading"></div> Starting Next Round...';

    roomSocket.send("start", {
        roomId: currentRoomId
    });

    showNotification('Sonraki round başlatılıyor...', 'info');

    setTimeout(() => {
        if (this.disabled) {
            this.disabled = false;
            this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="white" style="margin-right: 8px;"><path d="M544 160C544 124.7 515.3 96 480 96L160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160zM416 320C416 326.7 413.2 333 408.3 337.6L296.3 441.6C289.3 448.1 279.1 449.8 270.4 446C261.7 442.2 256 433.5 256 424L256 216C256 206.5 261.7 197.8 270.4 194C279.1 190.2 289.3 191.9 296.3 198.4L408.3 302.4C413.2 306.9 416 313.3 416 320z"/></svg><span>Start Next Round</span>';
        }
    }, 10000);
});

// Final Round butonuna event listener ekle
document.getElementById('final-round-btn').addEventListener('click', function() {
    this.disabled = true;
    this.innerHTML = '<div class="loading"></div> Starting Final Round...';

    roomSocket.send("start", {
        roomId: currentRoomId,
        round: tournamentData.currentRound + 1,
        isFinal: true
    });

    showNotification('🏆 Final round başlatılıyor!', 'success');

    setTimeout(() => {
        if (this.disabled) {
            this.disabled = false;
            this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="white" style="margin-right: 8px;"><path d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"/></svg><span>Start Final Round</span>';
        }
    }, 10000);
});

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
        currentRound: currentRound,
        totalRounds: maxRound,
        maxRound: maxRound,  // Her ikisini de sakla
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
document.getElementById('back-arrow').addEventListener('click', function() {
    // Leave room if in one
    if (currentRoomId) {
        roomSocket.send("leave", { roomId: currentRoomId });
    }

    // Lobiye dön
    // returnToLobby();
    showNotification('Odadan ayrıldınız', 'info');
});