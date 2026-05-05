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
    
    <div class="orbit-center-wrapper container section">
      <img src="assets/orbit-center.png" alt="Orbit Center" class="orbit-image" />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .orbit-center-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 80px;
      margin-bottom: 80px;
      position: relative;
    }

    /* Core Image */
    .orbit-image {
      width: clamp(140px, 45vw, 250px);
      height: clamp(140px, 45vw, 250px);
      object-fit: cover;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.8);
      position: relative;
      z-index: 2;
      animation: jarvisCore 1.5s infinite alternate ease-in-out;
    }

    /* Holographic Outer Tech Rings */
    .orbit-center-wrapper::before,
    .orbit-center-wrapper::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }

    /* Inner Dashed Ring */
    .orbit-center-wrapper::before {
      width: clamp(160px, 55vw, 280px);
      height: clamp(160px, 55vw, 280px);
      border: 2px dashed rgba(220, 220, 220, 0.6);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
      animation: jarvisSpin 20s linear infinite;
      z-index: 1;
    }

    /* Outer Tech Ring */
    .orbit-center-wrapper::after {
      width: clamp(190px, 65vw, 320px);
      height: clamp(190px, 65vw, 320px);
      border: 1px solid rgba(150, 150, 150, 0.2);
      border-top: 3px solid rgba(83, 80, 80, 0.9);
      border-bottom: 3px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 15px rgba(70, 70, 70, 0.3);
      animation: jarvisSpinReverse 12s linear infinite;
      z-index: 1;
    }

    /* Animations */
    @keyframes jarvisCore {
      0% {
        box-shadow: 
          0 0 10px rgba(255, 255, 255, 0.4),
          inset 0 0 10px rgba(220, 220, 220, 0.4),
          0 0 20px rgba(150, 150, 150, 0.2);
        filter: brightness(1) contrast(1.1);
      }
      100% {
        box-shadow: 
          0 0 20px rgba(255, 255, 255, 0.7),
          inset 0 0 20px rgba(255, 255, 255, 0.5),
          0 0 40px rgba(200, 200, 200, 0.5),
          0 0 60px rgba(120, 120, 120, 0.3);
        filter: brightness(1) contrast(1.2);
      }
    }

    @keyframes jarvisSpin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes jarvisSpinReverse {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(-360deg); }
    }

    /* Light Theme Overrides */
    :host-context([data-theme="light"]) .orbit-image {
      border-color: rgba(20, 20, 20, 0.8);
      animation: jarvisCoreLight 1.5s infinite alternate ease-in-out;
    }

    :host-context([data-theme="light"]) .orbit-center-wrapper::before {
      border-color: rgba(50, 50, 50, 0.6);
      box-shadow: 0 0 10px rgba(20, 20, 20, 0.2);
    }

    :host-context([data-theme="light"]) .orbit-center-wrapper::after {
      border-color: rgba(200, 200, 200, 0.2);
      border-top-color: rgba(20, 20, 20, 0.9);
      border-bottom-color: rgba(20, 20, 20, 0.9);
      box-shadow: 0 0 15px rgba(50, 50, 50, 0.3);
    }

    @keyframes jarvisCoreLight {
      0% {
        box-shadow: 
          0 0 10px rgba(20, 20, 20, 0.3),
          inset 0 0 10px rgba(50, 50, 50, 0.3),
          0 0 20px rgba(100, 100, 100, 0.2);
        filter: brightness(1) contrast(1.1);
      }
      100% {
        box-shadow: 
          0 0 20px rgba(10, 10, 10, 0.6),
          inset 0 0 20px rgba(30, 30, 30, 0.5),
          0 0 40px rgba(60, 60, 60, 0.5),
          0 0 60px rgba(100, 100, 100, 0.3);
        filter: brightness(0.9) contrast(1.2);
      }
    }

    /* Responsive Adjustments */
    @media (max-width: 768px) {
      .orbit-center-wrapper {
        margin-top: 40px;
        margin-bottom: 40px;
      }
    }
  `]
})
export class HomeComponent { }
