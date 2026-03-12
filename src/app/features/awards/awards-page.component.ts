import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AWARDS_DATA, Award } from '../../core/data/portfolio.data';
import { fadeInUp, staggerFadeIn } from '../../shared/animations/animations';

@Component({
    selector: 'app-awards-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    template: `
    <section class="page-section">
      <div class="container">
        <div class="page-header" @fadeInUp>
          <a routerLink="/home" class="back-link">← Back to Home</a>
          <span class="section-label">Recognition</span>
          <h1 class="section-title gradient-text">Awards & Achievements</h1>
          <p class="section-subtitle">Notable accomplishments and honors</p>
        </div>

        <div class="awards-detail-grid" [@staggerFadeIn]="awards().length">
          @for (award of awards(); track award.id) {
            <a [routerLink]="['/awards', award.id]" class="award-detail-card glass-card">
              <div class="ad-icon">{{ award.icon }}</div>
              <div class="ad-body">
                <span class="ad-year">{{ award.year }}</span>
                <h3>{{ award.title }}</h3>
                <p class="ad-org">{{ award.organization }}</p>
                <p class="ad-desc">{{ award.description }}</p>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
    styleUrl: './awards-page.component.scss'
})
export class AwardsPageComponent {
    awards = signal<Award[]>(AWARDS_DATA);
}
