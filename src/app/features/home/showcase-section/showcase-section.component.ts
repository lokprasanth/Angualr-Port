import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SHOWCASE_DATA, ShowcaseItem } from '../../../core/data/portfolio.data';
import { fadeInUp } from '../../../shared/animations/animations';

@Component({
    selector: 'app-showcase-section',
    standalone: true,
    imports: [CommonModule],
    animations: [fadeInUp],
    templateUrl: './showcase-section.component.html',
    styleUrl: './showcase-section.component.scss'
})
export class ShowcaseSectionComponent implements AfterViewInit, OnDestroy {
    private platformId = inject(PLATFORM_ID);
    @ViewChild('showcaseSection') showcaseSection!: ElementRef;

    isVisible = signal(false);
    // Comprehensive Skill Set for a Full "Honeybee Nest"
    items = signal<ShowcaseItem[]>([
        { id: 'html', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', title: 'HTML5', description: '', color: '#E34F26' },
        { id: 'css', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', title: 'CSS3', description: '', color: '#1572B6' },
        { id: 'js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', title: 'JavaScript', description: '', color: '#F7DF1E' },
        { id: 'ts', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg', title: 'TypeScript', description: '', color: '#3178C6' },
        { id: 'react', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', title: 'React', description: '', color: '#61DAFB' },
        { id: 'ng', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg', title: 'Angular', description: '', color: '#DD0031' },
        { id: 'py', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', title: 'Python', description: '', color: '#3776AB' },
        { id: 'sql', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', title: 'SQL', description: '', color: '#336791' },
        { id: 'bi', icon: 'https://raw.githubusercontent.com/microsoft/PowerBI-Icons/master/SVG/PowerBI.svg', title: 'Power BI', description: '', color: '#F2C811' },
        { id: 'excel', icon: 'https://www.vectorlogo.zone/logos/microsoft_excel/microsoft_excel-icon.svg', title: 'Excel', description: '', color: '#217346' },
        { id: 'wp', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg', title: 'WordPress', description: '', color: '#21759B' },
        { id: 'tw', icon: 'https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg', title: 'Tailwind', description: '', color: '#06B6D4' },
        { id: 'boot', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg', title: 'Bootstrap', description: '', color: '#7952B3' },
        { id: 'sass', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg', title: 'Sass', description: '', color: '#CC6699' },
        { id: 'git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', title: 'Git', description: '', color: '#F05032' },
        { id: 'fig', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg', title: 'Figma', description: '', color: '#F24E1E' },
        { id: 'canva', icon: 'https://www.vectorlogo.zone/logos/canva/canva-icon.svg', title: 'Canva', description: '', color: '#00C4CC' },
        { id: 'jira', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg', title: 'Jira', description: '', color: '#0052CC' },
        { id: 'docs', icon: 'https://www.svgrepo.com/show/353664/docs.svg', title: 'Documentation', description: '', color: '#4285F4' },
        { id: 'ai', icon: 'https://www.svgrepo.com/show/353380/ai.svg', title: 'AI', description: '', color: '#8E44AD' },
        { id: 'vercel', icon: 'https://www.vectorlogo.zone/logos/vercel/vercel-icon.svg', title: 'Vercel', description: '', color: '#FFFFFF' },
        { id: 'netlify', icon: 'https://www.vectorlogo.zone/logos/netlify/netlify-icon.svg', title: 'Netlify', description: '', color: '#00C7B7' },
        { id: 'pandasai', icon: 'https://pandas-ai.com/favicon.ico', title: 'PandasAI', description: '', color: '#FF6F61' },
        { id: 'rowsai', icon: 'https://rows.com/favicon.ico', title: 'RowsAI', description: '', color: '#000000' }
    ]);
    selectedItem = signal<ShowcaseItem | null>(null);

    private observer: IntersectionObserver | null = null;

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this.isVisible.set(entry.isIntersecting);
                });
            }, { threshold: 0.1 });
            this.observer.observe(this.showcaseSection.nativeElement);
        }
    }

    ngOnDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    getTags(item: ShowcaseItem): string[] { return []; }

    selectItem(item: ShowcaseItem): void {
        if (!item.title) return;
        this.selectedItem.set(item);
    }
}
