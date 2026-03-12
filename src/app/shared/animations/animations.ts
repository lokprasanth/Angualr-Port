import {
    trigger,
    transition,
    style,
    animate,
    query,
    stagger,
    group,
    state
} from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
]);

export const fadeInUp = trigger('fadeInUp', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('0.7s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
]);

export const fadeInLeft = trigger('fadeInLeft', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-40px)' }),
        animate('0.7s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
    ])
]);

export const fadeInRight = trigger('fadeInRight', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateX(40px)' }),
        animate('0.7s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
    ])
]);

export const scaleIn = trigger('scaleIn', [
    transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1)' }))
    ])
]);

export const staggerFadeIn = trigger('staggerFadeIn', [
    transition('* => *', [
        query(':enter', [
            style({ opacity: 0, transform: 'translateY(30px)' }),
            stagger('100ms', [
                animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ], { optional: true })
    ])
]);

export const slideInOut = trigger('slideInOut', [
    transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)' }))
    ]),
    transition(':leave', [
        animate('0.3s cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)' }))
    ])
]);

export const routeAnimation = trigger('routeAnimation', [
    transition('* <=> *', [
        query(':enter, :leave', [
            style({ position: 'absolute', width: '100%', top: 0, left: 0 })
        ], { optional: true }),
        group([
            query(':leave', [
                animate('0.3s ease-out', style({ opacity: 0, transform: 'translateY(-20px)' }))
            ], { optional: true }),
            query(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('0.4s 0.15s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ], { optional: true })
        ])
    ])
]);
