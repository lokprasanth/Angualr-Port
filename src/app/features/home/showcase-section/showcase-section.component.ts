import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SHOWCASE_DATA, ShowcaseItem } from '../../../core/data/portfolio.data';
import { fadeInUp, staggerFadeIn } from '../../../shared/animations/animations';

@Component({
    selector: 'app-showcase-section',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    templateUrl: './showcase-section.component.html',
    styleUrl: './showcase-section.component.scss'
})
export class ShowcaseSectionComponent {
    items = signal<ShowcaseItem[]>(SHOWCASE_DATA);
    isVisible = signal(false);

    onIntersection(): void {
        this.isVisible.set(true);
    }
}
