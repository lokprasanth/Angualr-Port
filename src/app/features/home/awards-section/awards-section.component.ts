import { Component, signal } from '@angular/core';
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
export class AwardsSectionComponent {
    awards = signal<Award[]>(AWARDS_DATA);
}
