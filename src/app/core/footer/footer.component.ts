import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent {
    currentYear = new Date().getFullYear();

    socialLinks = [
        { icon: '💼', label: 'LinkedIn', url: 'https://linkedin.com' },
        { icon: '🐙', label: 'GitHub', url: 'https://github.com' },
        { icon: '✉️', label: 'Email', url: 'mailto:hello@portfolio.com' }
    ];

    quickLinks = [
        { label: 'Home', path: '/home' },
        { label: 'About', path: '/about' },
        { label: 'Projects', path: '/projects' },
        { label: 'Awards', path: '/awards' },
        { label: 'Contact', path: '/contact' }
    ];

    scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
