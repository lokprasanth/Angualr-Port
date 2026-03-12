import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './core/navbar/navbar.component';
import { FooterComponent } from './core/footer/footer.component';
import { VoiceAssistantComponent } from './core/voice-assistant/voice-assistant.component';
import { routeAnimation } from './shared/animations/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, VoiceAssistantComponent],
  animations: [routeAnimation],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('portfolio');
  isLoading = signal(true);

  constructor(private contexts: ChildrenOutletContexts) {
    setTimeout(() => this.isLoading.set(false), 800);
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
