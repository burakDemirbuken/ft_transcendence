### Çalıştırma Adımları

1. `ai_transcendence` klasörünün içine girin. Projenin son hali bu klasörün içindedir.
2. Klasör içerisinde `Makefile` olduğundan dolayı `make` yazıp ortamı kurabilirsiniz.
3. Başka bir terminal açıp `python test/client_test_1.py` dosyasını çalıştırın.
4. Örnek çıktı:
	```json
	(.venv) ➜  test git:(nisa) ✗ python client_test_1.py
	WebSocket sunucusuna bağlandı!
	Oyun başlatma verisi gönderildi: {"type": "init_game", "ai_config": {"difficulty": "hard"}}
	Oyun başlatma cevabı: {"type": "game_initialized", "game_id": "bb7df626", "ai_difficulty": "hard", "success": true}
	Oyun verisi gönderildi: {"type": "game_data", "ball": {"x": 600, "y": 250, "speed_x": 5, "speed_y": -3}, "paddle": {"ai_y": 200, "ai_speed_y": 0, "opponent_y": 300, "length": 80}, "game_area": {"width": 800, "height": 600}, "score": {"ai_score": 2, "human_score": 3, "ai_scored": false, "human_scored": true}}
	AI cevabı alındı: {"type": "ai_decision", "direction": "up", "game_id": "bb7df626"}
	AI kararı: up
	```

	- Açıklamalar:
		- oyun başlatma verisi : AI'ın zorluk derecesi bilgisini verir. Bu bilgi frontend'den alınacaktır. Oyun tarafı ile bir ilgisi yoktur.
		- oyun başlatma cevabı : AI'ı tekrar tekrar başlatmamak amacıyla oluşturulan bir game_id mevcut. Oyun trafından bu verinin gönderilmesi daha iyi olur.
		- oyun verisi          : oyundan alınacak saniyelik verilerdir.
		- AI'ın cevabı         : game_id ile birlikte gelir. type kısmı çıkartılabilir, mecburiyet değildir. game_id olması oyun kısmında işlenmesini kolaylaştırır. direction verisi `up`, `down`, `stable` olarak üç farklı çeşittedir.

<br></br>

### Oyun Başlatılmadan Önce Alınması Gereken Veriler

- `difficulty`(string)     : Zorluk seviyesi ("easy", "medium", "hard", "impossible", "custom")
- `custom_settings` (dict) : Custom zorluk için özel ayarlar (sadece difficulty="custom" ise)
	- `reaction_speed`       : 0-10 arası (int)
	- `prediction_accuracy`  : 0-10 arası (int)
	- `prepare_distance`     : 0-10 arası (int)
	- `freeze_distance`      : 0-10 arası (int)
	- `accuracy`             : 0-10 arası (int)
	- `learning_rate`        : 0-10 arası (int)
	- `target_win_rate`      : 0-10 arası (int)
	- `fairness`             : 0-10 arası (int)
	- `max_consecutive_wins` : AI'ın maksimum ardışık kazanma sayısı (int)
	- `rage_mode`            : Öfke modu aktif mi? (bool)
	- `fatigue_system`       : Yorgunluk sistemi aktif mi? (bool)
	- `focus_mode`           : Odaklanma modu aktif mi? (bool)
	- `adaptive_difficulty`  : Uyarlanabilir zorluk aktif mi? (bool)

<br></br>

### Oyundan Alınması Gereken Saniyelik Veriler

- Oyun bilgisi;
	- `game_id` : oyuna ait id (bu veri tutulursa ve her saniye gönderilirse ona göre AI seçimi yapabilirim. Her seferinde zorluk seviyesine göre AI oluşturmamak için gereklidir.)

- Top bilgileri;
	- `x`       : topun x koordinatı
	- `y`       : topun y koordinatı
	- `speed_x` : topun x ekseni hızı
	- `speed_y` : topun y ekseni hızı

- Paddle bilgileri;
	- `ai_y`       : AI paddle'ının y koordinatı
	- `ai_speed_y` : AI paddle'ının y ekseni hızı
	- `opponent_y` : rakip paddle'ının y koordinatı
	- `length`     : paddle uzunluğu

- Oyun alanı bilgileri;
	- `width`  : oyun alanının genişliği (bu veri sabit değer ise baştan koda işlenebilir)
	- `height` : oyun alanının yüksekliği (bu veri sabit değer ise baştan koda işlenebilir)

- Skor bilgileri;
	- `ai_score`     : AI'ın skoru
	- `human_score`  : kullanıcı oyuncunun skoru
	- `ai_scored`    : AI bu turda skor yaptı mı? (true/false)
	- `human_scored` : kullanıcı bu turda skor yaptı mı? (true/false)
