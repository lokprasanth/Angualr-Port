import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PROJECTS_DATA, Project } from '../../../core/data/portfolio.data';
import { fadeInUp, staggerFadeIn } from '../../../shared/animations/animations';

@Component({
    selector: 'app-projects-section',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    templateUrl: './projects-section.component.html',
    styleUrl: './projects-section.component.scss'
})
export class ProjectsSectionComponent {
    allProjects = PROJECTS_DATA;
    projects = signal<Project[]>(PROJECTS_DATA);
    activeFilter = signal('All');

    categories = ['All', ...new Set(PROJECTS_DATA.map(p => p.category))];

    filterBy(category: string): void {
        this.activeFilter.set(category);
        if (category === 'All') {
            this.projects.set(this.allProjects);
        } else {
            this.projects.set(this.allProjects.filter(p => p.category === category));
        }
    }
}
