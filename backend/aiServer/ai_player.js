class PingPongAI {
    constructor(difficulty, customSettings = null) {
        this.gamesPlayed = 0;
        this.wins = 0;
        this.hits = 0;
        this.misses = 0;

        // Zorluk seviyesi
        this.difficulty = difficulty;
        this.customSettings = customSettings;

        this.reactionSpeed = 0.5;
        this.predictionAccuracy = 0.5;
        this.prepareDistance = 300;
        this.freezeDistance = 60;
        this.errorRate = 0.3;
        this.learningRate = 0.01;
        this.targetWinRate = 0.5;
        this.loseProbability = 0.2;
        this.maxConsecutiveWins = 3;
        this.rageEnabled = false;
        this.fatigueEnabled = false;
        this.focusEnabled = false;
        this.adaptiveEnabled = false;
        this.predictionLines = false;

        this.setupDifficulty();

        // Durum takibi
        this.isFrozen = false;
        this.targetLocked = false;
        this.lockedTarget = null;

        // Stratejik kaybetme
        this.consecutiveWins = 0;
        this.shouldLoseNext = false;

        // Yeni özellikler
        this.rageMode = false;
        this.rageCounter = 0;
        this.tiredMode = false;
        this.tiredCounter = 0;
        this.superFocus = false;
        this.focusCounter = 0;

        // Oyun alanı bilgileri
        this.screenWidth = 800;
        this.screenHeight = 600;
        this.paddleX = 780; // AI paddle X konumu
    }

    setupDifficulty() {
        /**Zorluk seviyesine göre parametreleri ayarla*/
        if (this.difficulty === "custom" && this.customSettings) {
            // Frontend'den gelen anahtar adlarını kullan (camelCase)
            let settings = this.customSettings.settings || this.customSettings;

            // Eğer 'settings' key'i varsa onu kullan, yoksa doğrudan customSettings'i kullan
            if (this.customSettings.settings) {
                settings = this.customSettings.settings;
            } else {
                settings = this.customSettings;
            }

            // DOĞRU anahtar adları (camelCase)
            const reactionSpeed = (settings.reactionSpeed !== undefined ? settings.reactionSpeed : 5) / 10.0;
            const predictionAccuracy = (settings.predictionAccuracy !== undefined ? settings.predictionAccuracy : 5) / 10.0;
            const generalAccuracy = (settings.generalAccuracy !== undefined ? settings.generalAccuracy : 5) / 10.0;
            const learningSpeed = (settings.learningSpeed !== undefined ? settings.learningSpeed : 5) / 10.0;
            const prepareDistance = settings.preparationDistance !== undefined ? settings.preparationDistance : 5;
            const freezeDistance = settings.freezeDistance !== undefined ? settings.freezeDistance : 5;
            const targetWinRate = (settings.targetWinRate !== undefined ? settings.targetWinRate : 5) / 10.0;
            const fairness = settings.fairnessLevel !== undefined ? settings.fairnessLevel : 5;
            const maxConsecutive = settings.maxConsecutiveWins !== undefined ? settings.maxConsecutiveWins : 3;

            // Parametreleri ayarla
            this.reactionSpeed = reactionSpeed;
            this.predictionAccuracy = predictionAccuracy;
            this.prepareDistance = 200 + (prepareDistance * 40); // 200-600
            this.freezeDistance = 50 + (freezeDistance * 15);    // 50-200
            this.errorRate = 0.5 - (generalAccuracy * 0.049);    // 0.5-0.01
            this.learningRate = learningSpeed / 200.0;           // 0.005-0.05
            this.targetWinRate = targetWinRate;
            this.loseProbability = (10 - fairness) / 20.0;       // 0.5-0.0
            this.maxConsecutiveWins = Math.max(1, maxConsecutive);

            // Özellikler
            this.rageEnabled = settings.rageMode !== undefined ? settings.rageMode : false;
            this.fatigueEnabled = settings.fatigueSystem !== undefined ? settings.fatigueSystem : false;
            this.focusEnabled = settings.focusMode !== undefined ? settings.focusMode : false;
            this.adaptiveEnabled = settings.adaptiveDifficulty !== undefined ? settings.adaptiveDifficulty : false;
            this.predictionLines = settings.show_prediction !== undefined ? settings.show_prediction : false;

        } else {
            // Varsayılan zorluk seviyeleri
            if (this.difficulty === "easy") {
                this.reactionSpeed = 0.5;
                this.predictionAccuracy = 0.4;
                this.prepareDistance = 300;
                this.freezeDistance = 60;
                this.errorRate = 0.3;
                this.learningRate = 0.005;
                this.targetWinRate = 0.3;
                this.loseProbability = 0.4;
                this.maxConsecutiveWins = 2;
            } else if (this.difficulty === "medium") {
                this.reactionSpeed = 0.7;
                this.predictionAccuracy = 0.7;
                this.prepareDistance = 400;
                this.freezeDistance = 100;
                this.errorRate = 0.15;
                this.learningRate = 0.01;
                this.targetWinRate = 0.5;
                this.loseProbability = 0.2;
                this.maxConsecutiveWins = 3;
            } else if (this.difficulty === "hard") {
                this.reactionSpeed = 0.95;
                this.predictionAccuracy = 0.9;
                this.prepareDistance = 500;
                this.freezeDistance = 140;
                this.errorRate = 0.05;
                this.learningRate = 0.02;
                this.targetWinRate = 0.7;
                this.loseProbability = 0.1;
                this.maxConsecutiveWins = 5;
            } else if (this.difficulty === "impossible") {
                this.reactionSpeed = 1.0;
                this.predictionAccuracy = 1.0;
                this.prepareDistance = 600;
                this.freezeDistance = 100;
                this.errorRate = 0.0;
                this.learningRate = 0.0;
                this.targetWinRate = 1.0;
                this.loseProbability = 0.0;
                this.maxConsecutiveWins = 100;
            }

            // Varsayılan özellikler
            this.rageEnabled = false;
            this.fatigueEnabled = false;
            this.focusEnabled = false;
            this.adaptiveEnabled = false;
            this.predictionLines = false;
        }
    }

    updateSpecialModes(scoredAgainstMe = false, scoredForMe = false) {
        /**Özel modları güncelle*/
        // Rage Mode - AI art arda kaybederse öfkelenir ve daha agresif olur
        if (this.rageEnabled) {
            if (scoredAgainstMe) {
                this.rageCounter += 1;
                if (this.rageCounter >= 2) {
                    this.rageMode = true;
                }
            } else if (scoredForMe) {
                this.rageCounter = Math.max(0, this.rageCounter - 1);
                if (this.rageCounter === 0) {
                    this.rageMode = false;
                }
            }
        }

        // Fatigue System - AI çok oynayınca yorulur
        if (this.fatigueEnabled) {
            if (this.gamesPlayed > 0 && this.gamesPlayed % 5 === 0) {
                this.tiredMode = true;
                this.tiredCounter = 3;
            }
            if (this.tiredCounter > 0) {
                this.tiredCounter -= 1;
                if (this.tiredCounter === 0) {
                    this.tiredMode = false;
                }
            }
        }

        // Focus Mode - AI bazen süper odaklanır
        if (this.focusEnabled) {
            if (Math.random() < 0.1) { // %10 ihtimal
                this.superFocus = true;
                this.focusCounter = 3;
            }
            if (this.focusCounter > 0) {
                this.focusCounter -= 1;
                if (this.focusCounter === 0) {
                    this.superFocus = false;
                }
            }
        }
    }

    getCurrentStats() {
        /**Mevcut performans istatistiklerini döndür*/
        let currentAccuracy = this.predictionAccuracy;
        let currentError = this.errorRate;

        // Rage mode etkisi - sadece doğruluk artar
        if (this.rageMode) {
            currentError *= 0.5;
            currentAccuracy = Math.min(0.98, currentAccuracy * 1.2);
        }

        // Tired mode etkisi - performans düşer
        if (this.tiredMode) {
            currentError *= 1.5;
            currentAccuracy *= 0.8;
        }

        // Focus mode etkisi - mükemmel doğruluk
        if (this.superFocus) {
            currentAccuracy = Math.min(0.99, currentAccuracy * 1.3);
            currentError *= 0.3;
        }

        return [currentAccuracy, currentError];
    }

    shouldIntentionallyLose() {
        /**AI'ın kasten kaybetmesi gerekip gerekmediğini belirler*/
        if (this.gamesPlayed < 3) {
            return false;
        }

        // Rage mode'da asla kasten kaybetmez
        if (this.rageMode) {
            return false;
        }

        const currentWinRate = this.wins / Math.max(this.gamesPlayed, 1);

        // Adaptive difficulty - oyuncunun performansına göre ayarla
        if (this.adaptiveEnabled) {
            // Oyuncu çok kaybediyorsa AI daha kolay olsun
            if (currentWinRate > 0.8) {
                return Math.random() < 0.6;
            }
        }

        if (currentWinRate > this.targetWinRate + 0.2) {
            return Math.random() < (this.loseProbability * 2);
        } else if (currentWinRate > this.targetWinRate) {
            return Math.random() < this.loseProbability;
        } else if (this.consecutiveWins >= this.maxConsecutiveWins) {
            return Math.random() < 0.8;
        }

        return false;
    }

    predictBallY(ballX, ballY, ballSpeedX, ballSpeedY, paddleX, screenHeight) {
        /**Topun paddle_x konumuna geldiğinde Y pozisyonunu tahmin eder*/
        // Hız çok düşükse mevcut Y konumunu döndür
        if (Math.abs(ballSpeedX) < 0.1) {
            return ballY;
        }

        // Topun paddle_x konumuna ulaşması için gereken süre
        const timeToReach = (paddleX - ballX) / ballSpeedX;
        if (timeToReach <= 0) {
            return ballY;
        }

        let predictedY = ballY + ballSpeedY * timeToReach;

        // Yansımaları hesaba kat
        let bounces = 0;
        while ((predictedY < 0 || predictedY > screenHeight) && bounces < 10) {
            if (predictedY < 0) {
                predictedY = -predictedY;
            } else if (predictedY > screenHeight) {
                predictedY = 2 * screenHeight - predictedY;
            }
            bounces += 1;
        }

        return predictedY;
    }

    getMove(ballX, ballY, ballSpeedX, ballSpeedY, myPaddleY, paddleHeight, screenHeight, scoredForMe = false, scoredAgainstMe = false) {
        /**AI'ın hareket kararını verir - hedef Y konumunu döndürür*/

        if (scoredForMe || scoredAgainstMe) {
            if (scoredForMe) {
                this.wins += 1;
                this.hits += 1;
                this.consecutiveWins += 1;
            } else {
                this.misses += 1;
                this.consecutiveWins = 0;
            }
            this.gamesPlayed += 1;

            // Özel modları güncelle
            this.updateSpecialModes(scoredAgainstMe, scoredForMe);

            this.isFrozen = false;
            this.targetLocked = false;
            this.lockedTarget = null;
            this.shouldLoseNext = false;
        }

        // Mevcut performans değerlerini al
        const [currentAccuracy, currentError] = this.getCurrentStats();

        const paddleCenter = myPaddleY + paddleHeight / 2;
        const screenCenter = screenHeight / 2;

        // Hedef Y konumu
        let targetY = null;

        if (ballSpeedX > 0 && ballX > 400) {
            if (!this.shouldLoseNext) {
                this.shouldLoseNext = this.shouldIntentionallyLose();
            }
        }

        if (this.shouldLoseNext && ballSpeedX > 0) {
            if (Math.random() < 0.7) {
                const predictedY = this.predictBallY(ballX, ballY, ballSpeedX, ballSpeedY, 780, screenHeight);
                const wrongTarget = predictedY + (Math.random() < 0.5 ? -150 : 150);
                targetY = Math.max(paddleHeight / 2, Math.min(screenHeight - paddleHeight / 2, wrongTarget));
            } else {
                // Mevcut konumda kal
                targetY = paddleCenter;
            }
        } else if (Math.random() < currentError) {
            // Rastgele bir konum seç
            targetY = Math.random() * (screenHeight - paddleHeight) + paddleHeight / 2;
        } else if (ballSpeedX <= 0 || ballX < 200) {
            this.isFrozen = false;
            this.targetLocked = false;
            this.lockedTarget = null;
            // Merkeze git
            targetY = screenCenter;
        } else if (ballSpeedX > 0) {
            if (ballX > (800 - this.freezeDistance)) {
                this.isFrozen = true;
                // Mevcut konumda kal
                targetY = paddleCenter;
            } else if (ballX > (800 - this.prepareDistance)) {
                if (!this.targetLocked) {
                    const predictedY = this.predictBallY(ballX, ballY, ballSpeedX, ballSpeedY, 780, screenHeight);
                    const noiseRange = 50 * (1 - currentAccuracy);
                    const noise = Math.random() * (noiseRange * 2) - noiseRange;
                    this.lockedTarget = predictedY + noise;
                    this.targetLocked = true;
                }

                targetY = this.lockedTarget;
            } else {
                const predictedY = this.predictBallY(ballX, ballY, ballSpeedX, ballSpeedY, 780, screenHeight);
                const noiseRange = 30 * (1 - currentAccuracy);
                const noise = Math.random() * (noiseRange * 2) - noiseRange;
                targetY = predictedY + noise;
            }
        } else {
            // Varsayılan olarak merkeze git
            targetY = screenCenter;
        }

        // Hedef Y konumunu sınırlar içinde tut
        targetY = Math.max(paddleHeight / 2, Math.min(screenHeight - paddleHeight / 2, targetY));

        // DEBUG LOG
        console.log(`🤖 AI Hesaplama:`);
        console.log(`  Top: (${ballX.toFixed(1)}, ${ballY.toFixed(1)}) | Hız: (${ballSpeedX.toFixed(1)}, ${ballSpeedY.toFixed(1)})`);
        console.log(`  Paddle Y: ${myPaddleY.toFixed(1)} | Hedef: ${targetY.toFixed(1)}`);
        console.log(`  Mod: Frozen=${this.isFrozen}, Locked=${this.targetLocked}, Lose=${this.shouldLoseNext}`);

        return targetY - paddleHeight / 2; // Paddle'ın üst kenarının Y konumunu döndür
    }

    _moveToTarget(currentPos, targetPos) {
        /**Belirli bir hedefe hareket et*/
        const diff = targetPos - currentPos;

        let threshold;
        if (this.difficulty === "easy") {
            threshold = 25;
        } else if (this.difficulty === "medium") {
            threshold = 15;
        } else if (this.difficulty === "hard") {
            threshold = 8;
        } else if (this.difficulty === "custom") {
            threshold = Math.floor(25 * (1 - this.predictionAccuracy));
        } else { // impossible
            threshold = 3;
        }

        if (Math.abs(diff) < threshold) {
            return 0;
        } else if (diff > 0) {
            return 1;
        } else {
            return -1;
        }
    }

    _moveToCenter(currentPos, centerPos) {
        /**Merkeze hareket et*/
        const diff = centerPos - currentPos;
        const threshold = this.difficulty === "easy" ? 30 : 20;

        if (Math.abs(diff) < threshold) {
            return 0;
        } else if (diff > 0) {
            return 1;
        } else {
            return -1;
        }
    }

    updatePerformance(hitSuccess) {
        /**Performansa göre parametreleri güncelle*/
        if (hitSuccess) {
            this.hits += 1;
            if (["hard", "impossible", "custom"].includes(this.difficulty)) {
                this.freezeDistance = Math.min(200, this.freezeDistance + 2);
                this.predictionAccuracy = Math.min(0.99, this.predictionAccuracy + this.learningRate);
            }
        } else {
            this.misses += 1;
            if (["hard", "impossible", "custom"].includes(this.difficulty)) {
                this.freezeDistance = Math.max(80, this.freezeDistance - 3);
            }
        }
    }

    getDifficultyInfo() {
        /**Zorluk seviyesi bilgilerini döndür*/
        const difficultyNames = {
            "easy": "KOLAY",
            "medium": "ORTA",
            "hard": "ZOR",
            "impossible": "İMKANSIZ",
            "custom": "ÖZEL"
        };

        return {
            name: difficultyNames[this.difficulty] || "ORTA",
            reaction: this.reactionSpeed.toFixed(1),
            accuracy: this.predictionAccuracy.toFixed(1),
            error_rate: `${(this.errorRate * 100).toFixed(0)}%`,
            target_win_rate: `${(this.targetWinRate * 100).toFixed(0)}%`
        };
    }

    getStats() {
        /**İstatistikleri döndür*/
        const totalGames = Math.max(this.gamesPlayed, 1);
        const totalAttempts = Math.max(this.hits + this.misses, 1);
        const currentWinRate = (this.wins / totalGames) * 100;

        return {
            games: this.gamesPlayed,
            wins: this.wins,
            win_rate: currentWinRate,
            target_win_rate: this.targetWinRate * 100,
            hit_rate: (this.hits / totalAttempts) * 100,
            hits: this.hits,
            misses: this.misses,
            freeze_distance: this.freezeDistance,
            is_frozen: this.isFrozen,
            target_locked: this.targetLocked,
            difficulty: this.difficulty,
            consecutive_wins: this.consecutiveWins,
            should_lose_next: this.shouldLoseNext,
            rage_mode: this.rageMode,
            tired_mode: this.tiredMode,
            super_focus: this.superFocus,
            rage_counter: this.rageCounter,
            prediction_lines: this.predictionLines
        };
    }

    getPredictionLine(ballX, ballY, ballSpeedX, ballSpeedY) {
        /**Tahmin çizgisi için koordinatları döndür*/
        if (!this.predictionLines || ballSpeedX <= 0) {
            return null;
        }

        const predictedY = this.predictBallY(ballX, ballY, ballSpeedX, ballSpeedY, 780, 600);
        return predictedY;
    }
}

// Node.js için export (eğer gerekirse)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PingPongAI;
}
