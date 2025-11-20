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
		labels: ["Vuruşlar"],
		data1: [],
		data2: []
	};
	private skillChartData: { speed: number, accuracy: number, defence: number, attack: number, strategy: number, durability: number } = {
	speed: 0,
	accuracy: 0,
	defence: 0,
	attack: 0,
	strategy: 0,
	durability: 0
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

		// HTML'den veya data attribute'lerinden wins/losses al
		let wins = parseInt(winLossCtx.dataset.wins || '0', 10);
		let losses = parseInt(winLossCtx.dataset.losses || '0', 10);

		// Eğer hiç veri yoksa default değerleri kullan
		if (wins === 0 && losses === 0) {
			wins = 0;
			losses = 0;
		}

		const translations = await getJsTranslations(localStorage.getItem("langPref"));
		let labels: string[] = translations?.profile?.winloss?.labels ?? ['Won', 'Lost'];

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
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
								const percentage = ((value / total) * 100).toFixed(1);
								return `${label}: ${value} (${percentage}%)`;
							}
						}
					}
				}
			}
		});
	}

	public updateSkillChartData(stats: any): void {
		// Skill verilerini güncelle
		this.skillChartData = {
			speed: Math.min(100, stats.speed || 0),
			accuracy: Math.min(100, stats.accuracy || 0),
			defence: Math.min(100, stats.defence || 0),
			attack: Math.min(100, stats.attack || 0),
			strategy: Math.min(100, stats.endurance || 0),  // Strategy = Endurance
			durability: Math.min(100, stats.endurance || 0) // Durability = Endurance
		};

		// Chart'ı güncelle
		const chart = this.charts.skill;
		if (chart && chart.data && Array.isArray(chart.data.datasets) && chart.data.datasets.length > 0) {
			chart.data.datasets[0].data = [
				this.skillChartData.speed,
				this.skillChartData.accuracy,
				this.skillChartData.defence,
				this.skillChartData.attack,
				this.skillChartData.strategy,
				this.skillChartData.durability
			];
			chart.update();
		} else {
			console.log("⚠️ Skill chart not initialized yet");
		}
	}

	private async createSkillRadarChart(): Promise<void> {
		const skillCtx = document.getElementById('skillRadar') as HTMLCanvasElement | null;
		if (!skillCtx) return;

		const translations = await getJsTranslations(localStorage.getItem("langPref"));
		const skills = translations?.profile?.skills.labels ?? ["Speed", "Accuracy", "Defence", "Attack", "Strategy", "Durability"];
		const label = translations?.profile?.skills.label ?? 'Skills';

		this.charts.skill = new Chart(skillCtx, {
			type: 'radar',
			data: {
				labels: skills,
				datasets: [{
					label: label,
					data: [
						this.skillChartData.speed,
						this.skillChartData.accuracy,
						this.skillChartData.defence,
						this.skillChartData.attack,
						this.skillChartData.strategy,
						this.skillChartData.durability
					],
					borderColor: '#ff00ff',
					backgroundColor: 'rgba(255, 0, 255, 0.2)',
					borderWidth: 3,
					pointBackgroundColor: '#ff00ff',
					pointBorderColor: '#ffffff',
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						labels: {
							color: '#ffffff',
							font: {
								family: 'Orbitron',
								size: 12
							}
						}
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: '#ffffff',
						bodyColor: '#00ffff',
						borderColor: '#ff00ff',
						borderWidth: 1,
						callbacks: {
							label: function(context) {
								return `${context.label}: ${context.parsed.r.toFixed(1)}`;
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
								size: 11,
								family: 'Orbitron',
								weight: 'bold'
							},
							padding: 10
						}
					}
				} as any
			}
		});
	}

	public updateBallStats(ballHitCount: number, ballMissCount: number): void {
		const chart = this.charts.monthly;
		if (chart && chart.data && Array.isArray(chart.data.datasets) && chart.data.datasets.length >= 2) {
			// İlk dataset: Hit Count
			chart.data.datasets[0].data = [ballHitCount];
			// İkinci dataset: Miss Count
			chart.data.datasets[1].data = [ballMissCount];
			chart.update();
		}
	}

	private async createMonthlyChart(): Promise<void> {
		const monthlyCtx = document.getElementById('monthlyChart') as HTMLCanvasElement | null;
		if (!monthlyCtx) return;
		const translations = await getJsTranslations(localStorage.getItem("langPref"));

		const hitLabel = translations?.profile?.monthly?.hitCount ?? 'Topa Vurma Sayısı';
		const missLabel = translations?.profile?.monthly?.missCount ?? 'Iskalamalar';
		const Label = translations?.profile?.monthly?.label ?? 'Vuruşlar';

		this.charts.monthly = new Chart(monthlyCtx, {
			type: 'bar',
			data: {
				labels: [Label],
				datasets: [
					{
						label: hitLabel,
						data: [0],
						backgroundColor: 'rgba(0, 255, 255, 0.8)',
						borderColor: '#00ffff',
						borderWidth: 2,
						borderRadius: 5,
						barThickness: 40
					},
					{
						label: missLabel,
						data: [0],
						backgroundColor: 'rgba(255, 0, 0, 0.8)',
						borderColor: '#ff0000',
						borderWidth: 2,
						borderRadius: 5,
						barThickness: 40
					}
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						labels: {
							color: '#ffffff',
							font: { family: 'Orbitron' },
						},
					},
				},
				scales: {
					x: {
						ticks: {
							color: '#888',
							font: { family: 'Orbitron' },
						},
						grid: {
							color: 'rgba(255, 255, 255, 0.1)',
						},
					},
					y: {
						beginAtZero: true,
						ticks: {
							color: '#888',
							font: { family: 'Orbitron' },
						},
						grid: {
							color: 'rgba(255, 255, 255, 0.1)',
						},
					},
				},
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
		const hitLabel = translations?.profile?.monthly?.hitCount ?? 'Topa Vurma Sayısı';
		const missLabel = translations?.profile?.monthly?.missCount ?? 'İskalamalar';
		const chartTitle = translations?.profile?.monthly?.label ?? 'Vuruşlar';
		chart.data.labels = [chartTitle];
		chart.data.datasets[0].label = hitLabel;
		chart.data.datasets[1].label = missLabel;
		chart.update();

		chart = this.charts.winLoss;
		let labels: string[] = translations?.profile?.winloss?.labels ?? ['Won', 'Lost'];
		chart.data.labels = labels;
		chart.update();

		chart = this.charts.skill;
		const skills = translations?.profile?.skills.labels ?? ["Speed", "Accuracy", "Defence", "Attack", "Strategy", "Durability"];
		const label = translations?.profile?.skills.label ?? 'Skills';
		chart.data.labels = skills;
		chart.data.datasets[0].label = label;
		chart.update();
	}

	public switchTab(tabName: string): void {
		// Mevcut aktif sekmeyi kaldır - tab-btn class'ını kullan
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.classList.remove('active');
		});

		// Yeni aktif sekmeyi ayarla
		const activeBtn = document.querySelector(`[data-tab="${tabName}"]`) as HTMLElement | null;
		if (activeBtn) {
			activeBtn.classList.add('active');
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
				progressBar.style.width = `${Number(targetWidth) || 0}%`;
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
		this.switchTab(tabName);
	}
}

let profileManager: ManagerProfile;

export function updateTournamentLanguage() {
	const userName = document.querySelector('.username')?.textContent?.replace('@', '');
	if (userName) {
		populateTournamentHistory(userName);
	}
}

export function updateChartLanguage() {
	if (profileManager)
		profileManager.updateChartLanguage();
	refreshMatchHistory();
	updateTournamentLanguage();
	updateRecentMatchesLanguage();

	// Eğer overlay açıksa, içeriğini güncelle
	const matchOverlay = document.getElementById('match-overlay') as HTMLDivElement;
	if (matchOverlay && !matchOverlay.classList.contains('hide-away')) {
		const content = matchOverlay.querySelector('.match-overlay-content') as HTMLDivElement;
		if (content) {
			updateMatchOverlayLanguage(content);
		}
	}
}

// Overlay'deki çevirileri güncelle
async function updateMatchOverlayLanguage(content: HTMLDivElement) {
	const translations = await getJsTranslations(localStorage.getItem("langPref"));

	// Overlay'den matchIndex'i al
	const overlay = document.getElementById('match-overlay') as HTMLDivElement;
	const matchIndex = parseInt(overlay.dataset.currentMatchIndex || '0');

	// Overlay'i yeniden yükle (güncel çevirilerle)
	await showMatchDetails(matchIndex);
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

function handleMatchOverlay(e: Event) {
    const target = e.target as HTMLElement;
    const matchRow = target.closest(".match-row:not(.header)") as HTMLElement | null;

    if (!matchRow) return;

    const matchId = parseInt(matchRow.dataset.matchId || '0');
    showMatchDetails(matchId);
}

async function showMatchDetails(matchIndex: number) {
    try {
        const userName = document.querySelector('.username')?.textContent?.replace('@', '');
        if (!userName) return;

        const response = await fetch(`${API_BASE_URL}/profile/match-history?userName=${encodeURIComponent(userName)}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        const matches = data.matches || [];
        const match = matches[matchIndex];

        if (!match) return;

        // Çevirileri her seferinde al (dil değişikliğini yakala)
        const translations = await getJsTranslations(localStorage.getItem("langPref"));

        // Overlay'i doldur
        const overlay = document.getElementById('match-overlay') as HTMLDivElement;
        const content = overlay.querySelector('.match-overlay-content') as HTMLDivElement;

        // Kullanıcı bilgisi
        const isUserInTeamOne = match.teamOne?.PlayerOne?.userName === userName ||
                               match.teamOne?.PlayerTwo?.userName === userName;

        const userTeam = isUserInTeamOne ? match.teamOne : match.teamTwo;
        const opponentTeam = isUserInTeamOne ? match.teamTwo : match.teamOne;

        const userScore = isUserInTeamOne ? match.teamOneScore : match.teamTwoScore;
        const opponentScore = isUserInTeamOne ? match.teamTwoScore : match.teamOneScore;

        const isWin = match.winnerTeam &&
                     (match.winnerTeam.PlayerOne?.userName === userName ||
                      match.winnerTeam.PlayerTwo?.userName === userName);

        // Tarih ve saat
        const matchDate = new Date(match.matchStartDate);
        const dateStr = matchDate.toLocaleDateString('tr-TR');
        const timeStr = matchDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        content.querySelector('.match-date').textContent = dateStr;
        content.querySelector('.match-time').textContent = timeStr;

        // User team (Team One)
        const userTeamOneDiv = content.querySelector('.team-one');
        const userPlayersDiv = userTeamOneDiv.querySelector('.team-players') as HTMLDivElement;
        userPlayersDiv.innerHTML = '';

        if (userTeam?.PlayerOne) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span class="player-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/></svg></span>
                <span class="player-name">${userTeam.PlayerOne.displayName}</span>
            `;
            userPlayersDiv.appendChild(playerDiv);
        }

        if (userTeam?.PlayerTwo) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span class="player-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/></svg></span>
                <span class="player-name">${userTeam.PlayerTwo.displayName}</span>
            `;
            userPlayersDiv.appendChild(playerDiv);
        }

        userTeamOneDiv.querySelector('.score-value').textContent = userScore.toString();

        // Opponent team (Team Two)
        const opponentTeamDiv = content.querySelector('.team-two');
        const opponentPlayersDiv = opponentTeamDiv.querySelector('.team-players') as HTMLDivElement;
        opponentPlayersDiv.innerHTML = '';

        if (opponentTeam?.PlayerOne) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span class="player-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/></svg></span>
                <span class="player-name">${opponentTeam.PlayerOne.displayName}</span>
            `;
            opponentPlayersDiv.appendChild(playerDiv);
        }

        if (opponentTeam?.PlayerTwo) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span class="player-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/></svg></span>
                <span class="player-name">${opponentTeam.PlayerTwo.displayName}</span>
            `;
            opponentPlayersDiv.appendChild(playerDiv);
        }

        opponentTeamDiv.querySelector('.score-value').textContent = opponentScore.toString();

        // Result
        const resultBadge = content.querySelector('.result-badge') as HTMLDivElement;
        resultBadge.className = `result-badge ${isWin ? 'win' : 'loss'}`;

        // Çeviriden sonuç metni al
        const resultText = isWin ?
            (translations?.profile?.mhistory?.win || 'GALİBİYET') :
            (translations?.profile?.mhistory?.lose || 'MAĞLUBİYET');

        resultBadge.innerHTML = `
            <span class="result-text">${resultText}</span>
        `;

        // Overlay'e matchIndex'i data attribute olarak sakla
        overlay.dataset.currentMatchIndex = matchIndex.toString();

        // Stats
        const durationFormatted = formatDuration(match.matchDuration || 0);
        content.querySelector('.match-duration').textContent = durationFormatted;

        // Ball stats (matchState'den al)
        const userStats = match.matchState?.players?.find(p => p.id === userName);
        if (userStats) {
            content.querySelector('.ball-hit').textContent = (userStats.kickBall || 0).toString();
            content.querySelector('.ball-miss').textContent = (userStats.missedBall || 0).toString();
        }

        // Match Settings
        if (match.matchSettings) {
            const settings = match.matchSettings;
            content.querySelector('.ball-radius').textContent = settings.ballRadius?.toString() || '-';
            content.querySelector('.ball-speed').textContent = settings.ballSpeed?.toString() || '-';
            content.querySelector('.paddle-height').textContent = settings.paddleHeight?.toString() || '-';
            content.querySelector('.max-score').textContent = settings.maxScore?.toString() || '-';
        }

        // Overlay'i göster
        overlay.classList.remove('hide-away');

    } catch (error) {
        console.error("❌ Error showing match details:", error);
    }
}

function hideMatchOverlay() {
    const overlay = document.getElementById('match-overlay') as HTMLDivElement;
    overlay.classList.add('hide-away');
}

// API verilerini bracket formatına dönüştür
function convertTournamentDataToPlayers(tournament: any, currentUser: string): Player[] {
	const players: Player[] = [];

	if (!tournament.Rounds || tournament.Rounds.length === 0) {
		return players;
	}

	// Kazananın adını bul
	let winnerName = 'Unknown';
	if (tournament.winnerPlayer) {
		for (const round of tournament.Rounds) {
			if (!round.RoundMatches) continue;
			for (const match of round.RoundMatches) {
				if (match.playerOneID === tournament.winnerPlayer) {
					winnerName = match.playerOne?.displayName || 'Unknown';
					break;
				}
				if (match.playerTwoID === tournament.winnerPlayer) {
					winnerName = match.playerTwo?.displayName || 'Unknown';
					break;
				}
			}
			if (winnerName !== 'Unknown') break;
		}
	}

	// Her round'u işle
	tournament.Rounds.forEach((round: any, roundIndex: number) => {
		if (!round.RoundMatches || round.RoundMatches.length === 0) return;

		round.RoundMatches.forEach((match: any, matchIndex: number) => {
			// PlayerOne
			players.push({
				etap: roundIndex,
				kutu: matchIndex * 2 + 1,
				kazanan: match.winnerPlayerID === match.playerOneID ? true :
						 match.winnerPlayerID === match.playerTwoID ? false : null,
				skor: match.playerOneScore,
				text: match.playerOne?.displayName || 'Unknown'
			});

			// PlayerTwo
			players.push({
				etap: roundIndex,
				kutu: matchIndex * 2 + 2,
				kazanan: match.winnerPlayerID === match.playerTwoID ? true :
						 match.winnerPlayerID === match.playerOneID ? false : null,
				skor: match.playerTwoScore,
				text: match.playerTwo?.displayName || 'Unknown'
			});
		});
	});

	return players;
}

function initBracket(players: Player[], n: number, currentUser: string, turnuva: HTMLDivElement, wrapper: HTMLDivElement) {
	turnuva.innerHTML = '';
	turnuva.style.transform = 'none';

	const finalStageNumber = n - 1;

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
		if (!box) {
			return;
		}

		const isCurrentUser = item.text === currentUser;
		const isFinalStage = item.etap === finalStageNumber;
		const isFinalWinner = item.kazanan === true && isFinalStage;

		box.classList.remove('kazanan', 'kaybeden', 'kendi', 'devam', 'kazanan-son');

		if (isCurrentUser) {
			box.classList.add('kendi');
			if (item.kazanan === null) {
				box.innerHTML = `<span class="isim">${item.text}</span>`;
			} else {
				box.innerHTML = `<span class="isim">${item.text}</span><div class="ayirici"></div><span class="skor">${item.skor}</span>`;
			}
		}

		else if (isFinalWinner && finalStageNumber == n) {
			box.classList.add('kazanan-son');
			box.innerHTML = `<span class="isim">${item.text}</span>`;
		}

		else {
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
		}
	});

	const finalWinner = players.find(p => p.etap === finalStageNumber && p.kazanan === true);
	if (finalWinner && kutularArray[finalStageNumber + 1]?.[0]) {
	  const finalBox = kutularArray[finalStageNumber + 1][0];
	  finalBox.classList.add('kazanan-son');
	  finalBox.innerHTML = `<span class="isim">${finalWinner.text}</span>`;
	}

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
			if (e.key === "Escape") {
				hideMatchOverlay();
			}
			if (e.key === "Escape" && this.overlay.style.display === 'flex') {
				this.closeBtn.classList.add('close');
				setTimeout(() => {
					this.overlay.style.display = 'none';
					this.turnuva.innerHTML = '';
					this.closeBtn.classList.remove('close');
				}, 300);
			}
		});

		// Tournament satırı tıklaması
		const tournamentTable = document.querySelector('.tournament-table');
		tournamentTable?.addEventListener('click', (e: Event) => {
			const target = e.target as HTMLElement;
			const row = target.closest('.tournament-row:not(.header)') as HTMLElement;
			if (row) {
				const tournamentId = row.dataset.tournamentId;
				if (tournamentId) {
					openTournamentBracket(tournamentId);
				}
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

	async setFriendsEventHandlers() {
		document.addEventListener("mousemove", handleCardMouseMove);
		document.addEventListener("mouseout", resetCardShadow);

		// Tab tıklamaları
		document.addEventListener('click', tabClickHandler);

		// Filtreler
		const resultFilter = document.getElementById('result-filter');
		resultFilter?.addEventListener('change', resultFilterChangeHandler);

		const tournamentYearFilter = document.getElementById('tournament-year-filter');
		tournamentYearFilter?.addEventListener('change', tournamentYearFilterChangeHandler);

		// Level progress animasyonu
		profileManager.animateLevelProgress();
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

async function fetchMatchHistory(userName: string) {
	try {
		const response = await fetch(`${API_BASE_URL}/profile/match-history?userName=${encodeURIComponent(userName)}`, {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			}
		});

		if (response.ok) {
			const data = await response.json();
			return data.matches || [];
		} else {
			console.error("❌ Failed to fetch match history:", response.statusText);
			return [];
		}
	} catch (error) {
		console.error("❌ Error fetching match history:", error);
		return [];
	}
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const year = date.getFullYear();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${day}.${month}.${year} ${hours}:${minutes}`;
}

async function populateMatchHistory(userName: string) {
	const matchTable = document.querySelector('.match-table');
	if (!matchTable) return;

	const matches = await fetchMatchHistory(userName);

	// Mevcut satırları temizle (header hariç)
	const existingRows = matchTable.querySelectorAll('.match-row:not(.header)');
	existingRows.forEach(row => row.remove());

	if (matches.length === 0) {
		// Eğer maç yoksa bilgi mesajı göster
		const translations = await getJsTranslations(localStorage.getItem("langPref"));
		const emptyRow = document.createElement('div');
		emptyRow.className = 'match-row empty-state';
		emptyRow.style.gridColumn = '1 / -1';
		emptyRow.style.textAlign = 'center';
		emptyRow.style.padding = '2rem';
		const nomatchText = translations?.profile?.mhistory?.nomatch || 'Henüz maç geçmişi bulunmuyor';
		emptyRow.innerHTML = `<span>${nomatchText}</span>`;
		matchTable.appendChild(emptyRow);
		return;
	}

	// Çeviriyi bir kez al
	const translations = await getJsTranslations(localStorage.getItem("langPref"));
	const winText = translations?.profile?.mhistory?.win || 'Galibiyet';
	const loseText = translations?.profile?.mhistory?.lose || 'Mağlubiyet';

	// Her maç için satır oluştur
	matches.forEach((match: any, index: number) => {
		const isUserInTeamOne = match.teamOne.PlayerOne?.userName === userName ||
								match.teamOne.PlayerTwo?.userName === userName;

		const userTeam = isUserInTeamOne ? match.teamOne : match.teamTwo;
		const opponentTeam = isUserInTeamOne ? match.teamTwo : match.teamOne;

		const userScore = isUserInTeamOne ? match.teamOneScore : match.teamTwoScore;
		const opponentScore = isUserInTeamOne ? match.teamTwoScore : match.teamOneScore;

		const isWin = match.winnerTeam &&
					 (match.winnerTeam.PlayerOne?.userName === userName ||
					  match.winnerTeam.PlayerTwo?.userName === userName);

		// Rakip ismi (tek veya çift oyuncu)
		let opponentName = '';
		if (opponentTeam.PlayerOne && opponentTeam.PlayerTwo) {
			opponentName = `${opponentTeam.PlayerOne.displayName} & ${opponentTeam.PlayerTwo.displayName}`;
		} else if (opponentTeam.PlayerOne) {
			opponentName = opponentTeam.PlayerOne.displayName;
		} else if (opponentTeam.PlayerTwo) {
			opponentName = opponentTeam.PlayerTwo.displayName;
		}

		const durationFormatted = formatDuration(match.matchDuration || 0);

		const matchRow = document.createElement('div');
		matchRow.className = 'match-row';
		matchRow.dataset.result = isWin ? 'win' : 'loss';
		matchRow.dataset.matchId = index.toString();

		matchRow.innerHTML = `
			<span>${formatDate(match.matchStartDate)}</span>
			<span>${opponentName}</span>
			<span>${userScore}-${opponentScore}</span>
			<span>${durationFormatted}</span>
			<span class="result ${isWin ? 'win' : 'loss'}">${isWin ? winText : loseText}</span>
		`;

		matchTable.appendChild(matchRow);
	});
}

export function refreshMatchHistory() {
	const userName = document.querySelector('.username')?.textContent?.replace('@', '');
	if (userName) {
		populateMatchHistory(userName);
	}
}

async function updateRecentMatchesLanguage() {
	const userName = document.querySelector('.username')?.textContent?.replace('@', '');
	if (userName) {
		await populateRecentMatches(userName);
	}
}

async function populateRecentMatches(userName: string) {
	const matchesList = document.querySelector('.matches-list');
	if (!matchesList) return;

	try {
		// Match history'yi çek
		const response = await fetch(`${API_BASE_URL}/profile/match-history?userName=${encodeURIComponent(userName)}`, {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			}
		});

		if (!response.ok) {
			console.error("❌ Failed to fetch match history for recent matches");
			return;
		}

		const data = await response.json();
		const matches = data.matches || [];

		// Mevcut içeriği temizle
		matchesList.innerHTML = '';

		if (matches.length === 0) {
			const translations = await getJsTranslations(localStorage.getItem("langPref"));
			matchesList.innerHTML = `<p style="text-align: center; color: var(--color-muted);">${translations?.profile?.mhistory?.nomatch || 'Henüz maç geçmişi bulunmuyor'}</p>`;
			return;
		}

		// Son 4 maçı al
		const recentMatches = matches.slice(-4).reverse();

		// Çevirileri al
		const translations = await getJsTranslations(localStorage.getItem("langPref"));

		recentMatches.forEach((match: any) => {
			const isUserInTeamOne = match.teamOne?.PlayerOne?.userName === userName ||
									match.teamOne?.PlayerTwo?.userName === userName;

			const userScore = isUserInTeamOne ? match.teamOneScore : match.teamTwoScore;
			const opponentScore = isUserInTeamOne ? match.teamTwoScore : match.teamOneScore;

			const isWin = match.winnerTeam &&
						 (match.winnerTeam.PlayerOne?.userName === userName ||
						  match.winnerTeam.PlayerTwo?.userName === userName);

			// Rakip ismi
			const opponentTeam = isUserInTeamOne ? match.teamTwo : match.teamOne;
			let opponentName = '';
			if (opponentTeam?.PlayerOne && opponentTeam?.PlayerTwo) {
				opponentName = `${opponentTeam.PlayerOne.displayName} & ${opponentTeam.PlayerTwo.displayName}`;
			} else if (opponentTeam?.PlayerOne) {
				opponentName = opponentTeam.PlayerOne.displayName;
			} else if (opponentTeam?.PlayerTwo) {
				opponentName = opponentTeam.PlayerTwo.displayName;
			} else {
				opponentName = 'Unknown';
			}

			// Match item oluştur
			const matchItem = document.createElement('div');
			matchItem.className = `match-item ${isWin ? 'win' : 'loss'}`;
			matchItem.innerHTML = `
				<div class="match-result">${isWin ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM441 335C450.4 344.4 450.4 359.6 441 368.9C431.6 378.2 416.4 378.3 407.1 368.9L320.1 281.9L233.1 368.9C223.7 378.3 208.5 378.3 199.2 368.9C189.9 359.5 189.8 344.3 199.2 335L303 231C312.4 221.6 327.6 221.6 336.9 231L441 335z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64zM199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L319.9 358.1L406.9 271.1C416.3 261.7 431.5 261.7 440.8 271.1C450.1 280.5 450.2 295.7 440.8 305L337 409C327.6 418.4 312.4 418.4 303.1 409L199 305z"/></svg>'}</div>
				<div class="match-info">
					<div class="match-header">
						<span class="opponent">&nbsp;${opponentName}</span>
						<span class="score">${userScore}-${opponentScore}</span>
					</div>
				</div>
			`;

			matchesList.appendChild(matchItem);
		});

	} catch (error) {
		console.error("❌ Error fetching recent matches:", error);
	}
}

function formatDuration(seconds) {
	seconds = Math.floor(seconds);
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

async function setTextStats(user: any) {
	// Title Card
	document.querySelector(".user-title").textContent = user.profile.displayName;
	document.querySelector(".username").textContent = "@" + user.profile.userName;
	document.getElementById("level-value").textContent = user.stats.level;
	const levelProgress = document.querySelector(".level-progress") as HTMLElement;
	if (levelProgress && user.stats.progressRatio !== undefined) {
		const progressValue = Math.min(100, Math.max(0, user.stats.progressRatio));
		levelProgress.setAttribute("data-progress", progressValue.toString()); }
	document.getElementById("current-streak").textContent = user.stats.gameCurrentStreak;
	document.getElementById("total-games").textContent = user.stats.gamesPlayed;
	document.getElementById("win-rate").textContent = Math.round(user.stats.winRate) + "%";
	// Overview
	document.getElementById("mwon").textContent = user.stats.gamesWon;
	document.getElementById("mlost").textContent = user.stats.gamesLost;
	document.getElementById("mdur-average").textContent = formatDuration(user.stats.gameAverageDuration);
	document.getElementById("total-play-time").textContent = formatDuration(user.stats.gameTotalDuration);
	// Win Streak
	document.querySelector(".streak-number").textContent = user.stats.gameCurrentStreak;
	document.querySelector(".streak-value").textContent = user.stats.gameLongestStreak;
	// Last Matches
	await populateRecentMatches(user.profile.userName);
	// Detail Statictic
	document.getElementById("xp_point").textContent = (user.stats.xp || 0).toString();
	document.getElementById("hit_rate").textContent = Math.round(user.stats.hitRate) + "%";
	document.getElementById("mfastest").textContent = formatDuration(user.stats.fastestWinDuration);
	document.getElementById("mlongest").textContent = formatDuration(user.stats.longestMatchDuration);
}

async function updateWinLossChart(wins: number, losses: number) {
	const winLossCtx = document.getElementById('winLossChart') as HTMLCanvasElement | null;

	if (!winLossCtx) {
		console.log("⚠️ Win/Loss chart canvas not found");
		return;
	}

	// Canvas'a data attribute'lerini ayarla
	winLossCtx.dataset.wins = wins.toString();
	winLossCtx.dataset.losses = losses.toString();

	// Çeviriler al
	const translations = await getJsTranslations(localStorage.getItem("langPref"));
	const labels: string[] = translations?.profile?.winloss?.labels ?? ['Won', 'Lost'];

	// Chart'ı güncelle veya oluştur
	if (profileManager['charts'] && profileManager['charts'].winLoss) {
		// Mevcut chart'ı güncelle
		const chart = profileManager['charts'].winLoss;
		chart.data.datasets[0].data = [wins, losses];
		chart.data.labels = labels;
		chart.update();
	} else {
		console.log("Chart will be created by ManagerProfile");
	}
}

async function setChartStats(user: any) {
	// Haftalık performans verilerini al
	if (user?.stats?.lastSevenDaysMatches) {
		const matchesByDay = user.stats.lastSevenDaysMatches;

		// Son 7 günü sırayla al (bugünden 6 gün geriye)
		const labels: string[] = [];
		const data: number[] = [];
		const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD formatında
			const dayIndex = date.getDay(); // 0 = Pazar, 1 = Pazartesi, vb.

			// Pazartesi = 1, Pazar = 0 olduğu için düzelt
			const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
			labels.push(dayNames[adjustedDayIndex]);
			data.push(matchesByDay[dateKey] || 0);
		}

		// Grafiği güncelle
		profileManager.updatePerformanceData(data, labels);
	}

	// Win/Loss Chart verilerini güncelle
	if (user?.stats?.gamesWon !== undefined && user?.stats?.gamesLost !== undefined) {
		updateWinLossChart(user.stats.gamesWon, user.stats.gamesLost);
	}

	// Skill Radar verilerini güncelle
	if (user?.stats) {
		profileManager.updateSkillChartData(user.stats);
	}

	// Ball Hit/Miss verilerini güncelle (YENİ)
	if (user?.stats?.ballHitCount !== undefined && user?.stats?.ballMissCount !== undefined) {
		profileManager.updateBallStats(user.stats.ballHitCount, user.stats.ballMissCount);
	}
}

async function setAchievementStats(user: any) {
	const achievements = document.querySelectorAll('.achievement-card');

	achievements.forEach(card => {
		const attrib = card.getAttribute("data-achievement");
		if (user?.achievements[attrib]?.unlockedAt) {
			card.classList.replace("locked", "unlocked");
			const date = card.querySelector(".achievement-date");
			if (date) {
				// Tarihten sadece tarih kısmını al
				const unlockedDate = new Date(user.achievements[attrib].unlockedAt);
				const formattedDate = unlockedDate.toLocaleDateString('tr-TR'); // "14.11.2025" formatında
				date.textContent = formattedDate;
			}
		}
	});
}

// ==================== TOURNAMENT HISTORY FETCH ====================

async function fetchTournamentHistory(userName: string) {
	try {
		// Endpoint'i deneyin - hangisi çalışırsa onu kullanın
		let response = await fetch(
			`${API_BASE_URL}/profile/tournament-history?userName=${encodeURIComponent(userName)}`,
			{
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders()
				}
			}
		);

		// Eğer 404 ise alternatif endpoint'i deneyin
		if (response.status === 404) {
			response = await fetch(
				`${API_BASE_URL}/tournaments/user/${encodeURIComponent(userName)}`,
				{
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders()
					}
				}
			);
		}

		if (response.ok) {
			const data = await response.json();
			console.log("tournament history: ", data);
			return data.usersTournament || data.tournaments || [];
		} else {
			console.error("❌ Failed to fetch tournament history:", response.statusText);
			return [];
		}
	} catch (error) {
		console.error("❌ Error fetching tournament history:", error);
		return [];
	}
}

// ==================== TOURNAMENT TABLE POPULATE ====================

async function populateTournamentHistory(userName: string) {
	const tournamentTable = document.querySelector('.tournament-table');
	if (!tournamentTable) return;

	const tournaments = await fetchTournamentHistory(userName);

	// Mevcut satırları temizle (header hariç)
	const existingRows = tournamentTable.querySelectorAll('.tournament-row:not(.header)');
	existingRows.forEach(row => row.remove());

	const existingEmptyStates = tournamentTable.querySelectorAll('.empty-state');
	existingEmptyStates.forEach(row => row.remove());

	if (tournaments.length === 0) {
		const translations = await getJsTranslations(localStorage.getItem("langPref"));
		const emptyRow = document.createElement('div');
		emptyRow.className = 'match-row empty-state';
		emptyRow.style.gridColumn = '1 / -1';
		emptyRow.style.textAlign = 'center';
		emptyRow.style.padding = '2rem';
		emptyRow.innerHTML = `<span data-i18n="profile.thistory.nomatch">${translations?.profile?.thistory?.nomatch || 'Henüz turnuva geçmişi bulunmuyor'}</span>`;
		tournamentTable.appendChild(emptyRow);
		return;
	}

	const translations = await getJsTranslations(localStorage.getItem("langPref"));

	tournaments.forEach((tournament: any) => {
		const tournamentRow = document.createElement('div');
		tournamentRow.className = 'tournament-row';
		tournamentRow.dataset.tournamentId = tournament.id?.toString() || '';
		tournamentRow.dataset.start = tournament.TournamentStartDate || '';

		// Tüm turnuva verilerini data attribute'e kaydet
		tournamentRow.dataset.tournament = JSON.stringify(tournament);

		// Tarih ve saat formatla
		const startDate = new Date(tournament.TournamentStartDate || '');
		const endDate = new Date(tournament.TournamentEndDate || '');

		const startDateStr = startDate.toLocaleDateString('tr-TR');
		const startTimeStr = startDate.toLocaleTimeString('tr-TR', {
			hour: '2-digit',
			minute: '2-digit'
		});

		const endDateStr = endDate.toLocaleDateString('tr-TR');
		const endTimeStr = endDate.toLocaleTimeString('tr-TR', {
			hour: '2-digit',
			minute: '2-digit'
		});

		tournamentRow.innerHTML = `
			<span class="tournament-name">${tournament.name || 'Unnamed Tournament'}</span>
			<span class="tournament-date">${startDateStr} ${startTimeStr}</span>
			<span class="tournament-end-date">${endDateStr} ${endTimeStr}</span>
			<span class="tournament-matches">${tournament.Rounds?.length || 0}</span>
		`;

		tournamentTable.appendChild(tournamentRow);
	});
}

// ==================== TOURNAMENT FILTER ====================

export function filterTournamentsByYear(year: string) {
	const tourRows = document.querySelectorAll('.tournament-row:not(.header)');

	tourRows.forEach(row => {
		const rowElement = row as HTMLElement;
		let show = true;

		if (year !== 'all') {
			const startDate = rowElement.dataset.start;
			const rowYear = new Date(startDate).getFullYear().toString();
			show = rowYear === year;
		}

		rowElement.style.display = show ? 'grid' : 'none';
	});
}

// ==================== TOURNAMENT BRACKET MODAL ====================

function openTournamentBracket(tournamentId: string) {
	const overlay = document.getElementById('overlay') as HTMLDivElement;
	const turnuva = document.getElementById('turnuva') as HTMLDivElement;
	const wrapper = document.getElementById('turnuva-wrapper') as HTMLDivElement;

	if (!overlay || !turnuva || !wrapper) {
		console.error("❌ Tournament elements not found");
		return;
	}

	// Turnuva satırını bul
	const row = document.querySelector(`[data-tournament-id="${tournamentId}"]`) as HTMLElement;
	if (!row) {
		console.error("❌ Tournament row not found");
		return;
	}

	try {
		// API'den gelen turnuva verilerini al
		const tournamentData = JSON.parse(row.dataset.tournament || '{}');

		const userName = document.querySelector('.username')?.textContent?.replace('@', '') || '';

		// Verileri Player[] formatına dönüştür
		const players = convertTournamentDataToPlayers(tournamentData, userName);

		if (players.length === 0) {
			console.error("❌ No players found in tournament data");
			return;
		}

		// İlk tur oyuncu sayısından tur sayısını hesapla
		const firstRoundCount = players.filter(p => p.etap === 0).length;
		const n = Math.max(1, Math.ceil(Math.log2(Math.max(1, firstRoundCount))));

		overlay.style.display = 'flex';
		initBracket(players, n, userName, turnuva, wrapper);

	} catch (error) {
		console.error("❌ Error opening tournament bracket:", error);
	}
}

async function onLoad() {
	const hasToken = getAuthToken();

	if (!hasToken) {
		console.log("⚠️ No auth token found, redirecting to login");
		return window.location.replace('/login');
	}

	try {
		const getProfileDatas = await fetch(`${API_BASE_URL}/auth/me`, {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			}
		});

		if (getProfileDatas.ok) {
			const authData = await getProfileDatas.json();
			const userData = authData.user;
			const currentUserName = userData.username;

			const ProfileUsername = await fetch(
				`${API_BASE_URL}/profile/profile?userName=${currentUserName}`,
				{
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders()
					}
				}
			);

			if (ProfileUsername.ok) {
				const user = await ProfileUsername.json();
				console.log("All data:", user);

				setTextStats(user);
				await setChartStats(user);
				setAchievementStats(user);
				await populateMatchHistory(currentUserName);
				await populateTournamentHistory(currentUserName);

				setTimeout(() => {
					profileManager.animateLevelProgress();
				}, 100);
			} else {
				console.error("❌ Failed to fetch profile data:", ProfileUsername.statusText);
				if (ProfileUsername.status === 401) {
					window.location.replace('/login');
				}
			}
		} else {
			console.error("❌ Auth failed:", getProfileDatas.status, getProfileDatas.statusText);

			if (getProfileDatas.status === 401) {
				console.log("⚠️ Token expired or invalid, redirecting to login");
				window.location.replace('/login');
			}
		}
	} catch (error) {
		console.error("❌ Error in onLoad:", error);
		window.location.replace('/login');
	}
}

export async function onUserProfile(userName: string) {
	try {
		const userProfile = await fetch(`${API_BASE_URL}/profile/profile?userName=${userName}`);

		if (userProfile.ok) {
			const user = await userProfile.json();
			console.log("Friend Page user data:", user);

			setTextStats(user);
			await setChartStats(user);
			setAchievementStats(user);
			await populateMatchHistory(userName);
			await populateTournamentHistory(userName);

			setTimeout(() => {
				profileManager.animateLevelProgress();
			}, 100);
		} else {
			console.error("❌ Failed to fetch profile data:", userProfile.statusText);
		}
	} catch (error) {
		console.error("ERROR LOADING OVERLAY", error);
	}
}
