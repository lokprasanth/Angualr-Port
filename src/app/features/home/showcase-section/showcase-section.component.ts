import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SHOWCASE_DATA, ShowcaseItem } from '../../../core/data/portfolio.data';
import { fadeInUp } from '../../../shared/animations/animations';

@Component({
    selector: 'app-showcase-section',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp],
    templateUrl: './showcase-section.component.html',
    styleUrl: './showcase-section.component.scss'
})
export class ShowcaseSectionComponent implements AfterViewInit, OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private ngZone = inject(NgZone);

    items = signal<ShowcaseItem[]>(SHOWCASE_DATA);
    selectedItem = signal<ShowcaseItem | null>(null);
    isDragging = false;

    @ViewChild('orbitContainer') orbitRef!: ElementRef<HTMLDivElement>;

    private rotation = 0;
    private targetRotation = 0;
    private lastMouseX = 0;
    private velocity = 0.5; 
    private animationId = 0;

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.startAnimation();
        }
    }

    ngOnDestroy(): void {
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    getTags(item: ShowcaseItem): string[] {
        return item.description.split(',').map(s => s.trim());
    }

    selectItem(item: ShowcaseItem): void {
        if (this.selectedItem()?.id === item.id) {
            this.selectedItem.set(null);
        } else {
            this.selectedItem.set(item);
        }
    }

    @HostListener('window:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (!this.isDragging) return;
        const deltaX = event.clientX - this.lastMouseX;
        this.targetRotation += deltaX * 0.2;
        this.lastMouseX = event.clientX;
        this.velocity = deltaX * 0.1;
    }

    @HostListener('window:mouseup')
    onMouseUp(): void {
        this.isDragging = false;
    }

    @HostListener('window:touchmove', ['$event'])
    onTouchMove(event: TouchEvent): void {
        if (!this.isDragging) return;
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.lastMouseX;
        this.targetRotation += deltaX * 0.2;
        this.lastMouseX = touch.clientX;
        this.velocity = deltaX * 0.1;
    }

    @HostListener('window:touchend')
    onTouchEnd(): void {
        this.isDragging = false;
    }

    onMouseDown(event: MouseEvent): void {
        this.isDragging = true;
        this.lastMouseX = event.clientX;
    }

    onTouchStart(event: TouchEvent): void {
        this.isDragging = true;
        this.lastMouseX = event.touches[0].clientX;
    }

    private startAnimation(): void {
        const update = () => {
            if (!this.isDragging) {
                this.targetRotation += this.velocity;
                this.velocity *= 0.98;
                if (Math.abs(this.velocity) < 0.1) this.velocity = 0.1;
            }

            this.rotation += (this.targetRotation - this.rotation) * 0.1;

            if (this.orbitRef) {
                const el = this.orbitRef.nativeElement;
                const nodes = el.querySelectorAll('.skill-node');
                const radius = window.innerWidth < 768 ? 140 : 260;
                
                nodes.forEach((node: any, i: number) => {
                    const angle = (i / nodes.length) * Math.PI * 2 + (this.rotation * Math.PI / 180);
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    
                    const scale = (z + radius * 1.5) / (radius * 2);
                    const zIndex = Math.round(scale * 100);
                    const opacity = Math.max(0.3, scale);

                    node.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + 0px), ${z}px) scale(${scale})`;
                    node.style.zIndex = zIndex;
                    node.style.opacity = opacity;
                });
            }

            this.animationId = requestAnimationFrame(update);
        };

        this.ngZone.runOutsideAngular(() => {
            update();
        });
    }
}
