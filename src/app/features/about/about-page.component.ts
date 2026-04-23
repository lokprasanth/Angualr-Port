import { Component, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { fadeInUp, staggerFadeIn } from '../../shared/animations/animations';

@Component({
    selector: 'app-about-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    templateUrl: './about-page.component.html',
    styleUrl: './about-page.component.scss'
})
export class AboutPageComponent implements OnDestroy {
    categories = [
        {
            name: 'Frontend Development',
            icon: '🎨',
            skills: ['React.js', 'UI Engineering', 'JavaScript (ES6+)', 'TypeScript', 'Figma', 'Responsive UI Design']
        },
        {
            name: 'Testing & Analytics',
            icon: '🧪',
            skills: ['UI/UX Testing', 'A/B Testing', 'Web Analytics', 'Debugging', 'Bug Tracking']
        },
        {
            name: 'Tools & Platforms',
            icon: '🛠️',
            skills: ['Git', 'GitHub Actions (CI/CD)', 'JIRA', 'Netlify', 'Vercel']
        },
        {
            name: 'Development Practices',
            icon: '⚙️',
            skills: ['Agile Development', 'SDLC', 'Continuous Integration / Deployment (CI/CD)', 'Code Optimization']
        }
    ];

    experience = [
        {
            year: '2023 – 2025',
            role: 'UI Engineer / Frontend Developer',
            company: 'LDEV Technologies Pvt. Ltd., Hyderabad',
            desc: 'Engineered scalable user interfaces using React, TypeScript, and Redux. Conducted rigorous UI testing, optimized performance by 30%, and integrated user analytics tracking.'
        },
        {
            year: 'Jun 2025 – Sep 2025',
            role: 'Data Analyst Intern',
            company: 'Zaalima Development (Remote)',
            desc: 'Cleaned 100,000+ rows of data using SQL/Python. Built interactive Power BI dashboards for KPI tracking.'
        },
        {
            year: 'Sep 2025 – Oct 2025',
            role: 'Business Analyst / Operations Support',
            company: 'Inventrax – Caterpillar Gammco Project',
            desc: 'Supported operational workflows and manpower allocation planning. Provided actionable insights for process improvement.'
        }
    ];

    education = {
        year: '2019 – 2023',
        degree: 'Bachelor of Technology (BTech)',
        school: 'Raghu Engineering College, Visakhapatnam',
        gpa: 'GPA: 7.46 / 10'
    };

    // --- Blob Reveal Logic ---
    @ViewChild('blobWrapper') blobWrapper!: ElementRef<HTMLElement>;
    @ViewChild('blobLayer')   blobLayer!:   ElementRef<HTMLElement>;
    @ViewChild('turbulence')  turbulence!:  ElementRef<SVGFETurbulenceElement>;

    private targetX = 50;
    private targetY = 50;
    private currentX = 50;
    private currentY = 50;
    private time = 0;

    private rafId: number | null = null;
    private isActive = false;

    constructor(private zone: NgZone) {}

    onMouseMove(event: MouseEvent | TouchEvent): void {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        
        let clientX: number;
        let clientY: number;

        if (event instanceof MouseEvent) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            if (event.cancelable) event.preventDefault();
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        }

        this.targetX = ((clientX - rect.left) / rect.width)  * 100;
        this.targetY = ((clientY - rect.top)  / rect.height) * 100;

        if (!this.isActive) {
            this.isActive = true;
            this.zone.runOutsideAngular(() => this.animate());
        }
    }

    onMouseLeave(): void {
        this.isActive = false;
    }

    private animate(): void {
        if (!this.blobLayer) return;

        const ease = 0.08;
        this.currentX += (this.targetX - this.currentX) * ease;
        this.currentY += (this.targetY - this.currentY) * ease;

        this.time += 0.015;
        const wobble = 0.02 + Math.sin(this.time) * 0.005;

        const isMobile = window.innerWidth < 768;
        const baseSize = isMobile ? 180 : 280;

        const el = this.blobLayer.nativeElement;
        el.style.setProperty('--blob-x',    `${this.currentX}%`);
        el.style.setProperty('--blob-y',    `${this.currentY}%`);
        el.style.setProperty('--blob-size', this.isActive ? `${baseSize}px` : '0px');

        if (this.turbulence) {
            this.turbulence.nativeElement.setAttribute('baseFrequency', `${wobble} ${wobble * 1.2}`);
        }

        if (this.isActive || 
            Math.abs(this.currentX - this.targetX) > 0.01 || 
            parseInt(el.style.getPropertyValue('--blob-size')) > 0) {
            this.rafId = requestAnimationFrame(() => this.animate());
        } else {
            this.rafId = null;
        }
    }

    ngOnDestroy(): void {
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }
}
