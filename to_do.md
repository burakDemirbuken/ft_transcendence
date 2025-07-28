1. “Kullanıcılara oyun istatistikleri hakkında bilgi sağlayan kullanıcı dostu panolar oluşturmak.”

Kullanılabilecek Veriler:
- [ ] Kullanıcı adı / ID
- [ ] Toplam oynanan oyun/maç sayısı
- [ ] Kazanılan maç sayısı
- [ ] Kaybedilen maç sayısı
- [ ] Kazanma oranı (%)
- [ ] Ortalama maç süresi
- [ ] Toplam oyun oynama süresi
- [ ] Ardışık galibiyetlerin sayısı (streak)
- [ ] Toplam puan

2. “Oyun oturumları için her maçın ayrıntılı istatistiklerini, sonuçlarını ve geçmiş verilerini gösteren ayrı bir gösterge tablosu geliştirin.”

Kullanılabilecek Veriler (her maç için):
- [ ] Maç ID
- [ ] Tarih ve saat
- [ ] Oyuncu 1 (ID, ad)
- [ ] Oyuncu 2 (ID, ad)
- [ ] Skor (örn: 11 - 9)
- [ ] Kazanan oyuncu
- [ ] Toplam süre
- [ ] Topa vurma sayısı (her kullanıcı için)
- [ ] Kaçıırılan top sayısı (her kullanıcı için)
- [ ] Zorluk seviyesi (bot ise)
- [ ] Oyuncu 1 vs Oyuncu 2 geçmiş maç sayısı ve skorları (head-to-head history)

3. “Gösterge tablolarının verileri izlemek ve analiz etmek için sezgisel ve bilgilendirici bir kullanıcı arayüzü sunduğundan emin olun.”

Kullanılabilecek Veriler:
- [ ] Kullanıcı seçim menüsü (drop-down) / açılır pencere ile oyuncu istatistiklerine erişim
- [ ] Tarih aralığı filtresi (örn: son 7 gün, son 30 gün, tüm zamanlar)
- [ ] Grafik filtreleri: “Sadece kazanılan maçlar”, “Yüksek skorlar”, “En uzun oyunlar” vb.
- [ ] Oturum başına detaylı analiz (skor, süre, performans)
- [ ] Hover ile bilgi kutuları (tooltip) → grafiklerdeki verilerin anlamları gösterir

4. “İstatistikleri açık ve görsel olarak çekici bir şekilde sunmak için çizelgeler ve grafikler gibi veri görselleştirme tekniklerini uygulayın.”

Kullanılabilecek Grafik Türleri & Veriler:
- [ ]📈 Çizgi Grafik (Line Chart):
	- [ ]Zamanla skor gelişimi
	- [ ]Günlük / haftalık performans (kazanılan maçlar)
- [ ]📊 Sütun Grafik (Bar Chart):
	- [ ]Oyuncu bazlı kazanılan/kaybedilen maç sayısı
	- [ ]En çok karşılaşılan rakipler
- [ ]🥧 Pasta Grafik (Pie Chart):
	- [ ]Kazanma/kaybetme oranları
- [ ]📌 Radar / Spider Grafiği:
	- [ ]Beceri puanı: isabet

5. “Kullanıcıların kendi oyun geçmişlerine ve performans ölçümlerine rahatça erişmelerine ve bunları keşfetmelerine olanak tanıyın.”

Kullanılabilecek Veriler:
- [ ] Son 10 maç listesi (tarih, rakip, skor, sonuç)
- [ ] Her maçın detayına tıklayıp grafiksel analiz görme
- [ ] En iyi ve en kötü maçlar
- [ ] Kişisel rekorlar: En kısa sürede kazanılan maç
- [ ] Gelişim grafiği: Zamanla kazanma oranı değişimi

6. “Faydalı olduğunu düşündüğünüz herhangi bir ölçütü eklemekten çekinmeyin.”

Eklenebilecek Ölçütler:
- [ ] “Revanş Sayısı” → aynı rakiple oynanan maç sayısı
- [ ] “Streak” Bilgisi → üst üste galibiyet veya mağlubiyet sayısı
- [ ] “Performans Puanı” (özelleştirilmiş skor; kazanma + süre + rakip zorluğu vs.) --> rakip zorluğu = 100 - (kaçırılan top sayısı / toplam topa vurma sayısı)
