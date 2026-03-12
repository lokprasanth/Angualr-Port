import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PROJECTS_DATA, Project } from '../../core/data/portfolio.data';
import { fadeInUp } from '../../shared/animations/animations';

@Component({
    selector: 'app-project-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp],
    template: `
    <section class="detail-page">
      <div class="container">
        @if (project()) {
          <div class="detail-header" @fadeInUp>
            <a routerLink="/projects" class="back-link">← All Projects</a>
            <div class="detail-hero">
              <div class="detail-image">
                <div class="detail-placeholder" [style.background]="getGradient(project()!.category)">
                  <span class="dp-icon">{{ getIcon(project()!.category) }}</span>
                </div>
              </div>
              <div class="detail-info">
                <span class="detail-cat">{{ project()!.category }}</span>
                <h1>{{ project()!.title }}</h1>
                <p class="detail-desc">{{ project()!.description }}</p>
                <div class="detail-techs">
                  @for (tech of project()!.techStack; track tech) {
                    <span class="tech-badge">{{ tech }}</span>
                  }
                </div>
                <div class="detail-actions">
                  <a [href]="project()!.githubUrl" target="_blank" class="btn btn-primary">🐙 View on GitHub</a>
                  <a [href]="project()!.liveUrl" target="_blank" class="btn btn-outline">🔗 Live Demo</a>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="not-found" @fadeInUp>
            <h2>Project not found</h2>
            <a routerLink="/projects" class="btn btn-primary">Browse Projects</a>
          </div>
        }
      </div>
    </section>
  `,
    styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
    project = signal<Project | undefined>(undefined);

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const p = PROJECTS_DATA.find(proj => proj.id === params['id']);
            this.project.set(p);
        });
    }

    getGradient(cat: string): string {
        const map: Record<string, string> = {
            AI: '#5fa879',
            Data: '#5f8ba8',
            IoT: '#a88b5f',
            Web: '#a3c6b2',
            Web3: '#5f8ba8'
        };
        return map[cat] || map['Web'];
    }

    getIcon(cat: string): string {
        const map: Record<string, string> = { AI: '🤖', Data: '📊', IoT: '📡', Web: '🌐', Web3: '⛓️' };
        return map[cat] || '💻';
    }
}
