import { getAuthToken, getAuthHeaders } from './utils/auth.js';
import { getJsTranslations } from './I18n.js';
import { API_BASE_URL } from './index.js';
import AView from "./AView.js";
declare const Chart: any; // Global Chart.js nesnesini tanımlar

function getCSSVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

class ManagerProfile {
    private currentTab: string;
    private charts: Record<string, any>;
    private avatarStatus: HTMLElement;
    private showcharts: { performance?: any } = {};
    private perfChartData: { labelName: string, labels: string[], data: number[] } = {
		labelName: "Matches Won",
		labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: []
    };
    private monthChartData: { label0: string, label1: string, labels: string[], data1: number[], data2: number[] } = {
		label0: "Total Matches",
		label1: "Matches Won",
		labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data1: [],
        data2: []
    };

    constructor() {
        this.currentTab = 'overview';
        this.charts = {};
	    // DOM yüklendikten sonra avatar'ı seç
        setTimeout(() => {
            this.avatarStatus = document.querySelector('.avatar') as HTMLElement;
            if (!this.avatarStatus) {
                console.error("avatar elemanı bulunamadı!");
            } else {
                this.initConnectionStatus(); // Bağlantı durumunu başlat
            }
            this.init();
        }, 100);
    }

    private init(): void {
		// DOM yüklendikten sonra grafikleri oluştur
        setTimeout(() => {
            this.startAnimations();
            this.loadUserData();
            this.createPerformanceChart();
			this.createSkillRadarChart();
			this.createMonthlyChart();
			this.createWinLossChart();
			onLoad(); // Profile yüklendiğinde onLoad fonksiyonunu çağır
        }, 100);
    }

    public setAvatarStatus(status: 'online' | 'offline'): void {
        if (this.avatarStatus) {
            this.avatarStatus.classList.remove('online', 'offline'); // Eski sınıfı kaldır
            this.avatarStatus.classList.add(status); // Yeni sınıfı ekle
        }
    }

    public initConnectionStatus(): void {
        this.setAvatarStatus(navigator.onLine ? 'online' : 'offline');
    }

    private async createPerformanceChart(): Promise<void> {
        const perfCtx = document.getElementById('performanceChart') as HTMLCanvasElement;
        const translations = await getJsTranslations(localStorage.getItem("langPref"));

        this.perfChartData.labelName = translations?.profile?.weekly?.label ?? this.perfChartData.labelName;
        this.perfChartData.labels = translations?.profile?.weekly?.labels ?? this.perfChartData.labels;
        if (perfCtx) {
            this.showcharts.performance = new Chart(perfCtx, {
                type: 'line',
                data: {
                    labels: this.perfChartData.labels, // Haftalık günler
                    datasets: [{
                        label: this.perfChartData.labelName,
                        data: this.perfChartData.data, // Haftalık kazanılan maç sayıları
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

    private async createWinLossChart(): Promise<void> {
        const winLossCtx = document.getElementById('winLossChart') as HTMLCanvasElement | null;

        if (!winLossCtx) return;

        const wins = parseInt(winLossCtx.dataset.wins || '0', 10);
        const losses = parseInt(winLossCtx.dataset.losses || '0', 10);

        const translations = await getJsTranslations(localStorage.getItem("langPref"));
        let labels: string[] = translations?.profile?.winloss?.labels ?? ['Won', 'Lost']; // default fallback

        // BU NE İÇİN ??
        // JSON string olan labels'ı diziye çevir
		// if (winLossCtx.dataset.labels) {
        //     labels = JSON.parse(winLossCtx.dataset.labels);
        // }

        this.charts.winLoss = new Chart(winLossCtx, {
            type: 'doughnut',
            data: {
                labels: labels ?? ['Won', 'Lost'],
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

    private async createSkillRadarChart(): Promise<void> {
        const skillCtx = document.getElementById('skillRadar') as HTMLCanvasElement | null;
        if (!skillCtx) return;

        // HTML'den beceri verilerini oku
        const skillDataElement = document.getElementById('skill-data');
        if (!skillDataElement) return;

        // Gerekli veri alanlarını oku ve sayıya çevir
        const parseSkill = (key: string): number => {
            const val = skillDataElement.getAttribute(`data-${key}`);
            return val ? parseFloat(val) : 0;
        };

        const translations = await getJsTranslations(localStorage.getItem("langPref"));
        const skills = translations?.profile?.skills.labels ?? ["Speed", "Accuracy", "Defence", "Attack", "Strategy", "Durability"];
        const label = translations?.profile?.skills.label ?? 'Skills';

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
                labels: skills,
                datasets: [{
                    label: label,
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
                } as any // << Tip uyumsuzluğu hatalarını bastırır
            }
        });
    }

	private async createMonthlyChart(): Promise<void> {
		const monthlyCtx = document.getElementById('monthlyChart') as HTMLCanvasElement | null;
		if (!monthlyCtx) return;
        const translations = await getJsTranslations(localStorage.getItem("langPref"));

        this.monthChartData.label0 = translations?.profile?.monthly?.label0 ?? this.monthChartData.label0;
        this.monthChartData.label1 = translations?.profile?.monthly?.label1 ?? this.monthChartData.label1;
        this.monthChartData.labels = translations?.profile?.monthly?.labels ?? this.monthChartData.labels;

		this.charts.monthly = new Chart(monthlyCtx, {
			type: 'bar',
			data: {
				labels: this.monthChartData.labels,
				datasets: [
					{
						label: this.monthChartData.label0,
						data: [15, 22, 18, 35, 28, 42, 38],
						backgroundColor: 'rgba(0, 255, 255, 0.6)',
						borderColor: '#00ffff',
						borderWidth: 2,
					},
					{
						label: this.monthChartData.label1,
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
				} as any
			},
		});
	}

    public updatePerformanceData(newData: number[], newLabels?: string[]): void {
        const chart = this.showcharts.performance;
        if ( chart && chart.data && Array.isArray(chart.data.datasets) && chart.data.datasets.length > 0) {
            chart.data.datasets[0].data = newData;
            if (newLabels && Array.isArray(newLabels)) {
                chart.data.labels = newLabels;
            }
            chart.update();
        }
    }

    public async updateChartLanguage(): Promise<void> {
        const translations = await getJsTranslations(localStorage.getItem("langPref"));

        let chart = this.showcharts.performance;
        this.perfChartData.labelName = translations?.profile?.weekly?.label ?? this.perfChartData.labelName;
        this.perfChartData.labels = translations?.profile?.weekly?.labels ?? this.perfChartData.labels;


        chart.data.labels = this.perfChartData.labels;
        chart.data.datasets[0].label = this.perfChartData.labelName;
        chart.update();

        chart = this.charts.monthly;
        this.monthChartData.label0 = translations?.profile?.monthly?.label0 ?? this.monthChartData.label0;
        this.monthChartData.label1 = translations?.profile?.monthly?.label1 ?? this.monthChartData.label1;
        this.monthChartData.labels = translations?.profile?.monthly?.labels ?? this.monthChartData.labels;

        chart.data.labels = this.monthChartData.labels;
        chart.data.datasets[0].label = this.monthChartData.label0;
        chart.data.datasets[1].label = this.monthChartData.label1;
        chart.update();

		chart = this.charts.winLoss;
		let labels: string[] = translations?.profile?.winloss?.labels ?? ['Won', 'Lost'];
		chart.data.labels = labels;
		console.log(labels);
		chart.update();

		chart = this.charts.skill;
        const skills = translations?.profile?.skills.labels ?? ["Speed", "Accuracy", "Defence", "Attack", "Strategy", "Durability"];
        const label = translations?.profile?.skills.label ?? 'Skills';
		chart.data.labels = skills;
		chart.data.datasets[0].label = label;
		chart.update();
    }

    public switchTab(tabName: string): void {
        console.log('Switching to tab:', tabName); // Debug için

        // Mevcut aktif sekmeyi kaldır - tab-btn class'ını kullan
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Yeni aktif sekmeyi ayarla
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`) as HTMLElement | null;
        if (activeBtn) {
            activeBtn.classList.add('active');
            console.log('Active button set for:', tabName); // Debug için
        } else {
            console.log('Button not found for tab:', tabName); // Debug için
        }

        // Tüm tab içeriklerini gizle
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            (content as HTMLElement).style.display = 'none'; // Ekstra güvenlik için
        });

        // Aktif tab içeriğini göster
        const activeTab = document.getElementById(tabName) as HTMLElement | null;
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.display = 'block'; // Ekstra güvenlik için
            console.log('Active tab content set for:', tabName); // Debug için
        } else {
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

    public filterMatches(filterType: string, value: string): void {
        if (filterType === 'result')
        {
            const matchRows = document.querySelectorAll('.match-row:not(.header)');

            matchRows.forEach(row => {
                const rowElement = row as HTMLElement;
                let show = true;

                if (filterType === 'result' && value !== 'all') {
                    const result = rowElement.dataset.result;
                    show = result === value;
                }

                rowElement.style.display = show ? 'grid' : 'none';
            });
        } else if (filterType === 'tournamentYear') {
            const tourRows = document.querySelectorAll('.tournament-row:not(.header)');

            tourRows.forEach(row => {
                const rowElement = row as HTMLElement;
                let show = true;

                if (filterType === 'tournamentYear' && value !== 'all') {
                    const year = rowElement.dataset.start;
                    show = year.split('-')[0] === value;
                }

                rowElement.style.display = show ? 'grid' : 'none';
            });
        }
    }

    public animateLevelProgress(): void {
        const progressBar = document.querySelector('.level-progress') as HTMLElement | null;

        if (progressBar) {
            const targetWidth = progressBar.dataset.progress ?? '75';
            progressBar.style.width = '0%';

            setTimeout(() => {
                progressBar.style.transition = 'width 2s ease-in-out';
                progressBar.style.width = `${targetWidth}%`;
            }, 500);
        }
    }

    private refreshCharts(): void {
        Object.values(this.charts).forEach((chart: any) => {
            if (chart) {
                chart.resize();
                chart.update();
            }
        });
    }

    private startAnimations(): void {
        this.animateCounters();
        this.animateStreak();
        this.animateAchievements();
    }

    private animateCounters(): void {
        const counters = document.querySelectorAll<HTMLElement>('.stat-value');
        counters.forEach(counter => {
            const text = counter.textContent ?? '';
            const target = parseInt(text.replace(/\D/g, ''));
            if (target > 0) {
                this.animateCounter(counter, target);
            }
        });
    }

    private animateCounter(element: HTMLElement, target: number): void {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            const suffix = element.textContent?.includes('%') ? '%' : '';
            element.textContent = Math.floor(current) + suffix;
        }, 30);
    }

    private animateStreak(): void {
        const streakNumber = document.querySelector<HTMLElement>('.streak-number');
        if (streakNumber) {
            setInterval(() => {
                streakNumber.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    streakNumber.style.transform = 'scale(1)';
                }, 200);
            }, 3000);
        }
    }

    private animateAchievements(): void {
        const achievements = document.querySelectorAll<HTMLElement>('.achievement-card.unlocked');
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

    private loadUserData(): void {
        const loadingElements = document.querySelectorAll<HTMLElement>('.loading');
        loadingElements.forEach(element => {
            setTimeout(() => {
                element.classList.remove('loading');
            }, Math.random() * 2000 + 1000);
        });
    }

    public debugTabSwitch(tabName: string): void {
        console.log('Debug tab switch called for:', tabName);
        this.switchTab(tabName);
    }
}


let profileManager: ManagerProfile;

export function updateChartLanguage() {
    if (profileManager)
        profileManager.updateChartLanguage();
}

function handleCardMouseMove(e: MouseEvent) {
    const cards = document.querySelectorAll<HTMLElement>('.stat-card');
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
    const cards = document.querySelectorAll<HTMLElement>('.stat-card');
    cards.forEach(card => card.style.boxShadow = 'none');
}

// Event handler referansları (unset için)
function tabClickHandler (e: Event) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tab-btn') || target.closest('.tab-btn')) {
        e.preventDefault();
        const tabBtn = target.classList.contains('tab-btn') ? target : target.closest('.tab-btn') as HTMLElement;
        const tab = tabBtn?.dataset.tab;
        if (tab) {
            profileManager.switchTab(tab);
        }
    }
};

function timeFilterChangeHandler (e: Event) {
    const target = e.target as HTMLSelectElement;
    profileManager.filterMatches('time', target.value);
};

function resultFilterChangeHandler (e: Event) {
    const target = e.target as HTMLSelectElement;
    profileManager.filterMatches('result', target.value);
};

function tournamentYearFilterChangeHandler (e: Event) {
    const target = e.target as HTMLSelectElement;
    profileManager.filterMatches('tournamentYear', target.value);
};

interface Player {
  etap: number;
  kutu: number;
  kazanan: boolean | null;
  skor?: number;
  text: string;
}

interface Tournament {
  name: string;
  start_date: string;
  end_date: string;
  total_matches: number;
  players: Player[];
}

interface User {
  username: string;
}

function handleTournamentClick(e: MouseEvent, USERNAME: string, overlay: HTMLDivElement, turnuva: HTMLDivElement, wrapper: HTMLDivElement) {
  const target = e.target as HTMLElement;
  const row = target.closest('.tournament-row:not(.header)') as HTMLDivElement | null;
  if (!row) return;

  const players: Player[] = JSON.parse(row.dataset.players || '[]');
  const firstRoundCount = players.filter(p => Number(p.etap) === 0).length;
  const n = Math.max(1, Math.ceil(Math.log2(Math.max(1, firstRoundCount))));

  overlay.style.display = 'flex';
  initBracket(players, n, USERNAME, turnuva, wrapper);
}

function handleOverlayClick(e: MouseEvent, overlay: HTMLDivElement, turnuva: HTMLDivElement) {
  const target = e.target as HTMLElement;
  if (target.id === 'overlay') {
    overlay.style.display = 'none';
    turnuva.innerHTML = '';
  }
}

function handleMatchOverlay(e) {
    if (e.target.classList.contains("match-row") || e.target.closest(".match-row"))
        document.querySelector('#match-overlay').classList.remove("hide-away");

    const matchdetails = document.querySelector('.match-card');
    console.log(matchdetails);
    matchdetails.innerHTML = `
        <h2 class="match-details-title">Match Details</h2>
        <div class="match-details-info">
            <span class="">Date: 2024-10-05</span>
            <span class="">Duration: 4.23 mins</span>
            <span class="">Score: 11</span>
        </div>
        <div class="players-comp">
            <div class="match-player">
                <h3>You</h3>
                <span class="player-result">winner</span>
                <span class="player-score">11</span>
            </div>
            <div class="match-player">
                <h3>Opponent</h3>
                <span class="player-result">loser</span>
                <span class="player-score">10</span>
            </div>
        </div>
    `;
    console.log("Hayyayayayay");
}

function hideMatchOverlay() {
    document.querySelector('#match-overlay').classList.add("hide-away");
}

function initBracket(players: Player[], n: number, currentUser: string, turnuva: HTMLDivElement, wrapper: HTMLDivElement) {
    turnuva.innerHTML = '';
    turnuva.style.transform = 'none';

    const etapGap = 150;
    const kutularArray: HTMLDivElement[][] = [];
    const kutuHeight = 50;
    const gapInMatch = 40;
    const gapBetweenMatch = 100;

    function createKutu(text = '', skor: number | null = null, left = 0, top = 0): HTMLDivElement {
      const kutu = document.createElement('div');
      kutu.classList.add('kutu');
      kutu.style.left = left + 'px';
      kutu.style.top = top + 'px';
      if (text) {
        const isimSpan = document.createElement('span');
        isimSpan.classList.add('isim');
        isimSpan.textContent = text;
        kutu.appendChild(isimSpan);
      }
      if (skor !== null) {
        const ayirici = document.createElement('div');
        ayirici.classList.add('ayirici');
        const skorSpan = document.createElement('span');
        skorSpan.classList.add('skor');
        skorSpan.textContent = skor.toString();
        kutu.appendChild(ayirici);
        kutu.appendChild(skorSpan);
      }
      return kutu;
    }

    // 1. etap kutuları
    kutularArray[0] = [];
    let currentTop = 0;
    const firstStageCount = Math.pow(2, n);
    for (let i = 0; i < firstStageCount; i++) {
      const kutu = createKutu('', null, 0, currentTop);
      turnuva.appendChild(kutu);
      kutularArray[0].push(kutu);
      currentTop += kutuHeight + (i % 2 === 1 ? gapBetweenMatch : gapInMatch);
    }

    // Diğer etaplar
    for (let etap = 1; etap <= n; etap++) {
      const prevStage = kutularArray[etap - 1];
      const count = prevStage.length / 2;
      kutularArray[etap] = [];

      for (let i = 0; i < count; i++) {
        const rect1 = prevStage[i * 2].getBoundingClientRect();
        const rect2 = prevStage[i * 2 + 1].getBoundingClientRect();
        const turnuvaRect = turnuva.getBoundingClientRect();

        const middleY = (rect1.top + rect2.bottom) / 2 - turnuvaRect.top;
        const kutu = createKutu('', null, etap * etapGap, middleY - kutuHeight / 2);
        turnuva.appendChild(kutu);
        kutularArray[etap].push(kutu);

        // çizgiler
        const vLine = document.createElement('div');
        vLine.classList.add('line');
        vLine.style.width = '2px';
        vLine.style.height = (rect2.top - rect1.bottom) + 'px';
        vLine.style.left = (rect1.left + rect1.width / 2 - turnuvaRect.left) + 'px';
        vLine.style.top = (rect1.bottom - turnuvaRect.top) + 'px';
        turnuva.appendChild(vLine);

        const hLine = document.createElement('div');
        hLine.classList.add('line');
        const vMid = rect1.bottom + (rect2.top - rect1.bottom) / 2;
        const leftStart = rect1.left + rect1.width / 2;
        const leftEnd = rect1.left + etapGap;
        hLine.style.width = (leftEnd - leftStart) + 'px';
        hLine.style.height = '2px';
        hLine.style.left = (leftStart - turnuvaRect.left) + 'px';
        hLine.style.top = (vMid - turnuvaRect.top) + 'px';
        turnuva.appendChild(hLine);

        const shortVLine = document.createElement('div');
        shortVLine.classList.add('line');
        shortVLine.style.width = '2px';
        shortVLine.style.height = (middleY - vMid) + 'px';
        shortVLine.style.left = (leftEnd - turnuvaRect.left) + 'px';
        shortVLine.style.top = (vMid - turnuvaRect.top) + 'px';
        turnuva.appendChild(shortVLine);
      }
    }

    const userBoxes = players.filter(p => p.text === currentUser);
    const lastStage = userBoxes.length ? Math.max(...userBoxes.map(p => p.etap)) : -1;

    players.forEach(item => {
      const box = kutularArray[item.etap]?.[item.kutu - 1];
      if (!box) return;

      const isCurrentUser = item.text === currentUser;
      const isFinalStage = item.etap === n;

      if (item.kazanan === null) {
        box.classList.add('devam');
        box.innerHTML = `<span class="isim">${item.text}</span>`;
      } else if (item.kazanan) {
        box.classList.add('kazanan');
        box.innerHTML = `<span class="isim">${item.text}</span><div class="ayirici"></div><span class="skor">${item.skor}</span>`;
      } else {
        box.classList.add('kaybeden');
        box.innerHTML = `<span class="isim">${item.text}</span><div class="ayirici"></div><span class="skor">${item.skor}</span>`;
      }

      if (isCurrentUser) {
        if (isFinalStage) {
          box.classList.add('kazanan-son');
          box.classList.remove('kendi');
        } else if (item.etap === lastStage) {
          box.classList.add('kendi');
        }
      }
    });

    setTimeout(() => {
      const wrapperWidth = wrapper.clientWidth;
      const turnuvaWidth = turnuva.scrollWidth;
      const scaleX = wrapperWidth / turnuvaWidth;
      const scale = Math.min(scaleX, 1);

      const translateX = wrapperWidth / 15 - (turnuvaWidth * scale) / 2;
      const translateY = 0;

      turnuva.style.transformOrigin = 'top left';
      turnuva.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }, 50);
}

export default class extends AView {
	 private USERNAME: string | null = null;
    // turnuva ile ilgili DOM referansları
    private overlay!: HTMLDivElement;
    private table!: HTMLDivElement;
    private closeBtn!: HTMLDivElement;
    private wrapper!: HTMLDivElement;
    private turnuva!: HTMLDivElement;

    constructor() {
		super();
        this.setTitle("Profile");
		this.USERNAME = "test_user";
		profileManager = new ManagerProfile();
    }

    async getHtml(): Promise<string> {
        const response = await fetch(`templates/profile.html`);
        return await response.text();
    }

    private onlineHandler = () => profileManager.setAvatarStatus('online');
    private offlineHandler = () => profileManager.setAvatarStatus('offline');

    async setEventHandlers() {
        document.addEventListener("onload", onLoad);
        document.addEventListener("mousemove", handleCardMouseMove);
        document.addEventListener("mouseout", resetCardShadow); // fare dışarı çıkınca gölgeyi sıfırlar

        // İnternet durumu event listener'ları
        profileManager.initConnectionStatus();
        window.addEventListener('online', this.onlineHandler);
        window.addEventListener('offline', this.offlineHandler);

        // Tab tıklamaları
        document.addEventListener('click', tabClickHandler);

        // Filtreler
        const resultFilter = document.getElementById('result-filter');
        resultFilter?.addEventListener('change', resultFilterChangeHandler);

        const tournamentYearFilter = document.getElementById('tournament-year-filter');
        tournamentYearFilter?.addEventListener('change', tournamentYearFilterChangeHandler);

        // Level progress animasyonu
        profileManager.animateLevelProgress();
        // ==================== Turnuva elementleri ====================
        this.overlay = document.getElementById('overlay') as HTMLDivElement;
        this.table = document.getElementById('tournament-table') as HTMLDivElement;
        this.closeBtn = document.getElementById('close-btn') as HTMLDivElement;
        this.wrapper = document.getElementById('turnuva-wrapper') as HTMLDivElement;
        this.turnuva = document.getElementById('turnuva') as HTMLDivElement;

        // Kullanıcıyı fetch et
        fetch(`${API_BASE_URL}/auth/me`)
          .then(res => res.json())
          .then((user: User) => {
            this.USERNAME = user.username;
            return fetch(`${API_BASE_URL}/user-tournaments/${encodeURIComponent(this.USERNAME)}`);
          })
          .then(res => res.json())
          .then((tournaments: Tournament[]) => {
            tournaments.forEach(tr => {
              const row = document.createElement('div');
              row.classList.add('tournament-row');
              row.innerHTML = `
                <span>${tr.name}</span>
                <span>${tr.start_date}</span>
                <span>${tr.end_date}</span>
                <span>${tr.total_matches}</span>
              `;
              row.dataset.players = JSON.stringify(tr.players);
              this.table.appendChild(row);
            });
          });

        // Event delegation
        this.table.addEventListener('click', (e) => {
          if (!this.USERNAME) return;
          handleTournamentClick(e, this.USERNAME, this.overlay, this.turnuva, this.wrapper);
        });

        this.overlay.addEventListener('click', (e) => handleOverlayClick(e, this.overlay, this.turnuva));

        this.closeBtn.addEventListener('click', () => {
          this.closeBtn.classList.add('close');
          setTimeout(() => {
            this.overlay.style.display = 'none';
            this.turnuva.innerHTML = '';
            this.closeBtn.classList.remove('close');
          }, 300);
        });

        document.querySelector(".match-table")?.addEventListener('click', handleMatchOverlay);
        document.querySelector("#match-card-exit")?.addEventListener('click', hideMatchOverlay);

        document.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === "Escape" && this.overlay.style.display === 'flex') {
            this.closeBtn.classList.add('close');
            setTimeout(() => {
              this.overlay.style.display = 'none';
              this.turnuva.innerHTML = '';
              this.closeBtn.classList.remove('close');
            }, 300);
          }
        });
    }

    async unsetEventHandlers() {
        document.removeEventListener("mousemove", handleCardMouseMove);
        document.removeEventListener("mouseout", resetCardShadow);

        window.removeEventListener('online', this.onlineHandler);
        window.removeEventListener('offline', this.offlineHandler);

        document.removeEventListener('click', tabClickHandler);

        const resultFilter = document.getElementById('result-filter');
        resultFilter?.removeEventListener('change', resultFilterChangeHandler);

        const tournamentYearFilter = document.getElementById('tournament-year-filter');
        tournamentYearFilter?.removeEventListener('change', tournamentYearFilterChangeHandler);

        // Turnuva ile ilgili eventleri de kaldır
        this.table?.replaceChildren(); // satırları temizle
        this.overlay?.removeEventListener('click', (e) => handleOverlayClick(e, this.overlay, this.turnuva));
        this.closeBtn?.removeEventListener('click', () => {});
        document.removeEventListener('keydown', () => {});
    }

    async setStylesheet() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "styles/profile.css";
        document.head.appendChild(link);
    }

    async unsetStylesheet() {
        const link = document.querySelector("link[href='styles/profile.css']");
        if (link) document.head.removeChild(link);
    }
}


// Cookie'leri parse etmek için yardımcı fonksiyon
function parseCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (document.cookie) {
        document.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = decodeURIComponent(value);
            }
        });
    }
    return cookies;
}

async function setTextStats(user: any) {
    // Title Card
    document.querySelector(".user-title").textContent = user.profile.displayName;
    document.querySelector(".username").textContent = "@" + user.profile.userName;
    // Overview
    document.getElementById("mwon").textContent = user.stats.gamesWon;
    document.getElementById("mlost").textContent = user.stats.gamesLost;
    document.getElementById("mdur-average").textContent = `${user.stats.gameTotalDuration / user.stats.gamesPlayed || 0}`;
    document.getElementById("total-play-time").textContent = user.stats.gameTotalDuration;
    // Win Streak
    document.querySelector(".streak-number").textContent = user.stats.gameCurrentStreak;
    document.querySelector(".streak-value").textContent = user.stats.gameLongestStreak;
}

async function setChartStats(user: any) {
}

async function setAchievementStats(user: any) {
	const achievements = document.querySelectorAll('.achievement-card');

	achievements.forEach(card => {
		const attrib = card.getAttribute("data-achievement");
		if (user?.achievements[attrib]?.unlockedAt)
		{
			card.classList.replace("locked", "unlocked");
			const date = card.querySelector(".achievement-date");
			if (date)
				date.textContent = user.achievements[attrib].unlockedAt;
		}
	});
}

async function onLoad()
{
    const hasToken = getAuthToken();

    if (!hasToken) {
        return window.location.replace('/login');
    }
    try
    {


        const getProfileDatas = await fetch(`${API_BASE_URL}/auth/me`,
        {
            credentials: 'include',
            headers:
            {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });

        if (getProfileDatas.ok)
        {
            const userData = await getProfileDatas.json();

            const ProfileUsername = await fetch(`${API_BASE_URL}/profile/profile?userName=${userData.user.username}`,
            {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });

            if (ProfileUsername.ok)
            {
                const user = await ProfileUsername.json();
                console.log(user);
                setTextStats(user);
                setChartStats(user);
                setAchievementStats(user);
            }
            else
                console.error("❌ Failed to fetch profile data:", ProfileUsername.statusText);
        }
        else
        {
            if (getProfileDatas.status === 401) {
                window.location.replace('/login');
            }
        }
    } catch (error) {
        window.location.replace('/login');
    }
}