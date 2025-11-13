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
			console.warn("⚠️ Skill chart not initialized yet");
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
		// Mevcut aktif sekmeyi kaldır - tab-btn class'ını kullan
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.classList.remove('active');
		});

		// Yeni aktif sekmeyi ayarla
		const activeBtn = document.querySelector(`[data-tab="${tabName}"]`) as HTMLElement | null;
		if (activeBtn) {
			activeBtn.classList.add('active');
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
		// fetch(`${API_BASE_URL}/auth/me`)
		// 	.then(res => res.json())
		// 	.then((user: User) => {
		// 		this.USERNAME = user.username;
		// 		return fetch(`${API_BASE_URL}/user-tournaments/${encodeURIComponent(this.USERNAME)}`);
		// 	})
		// 	.then(res => res.json())
		// 	.then((tournaments: Tournament[]) => {
		// 	tournaments.forEach(tr => {
		// 		const row = document.createElement('div');
		// 		row.classList.add('tournament-row');
		// 		row.innerHTML = `
		// 			<span>${tr.name}</span>
		// 			<span>${tr.start_date}</span>
		// 			<span>${tr.end_date}</span>
		// 			<span>${tr.total_matches}</span>
		// 		`;
		// 		row.dataset.players = JSON.stringify(tr.players);
		// 		this.table.appendChild(row);
		// 	});
		// 	});

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

// Profile.ts içine eklenecek fonksiyonlar

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
			console.log("Match history:", data);
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
		emptyRow.innerHTML = `<span data-i18n="profile.mhistory.nomatch">${translations?.profile?.mhistory?.nomatch || 'Henüz maç geçmişi bulunmuyor'}</span>`;
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
		const winText = translations?.profile?.mhistory?.win || 'Galibiyet';
		const loseText = translations?.profile?.mhistory?.lose || 'Mağlubiyet';

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
				<div class="match-result">${isWin ? 'W' : 'L'}</div>
				<div class="match-info">
					<span class="opponent">${opponentName}</span>
					<span class="score">${userScore}-${opponentScore}</span>
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
}

async function updateWinLossChart(wins: number, losses: number) {
	const winLossCtx = document.getElementById('winLossChart') as HTMLCanvasElement | null;

	if (!winLossCtx) {
		console.warn("⚠️ Win/Loss chart canvas not found");
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
		// Yeni chart oluştur (ManagerProfile içinde createWinLossChart çağrılacak)
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
		if (user?.achievements[attrib]?.unlockedAt)
		{
			card.classList.replace("locked", "unlocked");
			const date = card.querySelector(".achievement-date");
			if (date)
				date.textContent = user.achievements[attrib].unlockedAt;
		}
	});
}

async function onLoad() {
	const hasToken = getAuthToken();

	if (!hasToken) {
		console.warn("⚠️ No auth token found, redirecting to login");
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
				console.warn("⚠️ Token expired or invalid, redirecting to login");
				window.location.replace('/login');
			}
		}
	} catch (error) {
		console.error("❌ Error in onLoad:", error);
		window.location.replace('/login');
	}
}
