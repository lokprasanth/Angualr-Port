import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AWARDS_DATA, Award } from '../../../core/data/portfolio.data';
import { fadeInUp, staggerFadeIn } from '../../../shared/animations/animations';

@Component({
    selector: 'app-awards-section',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    templateUrl: './awards-section.component.html',
    styleUrl: './awards-section.component.scss'
})
export class AwardsSectionComponent implements AfterViewInit, OnDestroy {
    awards = signal<Award[]>(AWARDS_DATA);
    @ViewChild('carousel', { static: false }) carousel!: ElementRef;
    private scrollInterval: any;

    ngAfterViewInit() {
        this.startAutoScroll();
    }

    ngOnDestroy() {
        this.stopAutoScroll();
    }

    startAutoScroll() {
        this.stopAutoScroll(); // ensure no duplicates
        this.scrollInterval = setInterval(() => {
            if (this.carousel) {
                const el = this.carousel.nativeElement;
                // If reached the end, scroll back to start, else scroll right by 344px (card + gap)
                if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
                    el.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    el.scrollBy({ left: 344, behavior: 'smooth' });
                }
            }
        }, 3500); // Rotate every 3.5 seconds
    }

    stopAutoScroll() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
    }
}
