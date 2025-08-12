//  >>> npm list chart.js
//                └── chart.js@2.9.4

interface Friend {
    id: number;
    name: string;
    avatar: string;
    online: boolean;
}

function getCSSVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

class ManagerProfile {
    private currentTab: string;
    private charts: Record<string, any>;
    private avatarStatus: HTMLElement;
    private showcharts: { performance?: Chart } = {}; // Chart.js nesnelerini saklamak için
    private chartData: { labelName: string, labels: string[], data: number[] } = {
        labelName: 'Kazanılan Maçlar',
        labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        data: [3, 5, 2, 8, 6, 4, 7]
    };

    constructor() {
        this.currentTab = 'overview';
        this.charts = {};
        this.avatarStatus = document.querySelector('.avatar-ring') as HTMLElement;
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.startAnimations();
        this.loadUserData();
        this.monitorConnectionStatus();
        this.setupGlobalCardShadowEffect();

        this.createPerformanceChart();
        this.createSkillRadarChart();
        this.createMonthlyChart();
        this.createWinLossChart();
    }

    private setupGlobalCardShadowEffect(): void {
        const cards = document.querySelectorAll<HTMLElement>('.stat-card');

        document.addEventListener('mousemove', (e) => {
            const windowCenterX = window.innerWidth / 2;
            const windowCenterY = window.innerHeight / 2;

            const offsetX = (e.clientX - windowCenterX) / windowCenterX;
            const offsetY = (e.clientY - windowCenterY) / windowCenterY;

            const shadowX = offsetX * 10; // gölge yönü
            const shadowY = offsetY * 10;

            cards.forEach((card) => {
                card.style.boxShadow = `${-shadowX}px ${-shadowY}px 25px rgba(255, 0, 255, 0.15), ${shadowX}px ${shadowY}px 15px rgba(0, 255, 255, 0.25)`;
            });
        });

        document.addEventListener('mouseleave', () => {
            cards.forEach((card) => {
                card.style.boxShadow = 'none';
            });
        });
    }

    // Avatar durumunu ayarlayan fonksiyon
    private setAvatarStatus(status: 'online' | 'offline'): void {
        if (this.avatarStatus) {
            this.avatarStatus.classList.remove('online', 'offline'); // Eski sınıfı kaldır
            this.avatarStatus.classList.add(status); // Yeni sınıfı ekle
        }
    }

    // Gerçek internet durumunu kontrol eden fonksiyon
    private monitorConnectionStatus(): void {
        // İlk başta durumu kontrol et
        this.setAvatarStatus(navigator.onLine ? 'online' : 'offline');

        // Tarayıcı internet bağlantısı değişince güncelle
        window.addEventListener('online', () => this.setAvatarStatus('online'));
        window.addEventListener('offline', () => this.setAvatarStatus('offline'));
    }

    // private createMonthlyChart(): void {
	// 	const monthlyCtx = document.getElementById('monthlyChart') as HTMLCanvasElement | null;
	// 	if (!monthlyCtx) return;

	// 	this.charts.monthly = new Chart(monthlyCtx, {
	// 		type: 'bar',
	// 		data: {
	// 			labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'],
	// 			datasets: [
	// 				{
	// 					label: 'Toplam Maç',
	// 					data: [15, 22, 18, 35, 28, 42, 38],
	// 					backgroundColor: 'rgba(0, 255, 255, 0.6)',
	// 					borderColor: '#00ffff',
	// 					borderWidth: 2,
	// 				},
	// 				{
	// 					label: 'Kazanılan Maç',
	// 					data: [12, 16, 14, 28, 21, 32, 28],
	// 					backgroundColor: 'rgba(0, 255, 0, 0.6)',
	// 					borderColor: '#00ff00',
	// 					borderWidth: 2,
	// 				},
	// 			],
	// 		},
	// 		options: {
	// 			responsive: true,
	// 			plugins: {
	// 				legend: {
	// 					labels: {
	// 						color: '#ffffff',
	// 						font: {
	// 							family: 'Orbitron',
	// 						},
	// 					},
	// 				},
	// 			},
	// 			scales: {
	// 				x: {
	// 					ticks: {
	// 						color: '#888',
	// 						font: {
	// 							family: 'Orbitron',
	// 						},
	// 					},
	// 					grid: {
	// 						color: 'rgba(255, 255, 255, 0.1)',
	// 					},
	// 				},
	// 				y: {
	// 					ticks: {
	// 						color: '#888',
	// 						font: {
	// 							family: 'Orbitron',
	// 						},
	// 					},
	// 					grid: {
	// 						color: 'rgba(255, 255, 255, 0.1)',
	// 					},
	// 				},
	// 			},
	// 		},
	// 	});
	// }

	// private createWinLossChart(): void {
	// 	const winLossCtx = document.getElementById('winLossChart') as HTMLCanvasElement | null;

	// 	if (!winLossCtx) return;

	// 	const wins = parseInt(winLossCtx.dataset.wins || '0', 10);
	// 	const losses = parseInt(winLossCtx.dataset.losses || '0', 10);

	// 	// JSON string olan labels'ı diziye çevir
	// 	let labels: string[] = ['Kazanılan', 'Kaybedilen']; // default fallback
	// 	if (winLossCtx.dataset.labels) {
	// 		labels = JSON.parse(winLossCtx.dataset.labels);
	// 	}

	// 	this.charts.winLoss = new Chart(winLossCtx, {
	// 		type: 'doughnut',
	// 		data: {
	// 			labels: labels,
	// 			datasets: [{
	// 				data: [wins, losses],
	// 				backgroundColor: [
	// 					getCSSVar('--color-success'),
	// 					getCSSVar('--color-important')
	// 				],
	// 				borderColor: [
	// 					getCSSVar('--color-success'),
	// 					getCSSVar('--color-important')
	// 				],
	// 				borderWidth: 3
	// 			}]
	// 		},
	// 		options: {
	// 			responsive: true,
	// 			plugins: {
	// 				legend: {
	// 					labels: {
	// 						color: getCSSVar('--color-text'),
	// 						font: {
	// 							family: 'Orbitron'
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	});
	// }

	// private createSkillRadarChart(): void {
	// 	const skillCtx = document.getElementById('skillRadar') as HTMLCanvasElement | null;
	// 	if (!skillCtx) return;

	// 	// HTML'den beceri verilerini oku
	// 	const skillDataElement = document.getElementById('skill-data');
	// 	if (!skillDataElement) return;

	// 	// Gerekli veri alanlarını oku ve sayıya çevir
	// 	const parseSkill = (key: string): number => {
	// 		const val = skillDataElement.getAttribute(`data-${key}`);
	// 		return val ? parseFloat(val) : 0;
	// 	};

	// 	const skillValues = {
	// 		hiz: parseSkill('hiz'),
	// 		dogruluk: parseSkill('dogruluk'),
	// 		savunma: parseSkill('savunma'),
	// 		saldiri: parseSkill('saldiri'),
	// 		strateji: parseSkill('strateji'),
	// 		dayaniklilik: parseSkill('dayaniklilik')
	// 	};

	// 	this.charts.skill = new Chart(skillCtx, {
	// 		type: 'radar',
	// 		data: {
	// 			labels: ['Hız', 'Doğruluk', 'Savunma', 'Saldırı', 'Strateji', 'Dayanıklılık'],
	// 			datasets: [{
	// 				label: 'Beceri Puanı',
	// 				data: [
	// 					skillValues.hiz,
	// 					skillValues.dogruluk,
	// 					skillValues.savunma,
	// 					skillValues.saldiri,
	// 					skillValues.strateji,
	// 					skillValues.dayaniklilik
	// 				],
	// 				borderColor: '#ff00ff',
	// 				backgroundColor: 'rgba(255, 0, 255, 0.2)',
	// 				borderWidth: 3,
	// 				pointBackgroundColor: '#ff00ff',
	// 				pointBorderColor: '#ffffff',
	// 				pointBorderWidth: 2
	// 			}]
	// 		},
	// 		options: {
	// 			responsive: true,
	// 			plugins: {
	// 				legend: {
	// 					labels: {
	// 						color: '#ffffff',
	// 						font: {
	// 							family: 'Orbitron'
	// 						}
	// 					}
	// 				}
	// 			},
	// 			scales: {
	// 				r: {
	// 					beginAtZero: true,
	// 					min: 0,
	// 					max: 100,
	// 					ticks: {
	// 						stepSize: 10,
	// 						display: true,
	// 						color: 'rgba(255, 255, 255, 0.9)',
	// 						backdropColor: 'transparent',
	// 						font: {
	// 							size: 8
	// 						}
	// 					},
	// 					grid: {
	// 						color: 'rgba(255, 255, 255, 0.2)',
	// 						lineWidth: 2,
	// 						circular: false
	// 					},
	// 					angleLines: {
	// 						color: 'rgba(255, 255, 255, 0.2)',
	// 						lineWidth: 2
	// 					},
	// 					pointLabels: {
	// 						color: '#00ffff',
	// 						font: {
	// 							size: 8,
	// 							family: 'Orbitron'
	// 						}
	// 					}
	// 				}
	// 			} as any // << Tip uyumsuzluğu hatalarını bastırır
	// 		}
	// 	});
	// }


    // Haftalık performans tablosunu oluşturan fonksiyon
    private createPerformanceChart(): void {
        const perfCtx = document.getElementById('performanceChart') as HTMLCanvasElement;
        if (perfCtx) {
            this.showcharts.performance = new Chart(perfCtx, {
                type: 'line',
                data: {
                    labels: this.chartData.labels, // Haftalık günler
                    datasets: [{
                        label: this.chartData.labelName,
                        data: this.chartData.data, // Haftalık kazanılan maç sayıları
                        borderColor: getCSSVar('--color-primary'),
                        backgroundColor: getCSSVar('--bg-radial'),
                        borderWidth: 3,
                        fill: true,
                        cubicInterpolationMode: 'monotone', // tension:0.4 yerine kullanılır
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
                        xAxes: [{
                            ticks: {
                                fontColor: getCSSVar('--color-muted'),
                                fontFamily: 'Orbitron'
                            },
                            gridLines: {
                                color: getCSSVar('--bg-overlay-light')
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                fontColor: getCSSVar('--color-muted'),
                                fontFamily: 'Orbitron'
                            },
                            gridLines: {
                                color: getCSSVar('--bg-overlay-light')
                            }
                        }]
                    }
                }
            });
        }
    }

    private createWinLossChart(): void {
        const winLossCtx = document.getElementById('winLossChart') as HTMLCanvasElement | null;

        if (!winLossCtx) return;

        const wins = parseInt(winLossCtx.dataset.wins || '0', 10);
        const losses = parseInt(winLossCtx.dataset.losses || '0', 10);

        // JSON string olan labels'ı diziye çevir
        let labels: string[] = ['Kazanılan', 'Kaybedilen']; // default fallback
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

    private createSkillRadarChart(): void {
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
                } as any // << Tip uyumsuzluğu hatalarını bastırır
            }
        });
    }

	private createMonthlyChart(): void {
		const monthlyCtx = document.getElementById('monthlyChart') as HTMLCanvasElement | null;
		if (!monthlyCtx) return;

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
				} as any
			},
		});
	}

    // Haftalık performans verilerini güncelleyen fonksiyon
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

    private setupEventListeners(): void {
        // Tab navigation - Doğru class adı: tab-btn
        document.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;

            // Tab button kontrolü - tab-btn class'ını arıyoruz
            if (target.classList.contains('tab-btn') || target.closest('.tab-btn')) {
                e.preventDefault();
                const tabBtn = target.classList.contains('tab-btn') ? target : target.closest('.tab-btn') as HTMLElement;
                const tab = tabBtn?.dataset.tab;
                if (tab) {
                    console.log('Tab switching to:', tab); // Debug için
                    this.switchTab(tab);
                }
                return;
            }
        });

        // Match filters
        const timeFilter = document.getElementById('time-filter') as HTMLSelectElement | null;
        timeFilter?.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            this.filterMatches('time', target.value);
        });

        const resultFilter = document.getElementById('result-filter') as HTMLSelectElement | null;
        resultFilter?.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            this.filterMatches('result', target.value);
        });

        // FAB button
        const newGameBtn = document.getElementById('new-game-btn') as HTMLButtonElement | null;
        newGameBtn?.addEventListener('click', () => {
            this.startNewGame();
        });

        // Level progress animation
        this.animateLevelProgress();
    }

    private switchTab(tabName: string): void {
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

    private filterMatches(filterType: string, value: string): void {
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
    }

    private startNewGame(): void {
        this.showNotification('Yeni oyun başlatılıyor... 🏓', 'info');

        setTimeout(() => {
            this.showNotification('Rakip aranıyor... 🔍', 'info');
        }, 1000);

        setTimeout(() => {
            this.showNotification('Rakip bulundu! Oyun başlıyor! 🎮', 'success');
        }, 3000);
    }

    private animateLevelProgress(): void {
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

    private showNotification(message: string, type: 'info' | 'success' = 'info'): void {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        if (type === 'success') {
            notification.style.borderColor = '#00ff00';
            notification.style.color = '#00ff00';
            notification.style.background = 'rgba(0, 255, 0, 0.1)';
        }

        // Notification styling
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '10px';
        notification.style.border = '2px solid #00ffff';
        notification.style.background = 'rgba(0, 255, 255, 0.1)';
        notification.style.color = '#00ffff';
        notification.style.fontFamily = 'Orbitron, monospace';
        notification.style.zIndex = '9999';
        notification.style.animation = 'slideIn 0.3s ease';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
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

    // Public method - debugging için
    public debugTabSwitch(tabName: string): void {
        console.log('Debug tab switch called for:', tabName);
        this.switchTab(tabName);
    }

    public async fetchFriends(): Promise<Friend[]> {
        try {
            // API'den SQLite verisini çekecek istek
            const response = await fetch("/api/friends");
            if (!response.ok) throw new Error("Arkadaş listesi alınamadı");

            const data: Friend[] = await response.json();
            return data;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    public renderFriends(friends: Friend[]): void {
        const container = document.getElementById("friends-list");
        if (!container) return;

        container.innerHTML = ""; // Temizle

        friends.forEach(friend => {
            const card = document.createElement("div");
            card.className = "friend-card";

            const statusColor = friend.online ? "limegreen" : "gray";

            card.innerHTML = `
                <img src="${friend.avatar}" alt="${friend.name}">
                <div class="friend-name">${friend.name}</div>
                <div style="width:10px;height:10px;border-radius:50%;background:${statusColor};margin:5px auto;"></div>
            `;

            container.appendChild(card);
        });
    }
}

// Global değişken debugging için
let profileManager: ManagerProfile;

// document.addEventListener('DOMContentLoaded', () => {
//     profileManager = new ManagerProfile();

//     // Performans verilerini HTML'den al
//     const performanceCanvas = document.getElementById('performanceChart') as HTMLCanvasElement | null;
//     if (performanceCanvas) {
//         const labels = performanceCanvas.dataset.labels
//             ? JSON.parse(performanceCanvas.dataset.labels)
//             : [];

//         const values = performanceCanvas.dataset.values
//             ? JSON.parse(performanceCanvas.dataset.values)
//             : [];

//         profileManager.updatePerformanceData(values, labels);
//     }

//     // Debug: Mevcut tab buttonları kontrol et
//     console.log('Available tab buttons:', document.querySelectorAll('.tab-btn'));
//     console.log('Available tab contents:', document.querySelectorAll('.tab-content'));
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const tabButtons = document.querySelectorAll<HTMLButtonElement>(".tab-btn");

//   tabButtons.forEach((button) => {
//     button.addEventListener("click", () => {
//       button.classList.remove("animate-glow");

//       // Reflow tetikleyerek animasyonu sıfırla
//       void button.offsetWidth;

//       button.classList.add("animate-glow");

//       // Animasyonun bitiminde sınıfı kaldır (isteğe bağlı)
//       setTimeout(() => {
//         button.classList.remove("animate-glow");
//       }, 600); // animasyon süresiyle aynı olmalı
//     });
//   });
// });


// Sayfa yüklendiğinde çalıştırma
// document.addEventListener("DOMContentLoaded", async () => {
//     const friends = await this.fetchFriends();
//     this.renderFriends(friends);
// });

document.addEventListener("DOMContentLoaded", async () => {
    // Profil yöneticisini başlat
    profileManager = new ManagerProfile();

    // Performans verilerini HTML dataset'ten al
    const performanceCanvas = document.getElementById('performanceChart') as HTMLCanvasElement | null;
    if (performanceCanvas) {
        const labels = performanceCanvas.dataset.labels
            ? JSON.parse(performanceCanvas.dataset.labels)
            : [];

        const values = performanceCanvas.dataset.values
            ? JSON.parse(performanceCanvas.dataset.values)
            : [];

        profileManager.updatePerformanceData(values, labels);
    }

    // Sekme butonları animasyon efekti
    const tabButtons = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            button.classList.remove("animate-glow");
            void button.offsetWidth; // Reflow
            button.classList.add("animate-glow");
            setTimeout(() => button.classList.remove("animate-glow"), 600);
        });
    });

    // Arkadaş listesini veritabanından çek (ileride API/SQLite bağlanacak)
    try {
        const friends = await profileManager.fetchFriends(); // ManagerProfile içine koyabiliriz
        profileManager.renderFriends(friends);
    } catch (err) {
        console.error("Arkadaş listesi alınamadı:", err);
    }
});

// Turnuva detaylarını göster/gizle
document.querySelectorAll<HTMLButtonElement>('.view-details-btn').forEach(button => {
    button.addEventListener('click', function (this: HTMLButtonElement) {
        const detailsSection = this.nextElementSibling as HTMLElement | null;
        if (!detailsSection) return;

        const isVisible = detailsSection.style.display === 'block';

        // Detayları göster/gizle
        detailsSection.style.display = isVisible ? 'none' : 'block';

        // Buton metnini güncelle
        this.innerHTML = isVisible
            ? '<i class="fa-solid fa-chevron-down"></i> Detayları Göster'
            : '<i class="fa-solid fa-chevron-up"></i> Detayları Gizle';
    });
});

// Turnuva filtreleme
function filterTournaments(): void {
    const yearFilter = (document.getElementById('tournament-year-filter') as HTMLSelectElement)?.value ?? 'all';
    const typeFilter = (document.getElementById('tournament-type-filter') as HTMLSelectElement)?.value ?? 'all';

    document.querySelectorAll<HTMLElement>('.tournament-card').forEach(card => {
        const year = card.getAttribute('data-year');
        const type = card.getAttribute('data-type');

        const yearMatch = yearFilter === 'all' || year === yearFilter;
        const typeMatch = typeFilter === 'all' || type === typeFilter;

        card.style.display = yearMatch && typeMatch ? 'block' : 'none';
    });
}

// Filtre değişikliklerini dinle
(document.getElementById('tournament-year-filter') as HTMLSelectElement | null)
    ?.addEventListener('change', filterTournaments);
(document.getElementById('tournament-type-filter') as HTMLSelectElement | null)
    ?.addEventListener('change', filterTournaments);



// import { Chart, ChartConfiguration } from 'chart.js';

// // Window’a özel Chart referansları ekleyelim
// declare global {
//     interface Window {
//         pointsChart?: Chart;
//         shotChart?: Chart;
//     }
// }

// // Maç veri tipleri
// interface MatchStats {
//     yourAces: number;
//     opponentAces: number;
//     yourWinners: number;
//     opponentWinners: number;
//     yourErrors: number;
//     opponentErrors: number;
//     yourRallies: number;
//     opponentRallies: number;
// }

// interface ChartDataSet {
//     labels: string[];
//     you: number[];
//     opponent: number[];
// }

// interface MatchData {
//     opponent: string;
//     yourScore: number;
//     opponentScore: number;
//     date: string;
//     duration: string;
//     location: string;
//     stats: MatchStats;
//     analysis: string;
//     tips: string[];
//     pointsData: ChartDataSet;
//     shotData: ChartDataSet;
// }

// // Vuruş noktası tipi
// interface HitPoint {
//     x: number;
//     y: number;
//     win: boolean;
//     description: string;
// }

// document.addEventListener('DOMContentLoaded', () => {
//     const matchData: Record<number, MatchData> = {
//         1: { /* ... senin 1. maç verilerin buraya aynen gelecek */ } as MatchData,
//         2: { /* ... 2. maç verileri */ } as MatchData,
//         3: { /* ... 3. maç verileri */ } as MatchData,
//         4: { /* ... 4. maç verileri */ } as MatchData,
//     };

//     // Analiz butonları
//     document.querySelectorAll<HTMLButtonElement>('.match-analysis-btn').forEach(button => {
//         button.addEventListener('click', function (this: HTMLButtonElement) {
//             const matchId = this.getAttribute('data-match-id');
//             if (matchId) openMatchAnalysis(parseInt(matchId, 10));
//         });
//     });

//     // Popup kapatma
//     document.querySelector<HTMLButtonElement>('.popup-close')?.addEventListener('click', closeMatchAnalysis);

//     // ESC ile kapatma
//     document.addEventListener('keydown', e => {
//         if (e.key === 'Escape') closeMatchAnalysis();
//     });

//     // Dışına tıklayarak kapatma
//     document.getElementById('match-analysis-popup')?.addEventListener('click', function (e) {
//         if (e.target === this) closeMatchAnalysis();
//     });

//     function openMatchAnalysis(matchId: number) {
//         const match = matchData[matchId];
//         if (!match) return;

//         // Temel bilgiler
//         setText('popup-match-title', `Maç Analizi: Siz vs ${match.opponent}`);
//         setText('popup-opponent-name', match.opponent);
//         setText('popup-your-score', match.yourScore.toString());
//         setText('popup-opponent-score', match.opponentScore.toString());
//         setText('popup-match-date', match.date);
//         setText('popup-match-duration', match.duration);
//         setText('popup-match-location', match.location);

//         // İstatistikler
//         setText('popup-your-aces', match.stats.yourAces.toString());
//         setText('popup-opponent-aces', match.stats.opponentAces.toString());
//         setText('popup-your-winners', match.stats.yourWinners.toString());
//         setText('popup-opponent-winners', match.stats.opponentWinners.toString());
//         setText('popup-your-errors', match.stats.yourErrors.toString());
//         setText('popup-opponent-errors', match.stats.opponentErrors.toString());
//         setText('popup-your-rallies', match.stats.yourRallies.toString());
//         setText('popup-opponent-rallies', match.stats.opponentRallies.toString());

//         // Analiz yorumları
//         const analysisElem = document.getElementById('popup-analysis-comment');
//         if (analysisElem) {
//             analysisElem.innerHTML = match.analysis
//                 .split('\n\n')
//                 .map(p => `<p>${p}</p>`)
//                 .join('');
//         }

//         // Öneriler
//         const tipsList = document.getElementById('popup-improvement-tips');
//         if (tipsList) {
//             tipsList.innerHTML = '';
//             match.tips.forEach(tip => {
//                 const li = document.createElement('li');
//                 li.textContent = tip;
//                 tipsList.appendChild(li);
//             });
//         }

//         // Grafikler
//         createPointsDistributionChart(match.pointsData);
//         createShotAnalysisChart(match.shotData);

//         // Oyun haritası
//         createGameMap(matchId);

//         // Popup aç
//         const popup = document.getElementById('match-analysis-popup');
//         if (popup) {
//             popup.classList.add('active');
//             document.body.style.overflow = 'hidden';
//         }
//     }

//     function closeMatchAnalysis() {
//         const popup = document.getElementById('match-analysis-popup');
//         if (popup) {
//             popup.classList.remove('active');
//             document.body.style.overflow = '';
//         }
//     }

//     function createPointsDistributionChart(data: ChartDataSet) {
//         const ctx = (document.getElementById('pointsDistributionChart') as HTMLCanvasElement)?.getContext('2d');
//         if (!ctx) return;

//         if (window.pointsChart) window.pointsChart.destroy();

//         const config: ChartConfiguration = {
//             type: 'bar',
//             data: {
//                 labels: data.labels,
//                 datasets: [
//                     {
//                         label: 'Sizin Puanlarınız',
//                         data: data.you,
//                         backgroundColor: 'rgba(0, 255, 255, 0.7)',
//                         borderColor: 'rgba(0, 255, 255, 1)',
//                         borderWidth: 1
//                     },
//                     {
//                         label: 'Rakip Puanları',
//                         data: data.opponent,
//                         backgroundColor: 'rgba(255, 0, 255, 0.7)',
//                         borderColor: 'rgba(255, 0, 255, 1)',
//                         borderWidth: 1
//                     }
//                 ]
//             },
//             options: {
//                 responsive: true,
//                 scales: {
//                     y: {
//                         beginAtZero: true
//                     }
//                 } as any // tip hatasını aşmak için
//             }
//         };

//         window.pointsChart = new Chart(ctx, config);
//     }

//     function createShotAnalysisChart(data: ChartDataSet) {
//         const ctx = (document.getElementById('shotAnalysisChart') as HTMLCanvasElement)?.getContext('2d');
//         if (!ctx) return;

//         if (window.shotChart) window.shotChart.destroy();

//         const config: ChartConfiguration = {
//             type: 'radar',
//             data: {
//                 labels: data.labels,
//                 datasets: [
//                     {
//                         label: 'Sizin Vuruşlarınız (%)',
//                         data: data.you,
//                         backgroundColor: 'rgba(0, 255, 255, 0.3)',
//                         borderColor: 'rgba(0, 255, 255, 1)',
//                         borderWidth: 2
//                     },
//                     {
//                         label: 'Rakip Vuruşları (%)',
//                         data: data.opponent,
//                         backgroundColor: 'rgba(255, 0, 255, 0.3)',
//                         borderColor: 'rgba(255, 0, 255, 1)',
//                         borderWidth: 2
//                     }
//                 ]
//             },
//             options: { responsive: true }
//         };

//         window.shotChart = new Chart(ctx, config);
//     }

//     function createGameMap(matchId: number) {
//         const container = document.querySelector<HTMLElement>('.hit-points');
//         if (!container) return;

//         container.innerHTML = '';
//         const points = generateHitPoints(matchId);

//         points.forEach(point => {
//             const hitPoint = document.createElement('div');
//             hitPoint.style.position = 'absolute';
//             hitPoint.style.left = `${point.x}%`;
//             hitPoint.style.top = `${point.y}%`;
//             hitPoint.style.width = '12px';
//             hitPoint.style.height = '12px';
//             hitPoint.style.borderRadius = '50%';
//             hitPoint.style.backgroundColor = point.win
//                 ? 'rgba(0, 255, 0, 0.7)'
//                 : 'rgba(255, 0, 0, 0.7)';
//             hitPoint.title = point.description;
//             container.appendChild(hitPoint);
//         });
//     }

//     function generateHitPoints(matchId: number): HitPoint[] {
//         const basePoints: HitPoint[] = [
//             { x: 15, y: 20, win: true, description: 'Forehand winner' },
//             { x: 85, y: 30, win: true, description: 'Backhand winner' },
//             { x: 25, y: 80, win: true, description: 'Servis ası' },
//             { x: 75, y: 70, win: true, description: 'Smash winner' },
//             { x: 10, y: 50, win: true, description: 'Köşe vuruşu' },
//             { x: 30, y: 40, win: false, description: 'Forehand hata' },
//             { x: 70, y: 60, win: false, description: 'Backhand hata' },
//             { x: 50, y: 90, win: false, description: 'Servis hatası' },
//             { x: 60, y: 10, win: false, description: 'File hatası' },
//             { x: 90, y: 40, win: false, description: 'Out vuruş' }
//         ];

//         const offset = matchId * 5;
//         return basePoints.map(point => ({
//             ...point,
//             x: (point.x + offset) % 95 + 2.5,
//             y: (point.y + offset) % 85 + 7.5
//         }));
//     }

//     function setText(id: string, value: string) {
//         const el = document.getElementById(id);
//         if (el) el.textContent = value;
//     }
// });
