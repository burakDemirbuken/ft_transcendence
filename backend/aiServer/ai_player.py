import math
import random

class PingPongAI:
    def __init__(self, difficulty="medium", custom_settings=None):
        self.games_played = 0
        self.wins = 0
        self.hits = 0
        self.misses = 0

        # Zorluk sevixyesi
        self.difficulty = difficulty
        self.custom_settings = custom_settings
        self.setup_difficulty()

        # Durum takibi
        self.is_frozen = False
        self.target_locked = False
        self.locked_target = None

        # Stratejik kaybetme
        self.consecutive_wins = 0
        self.should_lose_next = False

        # Yeni özellikler
        self.rage_mode = False
        self.rage_counter = 0
        self.tired_mode = False
        self.tired_counter = 0
        self.super_focus = False
        self.focus_counter = 0

		# Yeni -  Oyun alanı bilgileri
        self.screen_width = 800
        self.screen_height = 600
        self.paddle_x = 780  # AI paddle X konumu

    def setup_difficulty(self):
        """Zorluk seviyesine göre parametreleri ayarla"""
        if self.difficulty == "custom" and self.custom_settings:
            # Custom ayarları 10 üzerinden sisteme çevir
            self.reaction_speed = self.custom_settings['reaction_speed'] / 10.0
            self.prediction_accuracy = self.custom_settings['prediction_accuracy'] / 10.0
            self.prepare_distance = 200 + (self.custom_settings['prepare_distance'] * 40)  # 200-600
            self.freeze_distance = 50 + (self.custom_settings['freeze_distance'] * 15)     # 50-200
            self.error_rate = 0.5 - (self.custom_settings['accuracy'] * 0.049)  # 0.5-0.01
            self.learning_rate = self.custom_settings['learning_rate'] / 200.0  # 0.005-0.05
            self.target_win_rate = self.custom_settings['target_win_rate'] / 10.0
            self.lose_probability = (10 - self.custom_settings['fairness']) / 20.0  # 0.5-0.0
            self.max_consecutive_wins = max(1, self.custom_settings['max_consecutive_wins'])

            # özellikler
            self.rage_enabled = self.custom_settings['rage_mode']
            self.fatigue_enabled = self.custom_settings['fatigue_system']
            self.focus_enabled = self.custom_settings['focus_mode']
            self.adaptive_enabled = self.custom_settings['adaptive_difficulty']
            self.prediction_lines = self.custom_settings['show_prediction']

        else:
            # Varsayılan zorluk seviyeleri
            if self.difficulty == "easy":
                self.reaction_speed = 0.5
                self.prediction_accuracy = 0.4
                self.prepare_distance = 300
                self.freeze_distance = 60
                self.error_rate = 0.3
                self.learning_rate = 0.005
                self.target_win_rate = 0.3
                self.lose_probability = 0.4
                self.max_consecutive_wins = 2
            elif self.difficulty == "medium":
                self.reaction_speed = 0.7
                self.prediction_accuracy = 0.7
                self.prepare_distance = 400
                self.freeze_distance = 100
                self.error_rate = 0.15
                self.learning_rate = 0.01
                self.target_win_rate = 0.5
                self.lose_probability = 0.2
                self.max_consecutive_wins = 3
            elif self.difficulty == "hard":
                self.reaction_speed = 0.95
                self.prediction_accuracy = 0.9
                self.prepare_distance = 500
                self.freeze_distance = 140
                self.error_rate = 0.05
                self.learning_rate = 0.02
                self.target_win_rate = 0.7
                self.lose_probability = 0.1
                self.max_consecutive_wins = 5
            elif self.difficulty == "impossible":
                self.reaction_speed = 1.0
                self.prediction_accuracy = 1.0
                self.prepare_distance = 600
                self.freeze_distance = 100
                self.error_rate = 0.00
                self.learning_rate = 0.00
                self.target_win_rate = 1.0
                self.lose_probability = 0.00
                self.max_consecutive_wins = 100

            # Varsayılan özellikler
            self.rage_enabled = False
            self.fatigue_enabled = False
            self.focus_enabled = False
            self.adaptive_enabled = False
            self.prediction_lines = False

    def update_special_modes(self, scored_against_me=False, scored_for_me=False):
        """Özel modları güncelle"""
        # Rage Mode - AI art arda kaybederse öfkelenir ve daha agresif olur
        if self.rage_enabled:
            if scored_against_me:
                self.rage_counter += 1
                if self.rage_counter >= 2:
                    self.rage_mode = True
            elif scored_for_me:
                self.rage_counter = max(0, self.rage_counter - 1)
                if self.rage_counter == 0:
                    self.rage_mode = False

        # Fatigue System - AI çok oynayınca yorulur
        if self.fatigue_enabled:
            if self.games_played > 0 and self.games_played % 5 == 0:
                self.tired_mode = True
                self.tired_counter = 3
            if self.tired_counter > 0:
                self.tired_counter -= 1
                if self.tired_counter == 0:
                    self.tired_mode = False

        # Focus Mode - AI bazen süper odaklanır
        if self.focus_enabled:
            if random.random() < 0.1:  # %10 ihtimal
                self.super_focus = True
                self.focus_counter = 3
            if self.focus_counter > 0:
                self.focus_counter -= 1
                if self.focus_counter == 0:
                    self.super_focus = False

    def get_current_stats(self):
        """Mevcut performans istatistiklerini döndür"""
        current_accuracy = self.prediction_accuracy
        current_error = self.error_rate

        # Rage mode etkisi - sadece doğruluk artar
        if self.rage_mode:
            current_error *= 0.5
            current_accuracy = min(0.98, current_accuracy * 1.2)

        # Tired mode etkisi - performans düşer
        if self.tired_mode:
            current_error *= 1.5
            current_accuracy *= 0.8

        # Focus mode etkisi - mükemmel doğruluk
        if self.super_focus:
            current_accuracy = min(0.99, current_accuracy * 1.3)
            current_error *= 0.3

        return current_accuracy, current_error

    def should_intentionally_lose(self):
        """AI'ın kasten kaybetmesi gerekip gerekmediğini belirler"""
        if self.games_played < 3:
            return False

        # Rage mode'da asla kasten kaybetmez
        if self.rage_mode:
            return False

        current_win_rate = self.wins / max(self.games_played, 1)

        # Adaptive difficulty - oyuncunun performansına göre ayarla
        if hasattr(self, 'adaptive_enabled') and self.adaptive_enabled:
            # Oyuncu çok kaybediyorsa AI daha kolay olsun
            if current_win_rate > 0.8:
                return random.random() < 0.6

        if current_win_rate > self.target_win_rate + 0.2:
            return random.random() < (self.lose_probability * 2)
        elif current_win_rate > self.target_win_rate:
            return random.random() < self.lose_probability
        elif self.consecutive_wins >= self.max_consecutive_wins:
            return random.random() < 0.8

        return False

    def predict_ball_y(self, ball_x, ball_y, ball_speed_x, ball_speed_y, paddle_x, screen_height):
        """Topun paddle_x konumuna geldiğinde Y pozisyonunu tahmin eder"""
		# Hız çok düşükse mevcut Y konumunu döndür
        if abs(ball_speed_x) < 0:
            return ball_y

        # Topun paddle_x konumuna ulaşması için gereken süre
        time_to_reach = (paddle_x - ball_x) / ball_speed_x
        if time_to_reach <= 0:
            return ball_y

        predicted_y = ball_y + ball_speed_y * time_to_reach

        # Yansımaları hesaba kat
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
        """AI'ın hareket kararını verir - hedef Y konumunu döndürür"""

        if scored_for_me or scored_against_me:
            if scored_for_me:
                self.wins += 1
                self.hits += 1
                self.consecutive_wins += 1
            else:
                self.misses += 1
                self.consecutive_wins = 0
            self.games_played += 1

            # Özel modları güncelle
            self.update_special_modes(scored_against_me, scored_for_me)

            self.is_frozen = False
            self.target_locked = False
            self.locked_target = None
            self.should_lose_next = False

        # Mevcut performans değerlerini al
        current_accuracy, current_error = self.get_current_stats()

        paddle_center = my_paddle_y + paddle_height / 2
        screen_center = screen_height / 2

        # Hedef Y konumu
        target_y = None

        if ball_speed_x > 0 and ball_x > 400:
            if not self.should_lose_next:
                self.should_lose_next = self.should_intentionally_lose()

        if self.should_lose_next and ball_speed_x > 0:
            if random.random() < 0.7:
                predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780, screen_height)
                wrong_target = predicted_y + random.choice([-150, 150])
                target_y = max(paddle_height/2, min(screen_height - paddle_height/2, wrong_target))
            else:
                # Mevcut konumda kal
                target_y = paddle_center
        elif random.random() < current_error:
            # Rastgele bir konum seç
            target_y = random.uniform(paddle_height/2, screen_height - paddle_height/2)
        elif ball_speed_x <= 0 or ball_x < 200:
            self.is_frozen = False
            self.target_locked = False
            self.locked_target = None
            # Merkeze git
            target_y = screen_center
        elif ball_speed_x > 0:
            if ball_x > (800 - self.freeze_distance):
                self.is_frozen = True
                # Mevcut konumda kal
                target_y = paddle_center
            elif ball_x > (800 - self.prepare_distance):
                if not self.target_locked:
                    predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780, screen_height)
                    noise_range = 50 * (1 - current_accuracy)
                    noise = random.uniform(-noise_range, noise_range)
                    self.locked_target = predicted_y + noise
                    self.target_locked = True

                target_y = self.locked_target
            else:
                predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780, screen_height)
                noise_range = 30 * (1 - current_accuracy)
                noise = random.uniform(-noise_range, noise_range)
                target_y = predicted_y + noise
        else:
            # Varsayılan olarak merkeze git
            target_y = screen_center

        # Hedef Y konumunu sınırlar içinde tut
        target_y = max(paddle_height/2, min(screen_height - paddle_height/2, target_y))

		# DEBUG LOG
        print(f"🤖 AI Hesaplama:")
        print(f"  Top: ({ball_x:.1f}, {ball_y:.1f}) | Hız: ({ball_speed_x:.1f}, {ball_speed_y:.1f})")
        print(f"  Paddle Y: {my_paddle_y:.1f} | Hedef: {target_y:.1f}")
        print(f"  Mod: Frozen={self.is_frozen}, Locked={self.target_locked}, Lose={self.should_lose_next}")

        return target_y - paddle_height/2  # Paddle'ın üst kenarının Y konumunu döndür

    def _move_to_target(self, current_pos, target_pos):
        """Belirli bir hedefe hareket et"""
        diff = target_pos - current_pos

        if self.difficulty == "easy":
            threshold = 25
        elif self.difficulty == "medium":
            threshold = 15
        elif self.difficulty == "hard":
            threshold = 8
        elif self.difficulty == "custom":
            threshold = int(25 * (1 - self.prediction_accuracy))
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
            if self.difficulty in ["hard", "impossible", "custom"]:
                self.freeze_distance = min(200, self.freeze_distance + 2)
                self.prediction_accuracy = min(0.99, self.prediction_accuracy + self.learning_rate)
        else:
            self.misses += 1
            if self.difficulty in ["hard", "impossible", "custom"]:
                self.freeze_distance = max(80, self.freeze_distance - 3)

    def get_difficulty_info(self):
        """Zorluk seviyesi bilgilerini döndür"""
        difficulty_names = {
            "easy": "KOLAY",
            "medium": "ORTA",
            "hard": "ZOR",
            "impossible": "İMKANSIZ",
            "custom": "ÖZEL"
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
            'should_lose_next': self.should_lose_next,
            'rage_mode': getattr(self, 'rage_mode', False),
            'tired_mode': getattr(self, 'tired_mode', False),
            'super_focus': getattr(self, 'super_focus', False),
            'rage_counter': getattr(self, 'rage_counter', 0),
            'prediction_lines': getattr(self, 'prediction_lines', False)
        }

    def get_prediction_line(self, ball_x, ball_y, ball_speed_x, ball_speed_y):
        """Tahmin çizgisi için koordinatları döndür"""
        if not getattr(self, 'prediction_lines', False) or ball_speed_x <= 0:
            return None

        predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780, 600)
        return predicted_y
