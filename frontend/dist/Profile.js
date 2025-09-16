var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import AView from "./AView.js";
function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
class ManagerProfile {
    constructor() {
        this.showcharts = {};
        this.chartData = {
            labelName: 'Kazanılan Maçlar',
            labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
            data: [3, 5, 2, 8, 6, 4, 7]
        };
        this.currentTab = 'overview';
        this.charts = {};
        // DOM yüklendikten sonra avatar-ring'i seç
        setTimeout(() => {
            this.avatarStatus = document.querySelector('.avatar-ring');
            if (!this.avatarStatus) {
                console.error("avatar-ring elemanı bulunamadı!");
            }
            else {
                this.initConnectionStatus(); // Bağlantı durumunu başlat
            }
            this.init();
        }, 100);
    }
    init() {
        // DOM yüklendikten sonra grafikleri oluştur
        setTimeout(() => {
            this.startAnimations();
            this.loadUserData();
            this.createPerformanceChart();
            this.createSkillRadarChart();
            this.createMonthlyChart();
            this.createWinLossChart();
        }, 100);
    }
    setAvatarStatus(status) {
        if (this.avatarStatus) {
            this.avatarStatus.classList.remove('online', 'offline'); // Eski sınıfı kaldır
            this.avatarStatus.classList.add(status); // Yeni sınıfı ekle
        }
    }
    initConnectionStatus() {
        this.setAvatarStatus(navigator.onLine ? 'online' : 'offline');
    }
    createPerformanceChart() {
        const perfCtx = document.getElementById('performanceChart');
        if (perfCtx) {
            this.showcharts.performance = new Chart(perfCtx, {
                type: 'line',
                data: {
                    labels: this.chartData.labels, // Haftalık günler
                    datasets: [{
                            label: this.chartData.labelName,
                            data: this.chartData.data, // Haftalık kazanılan maç sayıları
                            borderColor: getCSSVar('--color-primary'),
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4, // Cubic interpolation için
                            pointBackgroundColor: getCSSVar('--color-primary'),
                            pointBorderColor: getCSSVar('--color-text'),
                            pointBorderWidth: 2,
                            pointRadius: 6
                        }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: getCSSVar('--color-text'),
                                font: {
                                    family: 'Orbitron'
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: getCSSVar('--color-muted'),
                                font: {
                                    family: 'Orbitron'
                                }
                            },
                            grid: {
                                color: getCSSVar('--bg-overlay-light')
                            }
                        },
                        y: {
                            ticks: {
                                color: getCSSVar('--color-muted'),
                                font: {
                                    family: 'Orbitron'
                                }
                            },
                            grid: {
                                color: getCSSVar('--bg-overlay-light')
                            }
                        }
                    }
                }
            });
        }
    }
    createWinLossChart() {
        const winLossCtx = document.getElementById('winLossChart');
        if (!winLossCtx)
            return;
        const wins = parseInt(winLossCtx.dataset.wins || '0', 10);
        const losses = parseInt(winLossCtx.dataset.losses || '0', 10);
        // JSON string olan labels'ı diziye çevir
        let labels = ['Kazanılan', 'Kaybedilen']; // default fallback
        if (winLossCtx.dataset.labels) {
            labels = JSON.parse(winLossCtx.dataset.labels);
        }
        this.charts.winLoss = new Chart(winLossCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                        data: [wins, losses],
                        backgroundColor: [
                            getCSSVar('--color-success'),
                            getCSSVar('--color-important')
                        ],
                        borderColor: [
                            getCSSVar('--color-success'),
                            getCSSVar('--color-important')
                        ],
                        borderWidth: 3
                    }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: getCSSVar('--color-text'),
                            font: {
                                family: 'Orbitron'
                            }
                        }
                    }
                }
            }
        });
    }
    createSkillRadarChart() {
        const skillCtx = document.getElementById('skillRadar');
        if (!skillCtx)
            return;
        // HTML'den beceri verilerini oku
        const skillDataElement = document.getElementById('skill-data');
        if (!skillDataElement)
            return;
        // Gerekli veri alanlarını oku ve sayıya çevir
        const parseSkill = (key) => {
            const val = skillDataElement.getAttribute(`data-${key}`);
            return val ? parseFloat(val) : 0;
        };
        const skillValues = {
            hiz: parseSkill('hiz'),
            dogruluk: parseSkill('dogruluk'),
            savunma: parseSkill('savunma'),
            saldiri: parseSkill('saldiri'),
            strateji: parseSkill('strateji'),
            dayaniklilik: parseSkill('dayaniklilik')
        };
        this.charts.skill = new Chart(skillCtx, {
            type: 'radar',
            data: {
                labels: ['Hız', 'Doğruluk', 'Savunma', 'Saldırı', 'Strateji', 'Dayanıklılık'],
                datasets: [{
                        label: 'Beceri Puanı',
                        data: [
                            skillValues.hiz,
                            skillValues.dogruluk,
                            skillValues.savunma,
                            skillValues.saldiri,
                            skillValues.strateji,
                            skillValues.dayaniklilik
                        ],
                        borderColor: '#ff00ff',
                        backgroundColor: 'rgba(255, 0, 255, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#ff00ff',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: {
                                family: 'Orbitron'
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            display: true,
                            color: 'rgba(255, 255, 255, 0.9)',
                            backdropColor: 'transparent',
                            font: {
                                size: 10,
                                family: 'Orbitron'
                            }
                        },
                        grid: {
                            color: 'rgba(49, 48, 48, 0.5)',
                            lineWidth: 2,
                            circular: false
                        },
                        angleLines: {
                            color: 'rgba(49, 48, 48, 0.5)',
                            lineWidth: 2
                        },
                        pointLabels: {
                            color: getCSSVar('--color-primary'),
                            font: {
                                size: 10,
                                family: 'Orbitron'
                            }
                        }
                    }
                } // << Tip uyumsuzluğu hatalarını bastırır
            }
        });
    }
    createMonthlyChart() {
        const monthlyCtx = document.getElementById('monthlyChart');
        if (!monthlyCtx)
            return;
        this.charts.monthly = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'],
                datasets: [
                    {
                        label: 'Toplam Maç',
                        data: [15, 22, 18, 35, 28, 42, 38],
                        backgroundColor: 'rgba(0, 255, 255, 0.6)',
                        borderColor: '#00ffff',
                        borderWidth: 2,
                    },
                    {
                        label: 'Kazanılan Maç',
                        data: [12, 16, 14, 28, 21, 32, 28],
                        backgroundColor: 'rgba(0, 255, 0, 0.6)',
                        borderColor: '#00ff00',
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: {
                                family: 'Orbitron',
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#888',
                            font: {
                                family: 'Orbitron',
                            },
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                        },
                    },
                    y: {
                        ticks: {
                            color: '#888',
                            font: {
                                family: 'Orbitron',
                            },
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                        },
                    },
                }
            },
        });
    }
    updatePerformanceData(newData, newLabels) {
        const chart = this.showcharts.performance;
        if (chart && chart.data && Array.isArray(chart.data.datasets) && chart.data.datasets.length > 0) {
            chart.data.datasets[0].data = newData;
            if (newLabels && Array.isArray(newLabels)) {
                chart.data.labels = newLabels;
            }
            chart.update();
        }
    }
    switchTab(tabName) {
        console.log('Switching to tab:', tabName); // Debug için
        // Mevcut aktif sekmeyi kaldır - tab-btn class'ını kullan
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Yeni aktif sekmeyi ayarla
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            console.log('Active button set for:', tabName); // Debug için
        }
        else {
            console.log('Button not found for tab:', tabName); // Debug için
        }
        // Tüm tab içeriklerini gizle
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none'; // Ekstra güvenlik için
        });
        // Aktif tab içeriğini göster
        const activeTab = document.getElementById(tabName);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.display = 'block'; // Ekstra güvenlik için
            console.log('Active tab content set for:', tabName); // Debug için
        }
        else {
            console.log('Tab content not found for:', tabName); // Debug için
        }
        this.currentTab = tabName;
        // Charts refresh
        if (tabName === 'statistics') {
            setTimeout(() => {
                this.refreshCharts();
            }, 100);
        }
    }
    filterMatches(filterType, value) {
        const matchRows = document.querySelectorAll('.match-row:not(.header)');
        matchRows.forEach(row => {
            const rowElement = row;
            let show = true;
            if (filterType === 'result' && value !== 'all') {
                const result = rowElement.dataset.result;
                show = result === value;
            }
            rowElement.style.display = show ? 'grid' : 'none';
        });
    }
    animateLevelProgress() {
        var _a;
        const progressBar = document.querySelector('.level-progress');
        if (progressBar) {
            const targetWidth = (_a = progressBar.dataset.progress) !== null && _a !== void 0 ? _a : '75';
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.transition = 'width 2s ease-in-out';
                progressBar.style.width = `${targetWidth}%`;
            }, 500);
        }
    }
    refreshCharts() {
        Object.values(this.charts).forEach((chart) => {
            if (chart) {
                chart.resize();
                chart.update();
            }
        });
    }
    startAnimations() {
        this.animateCounters();
        this.animateStreak();
        this.animateAchievements();
    }
    animateCounters() {
        const counters = document.querySelectorAll('.stat-value');
        counters.forEach(counter => {
            var _a;
            const text = (_a = counter.textContent) !== null && _a !== void 0 ? _a : '';
            const target = parseInt(text.replace(/\D/g, ''));
            if (target > 0) {
                this.animateCounter(counter, target);
            }
        });
    }
    animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            var _a;
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            const suffix = ((_a = element.textContent) === null || _a === void 0 ? void 0 : _a.includes('%')) ? '%' : '';
            element.textContent = Math.floor(current) + suffix;
        }, 30);
    }
    animateStreak() {
        const streakNumber = document.querySelector('.streak-number');
        if (streakNumber) {
            setInterval(() => {
                streakNumber.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    streakNumber.style.transform = 'scale(1)';
                }, 200);
            }, 3000);
        }
    }
    animateAchievements() {
        const achievements = document.querySelectorAll('.achievement-card.unlocked');
        achievements.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            }, index * 200);
        });
    }
    loadUserData() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            setTimeout(() => {
                element.classList.remove('loading');
            }, Math.random() * 2000 + 1000);
        });
    }
    debugTabSwitch(tabName) {
        console.log('Debug tab switch called for:', tabName);
        this.switchTab(tabName);
    }
}
let profileManager;
function handleCardMouseMove(e) {
    const cards = document.querySelectorAll('.stat-card');
    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;
    const offsetX = (e.clientX - windowCenterX) / windowCenterX;
    const offsetY = (e.clientY - windowCenterY) / windowCenterY;
    const shadowX = offsetX * 10;
    const shadowY = offsetY * 10;
    cards.forEach(card => {
        card.style.boxShadow = `${-shadowX}px ${-shadowY}px 25px rgba(255,0,255,0.15), ${shadowX}px ${shadowY}px 15px rgba(0,255,255,0.25)`;
    });
}
function resetCardShadow() {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach(card => card.style.boxShadow = 'none');
}
// Event handler referansları (unset için)
function tabClickHandler(e) {
    const target = e.target;
    if (target.classList.contains('tab-btn') || target.closest('.tab-btn')) {
        e.preventDefault();
        const tabBtn = target.classList.contains('tab-btn') ? target : target.closest('.tab-btn');
        const tab = tabBtn === null || tabBtn === void 0 ? void 0 : tabBtn.dataset.tab;
        if (tab) {
            profileManager.switchTab(tab);
        }
    }
}
;
function timeFilterChangeHandler(e) {
    const target = e.target;
    profileManager.filterMatches('time', target.value);
}
;
function resultFilterChangeHandler(e) {
    const target = e.target;
    profileManager.filterMatches('result', target.value);
}
;
export default class extends AView {
    constructor() {
        super();
        this.onlineHandler = () => profileManager.setAvatarStatus('online');
        this.offlineHandler = () => profileManager.setAvatarStatus('offline');
        this.setTitle("Profile");
        profileManager = new ManagerProfile();
    }
    getHtml() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`templates/profile.html`);
            return yield response.text();
        });
    }
    setEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            document.addEventListener("mousemove", handleCardMouseMove);
            document.addEventListener("mouseout", resetCardShadow); // fare dışarı çıkınca gölgeyi sıfırlar
            // İnternet durumu event listener'ları
            profileManager.initConnectionStatus();
            window.addEventListener('online', this.onlineHandler);
            window.addEventListener('offline', this.offlineHandler);
            // Tab tıklamaları
            document.addEventListener('click', tabClickHandler);
            // Filtreler
            const timeFilter = document.getElementById('time-filter');
            const resultFilter = document.getElementById('result-filter');
            timeFilter === null || timeFilter === void 0 ? void 0 : timeFilter.addEventListener('change', timeFilterChangeHandler);
            resultFilter === null || resultFilter === void 0 ? void 0 : resultFilter.addEventListener('change', resultFilterChangeHandler);
            // Level progress animasyonu
            profileManager.animateLevelProgress();
        });
    }
    unsetEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            document.removeEventListener("mousemove", handleCardMouseMove);
            document.removeEventListener("mouseout", resetCardShadow);
            window.removeEventListener('online', this.onlineHandler);
            window.removeEventListener('offline', this.offlineHandler);
            document.removeEventListener('click', tabClickHandler);
            const timeFilter = document.getElementById('time-filter');
            const resultFilter = document.getElementById('result-filter');
            timeFilter === null || timeFilter === void 0 ? void 0 : timeFilter.removeEventListener('change', timeFilterChangeHandler);
            resultFilter === null || resultFilter === void 0 ? void 0 : resultFilter.removeEventListener('change', resultFilterChangeHandler);
        });
    }
    setStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "styles/profile.css";
            document.head.appendChild(link);
        });
    }
    unsetStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.querySelector("link[href='styles/profile.css']");
            if (link)
                document.head.removeChild(link);
        });
    }
}
//# sourceMappingURL=Profile.js.map