import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { AboutSectionComponent } from './about-section/about-section.component';
import { ShowcaseSectionComponent } from './showcase-section/showcase-section.component';
import { ProjectsSectionComponent } from './projects-section/projects-section.component';
import { AwardsSectionComponent } from './awards-section/awards-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    AboutSectionComponent,
    ShowcaseSectionComponent,
    ProjectsSectionComponent,
    AwardsSectionComponent
  ],
  template: `
    <app-hero />
    <app-about-section />
    <app-showcase-section />
    <app-projects-section />
    <app-awards-section />
  `,
  styles: [`:host { display: block; }`]
})
export class HomeComponent { }
