import pygame
import sys
import random
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

# Ekran boyutları
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Ping Pong vs AI - Zorluk Seçimi")

# Fontlar
font = pygame.font.SysFont("Arial", 30)
small_font = pygame.font.SysFont("Arial", 18)
big_font = pygame.font.SysFont("Arial", 40)

# Game states
MENU = 0
PLAYING = 1
game_state = MENU

# Zorluk seviyeleri
difficulties = ["easy", "medium", "hard", "impossible"]
difficulty_names = ["KOLAY", "ORTA", "ZOR", "İMKANSIZ"]
difficulty_colors = [GREEN, YELLOW, ORANGE, RED]
selected_difficulty = 1  # Default: medium

# Oyun değişkenleri
ai_player = None
ball_pos = [WIDTH // 2, HEIGHT // 2]
ball_radius = 10
ball_speed = [5, 3]
paddle_width, paddle_height = 10, 100
paddle_speed = 8
left_paddle = pygame.Rect(10, HEIGHT // 2 - paddle_height // 2, paddle_width, paddle_height)
right_paddle = pygame.Rect(WIDTH - 20, HEIGHT // 2 - paddle_height // 2, paddle_width, paddle_height)
left_score = 0
right_score = 0
prev_left_score = 0
prev_right_score = 0
clock = pygame.time.Clock()

def draw_menu():
    """Ana menüyü çiz"""
    screen.fill(BLACK)

    # Başlık
    title = big_font.render("PING PONG vs AI", True, WHITE)
    title_rect = title.get_rect(center=(WIDTH//2, 100))
    screen.blit(title, title_rect)

    # Zorluk seçimi başlığı
    subtitle = font.render("Zorluk Seviyesi Secin:", True, WHITE)
    subtitle_rect = subtitle.get_rect(center=(WIDTH//2, 200))
    screen.blit(subtitle, subtitle_rect)

    # Zorluk seviyeleri
    win_rates = ["AI %30 kazanir", "AI %50 kazanir", "AI %70 kazanir", "AI %90 kazanir"]

    for i, (diff_name, color, win_rate) in enumerate(zip(difficulty_names, difficulty_colors, win_rates)):
        y_pos = 280 + i * 50

        # Seçili olanı vurgula
        if i == selected_difficulty:
            pygame.draw.rect(screen, color, (WIDTH//2 - 200, y_pos - 20, 400, 40), 3)
            text_color = color
            rate_color = color
        else:
            text_color = GRAY
            rate_color = GRAY

        diff_text = font.render(f"{i+1}. {diff_name}", True, text_color)
        rate_text = small_font.render(f"({win_rate})", True, rate_color)

        screen.blit(diff_text, (WIDTH//2 - 180, y_pos))
        screen.blit(rate_text, (WIDTH//2 + 20, y_pos + 5))

    # Kontroller
    controls = [
        "1-4: Zorluk Secimi",
        "ENTER: Oyunu Baslat",
        "ESC: Cikis"
    ]

    for i, control in enumerate(controls):
        control_text = small_font.render(control, True, WHITE)
        screen.blit(control_text, (50, HEIGHT - 80 + i * 20))

    # Zorluk açıklamaları
    descriptions = [
        "AI cogu zaman kaybeder - Rahat oynayın!",
        "Dengeli mucadele - Esit sans",
        "AI cogunlukla kazanir - Zorlayici!",
        "AI neredeyse hep kazanir - Imkansiz!"
    ]

    desc_text = small_font.render(descriptions[selected_difficulty], True, difficulty_colors[selected_difficulty])
    desc_rect = desc_text.get_rect(center=(WIDTH//2, 500))
    screen.blit(desc_text, desc_rect)

def draw_game():
    """Oyunu çiz"""
    screen.fill(BLACK)

    # AI zone'larını görselleştir (sadece ai_player varsa)
    if ai_player and ball_speed[0] > 0:  # Top AI'ya gidiyorsa
        # Prepare zone (turuncu)
        prepare_line = WIDTH - ai_player.prepare_distance
        pygame.draw.line(screen, ORANGE, (prepare_line, 0), (prepare_line, HEIGHT), 2)

        # Freeze zone (kırmızı)
        freeze_line = WIDTH - ai_player.freeze_distance
        pygame.draw.line(screen, RED, (freeze_line, 0), (freeze_line, HEIGHT), 3)

    # Topu çiz
    pygame.draw.circle(screen, WHITE, ball_pos, ball_radius)

    # AI paddle durumuna göre renk
    paddle_color = RED
    if ai_player:
        if ai_player.should_lose_next:
            paddle_color = PINK  # Kasten kaybedecek
        elif ai_player.is_frozen:
            paddle_color = PURPLE  # Donmuş
        elif ai_player.target_locked:
            paddle_color = YELLOW  # Hedef kilitli

    # Raketleri çiz
    pygame.draw.rect(screen, BLUE, left_paddle)  # Human paddle
    pygame.draw.rect(screen, paddle_color, right_paddle)  # AI paddle

    # Orta çizgi
    for i in range(0, HEIGHT, 20):
        pygame.draw.rect(screen, WHITE, (WIDTH//2 - 2, i, 4, 10))

    # Skoru yazdır
    left_text = font.render(str(left_score), True, BLUE)
    right_text = font.render(str(right_score), True, RED)
    screen.blit(left_text, (WIDTH // 4, 20))
    screen.blit(right_text, (WIDTH * 3 // 4, 20))

    # Player labels ve AI durumu
    human_label = small_font.render("HUMAN", True, BLUE)

    if ai_player:
        # AI zorluk ve durum
        diff_info = ai_player.get_difficulty_info()
        stats = ai_player.get_stats()

        if stats['should_lose_next']:
            ai_status = f"AI ({diff_info['name']}) - SABOTAJ!"
            ai_color = PINK
        elif ai_player.is_frozen:
            ai_status = f"AI ({diff_info['name']}) - FROZEN"
            ai_color = PURPLE
        elif ai_player.target_locked:
            ai_status = f"AI ({diff_info['name']}) - LOCKED"
            ai_color = YELLOW
        else:
            ai_status = f"AI ({diff_info['name']}) - FREE"
            ai_color = difficulty_colors[selected_difficulty]

        ai_label = small_font.render(ai_status, True, ai_color)
        screen.blit(ai_label, (WIDTH * 3 // 4 - 100, 60))

        # AI istatistikleri
        info_texts = [
            f"Zorluk: {diff_info['name']} (Hedef: {diff_info['target_win_rate']})",
            f"Oyun: {stats['games']} | AI Kazanma: {stats['win_rate']:.1f}%",
            f"Ust Uste Kazanma: {stats['consecutive_wins']}",
            f"Vurus Orani: {stats['hit_rate']:.1f}%",
            f"Durum: {'SABOTAJ' if stats['should_lose_next'] else 'NORMAL'}"
        ]

        y_start = HEIGHT - 120
        for i, text in enumerate(info_texts):
            if i == 0:
                color = difficulty_colors[selected_difficulty]
            elif i == 1:
                # Kazanma oranını hedefle karşılaştır
                if abs(stats['win_rate'] - stats['target_win_rate']) < 10:
                    color = GREEN  # Hedefe yakın
                else:
                    color = WHITE
            elif i == 2 and stats['consecutive_wins'] >= 3:
                color = ORANGE  # Çok kazanıyor
            elif i == 4 and stats['should_lose_next']:
                color = PINK  # Sabotaj modu
            else:
                color = WHITE
            info_surface = small_font.render(text, True, color)
            screen.blit(info_surface, (10, y_start + i * 20))

    screen.blit(human_label, (WIDTH // 4 - 25, 60))

    # Kontroller ve açıklamalar
    controls = small_font.render("W/S: Hareket | ESC: Menu | R: Restart", True, WHITE)
    screen.blit(controls, (10, HEIGHT - 20))

    # Renk açıklamaları
    color_info = small_font.render("Pembe=Sabotaj | Mor=Donmus | Sari=Kilitli", True, WHITE)
    screen.blit(color_info, (WIDTH - 300, HEIGHT - 20))

def reset_ball():
    """Topu sıfırla"""
    global ball_pos, ball_speed
    ball_pos = [WIDTH // 2, HEIGHT // 2]
    direction_x = random.choice([-1, 1])
    direction_y = random.choice([-1, 1])
    ball_speed = [direction_x * random.randint(4, 6),
                  direction_y * random.randint(2, 4)]

def start_game():
    """Oyunu başlat"""
    global game_state, ai_player, left_score, right_score, prev_left_score, prev_right_score
    global left_paddle, right_paddle

    game_state = PLAYING
    ai_player = PingPongAI(difficulties[selected_difficulty])
    left_score = 0
    right_score = 0
    prev_left_score = 0
    prev_right_score = 0

    # Paddle pozisyonlarını sıfırla
    left_paddle.y = HEIGHT // 2 - paddle_height // 2
    right_paddle.y = HEIGHT // 2 - paddle_height // 2

    reset_ball()

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
                elif event.key == pygame.K_RETURN:
                    start_game()
                elif event.key == pygame.K_ESCAPE:
                    running = False

            elif game_state == PLAYING:
                if event.key == pygame.K_ESCAPE:
                    game_state = MENU
                elif event.key == pygame.K_r:
                    start_game()  # Restart

    # Oyun durumuna göre çizim
    if game_state == MENU:
        draw_menu()

    elif game_state == PLAYING and ai_player:
        keys = pygame.key.get_pressed()

        # Human player kontrolü
        if keys[pygame.K_w] and left_paddle.top > 0:
            left_paddle.y -= paddle_speed
        if keys[pygame.K_s] and left_paddle.bottom < HEIGHT:
            left_paddle.y += paddle_speed

        # AI hareket kararı
        scored_for_ai = (right_score > prev_right_score)
        scored_against_ai = (left_score > prev_left_score)

        ai_move = ai_player.get_move(
            ball_pos[0], ball_pos[1],
            ball_speed[0], ball_speed[1],
            right_paddle.y, paddle_height, HEIGHT,
            scored_for_ai, scored_against_ai
        )

        # AI paddle hareketi (zorluk seviyesine göre hız)
        ai_speed = int(paddle_speed * ai_player.paddle_speed_multiplier)
        if ai_move == 1 and right_paddle.bottom < HEIGHT:
            right_paddle.y += ai_speed
        elif ai_move == -1 and right_paddle.top > 0:
            right_paddle.y -= ai_speed

        # Skor takibi güncelle
        prev_left_score = left_score
        prev_right_score = right_score

        # Topu hareket ettir
        ball_pos[0] += ball_speed[0]
        ball_pos[1] += ball_speed[1]

        # Duvar kontrolü
        if ball_pos[1] - ball_radius <= 0 or ball_pos[1] + ball_radius >= HEIGHT:
            ball_speed[1] = -ball_speed[1]

        # Paddle çarpışma kontrolü
        ball_rect = pygame.Rect(ball_pos[0] - ball_radius, ball_pos[1] - ball_radius,
                               ball_radius * 2, ball_radius * 2)

        # Sol paddle (human)
        if ball_rect.colliderect(left_paddle) and ball_speed[0] < 0:
            ball_speed[0] = -ball_speed[0]
            paddle_center = left_paddle.y + paddle_height // 2
            hit_pos = (ball_pos[1] - paddle_center) / (paddle_height // 2)
            ball_speed[1] += hit_pos * 3

        # Sağ paddle (AI)
        if ball_rect.colliderect(right_paddle) and ball_speed[0] > 0:
            ball_speed[0] = -ball_speed[0]
            paddle_center = right_paddle.y + paddle_height // 2
            hit_pos = (ball_pos[1] - paddle_center) / (paddle_height // 2)
            ball_speed[1] += hit_pos * 3
            ai_player.update_performance(True)

        # Hız sınırlaması
        max_speed = 10
        ball_speed[0] = max(-max_speed, min(max_speed, ball_speed[0]))
        ball_speed[1] = max(-max_speed, min(max_speed, ball_speed[1]))

        # Skor kontrolü
        if ball_pos[0] < 0:  # AI kazandı
            right_score += 1
            reset_ball()

        if ball_pos[0] > WIDTH:  # Human kazandı
            left_score += 1
            ai_player.update_performance(False)
            reset_ball()

        draw_game()

    # Ekranı güncelle
    pygame.display.flip()
    clock.tick(60)

# Pygame'i kapat
pygame.quit()
sys.exit()
