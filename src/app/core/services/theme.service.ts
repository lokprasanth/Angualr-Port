import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'portfolio-theme';
    isDark = signal(true);

    constructor() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.isDark.set(saved === 'dark');
        }
        this.applyTheme();

        effect(() => {
            this.applyTheme();
        });
    }

    toggle(): void {
        this.isDark.update(v => !v);
        localStorage.setItem(this.STORAGE_KEY, this.isDark() ? 'dark' : 'light');
    }

    private applyTheme(): void {
        const theme = this.isDark() ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }
}
