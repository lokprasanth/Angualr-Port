import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { fadeInUp, fadeInLeft, fadeInRight } from '../../../shared/animations/animations';

@Component({
    selector: 'app-about-section',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, fadeInLeft, fadeInRight],
    templateUrl: './about-section.component.html',
    styleUrl: './about-section.component.scss'
})
export class AboutSectionComponent {
    skills = [
        { name: 'React.js', level: 90, color: '#a88b5f' },
        { name: 'Tailwind CSS', level: 85, color: '#5f8ba8' },
        { name: 'SQL', level: 80, color: '#9bad9b' },
        { name: 'Python', level: 80, color: '#5fa879' },
        { name: 'Power BI', level: 75, color: '#a3c6b2' }
    ];
}
