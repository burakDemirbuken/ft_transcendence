import random

class PingPongAI:
    def __init__(self, difficulty="medium", custom_settings=None):
        self.games_played = 0
        self.wins = 0
        self.hits = 0
        self.misses = 0

        # Zorluk seviyesi
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

        # Sabit değerler
        self.BALL_SPEED = 5
        self.PADDLE_SPEED = 8
        self.BALL_RADIUS = 10
        self.PADDLE_WIDTH = 10
        self.PADDLE_HEIGHT = 100
        self.WIDTH = 800
        self.HEIGHT = 600

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

            # Yeni özellikler
            self.rage_enabled = self.custom_settings['rage_mode']
            self.fatigue_enabled = self.custom_settings['fatigue_system']
            self.focus_enabled = self.custom_settings['focus_mode']
            self.adaptive_enabled = self.custom_settings['adaptive_difficulty']

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
                self.prediction_accuracy = 0.98
                self.prepare_distance = 600
                self.freeze_distance = 180
                self.error_rate = 0.01
                self.learning_rate = 0.03
                self.target_win_rate = 0.9
                self.lose_probability = 0.02
                self.max_consecutive_wins = 10

            # Varsayılan özellikler
            self.rage_enabled = False
            self.fatigue_enabled = False
            self.focus_enabled = False
            self.adaptive_enabled = False

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

    def predict_ball_y(self, ball_x, ball_y, ball_speed_x, ball_speed_y, paddle_x):
        """Topun paddle_x konumuna geldiğinde Y pozisyonunu tahmin eder"""
        if abs(ball_speed_x) < 0.1:
            return ball_y

        time_to_reach = (paddle_x - ball_x) / ball_speed_x
        if time_to_reach <= 0:
            return ball_y

        predicted_y = ball_y + ball_speed_y * time_to_reach

        bounces = 0
        while (predicted_y < 0 or predicted_y > self.HEIGHT) and bounces < 10:
            if predicted_y < 0:
                predicted_y = -predicted_y
            elif predicted_y > self.HEIGHT:
                predicted_y = 2 * self.HEIGHT - predicted_y
            bounces += 1

        return predicted_y

    def get_move(self, ball_x, ball_y, ball_speed_x, ball_speed_y,
                 my_paddle_y, scored_for_me=False, scored_against_me=False):
        """AI'ın hareket kararını verir"""

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

        paddle_center = my_paddle_y + self.PADDLE_HEIGHT / 2
        screen_center = self.HEIGHT / 2

        if ball_speed_x > 0 and ball_x > 400:
            if not self.should_lose_next:
                self.should_lose_next = self.should_intentionally_lose()

        if self.should_lose_next and ball_speed_x > 0:
            if random.random() < 0.7:
                predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780)
                wrong_target = predicted_y + random.choice([-150, 150])
                wrong_target = max(50, min(self.HEIGHT - 50, wrong_target))
                return self._move_to_target(paddle_center, wrong_target)
            else:
                return 0

        if random.random() < current_error:
            return random.choice([-1, 0, 1])

        if ball_speed_x <= 0 or ball_x < 200:
            self.is_frozen = False
            self.target_locked = False
            self.locked_target = None
            return self._move_to_center(paddle_center, screen_center)

        if ball_speed_x > 0:
            if ball_x > (self.WIDTH - self.freeze_distance):
                self.is_frozen = True
                return 0

            elif ball_x > (self.WIDTH - self.prepare_distance):
                if not self.target_locked:
                    predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780)
                    noise_range = 50 * (1 - current_accuracy)
                    noise = random.uniform(-noise_range, noise_range)
                    self.locked_target = predicted_y + noise
                    self.target_locked = True

                return self._move_to_target(paddle_center, self.locked_target)

            else:
                predicted_y = self.predict_ball_y(ball_x, ball_y, ball_speed_x, ball_speed_y, 780)
                noise_range = 30 * (1 - current_accuracy)
                noise = random.uniform(-noise_range, noise_range)
                target_y = predicted_y + noise
                return self._move_to_target(paddle_center, target_y)

        return self._move_to_center(paddle_center, screen_center)

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

