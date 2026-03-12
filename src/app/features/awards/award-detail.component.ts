import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AWARDS_DATA, Award } from '../../core/data/portfolio.data';
import { fadeInUp } from '../../shared/animations/animations';

@Component({
    selector: 'app-award-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp],
    template: `
    <section class="detail-page">
      <div class="container">
        @if (award()) {
          <div class="award-detail-content" @fadeInUp>
            <a routerLink="/awards" class="back-link">← All Awards</a>
            <div class="award-hero glass-card">
              <div class="ah-icon">{{ award()!.icon }}</div>
              <span class="ah-year">{{ award()!.year }}</span>
              <h1>{{ award()!.title }}</h1>
              <p class="ah-org">{{ award()!.organization }}</p>
              <p class="ah-desc">{{ award()!.description }}</p>
            </div>
          </div>
        } @else {
          <div class="not-found" @fadeInUp>
            <h2>Award not found</h2>
            <a routerLink="/awards" class="btn btn-primary">Browse Awards</a>
          </div>
        }
      </div>
    </section>
  `,
    styles: [`
    .detail-page {
      padding-top: calc(var(--navbar-height) + 48px);
      padding-bottom: 80px;
      min-height: 100vh;
    }
    .back-link {
      display: inline-block;
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 32px;
      transition: color 0.2s;
      &:hover { color: var(--accent-primary); }
    }
    .award-hero {
      text-align: center;
      padding: 64px 40px;
      max-width: 700px;
      margin: 0 auto;
    }
    .ah-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      filter: drop-shadow(0 8px 24px rgba(108, 99, 255, 0.3));
    }
    .ah-year {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--accent-secondary);
      letter-spacing: 2px;
    }
    h1 {
      font-size: 2rem;
      margin: 12px 0;
      color: var(--text-primary);
    }
    .ah-org {
      font-size: 1rem;
      color: var(--accent-primary);
      font-weight: 500;
      margin-bottom: 20px;
    }
    .ah-desc {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.8;
    }
    .not-found {
      text-align: center;
      padding: 80px 0;
      h2 { margin-bottom: 24px; color: var(--text-secondary); }
    }
  `]
})
export class AwardDetailComponent implements OnInit {
    award = signal<Award | undefined>(undefined);

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const a = AWARDS_DATA.find(aw => aw.id === params['id']);
            this.award.set(a);
        });
    }
}
