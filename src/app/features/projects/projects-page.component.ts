import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PROJECTS_DATA, Project } from '../../core/data/portfolio.data';
import { fadeInUp, staggerFadeIn } from '../../shared/animations/animations';

@Component({
    selector: 'app-projects-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    template: `
    <section class="page-section">
      <div class="container">
        <div class="page-header" @fadeInUp>
          <a routerLink="/home" class="back-link">← Back to Home</a>
          <span class="section-label">Portfolio</span>
          <h1 class="section-title gradient-text">All Projects</h1>
          <p class="section-subtitle">Complete collection of my work</p>
        </div>

        <div class="filter-bar" @fadeInUp>
          @for (cat of categories; track cat) {
            <button class="filter-btn" [class.active]="activeFilter() === cat" (click)="filterBy(cat)">
              {{ cat }}
            </button>
          }
        </div>

        <div class="projects-full-grid" [@staggerFadeIn]="projects().length">
          @for (project of projects(); track project.id) {
            <div class="project-full-card glass-card">
              <div class="pf-image">
                @if (project.image) {
                  <img [src]="project.image" [alt]="project.title" class="pf-img">
                } @else {
                  <div class="pf-placeholder" [style.background]="getGradient(project.category)">
                    <span class="pf-icon">{{ getIcon(project.category) }}</span>
                  </div>
                }
              </div>
              <div class="pf-body">
                <span class="pf-cat">{{ project.category }}</span>
                <h3><a [routerLink]="['/projects', project.id]">{{ project.title }}</a></h3>
                <p>{{ project.description }}</p>
                <div class="pf-techs">
                  @for (tech of project.techStack; track tech) {
                    <span class="tech-badge">{{ tech }}</span>
                  }
                </div>
                <div class="pf-actions">
                  <a [routerLink]="['/projects', project.id]" class="btn btn-primary btn-sm">View Details</a>
                  <a [href]="project.githubUrl" target="_blank" class="btn btn-outline btn-sm">GitHub</a>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
    styleUrl: './projects-page.component.scss'
})
export class ProjectsPageComponent {
    allProjects = PROJECTS_DATA;
    projects = signal<Project[]>(PROJECTS_DATA);
    activeFilter = signal('All');
    categories = ['All', ...new Set(PROJECTS_DATA.map(p => p.category))];

    filterBy(cat: string): void {
        this.activeFilter.set(cat);
        this.projects.set(cat === 'All' ? this.allProjects : this.allProjects.filter(p => p.category === cat));
    }

    getGradient(cat: string): string {
        const map: Record<string, string> = {
            Frontend: '#5fa879',
            Data: '#5f8ba8',
            Product: '#a88b5f'
        };
        return map[cat] || '#a3c6b2';
    }

    getIcon(cat: string): string {
        const map: Record<string, string> = { 
            Frontend: '⚛️', 
            Data: '📊', 
            Product: '⚙️'
        };
        return map[cat] || '💻';
    }
}
