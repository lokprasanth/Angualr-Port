import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        data: { animation: 'home' }
    },
    {
        path: 'about',
        loadComponent: () => import('./features/about/about-page.component').then(m => m.AboutPageComponent),
        data: { animation: 'about' }
    },
    {
        path: 'showcase',
        loadComponent: () => import('./features/showcase/showcase-page.component').then(m => m.ShowcasePageComponent),
        data: { animation: 'showcase' }
    },
    {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects-page.component').then(m => m.ProjectsPageComponent),
        data: { animation: 'projects' }
    },
    {
        path: 'projects/:id',
        loadComponent: () => import('./features/projects/project-detail.component').then(m => m.ProjectDetailComponent),
        data: { animation: 'projectDetail' }
    },
    {
        path: 'awards',
        loadComponent: () => import('./features/awards/awards-page.component').then(m => m.AwardsPageComponent),
        data: { animation: 'awards' }
    },
    {
        path: 'awards/:id',
        loadComponent: () => import('./features/awards/award-detail.component').then(m => m.AwardDetailComponent),
        data: { animation: 'awardDetail' }
    },
    {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact-page.component').then(m => m.ContactPageComponent),
        data: { animation: 'contact' }
    },
    {
        path: '**',
        redirectTo: 'home'
    }
];
