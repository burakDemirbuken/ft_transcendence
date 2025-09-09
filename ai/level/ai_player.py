import math
import random

class PingPongAI:
    def __init__(self, difficulty="medium"):
        self.games_played = 0
        self.wins = 0
        self.hits = 0
        self.misses = 0

        # Zorluk seviyesi
        self.difficulty = difficulty
        self.setup_difficulty()

        # Durum takibi
        self.is_frozen = False
        self.target_locked = False
        self.locked_target = None

        # Stratejik kaybetme
        self.consecutive_wins = 0
        self.should_lose_next = False

    def setup_difficulty(self):
        """Zorluk seviyesine göre parametreleri ayarla"""
        if self.difficulty == "easy":
            self.reaction_speed = 0.5
            self.prediction_accuracy = 0.4
            self.prepare_distance = 300
            self.freeze_distance = 60
            self.paddle_speed_multiplier = 0.7
            self.error_rate = 0.3  # %30 hata payı
            self.learning_rate = 0.005
            # Stratejik kaybetme
            self.target_win_rate = 0.3  # %30 kazanma hedefi
            self.lose_probability = 0.4  # %40 ihtimalle kasten kaybeder
            self.max_consecutive_wins = 2  # En fazla 2 kez üst üste kazanır

        elif self.difficulty == "medium":
            self.reaction_speed = 0.7
            self.prediction_accuracy = 0.7
            self.prepare_distance = 400
            self.freeze_distance = 100
            self.paddle_speed_multiplier = 1.0
            self.error_rate = 0.15  # %15 hata payı
            self.learning_rate = 0.01
            # Stratejik kaybetme
            self.target_win_rate = 0.5  # %50 kazanma hedefi
            self.lose_probability = 0.2  # %20 ihtimalle kasten kaybeder
            self.max_consecutive_wins = 3  # En fazla 3 kez üst üste kazanır

        elif self.difficulty == "hard":
            self.reaction_speed = 0.95
            self.prediction_accuracy = 0.9
            self.prepare_distance = 500
            self.freeze_distance = 140
            self.paddle_speed_multiplier = 1.3
            self.error_rate = 0.05  # %5 hata payı
            self.learning_rate = 0.02
            # Stratejik kaybetme
            self.target_win_rate = 0.7  # %70 kazanma hedefi
            self.lose_probability = 0.1  # %10 ihtimalle kasten kaybeder
            self.max_consecutive_wins = 5  # En fazla 5 kez üst üste kazanır

        elif self.difficulty == "impossible":
            self.reaction_speed = 1.0
            self.prediction_accuracy = 0.98
            self.prepare_distance = 600
            self.freeze_distance = 180
            self.paddle_speed_multiplier = 1.5
            self.error_rate = 0.01  # %1 hata payı
            self.learning_rate = 0.03
            # Stratejik kaybetme
            self.target_win_rate = 0.9  # %90 kazanma hedefi
            self.lose_probability = 0.02  # %2 ihtimalle kasten kaybeder
            self.max_consecutive_wins = 10  # En fazla 10 kez üst üste kazanır

    def should_intentionally_lose(self):
        """AI'ın kasten kaybetmesi gerekip gerekmediğini belirler"""
        if self.games_played < 3:  # İlk 3 oyunda kasten kaybetme
            return False

        current_win_rate = self.wins / max(self.games_played, 1)

        # Çok fazla kazanıyorsa kasten kaybetme ihtimali artar
        if current_win_rate > self.target_win_rate + 0.2:
            return random.random() < (self.lose_probability * 2)
        elif current_win_rate > self.target_win_rate:
            return random.random() < self.lose_probability
        elif self.consecutive_wins >= self.max_consecutive_wins:
            return random.random() < 0.8  # %80 ihtimalle kaybeder

        return False

    def predict_ball_y(self, ball_x, ball_y, ball_speed_x, ball_speed_y, paddle_x, screen_height):
        """Topun paddle_x konumuna geldiğinde Y pozisyonunu tahmin eder"""
        if abs(ball_speed_x) < 0.1:
            return ball_y

        time_to_reach = (paddle_x - ball_x) / ball_speed_x
        if time_to_reach <= 0:
            return ball_y

        predicted_y = ball_y + ball_speed_y * time_to_reach

        # Duvar sıçramalarını hesapla
        bounces = 0
        while (predicted_y < 0 or predicted_y > screen_height) and bounces < 10:
            if predicted_y < 0:
                predicted_y = -predicted_y
            elif predicted_y > screen_height:
                predicted_y = 2 * screen_height - predicted_y
            bounces += 1

        return predicted_y

    def get_move(self, ball_x, ball_y, ball_speed_x, ball_speed_y,
                 my_paddle_y, paddle_height, screen_height,
                 scored_for_me=False, scored_against_me=False):
        """AI'ın hareket kararını verir"""

        # Skor güncellemeleri ve reset
        if scored_for_me or scored_against_me:
            if scored_for_me:
                self.wins += 1
                self.hits += 1
                self.consecutive_wins += 1
            else:
                self.misses += 1
                self.consecutive_wins = 0  # Sıfırla
            self.games_played += 1

            # Her skor sonrası tüm kilitleri sıfırla
            self.is_frozen = False
            self.target_locked = False
            self.locked_target = None
            self.should_lose_next = False

        paddle_center = my_paddle_y + paddle_height / 2
        screen_center = screen_height / 2

        # Stratejik kaybetme kontrolü
        if ball_speed_x > 0 and ball_x > 400:  # Top AI'ya yaklaşıyorsa
            if not self.should_lose_next:
                self.should_lose_next = self.should_intentionally_lose()

        # Kasten kaybetme modundaysa
        if self.should_lose_next and ball_speed_x > 0:
            # Yanlış yöne git veya hiç hareket etme
            if random.random() < 0.7:  # %70 ihtimalle yanlış hareket
                predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780, screen_height)
                # Topun tam tersine git
                wrong_target = predicted_y + random.choice([-150, 150])
                wrong_target = max(50, min(screen_height - 50, wrong_target))
                return self._move_to_target(paddle_center, wrong_target)
            else:
                return 0  # Hiç hareket etme

        # Normal zorluk seviyesine göre hata payı
        if random.random() < self.error_rate:
            return random.choice([-1, 0, 1])

        # Top AI'ya gelmiyor veya çok uzaksa - serbest hareket
        if ball_speed_x <= 0 or ball_x < 200:
            self.is_frozen = False
            self.target_locked = False
            self.locked_target = None
            return self._move_to_center(paddle_center, screen_center)

        # Top AI'ya doğru geliyor
        if ball_speed_x > 0:

            # FREEZE ZONE - Tamamen dur!
            if ball_x > (800 - self.freeze_distance):
                self.is_frozen = True
                return 0  # HİÇBİR HAREKET YOK!

            # PREPARE ZONE - Hedefi belirle ve pozisyon al
            elif ball_x > (800 - self.prepare_distance):

                # İlk kez bu zone'a giriyorsa hedefi kilitle
                if not self.target_locked:
                    predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780, screen_height)

                    # Zorluk seviyesine göre hata payı ekle
                    noise_range = 50 * (1 - self.prediction_accuracy)
                    noise = random.uniform(-noise_range, noise_range)
                    self.locked_target = predicted_y + noise
                    self.target_locked = True

                # Kilitlenmiş hedefe git
                return self._move_to_target(paddle_center, self.locked_target)

            # REACTION ZONE - Normal takip
            else:
                predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780, screen_height)

                # Zorluk seviyesine göre tahmin hatası
                noise_range = 30 * (1 - self.prediction_accuracy)
                noise = random.uniform(-noise_range, noise_range)
                target_y = predicted_y + noise

                return self._move_to_target(paddle_center, target_y)

        # Default: merkeze git
        return self._move_to_center(paddle_center, screen_center)

    def _move_to_target(self, current_pos, target_pos):
        """Belirli bir hedefe hareket et"""
        diff = target_pos - current_pos

        # Zorluk seviyesine göre hassasiyet
        if self.difficulty == "easy":
            threshold = 25
        elif self.difficulty == "medium":
            threshold = 15
        elif self.difficulty == "hard":
            threshold = 8
        else:  # impossible
            threshold = 3

        if abs(diff) < threshold:
            return 0
        elif diff > 0:
            return 1
        else:
            return -1

    def _move_to_center(self, current_pos, center_pos):
        """Merkeze hareket et"""
        diff = center_pos - current_pos
        threshold = 30 if self.difficulty == "easy" else 20

        if abs(diff) < threshold:
            return 0
        elif diff > 0:
            return 1
        else:
            return -1

    def update_performance(self, hit_success):
        """Performansa göre parametreleri güncelle"""
        if hit_success:
            self.hits += 1
            # Öğrenme - sadece hard ve impossible modda
            if self.difficulty in ["hard", "impossible"]:
                self.freeze_distance = min(200, self.freeze_distance + 2)
                self.prediction_accuracy = min(0.99, self.prediction_accuracy + self.learning_rate)
        else:
            self.misses += 1
            # Öğrenme - sadece hard ve impossible modda
            if self.difficulty in ["hard", "impossible"]:
                self.freeze_distance = max(80, self.freeze_distance - 3)

    def get_difficulty_info(self):
        """Zorluk seviyesi bilgilerini döndür"""
        difficulty_names = {
            "easy": "KOLAY",
            "medium": "ORTA",
            "hard": "ZOR",
            "impossible": "İMKANSIZ"
        }

        return {
            "name": difficulty_names.get(self.difficulty, "ORTA"),
            "reaction": f"{self.reaction_speed:.1f}",
            "accuracy": f"{self.prediction_accuracy:.1f}",
            "error_rate": f"{self.error_rate*100:.0f}%",
            "target_win_rate": f"{self.target_win_rate*100:.0f}%"
        }

    def get_stats(self):
        """İstatistikleri döndür"""
        total_games = max(self.games_played, 1)
        total_attempts = max(self.hits + self.misses, 1)
        current_win_rate = (self.wins / total_games) * 100

        return {
            'games': self.games_played,
            'wins': self.wins,
            'win_rate': current_win_rate,
            'target_win_rate': self.target_win_rate * 100,
            'hit_rate': (self.hits / total_attempts) * 100,
            'hits': self.hits,
            'misses': self.misses,
            'freeze_distance': self.freeze_distance,
            'is_frozen': self.is_frozen,
            'target_locked': self.target_locked,
            'difficulty': self.difficulty,
            'consecutive_wins': self.consecutive_wins,
            'should_lose_next': self.should_lose_next
        }
