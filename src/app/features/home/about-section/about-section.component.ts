import { Component, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { fadeInUp } from '../../../shared/animations/animations';

@Component({
    selector: 'app-about-section',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp],
    templateUrl: './about-section.component.html',
    styleUrl: './about-section.component.scss'
})
export class AboutSectionComponent implements OnDestroy {
    skills = [
        { name: 'React.js',    level: 90, color: '#a88b5f' },
        { name: 'Tailwind CSS',level: 85, color: '#5f8ba8' },
        { name: 'SQL',         level: 80, color: '#9bad9b' },
        { name: 'Python',      level: 80, color: '#5fa879' },
        { name: 'Power BI',    level: 75, color: '#a3c6b2' },
    ];

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
            // Prevent scrolling while interacting with the blob on mobile
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

        // Smooth liquid follow (lerp)
        const ease = 0.08;
        this.currentX += (this.targetX - this.currentX) * ease;
        this.currentY += (this.targetY - this.currentY) * ease;

        // Wobble frequency over time
        this.time += 0.015;
        const wobble = 0.02 + Math.sin(this.time) * 0.005;

        const isMobile = window.innerWidth < 768;
        const baseSize = isMobile ? 100 : 280;

        const el = this.blobLayer.nativeElement;
        el.style.setProperty('--blob-x',    `${this.currentX}%`);
        el.style.setProperty('--blob-y',    `${this.currentY}%`);
        el.style.setProperty('--blob-size', this.isActive ? `${baseSize}px` : '0px');

        // Update SVG Turbulence for organic wobble
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
