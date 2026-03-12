import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class VoiceControlService {
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);

    private recognition: any;
    private synthesis = window.speechSynthesis;

    isSpeaking = signal(false);
    isListening = signal(false);
    transcript = signal('');
    isSupported = signal(false);
    isHeroVisible = signal(false);
    lastResponse = signal('');
    private hasWelcomed = false;
    private isProcessing = false;
    private lastCommand = '';
    private lastCommandTime = 0;

    // Semantic Concept Mapping (Concept-Based)
    private concepts: Record<string, string[]> = {
        home: ['home', 'start', 'main', 'intro', 'hero'],
        about: ['about', 'experience', 'background', 'who are you', 'profile', 'information', 'bio', 'identity'],
        projects: ['project', 'projects', 'work', 'works', 'portfolio', 'build', 'builds', 'creations', 'case studies'],
        awards: ['award', 'awards', 'achievements', 'recognition', 'honors', 'trophy'],
        showcase: ['showcase', 'skills', 'expertise', 'services', 'tools'],
        contact: ['contact', 'reach', 'email', 'message', 'connect', 'touch', 'hire']
    };

    private actionVerbs = ['open', 'go', 'take', 'show', 'check', 'see', 'visit', 'look', 'navigate', 'scroll'];

    // Randomized Natural Responses (Improve Natural Behavior)
    private responses: Record<string, string[]> = {
        welcome: [
            "Welcome to Lok's portfolio! I'm your AI guide. Would you like to see my latest projects, learn more about my background, or see what technologies I use?",
            "Hi there! I'm here to show you around Lok's work. Shall we start with my featured projects?",
            "Greetings! I can guide you through my skills, awards, or directly to my contact section. What would you like to see first?"
        ],
        projects: [
            "I've built some exciting things. Here are my main projects.",
            "Take a look at my work. I specialize in modern web technologies.",
            "Showing you my portfolio. Each project represents a unique challenge I've solved."
        ],
        about: [
            "Here's my story and background as a developer.",
            "I'm passionate about building things. Let me show you my profile.",
            "This section covers my experience and what drives my creative process."
        ],
        navigate_generic: [
            "Of course. Let me take you to the ${page} section.",
            "Smoothly moving to the ${page}. Hope you find it interesting!",
            "Heading over to see ${page} now."
        ],
        scroll: ["Scrolling down to show you more of my work.", "Moving the page so you can see everything.", "Follow me, I'll show you more."],
        confused: [
            "I didn't quite catch that, but I'd love to show you around! You can say 'Show projects', 'Tell me about yourself', or 'How can I contact you?'",
            "I'm still learning the ropes, but I can definitely take you to my projects or skills. Which would you prefer?",
            "Oops, sorry! Try asking me to 'Go to awards' or 'Visit the contact page'."
        ],
        top: ["Returning to the start!", "Heading back to the top section."],
        start: ["Assistant online. I'm ready to show you my portfolio!", "Systems ready. What part of my work would you like to explore?", "Listening and ready to guide you through my creations."],
        stop: ["Going offline. Thanks for visiting my portfolio!", "Goodbye! Feel free to explore more on your own.", "Assistant standing down. Have a wonderful time looking around!"]
    };

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.initRecognition();
            // Session Guard (Requirement 3)
            const played = sessionStorage.getItem('aiWelcomePlayed');
            this.hasWelcomed = played === 'true';
        }
    }

    private initRecognition() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.isSupported.set(true);
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
                // QUICK ATTENTION: Do not process anything if synthesis is active (Requirement 1)
                if (this.isSpeaking() || this.synthesis.speaking) return;

                const current = event.resultIndex;
                const result = event.results[current];
                const text = result[0].transcript.toLowerCase();

                this.transcript.set(text);

                if (result.isFinal) {
                    const now = Date.now();
                    // Prevent processing the same command within 1.5 seconds (Repetition Guard)
                    if (text === this.lastCommand && now - this.lastCommandTime < 1500) return;
                    
                    this.lastCommand = text;
                    this.lastCommandTime = now;
                    this.processCommand(text);
                }
            };

            this.recognition.onend = () => {
                // RESTART ONLY IF LINES COMPLETED (Requirement 1)
                if (this.isListening() && !this.isSpeaking() && !this.synthesis.speaking) {
                    try { this.recognition.start(); } catch (e) { }
                }
            };
        }
    }

    toggleListening() {
        if (!this.isSupported()) return;
        this.isListening() ? this.stop() : this.start();
    }

    private start() {
        this.isListening.set(true);
        this.transcript.set('Listening...');
        try {
            this.recognition.start();
            // Human-like greeting
            const greeting = !this.hasWelcomed 
                ? this.getRandomResponse('welcome') 
                : this.getRandomResponse('start');
            this.speak(greeting);
            this.setWelcomePlayed();
        } catch (e) { }
    }

    private stop() {
        this.speak(this.getRandomResponse('stop'));
        this.isListening.set(false);
        try { this.recognition.stop(); } catch (e) { }
        this.transcript.set('');
    }

    private setWelcomePlayed() {
        this.hasWelcomed = true;
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('aiWelcomePlayed', 'true');
        }
    }

    private processCommand(rawText: string) {
        // 1️⃣ Input Cleaning Layer (Requirement 1)
        let text = rawText.toLowerCase()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
            .replace(/\b(now|please|can you|could you|let me|i want to|i would like to)\b/g, "") // Remove fillers
            .trim();

        if (text.length < 2 || this.isProcessing) return;
        this.isProcessing = true;

        // 2️⃣ Semantic Concept Mapping & Similarity (Requirement 1D)
        const words = text.split(' ');
        let detectedConcept: string | null = null;

        for (const [concept, keywords] of Object.entries(this.concepts)) {
            const matchFound = keywords.some(kw => {
                if (text.includes(kw)) return true;
                // Partial Similarity (Requirement 1D)
                return words.some(w => this.getSimilarity(w, kw) > 0.75);
            });

            if (matchFound) {
                detectedConcept = concept;
                break;
            }
        }

        if (detectedConcept) {
            this.handleNavigation(detectedConcept);
            return;
        }

        // 2️⃣ Scroll Logic Fix (Refined Priority)
        const lowerText = text.toLowerCase();
        
        // Check UP direction first
        if (lowerText.includes('up') || lowerText.includes('higher') || (lowerText.includes('top') && !lowerText.includes('bottom'))) {
            if (lowerText.includes('top') || lowerText.includes('start') || lowerText.includes('beginning')) {
                this.scrollToTop();
            } else {
                this.scrollBy(-window.innerHeight * 0.6, "Heading up.");
            }
        } 
        // Check DOWN direction or generic scroll
        else if (lowerText.includes('down') || lowerText.includes('lower') || lowerText.includes('scroll') || lowerText.includes('next')) {
            if (lowerText.includes('bottom') || lowerText.includes('end')) {
                this.scrollToBottom();
            } else {
                this.scrollBy(window.innerHeight * 0.6, "Sure, moving down.");
            }
        } else if (lowerText.includes('back')) {
            this.speak("Going back.");
            window.history.back();
            setTimeout(() => { this.isProcessing = false; }, 500);
        } else {
            // "Human-like" interactive fallback
            if (this.actionVerbs.some(v => text.includes(v)) || text.length > 5) {
                this.speak(this.getRandomResponse('confused'));
            } else {
                this.isProcessing = false; // Release lock if nothing found
            }
        }
    }

    private handleNavigation(concept: string) {
        const routeMap: Record<string, { path: string, frag: string }> = {
            home: { path: '/home', frag: 'hero' },
            about: { path: '/about', frag: 'about' },
            projects: { path: '/projects', frag: 'projects' },
            awards: { path: '/awards', frag: 'awards' },
            showcase: { path: '/showcase', frag: 'showcase' },
            contact: { path: '/contact', frag: 'contact' }
        };

        const target = routeMap[concept];
        if (target) {
            const response = this.responses[concept]
                ? this.getRandomResponse(concept)
                : this.getRandomResponse('navigate_generic', concept);

            this.navigate(target.path, target.frag, response);
        } else {
            this.isProcessing = false;
        }
    }

    private navigate(path: string, fragment: string, message: string) {
        this.speak(message);
        const currentPath = this.router.url.split('#')[0].split('?')[0];

        if (currentPath === path || (currentPath === '/' && path === '/home')) {
            this.scrollToId(fragment);
        } else {
            this.router.navigate([path]).then(() => {
                setTimeout(() => this.scrollToId(fragment), 500);
            });
        }
    }

    // Similarity Utility (Levenshtein Distance)
    private getSimilarity(s1: string, s2: string): number {
        let longer = s1; let shorter = s2;
        if (s1.length < s2.length) { longer = s2; shorter = s1; }
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;
        return (longerLength - this.editDistance(longer, shorter)) / longerLength;
    }

    private editDistance(s1: string, s2: string): number {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) costs[j] = j;
                else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    private getRandomResponse(key: string, placeholder = ''): string {
        const list = this.responses[key] || this.responses['navigate_generic'];
        const res = list[Math.floor(Math.random() * list.length)];
        return res.replace('${page}', placeholder);
    }

    private scrollBy(y: number, message: string) {
        this.speak(message);
        window.scrollBy({ top: y, behavior: 'smooth' });
    }

    private scrollToTop() {
        this.speak(this.getRandomResponse('top'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private scrollToBottom() {
        this.speak("Moving to the end of the page. Anything else?");
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    private scrollToId(id: string) {
        const el = document.getElementById(id) || document.querySelector('section') || document.body;
        if (el) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
        this.isProcessing = false; // Ensure release if no speech follows
    }

    speak(text: string) {
        if (!text) {
            this.isProcessing = false;
            return;
        }
        
        // If already speaking, override instead of just returning (more human-like speed)
        if (this.isSpeaking()) {
            this.synthesis.cancel();
        }

        this.lastResponse.set(text);
        this.isSpeaking.set(true);

        // STOP recognition during speech (Requirement 1)
        try { this.recognition.stop(); } catch (e) { }
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find a softer, natural MALE voice
        const voices = this.synthesis.getVoices();
        const softMaleVoice = voices.find(v => 
            (v.name.includes('Male') || v.name.includes('Guy') || v.name.includes('David') || v.name.includes('James')) &&
            (v.name.includes('Google') || v.name.includes('Natural'))
        ) || voices.find(v => v.name.includes('Male'));
        
        if (softMaleVoice) utterance.voice = softMaleVoice;

        // Soft, mellow male parameters
        utterance.rate = 0.85;  // Slightly more relaxed pace
        utterance.pitch = 0.95; // Slightly lower for a mellow, resonant tone
        utterance.volume = 0.9;

        utterance.onend = () => {
            // Snappy human transition
            setTimeout(() => {
                this.isSpeaking.set(false);
                this.isProcessing = false; // Release command lock
                if (this.isListening()) {
                    try {
                        this.recognition.start();
                        this.transcript.set('Ready');
                    } catch (e) { }
                }
            }, 150);
        };
        utterance.onerror = () => {
            this.isSpeaking.set(false);
            this.isProcessing = false;
            if (this.isListening()) {
                try { this.recognition.start(); } catch (e) { }
            }
        };
        this.synthesis.speak(utterance);
    }
}
