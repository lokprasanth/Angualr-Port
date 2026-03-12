export interface Project {
    id: string;
    title: string;
    description: string;
    image: string;
    techStack: string[];
    category: string;
    githubUrl: string;
    liveUrl: string;
}

export interface Award {
    id: string;
    title: string;
    organization: string;
    year: number;
    description: string;
    icon: string;
}

export interface ShowcaseItem {
    id: string;
    icon: string;
    title: string;
    description: string;
    color: string;
}

export const PROJECTS_DATA: Project[] = [
    {
        id: 'itnt-hub',
        title: 'Innovation Digital Management Platform (iTNT Hub)',
        description: 'Developed frontend modules for a 10K+ user digital innovation platform. Improved system performance by 30% through code optimization and defect resolution.',
        image: '',
        techStack: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3'],
        category: 'Frontend',
        githubUrl: 'https://github.com',
        liveUrl: 'https://example.com'
    },
    {
        id: 'vitti-living',
        title: 'E-Commerce Platform (Vitti-Living)',
        description: 'Developed React-based shopping cart and checkout UI components. Optimized frontend performance achieving 90+ Google Lighthouse mobile performance score.',
        image: '',
        techStack: ['React.js', 'Redux', 'Responsive UI', 'Lighthouse'],
        category: 'Frontend',
        githubUrl: 'https://github.com',
        liveUrl: 'https://example.com'
    },
    {
        id: 'global-sales-dash',
        title: 'Global Product Sales Dashboard',
        description: 'Built BI dashboards tracking partner KPIs across multiple regions. Optimized SQL queries and designed interactive filters and drill-through features for business decisions.',
        image: '',
        techStack: ['Power BI', 'SQL', 'Data Modeling'],
        category: 'Data',
        githubUrl: 'https://github.com',
        liveUrl: 'https://example.com'
    },
    {
        id: 'hotel-booking-analysis',
        title: 'Hotel Booking Data Analysis',
        description: 'Cleaned and wrangled 6,336 booking records, resolving 18% missing data. Conducted KPI analysis including cancellation rates and revenue metrics with Jupyter notebooks.',
        image: '',
        techStack: ['Python', 'Excel', 'Jupyter Notebook', 'EDA'],
        category: 'Data',
        githubUrl: 'https://github.com',
        liveUrl: 'https://example.com'
    },
    {
        id: 'sales-perf-dash',
        title: 'Product Sales Performance Dashboard',
        description: 'Queried 15,000+ records using optimized SQL joins. Designed interactive multi-page dashboards for monitoring product performance trends and regional sales insights.',
        image: '',
        techStack: ['SQL', 'Power BI', 'Relational DB'],
        category: 'Data',
        githubUrl: 'https://github.com',
        liveUrl: 'https://example.com'
    },
    {
        id: 'speed-exam',
        title: 'Online Examination System (Speed Exam)',
        description: 'Built reusable UI workflows and test modules to enhance system stability. Performed application debugging to improve overall user experience.',
        image: '',
        techStack: ['React.js', 'Testing', 'Debugging'],
        category: 'Product',
        githubUrl: 'https://github.com',
        liveUrl: 'https://example.com'
    }
];

export const AWARDS_DATA: Award[] = [
    {
        id: 'itnt-appreciation',
        title: 'iTNT Appreciation Letter',
        organization: 'iTNT Hub',
        year: 2024,
        description: 'Recognized for contributions to the development, debugging, and performance optimization for a 10K+ user platform.',
        icon: '✉️'
    },
    {
        id: 'full-stack-udemy',
        title: 'Full-Stack Development',
        organization: 'Udemy',
        year: 2023,
        description: 'Comprehensive certification in modern web development technologies and full-stack architecture.',
        icon: '📜'
    },
    {
        id: 'python-automation',
        title: 'Python Programming (Advanced Automation)',
        organization: 'Udemy',
        year: 2025,
        description: 'Focused on advanced automation and scripting using Python.',
        icon: '🐍'
    }
];

export const SHOWCASE_DATA: ShowcaseItem[] = [
    {
        id: 'frontend-dev',
        icon: '⚛️',
        title: 'Frontend Development',
        description: 'React.js, JavaScript (ES6+), Redux, TypeScript, and Responsive UI Design.',
        color: '#5fa879'
    },
    {
        id: 'quality-assurance',
        icon: '🧪',
        title: 'Testing & QA',
        description: 'Unit Testing, Integration Testing, Debugging, and Bug Tracking.',
        color: '#5f8ba8'
    },
    {
        id: 'data-analytics',
        icon: '📈',
        title: 'Data & Analytics',
        description: 'SQL, Python, Excel, and Power BI for data cleaning and visualization.',
        color: '#a88b5f'
    },
    {
        id: 'tools-platforms',
        icon: '🛠️',
        title: 'Tools & Platforms',
        description: 'Git, GitHub Actions (CI/CD), JIRA, Netlify, and Vercel.',
        color: '#a3c6b2'
    }
];
