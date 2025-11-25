const fastify = require('fastify')({ logger: false });
const websocketPlugin = require('@fastify/websocket');
const { v4: uuidv4 } = require('uuid');
const PingPongAI = require('./ai_player');

class GameAIManager {
    /**Oyun AI'larını yöneten sınıf*/
    constructor() {
        this.gameAIs = new Map(); // game_id -> AI instance
        this.clientGames = new Map(); // client_id -> game_id
    }

    createGameAI(gameId, aiConfig) {
        /**Yeni bir oyun AI'ı oluştur*/
        if (this.gameAIs.has(gameId)) {
            console.log(`Oyun ${gameId} zaten mevcut, mevcut AI kullanılacak`);
            return gameId;
        }

        // AI'ı oluştur
        const difficulty = aiConfig.difficulty;

        let aiPlayer;
        if (difficulty === 'custom') {
            const customSettings = aiConfig.custom_settings || aiConfig.customSettings || {};
            aiPlayer = new PingPongAI('custom', customSettings);
        } else {
            aiPlayer = new PingPongAI(difficulty);
        }

        // Cache'e kaydet
        this.gameAIs.set(gameId, aiPlayer);
        console.log(`Oyun ${gameId} için ${difficulty} seviyesinde AI oluşturuldu`);

        return gameId;
    }

    assignClientToGame(clientId, gameId) {
        /**Client'ı bir oyuna ata*/
        if (!this.gameAIs.has(gameId)) {
            throw new Error(`Oyun ${gameId} bulunamadı`);
        }

        this.clientGames.set(clientId, gameId);
        console.log(`Client ${clientId} -> Oyun ${gameId} atandı`);
    }

    getAIForClient(clientId) {
        /**Client için AI'ı getir*/
        const gameId = this.clientGames.get(clientId);
        if (!gameId) {
            return null;
        }

        return this.gameAIs.get(gameId);
    }

    getClientGameId(clientId) {
        /**Client'ın oyun ID'sini getir*/
        return this.clientGames.get(clientId);
    }

    removeClient(clientId) {
        /**Client'ı sistemden çıkar*/
        if (this.clientGames.has(clientId)) {
            const gameId = this.clientGames.get(clientId);
            this.clientGames.delete(clientId);
            console.log(`Client ${clientId} oyun ${gameId}'den çıkarıldı`);
        }
    }

    cleanupEmptyGames() {
        /**Boş oyunları temizle*/
        const activeGames = new Set(this.clientGames.values());
        const gamesToRemove = [];

        for (const gameId of this.gameAIs.keys()) {
            if (!activeGames.has(gameId)) {
                gamesToRemove.push(gameId);
            }
        }

        for (const gameId of gamesToRemove) {
            this.gameAIs.delete(gameId);
            console.log(`Boş oyun ${gameId} temizlendi`);
        }
    }
}

function convertDecisionToDirection(decision) {
    /**AI kararını direction string'ine çevir*/
    if (decision === -1) {
        return "up";
    } else if (decision === 1) {
        return "down";
    } else {
        return "stable";
    }
}

function getAIDecision(aiPlayer, gameData) {
    /**Mevcut AI ile karar ver*/
    const ball = gameData.ball || {};
    const paddle = gameData.paddle || {};
    const gameArea = gameData.game_area || gameData.gameArea || {};
    const score = gameData.score || {};

    // Varsayılanlar
    const bx = ball.x !== undefined ? ball.x : 0;
    const by = ball.y !== undefined ? ball.y : 0;
    const bvx = ball.speed_x !== undefined ? ball.speed_x : (ball.speedX !== undefined ? ball.speedX : 0);
    const bvy = ball.speed_y !== undefined ? ball.speed_y : (ball.speedY !== undefined ? ball.speedY : 0);
    const aiY = paddle.ai_y !== undefined ? paddle.ai_y : (paddle.aiY !== undefined ? paddle.aiY : 0);
    const width = gameArea.width !== undefined ? gameArea.width : 800;
    const height = gameArea.height !== undefined ? gameArea.height : 600;
    const aiScored = score.ai_scored !== undefined ? score.ai_scored : (score.aiScored !== undefined ? score.aiScored : false);
    const humanScored = score.human_scored !== undefined ? score.human_scored : (score.humanScored !== undefined ? score.humanScored : false);

    // AI'a oyun alanı bilgilerini ver (eğer AI class'ı destekliyorsa)
    if (typeof aiPlayer.setGameArea === 'function') {
        aiPlayer.setGameArea(width, height);
    }

    // AI'a raket bilgilerini ver (eğer AI class'ı destekliyorsa)
    if (typeof aiPlayer.setPaddleInfo === 'function') {
        aiPlayer.setPaddleInfo(paddle.length !== undefined ? paddle.length : 80);
    }

    // AI kararını al
    const decision = aiPlayer.getMove(
        bx, by,
        bvx, bvy,
        aiY,
        aiScored,
        humanScored
    );

    return decision;
}

// Global AI Manager
const aiManager = new GameAIManager();

// Fastify WebSocket plugin'ini kaydet
fastify.register(websocketPlugin);

fastify.addHook('onRequest', async (request, reply) => {
	console.log("request:", request);
});
// WebSocket endpoint
fastify.register(async function (fastify) {
    fastify.get('/', { websocket: true }, (connection, req) => {
        const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}:${Date.now()}`;
        console.log(`Yeni bağlantı: ${clientId}`);

        connection.socket.on('message', async (message) => {
            try {
                // JSON'u parse et
                const data = JSON.parse(message.toString());
                const messageType = data.type || 'game_data';

                if (messageType === 'init_game') {
                    // Oyun başlatma mesajı
                    await handleInitGame(connection.socket, clientId, data);
                } else if (messageType === 'join_game') {
                    // Mevcut oyuna katılma mesajı
                    await handleJoinGame(connection.socket, clientId, data);
                } else if (messageType === 'game_data') {
                    // Normal oyun verisi
                    await handleGameData(connection.socket, clientId, data);
                } else {
                    // Eski format desteği (geriye uyumluluk)
                    if (data.ai_config || data.aiConfig) {
                        // İlk mesaj, oyun başlatma
                        await handleLegacyInit(connection.socket, clientId, data);
                    } else {
                        // Normal oyun verisi
                        await handleGameData(connection.socket, clientId, data);
                    }
                }
            } catch (error) {
                if (error instanceof SyntaxError) {
                    console.log(`JSON parse hatası: ${error.message}`);
                    connection.socket.send(JSON.stringify({ error: "Invalid JSON" }));
                } else {
                    console.log(`İşlem hatası: ${error.message}`);
                    console.error(error.stack);
                    connection.socket.send(JSON.stringify({ error: error.message }));
                }
            }
        });

        connection.socket.on('close', () => {
            console.log(`Bağlantı kapandı: ${clientId}`);
            // Client ayrıldığında temizlik yap
            aiManager.removeClient(clientId);
            aiManager.cleanupEmptyGames();
        });

        connection.socket.on('error', (error) => {
            console.log(`WebSocket hatası: ${error.message}`);
            console.error(error.stack);
        });
    });
});

async function handleInitGame(ws, clientId, data) {
    /**Yeni oyun başlatma*/
    try {
        const aiConfig = data.ai_config || data.aiConfig || {};
        let gameId = data.game_id || data.gameId;

        // Game ID yoksa otomatik oluştur
        if (!gameId) {
            gameId = uuidv4().substring(0, 8); // Kısa ID
        }

        // AI oluştur ve oyunu başlat
        aiManager.createGameAI(gameId, aiConfig);
        aiManager.assignClientToGame(clientId, gameId);

        console.log("\n" + "=".repeat(80));
        console.log(`📥 GELEN OYUN VERİSİ - Client: ${clientId}`);
        console.log("=".repeat(80));
        console.log(JSON.stringify(data, null, 2));
        console.log("=".repeat(80) + "\n");

        // AI Config varsa göster
        if (Object.keys(aiConfig).length > 0) {
            console.log("🔧 AI KONFIGÜRASYONU:");
            console.log(JSON.stringify(aiConfig, null, 2));
            console.log();
        }

        // Custom settings varsa göster
        const customSettings = data.custom_settings || data.customSettings || {};
        if (Object.keys(customSettings).length > 0) {
            console.log("⚙️ CUSTOM AYARLAR:");
            console.log(JSON.stringify(customSettings, null, 2));
            console.log();
        }

        const response = {
            type: "game_initialized",
            game_id: gameId,
            gameId: gameId,
            ai_difficulty: aiConfig.difficulty,
            aiDifficulty: aiConfig.difficulty,
            success: true
        };

        ws.send(JSON.stringify(response));
        console.log(`Oyun başlatıldı: ${gameId} (Client: ${clientId})`);
    } catch (error) {
        const response = {
            type: "game_initialized",
            success: false,
            error: error.message
        };
        ws.send(JSON.stringify(response));
    }
}

async function handleJoinGame(ws, clientId, data) {
    /**Mevcut oyuna katılma*/
    try {
        const gameId = data.game_id || data.gameId;

        if (!gameId || !aiManager.gameAIs.has(gameId)) {
            throw new Error(`Oyun ${gameId} bulunamadı`);
        }

        aiManager.assignClientToGame(clientId, gameId);

        const response = {
            type: "game_joined",
            game_id: gameId,
            gameId: gameId,
            success: true
        };

        ws.send(JSON.stringify(response));
        console.log(`Oyuna katıldı: ${gameId} (Client: ${clientId})`);
    } catch (error) {
        const response = {
            type: "game_joined",
            success: false,
            error: error.message
        };
        ws.send(JSON.stringify(response));
    }
}

async function handleGameData(ws, clientId, data) {
    /**Oyun verisini işle ve AI kararını döndür*/
    try {
        let gameId = data.game_id || data.gameId;
        console.log(`Handling game data for client ${clientId} with game_id ${gameId}`);

        console.log("\n" + "=".repeat(80));
        console.log(`📥 GELEN OYUN VERİSİ - Client: ${clientId}`);
        console.log("=".repeat(80));
        console.log(JSON.stringify(data, null, 2));
        console.log("=".repeat(80) + "\n");

        let aiPlayer = null;

        // ✅ ÖNCE VAR OLAN AI'YI KONTROL ET
        if (gameId && aiManager.gameAIs.has(gameId)) {
            // AI zaten var, kullan
            aiPlayer = aiManager.gameAIs.get(gameId);
            console.log(`✅ Mevcut AI kullanılıyor: ${gameId}`);
        }
        // ✅ EĞER AI YOKSA VE game_id VARSA, OLUŞTUR
        else if (gameId) {
            const aiConfig = data.ai_config || data.aiConfig || {};
            if (Object.keys(aiConfig).length > 0) {
                console.log(`🆕 Yeni AI oluşturuluyor: ${gameId}`);
                aiManager.createGameAI(String(gameId), aiConfig);
                aiManager.assignClientToGame(clientId, String(gameId));
                aiPlayer = aiManager.gameAIs.get(String(gameId));
                gameId = String(gameId);
            }
        }
        // ✅ EĞER game_id YOKSA, CLIENT EŞLEŞMESİNDEN BULA
        else {
            aiPlayer = aiManager.getAIForClient(clientId);
            gameId = aiManager.getClientGameId(clientId);
            if (!aiPlayer) {
                // Client için bir oyun ve AI yoksa otomatik oluştur
                const autoGameId = uuidv4().substring(0, 8);
                const aiConfig = data.ai_config || data.aiConfig || { difficulty: 'medium' };
                aiManager.createGameAI(autoGameId, aiConfig);
                aiManager.assignClientToGame(clientId, autoGameId);
                aiPlayer = aiManager.getAIForClient(clientId);
                gameId = autoGameId;
            }
        }

        // 2) AI kararını al
        const ball = data.ball || {};
        const paddle = data.paddle || {};
        const gameArea = data.game_area || data.gameArea || {};

        const bx = ball.x;
        const by = ball.y;
        const bvx = ball.speed_x !== undefined ? ball.speed_x : ball.speedX;
        const bvy = ball.speed_y !== undefined ? ball.speed_y : ball.speedY;
        const aiY = paddle.ai_y !== undefined ? paddle.ai_y : paddle.aiY;
        const paddleH = paddle.height !== undefined ? paddle.height : 100;
        const areaH = gameArea.height !== undefined ? gameArea.height : 600;

        const canCompute = [bx, by, bvx, bvy, aiY].every(v => v !== null && v !== undefined);

        let targetY;
        if (canCompute) {
            console.log(`[AI INPUT] bx=${bx.toFixed(2)}, by=${by.toFixed(2)}, bvx=${bvx.toFixed(2)}, bvy=${bvy.toFixed(2)}, ai_y=${aiY.toFixed(2)}, ph=${paddleH}, ah=${areaH}`);
            
            targetY = aiPlayer.getMove(
                bx, by,
                bvx, bvy,
                aiY, paddleH, areaH,
                data.scored_for_me || data.scoredForMe || false,
                data.scored_against_me || data.scoredAgainstMe || false
            );

            let isZeroish = false;
            try {
                isZeroish = Math.abs(parseFloat(targetY)) < 1e-6;
            } catch (e) {
                isZeroish = false;
            }

            if (isZeroish && (Math.abs(bvx) > 1e-3 || Math.abs(bvy) > 1e-3)) {
                const simpleTarget = Math.max(paddleH / 2, Math.min(areaH - paddleH / 2, by));
                targetY = simpleTarget - paddleH / 2;
                console.log(`[AI OUTPUT-FALLBACK] target_y=${targetY.toFixed(2)}`);
            } else {
                console.log(`[AI OUTPUT] target_y=${targetY.toFixed(2)}`);
            }
        } else {
            targetY = aiY || 0;
            try {
                console.log(`[AI OUTPUT-NOCOMPUTE] target_y=${parseFloat(targetY).toFixed(2)}`);
            } catch (e) {
                console.log(`[AI OUTPUT-NOCOMPUTE] target_y=${targetY}`);
            }
        }

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        console.log(`[${timeStr}] Oyun ${gameId} - AI karar verdi: Hedef Y = ${targetY.toFixed(2)}`);
        if (canCompute) {
            console.log(`  Top: (${bx.toFixed(1)}, ${by.toFixed(1)}), Hız: (${bvx.toFixed(1)}, ${bvy.toFixed(1)})`);
            console.log(`  Raket: Y = ${aiY.toFixed(1)}`);
        } else {
            console.log("  Eksik alan(lar) nedeniyle önceki target_y korundu");
        }

        const response = {
            type: "ai_decision",
            target_y: targetY,
            targetY: targetY,
            game_id: gameId,
            gameId: gameId
        };

        try {
            console.log(`[AI DECISION] game_id=${gameId} target_y=${parseFloat(targetY).toFixed(2)}`);
        } catch (e) {
            console.log(`[AI DECISION] game_id=${gameId} target_y=${targetY}`);
        }

        ws.send(JSON.stringify(response));
    } catch (error) {
        console.log(`Oyun verisi işleme hatası: ${error.message}`);
        console.error(error.stack);
        ws.send(JSON.stringify({ error: error.message }));
    }
}

async function handleLegacyInit(ws, clientId, data) {
    /**Eski format oyun başlatma (geriye uyumluluk)*/
    try {
        const aiConfig = data.ai_config || data.aiConfig || {};
        const gameId = data.game_id || data.gameId;

        // AI oluştur ve oyunu başlat
        aiManager.createGameAI(gameId, aiConfig);
        aiManager.assignClientToGame(clientId, gameId);

        console.log(`Eski format ile oyun başlatıldı: ${gameId} (Client: ${clientId})`);

        // Oyun verisini işle
        await handleGameData(ws, clientId, data);
    } catch (error) {
        console.log(`Eski format başlatma hatası: ${error.message}`);
        console.error(error.stack);
        ws.send(JSON.stringify({ error: error.message }));
    }
}

console.log("==> main.js başlatıldı");
console.log("==> Argümanlar:", process.argv);

// Sunucuyu başlat
const start = async () => {
    try {
        const port = process.env.AI_SERVER_PORT || 3003;
        const host = process.env.AI_SERVER_HOST || '0.0.0.0';

        await fastify.listen({ port: parseInt(port), host: host });
        
        console.log("\n" + "=".repeat(80));
        console.log("🚀 AI SERVER BAŞLATILDI");
        console.log("=".repeat(80));
        console.log(`📡 WebSocket: ws://${host}:${port}/ws`);
        console.log(`🏥 Health Check: http://${host}:${port}/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log("=".repeat(80) + "\n");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Graceful shutdown
const closeGracefully = async (signal) => {
    console.log(`\n⚠️  ${signal} sinyali alındı, sunucu kapatılıyor...`);
    
    // Tüm bağlantıları temizle
    aiManager.clientGames.clear();
    aiManager.gameAIs.clear();
    
    await fastify.close();
    console.log('✅ Sunucu başarıyla kapatıldı');
    process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Hata yakalama
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Ana kullanım
if (require.main === module) {
    start();
}

// Export (eğer modül olarak kullanılacaksa)
module.exports = {
    fastify,
    aiManager,
    GameAIManager,
    convertDecisionToDirection,
    getAIDecision
};
