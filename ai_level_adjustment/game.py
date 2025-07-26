import pygame
import sys
import random
import time
import threading
import json
from ai_player import PingPongAI

# Pygame'i başlat
pygame.init()

# Renkler (RGB)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 100, 255)
YELLOW = (255, 255, 0)
ORANGE = (255, 165, 0)
PURPLE = (128, 0, 128)
GRAY = (128, 128, 128)
PINK = (255, 192, 203)
CYAN = (0, 255, 255)
LIME = (0, 255, 0)
DARK_RED = (139, 0, 0)

# Ekran boyutları
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Ping Pong vs AI - Sabit Hızlar")

# Fontlar
font = pygame.font.SysFont("Arial", 22)
small_font = pygame.font.SysFont("Arial", 16)
big_font = pygame.font.SysFont("Arial", 40)
tiny_font = pygame.font.SysFont("Arial", 12)

# Game states
MENU = 0
CUSTOM_SETTINGS = 1
PLAYING = 2
game_state = MENU

# Zorluk seviyeleri
difficulties = ["easy", "medium", "hard", "impossible", "custom"]
difficulty_names = ["KOLAY", "ORTA", "ZOR", "İMKANSIZ", "ÖZEL"]
difficulty_colors = [GREEN, YELLOW, ORANGE, RED, CYAN]
selected_difficulty = 1  # Default: medium

# SABİT OYUN DEĞİŞKENLERİ - DEĞİŞTİRİLEMEZ!
BALL_SPEED = 5          # Top hızı sabit
PADDLE_SPEED = 8        # Çubuk hızı sabit
BALL_RADIUS = 10        # Top boyutu sabit
PADDLE_WIDTH = 10       # Çubuk genişliği sabit
PADDLE_HEIGHT = 100     # Çubuk yüksekliği sabit

# AI Veri Gönderimi için değişkenler
last_ai_update_time = 0
AI_UPDATE_INTERVAL = 1.0  # 1 saniye

# Custom ayarlar (sadece AI yetenekleri)
custom_settings = {
    # AI Yetenekleri (1-10)
    'reaction_speed': 7,        # Reaksiyon hızı
    'prediction_accuracy': 7,   # Tahmin doğruluğu
    'accuracy': 7,              # Genel doğruluk
    'learning_rate': 5,         # Öğrenme hızı

    # AI Mesafeleri (1-10)
    'prepare_distance': 5,      # Hazırlık mesafesi
    'freeze_distance': 5,       # Donma mesafesi

    # Oyun dengesi (1-10)
    'target_win_rate': 5,       # Hedef kazanma oranı
    'fairness': 5,              # Adalet (yüksek = daha adil)
    'max_consecutive_wins': 3,  # Max üst üste kazanma (1-10)

    # Özel özellikler (True/False)
    'rage_mode': True,          # Öfke modu
    'fatigue_system': True,     # Yorgunluk sistemi
    'focus_mode': True,         # Odaklanma modu
    'adaptive_difficulty': True, # Adaptif zorluk
    'show_prediction': False    # Tahmin çizgilerini göster
}

# Custom ayar seçimi
selected_setting = 0
setting_names = [
    "Reaksiyon Hizi (1-10)",
    "Tahmin Dogrulugu (1-10)",
    "Genel Dogruluk (1-10)",
    "Ogrenme Hizi (1-10)",
    "Hazirlik Mesafesi (1-10)",
    "Donma Mesafesi (1-10)",
    "Hedef Kazanma Orani (1-10)",
    "Adalet Seviyesi (1-10)",
    "Max Ust Uste Kazanma (1-10)",
    "Ofke Modu (Acik/Kapali)",
    "Yorgunluk Sistemi (Acik/Kapali)",
    "Odaklanma Modu (Acik/Kapali)",
    "Adaptif Zorluk (Acik/Kapali)",
    "Tahmin Cizgileri (Acik/Kapali)"
]

setting_keys = [
    'reaction_speed', 'prediction_accuracy', 'accuracy', 'learning_rate',
    'prepare_distance', 'freeze_distance', 'target_win_rate', 'fairness', 'max_consecutive_wins',
    'rage_mode', 'fatigue_system', 'focus_mode', 'adaptive_difficulty', 'show_prediction'
]

# Oyun değişkenleri
ai_player = None
ball_pos = [WIDTH // 2, HEIGHT // 2]
ball_speed = [BALL_SPEED, 3]  # Sabit hız kullan
left_paddle = pygame.Rect(10, HEIGHT // 2 - PADDLE_HEIGHT // 2, PADDLE_WIDTH, PADDLE_HEIGHT)
right_paddle = pygame.Rect(WIDTH - 20, HEIGHT // 2 - PADDLE_HEIGHT // 2, PADDLE_WIDTH, PADDLE_HEIGHT)
left_score = 0
right_score = 0
prev_left_score = 0
prev_right_score = 0
clock = pygame.time.Clock()

def send_data_to_ai(game_data):
    """Verileri yapay zekaya gönder"""
    try:
        # Konsola yazdır (test için)
        print(f"[{time.strftime('%H:%M:%S')}] AI Verisi: Skor H:{game_data['scores']['human']} AI:{game_data['scores']['ai']}, "
              f"Top: ({game_data['ball_position']['x']:.0f},{game_data['ball_position']['y']:.0f}), "
              f"AI Durum: {game_data['ai_stats']['difficulty']}, "
              f"Kazanma Oranı: {game_data['ai_stats']['win_rate']:.1f}%")

        # Burada kendi AI API'nize gönderim yapabilirsiniz
        # import requests
        # response = requests.post('http://your-ai-api-endpoint.com/game-data',
        #                         json=game_data, timeout=0.5)

        # Dosyaya kaydetmek isterseniz:
        # with open('game_data.json', 'a', encoding='utf-8') as f:
        #     f.write(json.dumps(game_data) + '\n')

    except Exception as e:
        print(f"Veri gönderme hatası: {e}")

def collect_game_data():
    """Oyun verilerini topla"""
    if not ai_player:
        return None

    stats = ai_player.get_stats()

    game_data = {
        'timestamp': time.time(),
        'formatted_time': time.strftime('%Y-%m-%d %H:%M:%S'),
        'ball_position': {'x': ball_pos[0], 'y': ball_pos[1]},
        'ball_speed': {'x': ball_speed[0], 'y': ball_speed[1]},
        'paddles': {
            'human': {'y': left_paddle.y, 'center_y': left_paddle.centery},
            'ai': {'y': right_paddle.y, 'center_y': right_paddle.centery}
        },
        'scores': {'human': left_score, 'ai': right_score},
        'ai_stats': {
            'difficulty': stats['difficulty'],
            'games_played': stats['games'],
            'wins': stats['wins'],
            'win_rate': stats['win_rate'],
            'target_win_rate': stats['target_win_rate'],
            'hit_rate': stats['hit_rate'],
            'hits': stats['hits'],
            'misses': stats['misses'],
            'consecutive_wins': stats['consecutive_wins'],
            'is_frozen': stats['is_frozen'],
            'target_locked': stats['target_locked'],
            'should_lose_next': stats['should_lose_next'],
            'freeze_distance': stats['freeze_distance'],
            'rage_mode': stats.get('rage_mode', False),
            'tired_mode': stats.get('tired_mode', False),
            'super_focus': stats.get('super_focus', False),
            'rage_counter': stats.get('rage_counter', 0),
            'prediction_lines': stats.get('prediction_lines', False)
        },
        'game_constants': {
            'ball_speed': BALL_SPEED,
            'paddle_speed': PADDLE_SPEED,
            'ball_radius': BALL_RADIUS,
            'paddle_width': PADDLE_WIDTH,
            'paddle_height': PADDLE_HEIGHT,
            'screen_width': WIDTH,
            'screen_height': HEIGHT
        }
    }

    return game_data

def draw_menu():
    """Ana menüyü çiz"""
    screen.fill(BLACK)

    title = big_font.render("PING PONG vs AI", True, WHITE)
    title_rect = title.get_rect(center=(WIDTH//2, 80))
    screen.blit(title, title_rect)

    subtitle = font.render("Zorluk Seviyesi Secin:", True, WHITE)
    subtitle_rect = subtitle.get_rect(center=(WIDTH//2, 150))
    screen.blit(subtitle, subtitle_rect)

    # Sabit hızlar bilgisi
    speed_info = small_font.render(f"Sabit Hizlar: Top={BALL_SPEED}, Cubuk={PADDLE_SPEED}", True, GRAY)
    speed_rect = speed_info.get_rect(center=(WIDTH//2, 120))
    screen.blit(speed_info, speed_rect)

    win_rates = ["AI %30 kazanir", "AI %50 kazanir", "AI %70 kazanir", "AI %90 kazanir", "Kendi AI'inizi Yaratin!"]

    for i, (diff_name, color, win_rate) in enumerate(zip(difficulty_names, difficulty_colors, win_rates)):
        y_pos = 200 + i * 45

        if i == selected_difficulty:
            pygame.draw.rect(screen, color, (WIDTH//2 - 220, y_pos - 15, 440, 35), 3)
            text_color = color
            rate_color = color
        else:
            text_color = GRAY
            rate_color = GRAY

        diff_text = font.render(f"{i+1}. {diff_name}", True, text_color)
        rate_text = small_font.render(f"({win_rate})", True, rate_color)

        screen.blit(diff_text, (WIDTH//2 - 200, y_pos))
        screen.blit(rate_text, (WIDTH//2 + 20, y_pos + 3))

    controls = [
        "1-5: Zorluk Secimi",
        "ENTER: Oyunu Baslat",
        "C: Ozel Ayarlar (5. secenekte)",
        "ESC: Cikis"
    ]

    for i, control in enumerate(controls):
        control_text = small_font.render(control, True, WHITE)
        screen.blit(control_text, (50, HEIGHT - 100 + i * 18))

    descriptions = [
        "AI cogu zaman kaybeder - Rahat oyun",
        "Dengeli mucadele - Esit sans",
        "AI cogunlukla kazanir - Zorlayici",
        "AI neredeyse hep kazanir - Imkansiz",
        "AI yeteneklerini ozellestirebilirsiniz!"
    ]

    desc_text = small_font.render(descriptions[selected_difficulty], True, difficulty_colors[selected_difficulty])
    desc_rect = desc_text.get_rect(center=(WIDTH//2, 450))
    screen.blit(desc_text, desc_rect)

def draw_custom_settings():
    """Custom ayarlar ekranını çiz"""
    screen.fill(BLACK)

    title = big_font.render("OZEL AI TASARIMI", True, CYAN)
    title_rect = title.get_rect(center=(WIDTH//2, 30))
    screen.blit(title, title_rect)

    subtitle = small_font.render("Sadece AI yetenekleri degistirilebilir - Hizlar sabittir!", True, WHITE)
    subtitle_rect = subtitle.get_rect(center=(WIDTH//2, 60))
    screen.blit(subtitle, subtitle_rect)

    # Sabit değerler bilgisi
    fixed_info = tiny_font.render(f"SABİT: Top Hızı={BALL_SPEED}, Çubuk Hızı={PADDLE_SPEED}, Boyutlar={PADDLE_WIDTH}x{PADDLE_HEIGHT}", True, GRAY)
    fixed_rect = fixed_info.get_rect(center=(WIDTH//2, 80))
    screen.blit(fixed_info, fixed_rect)

    # Ayarları listele
    for i, (key, name) in enumerate(zip(setting_keys, setting_names)):
        y_pos = 110 + i * 28
        value = custom_settings[key]

        # Seçili ayarı vurgula
        if i == selected_setting:
            pygame.draw.rect(screen, CYAN, (20, y_pos - 10, WIDTH - 40, 25), 2)
            text_color = CYAN
        else:
            text_color = WHITE

        # Ayar adı ve değeri
        if isinstance(value, bool):
            value_text = "ACIK" if value else "KAPALI"
            value_color = GREEN if value else RED
        else:
            value_text = f"{value}/10"
            # Renk gradyanı
            if value <= 3:
                value_color = RED
            elif value <= 6:
                value_color = YELLOW
            else:
                value_color = GREEN

        setting_text = font.render(name, True, text_color)
        value_surface = font.render(value_text, True, value_color)

        screen.blit(setting_text, (30, y_pos))
        screen.blit(value_surface, (WIDTH - 120, y_pos))

        # Değer çubuğu (sadece sayısal değerler için)
        if not isinstance(value, bool):
            bar_width = int(150 * (value / 10))
            pygame.draw.rect(screen, GRAY, (WIDTH - 200, y_pos + 5, 150, 12))
            pygame.draw.rect(screen, value_color, (WIDTH - 200, y_pos + 5, bar_width, 12))

    # AI Özet Bilgileri
    summary_y = 110 + len(setting_keys) * 28 + 10
    summary_title = font.render("AI OZETI:", True, YELLOW)
    screen.blit(summary_title, (30, summary_y))

    # Güç seviyesi hesapla (sadece AI yetenekleri)
    power_level = (custom_settings['reaction_speed'] + custom_settings['prediction_accuracy'] +
                  custom_settings['accuracy'] + custom_settings['learning_rate']) / 4

    win_rate = custom_settings['target_win_rate'] * 10
    fairness = custom_settings['fairness']

    summary_texts = [
        f"AI Zeka Seviyesi: {power_level:.1f}/10 ({'Aptal' if power_level < 4 else 'Normal' if power_level < 7 else 'Dahi'})",
        f"Hedef Kazanma: %{win_rate:.0f}",
        f"Adalet: {fairness}/10 ({'Haksiz' if fairness < 4 else 'Dengeli' if fairness < 7 else 'Cok Adil'})",
        f"Ozel Yetenekler: {sum([custom_settings['rage_mode'], custom_settings['fatigue_system'], custom_settings['focus_mode'], custom_settings['adaptive_difficulty']])}/4"
    ]

    for i, text in enumerate(summary_texts):
        color = WHITE
        if i == 0:  # Zeka seviyesi
            color = RED if power_level < 4 else YELLOW if power_level < 7 else GREEN
        elif i == 2:  # Adalet
            color = RED if fairness < 4 else YELLOW if fairness < 7 else GREEN

        summary_surface = small_font.render(text, True, color)
        screen.blit(summary_surface, (50, summary_y + 25 + i * 18))

    # Kontroller
    controls = [
        "W/S: Ayar Secimi",
        "A/D: Deger Degistir",
        "SPACE: Acik/Kapali",
        "R: Varsayilan Degerler",
        "ENTER: Oyunu Baslat",
        "ESC: Ana Menu"
    ]

    for i, control in enumerate(controls):
        control_text = small_font.render(control, True, WHITE)
        screen.blit(control_text, (30, HEIGHT - 130 + i * 18))

    # Açıklamalar
    explanations = [
        "Ne kadar hizli reaksiyon gosterir (1=cok yavas, 10=aninda)",
        "Topun nereye gidecegini ne kadar dogru tahmin eder",
        "Genel oyun dogrulugu ve hassasiyeti",
        "Ne kadar hizli ogrenir ve gelisir",
        "Ne kadar onceden hazirlanmaya baslar",
        "Topa ne kadar yakin oldugunda durur",
        "Oyunlarin yuzde kacini kazanmayi hedefler",
        "Ne kadar adil davranir (yuksek=daha cok kaybeder)",
        "En fazla kac kez ust uste kazanabilir",
        "Art arda kaybedince ofkelenir ve daha guclu olur",
        "Cok oynayinca yorulur ve performansi duser",
        "Bazen super odaklanir ve mukemmel oynar",
        "Oyuncunun seviyesine gore kendini ayarlar",
        "AI'nin tahmin cizgilerini gosterir"
    ]

    if selected_setting < len(explanations):
        exp_text = tiny_font.render(explanations[selected_setting], True, YELLOW)
        exp_rect = exp_text.get_rect(center=(WIDTH//2, HEIGHT - 20))
        screen.blit(exp_text, exp_rect)

def adjust_custom_setting(direction):
    """Custom ayarı artır/azalt"""
    key = setting_keys[selected_setting]

    if isinstance(custom_settings[key], bool):
        custom_settings[key] = not custom_settings[key]
    else:
        if key == 'max_consecutive_wins':
            custom_settings[key] = max(1, min(10, custom_settings[key] + direction))
        else:
            custom_settings[key] = max(1, min(10, custom_settings[key] + direction))

def reset_custom_settings():
    """Custom ayarları varsayılana döndür"""
    global custom_settings
    custom_settings = {
        'reaction_speed': 7,
        'prediction_accuracy': 7,
        'accuracy': 7,
        'learning_rate': 5,
        'prepare_distance': 5,
        'freeze_distance': 5,
        'target_win_rate': 5,
        'fairness': 5,
        'max_consecutive_wins': 3,
        'rage_mode': True,
        'fatigue_system': True,
        'focus_mode': True,
        'adaptive_difficulty': True,
        'show_prediction': False
    }

def get_ai_paddle_color():
    """AI paddle rengini belirle"""
    if not ai_player:
        return RED

    stats = ai_player.get_stats()

    if stats.get('rage_mode', False):
        return DARK_RED  # Öfkeli
    elif stats.get('super_focus', False):
        return LIME      # Süper odaklanmış
    elif stats.get('tired_mode', False):
        return GRAY      # Yorgun
    elif stats.get('should_lose_next', False):
        return PINK      # Sabotaj
    elif ai_player.is_frozen:
        return PURPLE    # Donmuş
    elif ai_player.target_locked:
        return YELLOW    # Kilitli
    else:
        return difficulty_colors[selected_difficulty] if selected_difficulty < 4 else CYAN

def draw_game():
    """Oyunu çiz"""
    screen.fill(BLACK)

    # AI tahmin çizgilerini göster
    if ai_player and hasattr(ai_player, 'prediction_lines') and ai_player.prediction_lines:
        predicted_y = ai_player.get_prediction_line(ball_pos[0], ball_pos[1], ball_speed[0], ball_speed[1])
        if predicted_y:
            pygame.draw.line(screen, ORANGE, (ball_pos[0], ball_pos[1]), (780, predicted_y), 2)
            pygame.draw.circle(screen, ORANGE, (780, int(predicted_y)), 8, 2)

    # AI mesafe çizgileri
    if ai_player and ball_speed[0] > 0:
        prepare_line = WIDTH - ai_player.prepare_distance
        pygame.draw.line(screen, ORANGE, (prepare_line, 0), (prepare_line, HEIGHT), 2)

        freeze_line = WIDTH - ai_player.freeze_distance
        pygame.draw.line(screen, RED, (freeze_line, 0), (freeze_line, HEIGHT), 3)

    # Top
    pygame.draw.circle(screen, WHITE, ball_pos, BALL_RADIUS)

    # Paddle'lar
    paddle_color = get_ai_paddle_color()
    pygame.draw.rect(screen, BLUE, left_paddle)
    pygame.draw.rect(screen, paddle_color, right_paddle)

    # Orta çizgi
    for i in range(0, HEIGHT, 20):
        pygame.draw.rect(screen, WHITE, (WIDTH//2 - 2, i, 4, 10))

    # Skorlar
    left_text = font.render(str(left_score), True, BLUE)
    right_text = font.render(str(right_score), True, RED)
    screen.blit(left_text, (WIDTH // 4, 20))
    screen.blit(right_text, (WIDTH * 3 // 4, 20))

    # Sabit hızlar bilgisi
    speed_info = tiny_font.render(f"SABİT HIZLAR: Top={BALL_SPEED} | Çubuk={PADDLE_SPEED} | AI Veri Gönderimi: Aktif", True, GRAY)
    screen.blit(speed_info, (10, 10))

    # Oyuncu etiketleri
    human_label = small_font.render("HUMAN", True, BLUE)
    screen.blit(human_label, (WIDTH // 4 - 25, 60))

    if ai_player:
        diff_info = ai_player.get_difficulty_info()
        stats = ai_player.get_stats()

        # AI durumu
        ai_status = f"AI ({diff_info['name']})"

        if stats.get('rage_mode', False):
            ai_status += " - OFKELI!"
            ai_color = DARK_RED
        elif stats.get('super_focus', False):
            ai_status += " - SUPER ODAK!"
            ai_color = LIME
        elif stats.get('tired_mode', False):
            ai_status += " - YORGUN"
            ai_color = GRAY
        elif stats.get('should_lose_next', False):
            ai_status += " - SABOTAJ!"
            ai_color = PINK
        elif ai_player.is_frozen:
            ai_status += " - DONMUS"
            ai_color = PURPLE
        elif ai_player.target_locked:
            ai_status += " - KILITLI"
            ai_color = YELLOW
        else:
            ai_status += " - NORMAL"
            ai_color = difficulty_colors[selected_difficulty] if selected_difficulty < 4 else CYAN

        ai_label = small_font.render(ai_status, True, ai_color)
        screen.blit(ai_label, (WIDTH * 3 // 4 - 120, 60))

        # Detaylı istatistikler
        info_texts = [
            f"Zorluk: {diff_info['name']} (Hedef: {diff_info['target_win_rate']})",
            f"Oyun: {stats['games']} | AI Kazanma: {stats['win_rate']:.1f}%",
            f"Ust Uste: {stats['consecutive_wins']} | Vurus: {stats['hit_rate']:.1f}%"
        ]

        # Özel durumlar
        special_status = []
        if stats.get('rage_mode', False):
            special_status.append(f"OFKE: {stats.get('rage_counter', 0)}/3")
        if stats.get('tired_mode', False):
            special_status.append("YORGUN")
        if stats.get('super_focus', False):
            special_status.append("ODAKLI")

        if special_status:
            info_texts.append(f"Durum: {' | '.join(special_status)}")
        else:
            info_texts.append("Durum: NORMAL")

        y_start = HEIGHT - 100
        for i, text in enumerate(info_texts):
            if i == 0:
                color = difficulty_colors[selected_difficulty] if selected_difficulty < 4 else CYAN
            elif i == 1:
                if abs(stats['win_rate'] - stats['target_win_rate']) < 10:
                    color = GREEN
                else:
                    color = WHITE
            elif i == 2 and stats['consecutive_wins'] >= 3:
                color = ORANGE
            elif i == 3:
                if stats.get('rage_mode', False):
                    color = DARK_RED
                elif stats.get('super_focus', False):
                    color = LIME
                elif stats.get('tired_mode', False):
                    color = GRAY
                else:
                    color = WHITE
            else:
                color = WHITE
            info_surface = small_font.render(text, True, color)
            screen.blit(info_surface, (10, y_start + i * 18))

    # Kontroller
    controls = small_font.render("W/S: Hareket | ESC: Menu | R: Restart", True, WHITE)
    screen.blit(controls, (10, HEIGHT - 20))

    # Renk açıklamaları
    if selected_difficulty == 4:  # Custom mode
        color_info = tiny_font.render("Koyu Kirmizi=Ofke | Yesil=Odak | Gri=Yorgun | Pembe=Sabotaj | Mor=Donmus | Sari=Kilitli", True, WHITE)
        screen.blit(color_info, (WIDTH - 600, HEIGHT - 40))

def reset_ball():
    """Topu sıfırla"""
    global ball_pos, ball_speed
    ball_pos = [WIDTH // 2, HEIGHT // 2]
    direction_x = random.choice([-1, 1])
    direction_y = random.choice([-1, 1])
    ball_speed = [direction_x * BALL_SPEED,  # Sabit hız kullan
                  direction_y * random.randint(2, 4)]

def start_game():
    """Oyunu başlat"""
    global game_state, ai_player, left_score, right_score, prev_left_score, prev_right_score
    global left_paddle, right_paddle, last_ai_update_time

    game_state = PLAYING
    last_ai_update_time = time.time()  # AI veri gönderim zamanlayıcısını sıfırla

    # Custom mod seçiliyse özel ayarları kullan
    if selected_difficulty == 4:  # Custom
        ai_player = PingPongAI("custom", custom_settings)
    else:
        ai_player = PingPongAI(difficulties[selected_difficulty])

    left_score = 0
    right_score = 0
    prev_left_score = 0
    prev_right_score = 0

    left_paddle.y = HEIGHT // 2 - PADDLE_HEIGHT // 2
    right_paddle.y = HEIGHT // 2 - PADDLE_HEIGHT // 2

    reset_ball()
    print(f"[{time.strftime('%H:%M:%S')}] Oyun başlatıldı - AI veri gönderimi aktif")

# Ana oyun döngüsü
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        if event.type == pygame.KEYDOWN:
            if game_state == MENU:
                if event.key == pygame.K_1:
                    selected_difficulty = 0
                elif event.key == pygame.K_2:
                    selected_difficulty = 1
                elif event.key == pygame.K_3:
                    selected_difficulty = 2
                elif event.key == pygame.K_4:
                    selected_difficulty = 3
                elif event.key == pygame.K_5:
                    selected_difficulty = 4
                elif event.key == pygame.K_c and selected_difficulty == 4:
                    game_state = CUSTOM_SETTINGS
                elif event.key == pygame.K_RETURN:
                    start_game()
                elif event.key == pygame.K_ESCAPE:
                    running = False

            elif game_state == CUSTOM_SETTINGS:
                if event.key == pygame.K_w:
                    selected_setting = (selected_setting - 1) % len(setting_names)
                elif event.key == pygame.K_s:
                    selected_setting = (selected_setting + 1) % len(setting_names)
                elif event.key == pygame.K_a:
                    adjust_custom_setting(-1)
                elif event.key == pygame.K_d:
                    adjust_custom_setting(1)
                elif event.key == pygame.K_SPACE:
                    key = setting_keys[selected_setting]
                    if isinstance(custom_settings[key], bool):
                        custom_settings[key] = not custom_settings[key]
                elif event.key == pygame.K_r:
                    reset_custom_settings()
                elif event.key == pygame.K_RETURN:
                    start_game()
                elif event.key == pygame.K_ESCAPE:
                    game_state = MENU

            elif game_state == PLAYING:
                if event.key == pygame.K_ESCAPE:
                    game_state = MENU
                elif event.key == pygame.K_r:
                    start_game()

    # Oyun durumuna göre çizim ve mantık
    if game_state == MENU:
        draw_menu()

    elif game_state == CUSTOM_SETTINGS:
        draw_custom_settings()

    elif game_state == PLAYING and ai_player:
        current_time = time.time()

        # 1 saniyede bir AI'ya veri gönder
        if current_time - last_ai_update_time >= AI_UPDATE_INTERVAL:
            game_data = collect_game_data()
            if game_data:
                # Thread kullanarak oyunu dondurmadan gönder
                threading.Thread(
                    target=send_data_to_ai,
                    args=(game_data,),
                    daemon=True
                ).start()
            last_ai_update_time = current_time

        keys = pygame.key.get_pressed()

        # Human player kontrolü - SABİT HIZ
        if keys[pygame.K_w] and left_paddle.top > 0:
            left_paddle.y -= PADDLE_SPEED  # Sabit hız kullan
        if keys[pygame.K_s] and left_paddle.bottom < HEIGHT:
            left_paddle.y += PADDLE_SPEED  # Sabit hız kullan

        # AI hareket kararı
        scored_for_ai = (right_score > prev_right_score)
        scored_against_ai = (left_score > prev_left_score)

        ai_move = ai_player.get_move(
            ball_pos[0], ball_pos[1],
            ball_speed[0], ball_speed[1],
            right_paddle.y, PADDLE_HEIGHT, HEIGHT,
            scored_for_ai, scored_against_ai
        )

        # AI paddle hareketi - SABİT HIZ (sadece hareket kararı değişir)
        if ai_move == 1 and right_paddle.bottom < HEIGHT:
            right_paddle.y += PADDLE_SPEED  # Sabit hız kullan
        elif ai_move == -1 and right_paddle.top > 0:
            right_paddle.y -= PADDLE_SPEED  # Sabit hız kullan

        # Skor takibi güncelle
        prev_left_score = left_score
        prev_right_score = right_score

        # Topu hareket ettir - SABİT HIZ
        ball_pos[0] += ball_speed[0]
        ball_pos[1] += ball_speed[1]

        # Duvar kontrolü
        if ball_pos[1] - BALL_RADIUS <= 0 or ball_pos[1] + BALL_RADIUS >= HEIGHT:
            ball_speed[1] = -ball_speed[1]

        # Paddle çarpışma kontrolü
        ball_rect = pygame.Rect(ball_pos[0] - BALL_RADIUS, ball_pos[1] - BALL_RADIUS,
                               BALL_RADIUS * 2, BALL_RADIUS * 2)

        # Sol paddle (human)
        if ball_rect.colliderect(left_paddle) and ball_speed[0] < 0:
            ball_speed[0] = -ball_speed[0]
                        # Top hızı her zaman sabit kalır
            ball_speed[0] = BALL_SPEED  # Sabit hız

            # Y hızını paddle'ın hangi kısmına çarptığına göre ayarla
            hit_pos = (ball_pos[1] - left_paddle.centery) / (PADDLE_HEIGHT / 2)
            ball_speed[1] = hit_pos * 4  # Maksimum 4 hız

        # Sağ paddle (AI)
        if ball_rect.colliderect(right_paddle) and ball_speed[0] > 0:
            ball_speed[0] = -ball_speed[0]

            # Top hızı her zaman sabit kalır
            ball_speed[0] = -BALL_SPEED  # Sabit hız (negatif yönde)

            # Y hızını paddle'ın hangi kısmına çarptığına göre ayarla
            hit_pos = (ball_pos[1] - right_paddle.centery) / (PADDLE_HEIGHT / 2)
            ball_speed[1] = hit_pos * 4  # Maksimum 4 hız

            # AI performansını güncelle
            ai_player.update_performance(True)

        # Skor kontrolü
        if ball_pos[0] < 0:
            right_score += 1
            if ai_player:
                ai_player.update_performance(False)
            reset_ball()
        elif ball_pos[0] > WIDTH:
            left_score += 1
            reset_ball()

        # Oyunu çiz
        draw_game()

    pygame.display.flip()
    clock.tick(60)  # 60 FPS

pygame.quit()
sys.exit()
