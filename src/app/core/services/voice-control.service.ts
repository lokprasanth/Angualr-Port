import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface Intent {
    category: 'navigation' | 'interaction' | 'theme' | 'query' | 'smalltalk' | 'scroll' | 'unknown';
    action: string;
    params?: any;
    confidence: number;
}

@Injectable({
    providedIn: 'root'
})
export class VoiceControlService {
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);
    private ngZone = inject(NgZone);

    private recognition: any;
    private synthesis = (typeof window !== 'undefined') ? window.speechSynthesis : null;
    private voices: SpeechSynthesisVoice[] = [];

    // --- State Signals ---
    isSpeaking = signal(false);
    isListening = signal(false);
    isProcessing = signal(false);
    transcript = signal('');
    lastResponse = signal('');
    isSupported = signal(false);
    isHeroVisible = signal(false);
    currentLang = signal('en-US');
    
    // Command Hints for UI
    hintIndex = signal(0);
    hints = [
        'Try "Go to Projects"',
        'Say "Switch to Dark Mode"',
        'Ask "Who are you?"',
        'Say "Scroll Down"',
        'Try "Go to Bottom"'
    ];

    // --- Internal State ---
    private hasWelcomed = false;
    private restartTimeout: any;
    private lastCommandTime = 0;
    private lastCommand = '';
    private silenceTimer: any;
    private context: string = 'global'; // Track where the user is in conversation

    // --- Human-like Personas ---
    private personas: Record<string, any> = {
        'en-US': {
            welcome: ["Hello! I'm your AI guide. How can I help you today?", "Hi there! I can navigate, change themes, or tell you about Lok's work. What's on your mind?"],
            start: ["I'm listening!", "Yes? How can I help?", "Ready for your command."],
            stop: ["Goodbye! Let me know if you need anything else.", "Turning off. See you later!"],
            confused: ["I didn't quite catch that. Could you try saying it differently?", "I'm not sure how to do that yet. Maybe ask about 'projects' or 'contact'?"],
            theme_dark: ["Switching to dark mode. Much better for the eyes!", "Shadow mode activated."],
            theme_light: ["Turning on the lights! Bright mode active.", "Switching to light mode."],
            navigating: ["Sure, let me take you to ${dest}.", "Moving to the ${dest} section now.", "Heading over to ${dest}!"],
            clicking: ["Clicking that for you.", "Executing the command.", "Got it, interacting now."],
            scrolling: ["Scrolling ${dir} for you.", "Moving the page.", "Going to the ${dir}."],
            already: ["We're already here!", "You're already looking at it!"],
            smalltalk_how: ["I'm doing great! Just enjoying being an AI. How about you?", "Excellent! Ready to assist you with anything."],
            smalltalk_who: ["I'm a custom-built AI assistant for this portfolio. My job is to make your visit seamless.", "Think of me as your digital guide through Lok's career!"],
            joke: ["Why did the web developer walk out of a restaurant? Because of the table layout! Ha-ha.", "What's an AI's favorite food? Micro-chips!"]
        }
    };

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.initVoices();
            this.initRecognition();
            this.hasWelcomed = sessionStorage.getItem('aiWelcomePlayed') === 'true';
            
            // Cycle hints every 5 seconds
            setInterval(() => {
                this.hintIndex.set((this.hintIndex() + 1) % this.hints.length);
            }, 5000);
        }
    }

    private initVoices() {
        if (!this.synthesis) return;
        const loadVoices = () => {
            this.voices = this.synthesis!.getVoices();
        };
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }

    private initRecognition() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.isSupported.set(false);
            return;
        }

        this.isSupported.set(true);
        this.recognition = new SpeechRecognition();
        
        // iOS Safari heavily throttles/errors on continuous=true.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        this.recognition.continuous = !isIOS;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLang();

        this.recognition.onstart = () => {
            this.ngZone.run(() => {
                this.isListening.set(true);
                this.isProcessing.set(false);
            });
        };

        this.recognition.onresult = (event: any) => {
            if (this.isSpeaking()) return;

            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalTranscript += text;
                else interimTranscript += text;
            }

            this.ngZone.run(() => {
                const textToShow = interimTranscript || finalTranscript;
                this.transcript.set(textToShow);
                
                // --- Fast Path: Process obvious interim commands for zero-latency ---
                if (interimTranscript.length > 3) {
                    const quickIntent = this.parseIntent(interimTranscript.toLowerCase().trim());
                    // Only execute 'safe' high-confidence actions from interim (scroll, theme)
                    if (quickIntent.confidence >= 0.9 && (quickIntent.category === 'scroll' || quickIntent.category === 'theme')) {
                        this.handleInput(interimTranscript.toLowerCase().trim(), true);
                        return;
                    }
                }

                if (finalTranscript) {
                    this.handleInput(finalTranscript.toLowerCase().trim(), false);
                }
            });
        };

        this.recognition.onerror = (event: any) => {
            console.warn('AI Recognition Error:', event.error);
            if (event.error === 'not-allowed') {
                this.isListening.set(false);
                this.isSupported.set(false); // Disable if blocked
            }
            if (event.error !== 'no-speech' && event.error !== 'not-allowed') {
                this.restartRecognition();
            }
        };

        this.recognition.onend = () => {
            if (this.isListening() && !this.isSpeaking()) {
                this.restartRecognition();
            }
        };
    }

    private restartRecognition() {
        if (!this.recognition || !this.isListening()) return;
        clearTimeout(this.restartTimeout);
        this.restartTimeout = setTimeout(() => {
            try {
                this.recognition.stop();
                setTimeout(() => {
                    if (this.isListening() && !this.isSpeaking()) {
                        this.recognition.lang = this.currentLang();
                        this.recognition.start();
                    }
                }, 100);
            } catch (e) {}
        }, 400);
    }

    toggleListening() {
        if (!this.isSupported()) {
            if (window.isSecureContext === false) {
                alert("Voice recognition requires security (HTTPS). Try using localhost or deploying the app.");
            } else {
                alert("Voice recognition is not supported in this browser. Please use Chrome or Safari.");
            }
            return;
        }
        if (this.isListening()) {
            this.stop();
        } else {
            this.start();
        }
    }

    private start() {
        this.isListening.set(true);
        try {
            this.recognition.start();
            if (!this.hasWelcomed) {
                this.speak(this.getRes('welcome'));
                this.hasWelcomed = true;
                sessionStorage.setItem('aiWelcomePlayed', 'true');
            } else {
                this.speak(this.getRes('start'));
            }
        } catch (e) { this.restartRecognition(); }
    }

    private stop() {
        this.isListening.set(false);
        this.speak(this.getRes('stop'));
        try { this.recognition.stop(); } catch (e) {}
    }

    private async handleInput(text: string, isInterim: boolean = false) {
        if (text.length < 2 || this.isProcessing()) return;
        
        // Anti-duplicate protection (Reduced for snappiness)
        const now = Date.now();
        if (text === this.lastCommand && now - this.lastCommandTime < 800) return;
        
        // Don't process the same command twice if it was already handled by interim logic
        if (!isInterim && text === this.lastCommand && now - this.lastCommandTime < 2000) return;

        this.lastCommand = text;
        this.lastCommandTime = now;

        const intent = this.parseIntent(text);
        if (intent.confidence < 0.5 && isInterim) return; // Ignore weak interim matches

        this.isProcessing.set(true);
        await this.executeIntent(intent, text);
        
        // Fast reset for better UX
        const delay = isInterim ? 1000 : 2500;
        setTimeout(() => {
            if (!this.isSpeaking()) {
                this.transcript.set('');
                this.isProcessing.set(false);
            }
        }, delay);
    }

    private parseIntent(text: string): Intent {
        // --- 1. Theme Check ---
        if (/\b(dark|night|black|shadow)\b/.test(text)) return { category: 'theme', action: 'dark', confidence: 1 };
        if (/\b(light|day|white|bright)\b/.test(text)) return { category: 'theme', action: 'light', confidence: 1 };

        // --- 2. Navigation Check ---
        const navMap: Record<string, string[]> = {
            'home': ['home', 'start', 'main', 'landing'],
            'about': ['about', 'bio', 'story', 'resume', 'experience'],
            'projects': ['projects', 'work', 'portfolio', 'apps'],
            'contact': ['contact', 'hire', 'email', 'reach'],
            'awards': ['awards', 'prizes', 'achievements'],
            'showcase': ['skills', 'tech', 'stack', 'showcase']
        };

        for (const [action, keywords] of Object.entries(navMap)) {
            if (keywords.some(kw => text.includes(kw))) {
                return { category: 'navigation', action, confidence: 0.9 };
            }
        }

        // --- 3. Interaction Check (The "Click anything" engine) ---
        if (/\b(click|open|go to|press|select)\b/.test(text)) {
            const target = text.replace(/\b(click|open|go to|press|select|the|button|link)\b/g, '').trim();
            if (target) return { category: 'interaction', action: 'click', params: target, confidence: 0.8 };
        }

        // --- 4. Scrolling Check ---
        const isScroll = /\b(scroll|move|page|go|slide|take me)\b/.test(text);
        if (isScroll || /\b(up|down|top|bottom)\b/.test(text)) {
            if (/\b(down|under|below)\b/.test(text)) return { category: 'scroll', action: 'down', confidence: 0.9 };
            if (/\b(up|above)\b/.test(text)) return { category: 'scroll', action: 'up', confidence: 0.9 };
            if (/\b(top|start|beginning|highest)\b/.test(text)) return { category: 'scroll', action: 'top', confidence: 0.9 };
            if (/\b(bottom|end|finish|lowest)\b/.test(text)) return { category: 'scroll', action: 'bottom', confidence: 0.9 };
        }

        // --- 5. Smalltalk Check ---
        if (/\b(how are you|how's it going|how are ya)\b/.test(text)) return { category: 'smalltalk', action: 'how', confidence: 1 };
        if (/\b(who are you|what are you|your name)\b/.test(text)) return { category: 'smalltalk', action: 'who', confidence: 1 };
        if (/\b(joke|laugh|funny)\b/.test(text)) return { category: 'smalltalk', action: 'joke', confidence: 1 };

        return { category: 'unknown', action: 'confused', confidence: 0 };
    }

    private async executeIntent(intent: Intent, rawText: string) {
        switch (intent.category) {
            case 'theme':
                this.performTheme(intent.action);
                break;
            case 'scroll':
                this.performScroll(intent.action);
                break;
            case 'navigation':
                this.performNavigation(intent.action);
                break;
            case 'interaction':
                if (intent.action === 'click') {
                    const success = this.discoverAndClick(intent.params);
                    if (success) {
                        this.speak(this.getRes('clicking'));
                    } else {
                        // Fallback: search for it as a navigation target
                        this.performNavigation(intent.params);
                    }
                }
                break;
            case 'smalltalk':
                this.speak(this.getRes(`smalltalk_${intent.action}`));
                break;
            default:
                // Global fallback for direct element interaction without "click" prefix
                if (rawText.length > 3) {
                    if (!this.discoverAndClick(rawText)) {
                        this.speak(this.getRes('confused'));
                    } else {
                        this.speak(this.getRes('clicking'));
                    }
                }
        }
    }

    private performTheme(mode: string) {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === mode) {
            this.speak(this.getRes('already'));
            return;
        }
        const btn = document.querySelector('.theme-switch') as HTMLElement;
        if (btn) {
            btn.click();
            this.speak(this.getRes(`theme_${mode}`));
        }
    }

    private performScroll(action: string) {
        this.speak(this.getRes('scrolling').replace('${dir}', action));
        switch (action) {
            case 'up': window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' }); break;
            case 'down': window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' }); break;
            case 'top': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
            case 'bottom': window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); break;
        }
    }

    private performNavigation(target: string) {
        const routeMap: any = { home:'/home', about:'/about', projects:'/projects', awards:'/awards', showcase:'/home', contact:'/contact' };
        let path = routeMap[target];

        // Advanced matching for unknown targets
        if (!path) {
            const keys = Object.keys(routeMap);
            const match = keys.find(k => target.includes(k) || k.includes(target));
            if (match) path = routeMap[match];
        }

        if (path) {
            this.speak(this.getRes('navigating').replace('${dest}', target));
            this.router.navigate([path]).then(() => {
                setTimeout(() => {
                    const el = document.getElementById(target === 'showcase' ? 'showcase' : target);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            });
        } else {
            this.speak(this.getRes('confused'));
        }
    }

    private discoverAndClick(target: string): boolean {
        // Optimize discovery by prioritizing common interactive elements
        const elements = Array.from(document.querySelectorAll('button, a, .nav-link, .btn, [role="button"], input[type="button"], input[type="submit"]'));
        const search = target.toLowerCase().trim();
        
        if (search.length < 2) return false;

        // 1. Exact Text Match (Prioritize)
        let found = elements.find(el => {
            const text = el.textContent?.toLowerCase().trim();
            return text === search || text === search + 's'; // simple plural
        });
        
        // 2. Exact Attribute Match (Aria-label, title)
        if (!found) {
            found = elements.find(el => 
                el.getAttribute('aria-label')?.toLowerCase().trim() === search || 
                el.getAttribute('title')?.toLowerCase().trim() === search
            );
        }

        // 3. Fuzzy Text Match (Includes)
        if (!found) {
            found = elements.find(el => {
                const text = el.textContent?.toLowerCase();
                return text && (text.includes(search) || search.includes(text)) && text.length > 1;
            });
        }

        // 4. Fuzzy Attribute Match
        if (!found) {
            found = elements.find(el => {
                const label = el.getAttribute('aria-label')?.toLowerCase() || el.getAttribute('title')?.toLowerCase();
                return label && (label.includes(search) || search.includes(label));
            });
        }

        if (found) {
            const htmlEl = found as HTMLElement;
            
            // Visual feedback of the click (Ripple effect simulation)
            const originalTransition = htmlEl.style.transition;
            const originalTransform = htmlEl.style.transform;
            htmlEl.style.transition = 'all 0.1s ease';
            htmlEl.style.transform = (originalTransform || '') + ' scale(0.95)';
            
            setTimeout(() => {
                htmlEl.click();
                setTimeout(() => {
                    htmlEl.style.transform = originalTransform;
                    htmlEl.style.transition = originalTransition;
                }, 100);
            }, 50);
            
            return true;
        }
        return false;
    }

    private getRes(key: string): string {
        const lang = this.currentLang();
        const templates = this.personas[lang]?.[key] || this.personas['en-US'][key] || ["..."];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    speak(text: string) {
        if (!text || !this.synthesis) {
            this.isProcessing.set(false);
            return;
        }

        // Interrupt recognition while speaking to prevent echo feedback
        if (this.recognition) {
            try { this.recognition.abort(); } catch(e){}
        }

        this.isSpeaking.set(true);
        this.lastResponse.set(text);
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.currentLang();
        
        // Select a premium natural voice if available
        const preferred = this.voices.find(v => v.lang === utterance.lang && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Apple')));
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => {
            this.ngZone.run(() => {
                this.isSpeaking.set(false);
                this.isProcessing.set(false);
                if (this.isListening()) this.restartRecognition();
            });
        };

        utterance.onerror = () => {
            this.ngZone.run(() => {
                this.isSpeaking.set(false);
                this.isProcessing.set(false);
                if (this.isListening()) this.restartRecognition();
            });
        };

        this.synthesis.speak(utterance);
    }
}
