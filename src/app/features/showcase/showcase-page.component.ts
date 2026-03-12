import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SHOWCASE_DATA, ShowcaseItem } from '../../core/data/portfolio.data';
import { fadeInUp, staggerFadeIn } from '../../shared/animations/animations';

@Component({
    selector: 'app-showcase-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    template: `
    <section class="page-section">
      <div class="container">
        <div class="page-header" @fadeInUp>
          <a routerLink="/home" class="back-link">← Back to Home</a>
          <span class="section-label">Expertise</span>
          <h1 class="section-title gradient-text">My Skills & Expertise</h1>
          <p class="section-subtitle">Deep dive into my areas of specialization</p>
        </div>

        <div class="showcase-detail-grid" [@staggerFadeIn]="items().length">
          @for (item of items(); track item.id) {
            <div class="detail-card glass-card" [class.highlighted]="highlightedId === item.id">
              <div class="detail-icon" [style.color]="item.color">
                <span>{{ item.icon }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="detail-bar">
                <div class="bar-fill" [style.background]="item.color" [style.width]="'85%'"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
    styleUrl: './showcase-page.component.scss'
})
export class ShowcasePageComponent {
    items = signal<ShowcaseItem[]>(SHOWCASE_DATA);
    highlightedId: string | null = null;

    constructor(private route: ActivatedRoute) {
        this.route.queryParams.subscribe(params => {
            this.highlightedId = params['id'] || null;
        });
    }
}
