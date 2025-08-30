import AView from "./AView.js";

declare const Chart: any;

function getCSSVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

class ManagerProfile {
    private currentTab: string;
    private charts: Record<string, any>;
    private avatarStatus: HTMLElement | null = null;
    private showcharts: { performance?: any } = {};
    private chartData: { labelName: string, labels: string[], data: number[] } = {
        labelName: 'Kazanılan Maçlar',
        labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        data: [3, 5, 2, 8, 6, 4, 7]
    };

    constructor() {
        this.currentTab = 'overview';
        this.charts = {};
        setTimeout(() => {
            this.avatarStatus = document.querySelector('.avatar-ring') as HTMLElement;
            if (!this.avatarStatus) {
                console.error("avatar-ring elemanı bulunamadı!");
            } else {
                this.initConnectionStatus();
            }
            this.init();
        }, 100);
    }

    private init(): void {
        setTimeout(() => {
            this.startAnimations();
            this.loadUserData();
            this.createPerformanceChart();
            this.createSkillRadarChart();
            this.createMonthlyChart();
            this.createWinLossChart();
        }, 100);
    }

    public setAvatarStatus(status: 'online' | 'offline'): void {
        if (this.avatarStatus) {
            this.avatarStatus.classList.remove('online', 'offline');
            this.avatarStatus.classList.add(status);
        }
    }

    public initConnectionStatus(): void {
        this.setAvatarStatus(navigator.onLine ? 'online' : 'offline');
    }

    // ...existing code...
    // Keep all other methods as they are, just fix the Chart type issues by using 'any'

    public switchTab(tabName: string): void {
        // Remove active class from all tabs and contents
        const allTabs = document.querySelectorAll('.tab-btn');
        const allContents = document.querySelectorAll('.tab-content');

        allTabs.forEach(tab => tab.classList.remove('active'));
        allContents.forEach(content => {
            content.classList.remove('active');
            (content as HTMLElement).style.display = 'none';
        });

        // Add active class to clicked tab
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
            console.log('Active tab button set for:', tabName);
        } else {
            console.log('Tab button not found for:', tabName);
        }

        // Show active tab content
        const activeTab = document.getElementById(tabName) as HTMLElement | null;
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.display = 'block';
            console.log('Active tab content set for:', tabName);
        } else {
            console.log('Tab content not found for:', tabName);
        }

        this.currentTab = tabName;

        // Charts refresh
        if (tabName === 'statistics') {
            setTimeout(() => {
                this.refreshCharts();
            }, 100);
        }
    }

    // ...existing code... (keep all other existing methods)
}

// ...existing code... (keep all other existing functions and exports)