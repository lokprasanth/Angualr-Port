import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { fadeInUp, staggerFadeIn } from '../../shared/animations/animations';

@Component({
    selector: 'app-about-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInUp, staggerFadeIn],
    templateUrl: './about-page.component.html',
    styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {
    categories = [
        {
            name: 'Frontend Development',
            icon: '🎨',
            skills: ['React.js', 'UI Engineering', 'JavaScript (ES6+)', 'TypeScript', 'Figma', 'Responsive UI Design']
        },
        {
            name: 'Testing & Analytics',
            icon: '🧪',
            skills: ['UI/UX Testing', 'A/B Testing', 'Web Analytics', 'Debugging', 'Bug Tracking']
        },
        {
            name: 'Tools & Platforms',
            icon: '🛠️',
            skills: ['Git', 'GitHub Actions (CI/CD)', 'JIRA', 'Netlify', 'Vercel']
        },
        {
            name: 'Development Practices',
            icon: '⚙️',
            skills: ['Agile Development', 'SDLC', 'Continuous Integration / Deployment (CI/CD)', 'Code Optimization']
        }
    ];

    experience = [
        {
            year: '2023 – 2025',
            role: 'UI Engineer / Frontend Developer',
            company: 'LDEV Technologies Pvt. Ltd., Hyderabad',
            desc: 'Engineered scalable user interfaces using React, TypeScript, and Redux. Conducted rigorous UI testing, optimized performance by 30%, and integrated user analytics tracking.'
        },
        {
            year: 'Jun 2025 – Sep 2025',
            role: 'Data Analyst Intern',
            company: 'Zaalima Development (Remote)',
            desc: 'Cleaned 100,000+ rows of data using SQL/Python. Built interactive Power BI dashboards for KPI tracking.'
        },
        {
            year: 'Sep 2025 – Oct 2025',
            role: 'Business Analyst / Operations Support',
            company: 'Inventrax – Caterpillar Gammco Project',
            desc: 'Supported operational workflows and manpower allocation planning. Provided actionable insights for process improvement.'
        }
    ];

    education = {
        year: '2019 – 2023',
        degree: 'Bachelor of Technology (BTech)',
        school: 'Raghu Engineering College, Visakhapatnam',
        gpa: 'GPA: 7.46 / 10'
    };
}
