import { Component, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { slideInOut, fadeIn } from '../../shared/animations/animations';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    animations: [slideInOut, fadeIn],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
    theme = inject(ThemeService);
    isScrolled = signal(false);
    isMobileOpen = signal(false);

    navLinks = [
        { label: 'Home', path: '/home', fragment: 'hero' },
        { label: 'About', path: '/about', fragment: 'about' },
        { label: 'Projects', path: '/projects', fragment: 'projects' },
        { label: 'Awards', path: '/awards', fragment: 'awards' },
        { label: 'Contact', path: '/contact', fragment: 'contact' }
    ];

    @HostListener('window:scroll')
    onScroll(): void {
        this.isScrolled.set(window.scrollY > 50);
    }

    toggleMobile(): void {
        this.isMobileOpen.update(v => !v);
    }

    closeMobile(): void {
        this.isMobileOpen.set(false);
    }

    toggleTheme(): void {
        this.theme.toggle();
    }

    scrollToSection(id: string): void {
        this.closeMobile();
        const el = document.getElementById(id);
        if (el) {
            const yOffset = -80;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }
}
