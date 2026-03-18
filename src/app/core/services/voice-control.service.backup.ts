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
    private synthesis = (typeof window !== 'undefined') ? window.speechSynthesis : null;

    // Signals
    isSpeaking = signal(false);
    isListening = signal(false);
    transcript = signal('');
    isSupported = signal(false);
    isHeroVisible = signal(false);
    lastResponse = signal('');
    
    // Detection & State
    currentLang = signal('en-US');
    private hasWelcomed = false;
    private isProcessing = false;
    private lastCommand = '';
    private lastCommandTime = 0;
    private restartTimeout: any;

    // ─── Modern & General Dictionary ──────────────────────────
    private dictionary: Record<string, Record<string, string[]>> = {
        'en-US': {
            home: ['home', 'start', 'main', 'landing', 'back to start'],
            about: ['about', 'bio', 'who', 'story', 'resume', 'cv', 'experience'],
            projects: ['projects', 'work', 'apps', 'portfolio', 'stuff'],
            awards: ['awards', 'prizes', 'won', 'achievements', 'medals'],
            showcase: ['showcase', 'skills', 'tech', 'stack', 'expertise', 'demonstration'],
            contact: ['contact', 'hire', 'email', 'message', 'call', 'reach'],
            dark: ['dark', 'night', 'black', 'dark mode'],
            light: ['light', 'day', 'white', 'bright'],
            scroll_up: ['scroll up', 'go up', 'move up', 'page up'],
            scroll_down: ['scroll down', 'go down', 'move down', 'page down', 'scroll'],
            smalltalk: ['hi', 'hello', 'hey', 'how are you', 'who are you', 'joke']
        },
        'te-IN': {
            home: ['హోమ్', 'మొదలు', 'ఇల్లు', 'ప్రారంభం'],
            about: ['గురించి', 'నేను', 'పరిచయం', 'బయో', 'రెజ్యూమ్'],
            projects: ['ప్రాజెక్టులు', 'పని', 'చేసినవి'],
            awards: ['అవార్డులు', 'గెలుచుకున్నవి', 'బహుమతులు'],
            showcase: ['షోకేస్', 'నైపుణ్యాలు', 'టెక్నాలజీ', 'తెలిసినవి'],
            contact: ['కాంటాక్ట్', 'మెసేజ్', 'ఈమెయిల్', 'ఫోన్'],
            dark: ['డార్క్', 'నలుపు', 'చీకటి'],
            light: ['లైట్', 'తెలుపు', 'వెలుగు'],
            scroll_up: ['పైకి', 'పైకి స్క్రోల్'],
            scroll_down: ['కిందకు', 'స్క్రోల్', 'కిందకు స్క్రోల్'],
            smalltalk: ['హలో', 'నమస్కారం', 'బాగున్నారా', 'ఎవరు మీరు']
        },
        'hi-IN': {
            home: ['होम', 'शुरुआत', 'घर', 'स्टार्ट'],
            about: ['बारे में', 'परिचय', 'बायोडेटा', 'कहानी'],
            projects: ['प्रोजेक्ट्स', 'काम', 'पोर्टफोलियो'],
            awards: ['पुरस्कार', 'इनाम', 'जीता'],
            showcase: ['शोकेस', 'कौशल', 'हुनर', 'टेक्नोलॉजी'],
            contact: ['संपर्क', 'मैसेज', 'ईमेल', 'नमस्ते'],
            dark: ['डार्क', 'काला', 'रात'],
            light: ['लाइट', 'सफेद', 'उजाला'],
            scroll_up: ['ऊपर', 'पेज ऊपर'],
            scroll_down: ['नीचे', 'स्क्रोल', 'नीचे स्क्रोल'],
            smalltalk: ['नमस्ते', 'हैलो', 'कैसे हो', 'कौन हो']
        }
    };

    private personas: Record<string, any> = {
        'en-US': {
            welcome: ["Hi! I'm Lok's AI assistant. Want to see some projects or just look around?", "Hello! I can help you find things here. What are you looking for?"],
            start: ["Listening! Tell me what to do.", "Ready! Where to?"],
            stop: ["Bye! Have a great day.", "See you later! Enjoy the site."],
            confused: ["Sorry, I didn't get that. Say it again?", "Not sure what you mean. Try 'projects' or 'about'."],
            dark: ["Switching to dark mode. Better for eyes!", "Okay, dark mode is on."],
            light: ["Switching to light mode. Nice and bright!", "Done! Light mode active."],
            already: ["We are already right here!", "You are already looking at it!"],
            projects: ["Sure! Here are the projects Lok worked on.", "Let's check out the work. Here you go."],
            about: ["Of course! Here is Lok's story.", "Changing to the about section now."],
            showcase: ["Here is the skills showcase. This is what Lok can do!", "Moving to the showcase section to see some cool tech."],
            awards: ["Checking out the awards! Here is the list.", "Moving to the achievements section."],
            contact: ["Sure! Here is how you can connect with Lok.", "Taking you to the contact section now."],
            scroll_up: ["Scrolling up for you.", "Heading back up."],
            scroll_down: ["Moving down the page.", "Scrolling down."],
            how_are_you: ["I'm doing great, thanks for asking! How can I help you?", "I'm good! Hope you are having a nice day."],
            who_are_you: ["I'm an AI assistant. I can navigate the site and answer questions for you.", "Think of me as your guide for this portfolio."],
            joke: ["Why do birds fly south? Because it's too far to walk! Haha.", "What do you call a fake noodle? An impasta! Haha."]
        },
        'te-IN': {
            welcome: ["హలో! లోక్ పోర్ట్‌ఫోలియోకి స్వాగతం. నేను మీకు ఎలా సహాయం చేయగలను?", "నమస్కారం! నేను మీ అసిస్టెంట్‌ని."],
            start: ["చెప్పండి, నేను వింటున్నాను.", "సిద్ధం! ఎక్కడికి వెళ్దాం?"],
            projects: ["ఖచ్చితంగా! ఇక్కడ అన్ని ప్రాజెక్టులు ఉన్నాయి.", "ప్రాజెక్టుల విభాగానికి వెళ్తున్నాం."],
            about: ["సరే, పరిచయ విభాగానికి తీసుకెళ్తున్నాను.", "లోక్ గురించి ఇక్కడ తెలుసుకోవచ్చు."],
            showcase: ["షోకేస్ విభాగానికి వెళ్తున్నాం. ఇక్కడ నైపుణ్యాలు చూడవచ్చు.", "ఇదిగోండి షోకేస్!"],
            awards: ["అవార్డులు ఇక్కడ చూడవచ్చు.", "గెలిచిన బహుమతులు ఇక్కడ ఉన్నాయి."],
            contact: ["తప్పకుండా! కాంటాక్ట్ సెక్షన్ కి వెళ్తున్నాం.", "నన్ను ఇక్కడ సంప్రదించవచ్చు."],
            dark: ["సరే, డార్క్ మోడ్ కి మారుస్తున్నాను."],
            light: ["లైట్ మోడ్ కి మార్చాను."],
            scroll_up: ["పైకి స్క్రోల్ చేస్తున్నాను."],
            scroll_down: ["కిందకు స్క్రోల్ చేస్తున్నాను."],
            confused: ["క్షమించండి, అర్థం కాలేదు. మళ్ళీ చెబుతారా?"],
            already: ["మనం ఇప్పటికే ఇక్కడే ఉన్నాం!"],
            how_are_you: ["నేను చాలా బాగున్నాను! మీరు ఎలా ఉన్నారు?"],
            who_are_you: ["నేను ఒక AI అసిస్టెంట్‌ని."],
            joke: ["ఒక జోక్ చెప్పనా? కాకికి ఇంగ్లీష్ లో ఏమంటారు? బ్లాక్ బర్డ్! హాహా."]
        },
        'hi-IN': {
            welcome: ["नमस्ते! मैं लोक का AI असिस्टेंट हूं। बताइए, क्या देखना चाहेंगे?"],
            start: ["जी, मैं सुन रहा हूं।", "बताइए, कहां चलना है?"],
            projects: ["बिल्कुल! ये रहे वो सारे प्रोजेक्ट्स जो लोक ने बनाए हैं."],
            about: ["जी, लोक के परिचय वाले भाग में चलते हैं।"],
            showcase: ["शोक़ेस भाग में चलते हैं। यहाँ हुनर देखिये।", "ये रहा शोक़ेस!"],
            awards: ["इनाम और पुरस्कार यहां देखिये।"],
            contact: ["जरूर! संपर्क करने के लिए यहां देखिये।"],
            dark: ["डार्क मोड ऑन कर दिया है।"],
            light: ["लाइट मोड ऑन कर दिया।"],
            scroll_up: ["ऊपर की ओर बढ़ रहे हैं।"],
            scroll_down: ["नीचे स्क्रोल कर रहा हूं।"],
            confused: ["माफी चाहता हूं, समझ नहीं आया।"],
            already: ["हम पहले से ही यहीं पर हैं!"],
            how_are_you: ["मैं बहुत अच्छा हूं! आप कैसे हैं?"],
            who_are_you: ["मैं एक AI असिस्टेंट हूं।"],
            joke: ["चुटकुला सुनेंगे? हाथी और चींटी की दोस्ती हो गई! हाहा।"]
        }
    };

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.initRecognition();
            const played = sessionStorage.getItem('aiWelcomePlayed');
            this.hasWelcomed = played === 'true';

            // Ensure voices are loaded for synthesis
            if (this.synthesis) {
                if (this.synthesis.onvoiceschanged !== undefined) {
                    this.synthesis.onvoiceschanged = () => this.synthesis?.getVoices();
                }
                this.synthesis.getVoices(); // Trigger initial load
            }
        }
    }

    private initRecognition() {
        if (!isPlatformBrowser(this.platformId)) return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.isSupported.set(true);
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.currentLang();

            this.recognition.onstart = () => {
                this.isListening.set(true);
                this.isProcessing = false; // Reset on start to ensure we aren't locked
            };

            this.recognition.onresult = (event: any) => {
                // If we are currently speaking, ignore any microphone input to prevent self-triggering
                if (this.isSpeaking()) return;

                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (interimTranscript) {
                    this.transcript.set(interimTranscript);
                    this.detectLanguage(interimTranscript);
                }

                if (finalTranscript) {
                    const text = finalTranscript.toLowerCase().trim();
                    this.transcript.set(text);
                    
                    // Prevent duplicate commands firing in rapid succession
                    const now = Date.now();
                    if (text === this.lastCommand && now - this.lastCommandTime < 1500) return;
                    
                    this.lastCommand = text;
                    this.lastCommandTime = now;
                    this.processCommand(text);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.warn('Speech recognition error:', event.error);
                
                if (event.error === 'not-allowed') {
                    this.isListening.set(false);
                    this.transcript.set('Permission denied. Please enable microphone.');
                    // Explicit alert for mobile users to help discovery
                    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                        alert("Microphone access is required for the AI Assistant. Please enable it in your browser settings.");
                    }
                } else if (event.error === 'network') {
                    this.transcript.set('Network error. Check your connection.');
                } else if (event.error === 'no-speech') {
                    // This is common, just restart quietly
                }
                
                // Don't auto-restart on critical permission errors
                if (event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
                    this.restartRecognition();
                } else {
                    this.isListening.set(false);
                }
            };
            
            this.recognition.onend = () => {
                if (this.isListening() && !this.isSpeaking()) {
                    this.restartRecognition();
                }
            };
        } else {
            this.isSupported.set(false);
            console.warn('Speech Recognition API not found in this browser.');
        }
    }

    private restartRecognition() {
        if (!isPlatformBrowser(this.platformId) || !this.recognition) return;
        
        if (this.isListening() && !this.isSpeaking()) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => {
                try { 
                    this.recognition.abort(); // Ensure it's fully stopped before starting
                    setTimeout(() => {
                        try {
                            this.recognition.lang = this.currentLang();
                            this.recognition.start();
                        } catch (e) {}
                    }, 100);
                } catch (e) {}
            }, 600);
        }
    }

    private detectLanguage(text: string) {
        const isTelugu = /[\u0C00-\u0C7F]/.test(text);
        const isHindi = /[\u0900-\u097F]/.test(text);
        let newLang = 'en-US';
        if (isTelugu) newLang = 'te-IN';
        else if (isHindi) newLang = 'hi-IN';
        if (newLang !== this.currentLang()) {
            this.currentLang.set(newLang);
            if (this.recognition) this.recognition.lang = newLang;
        }
    }

    toggleListening() {
        if (!this.isSupported()) return;
        if (this.isListening()) {
            this.isListening.set(false);
            this.speak(this.getPersonaRes('stop'));
            try { this.recognition.stop(); } catch (e) {}
        } else {
            this.start();
        }
    }

    private start() {
        this.isListening.set(true);
        this.transcript.set('Ready...');
        try {
            this.recognition.start();
            if (!this.hasWelcomed) {
                this.speak(this.getPersonaRes('welcome'));
                this.setWelcomePlayed();
            } else {
                this.speak(this.getPersonaRes('start'));
            }
        } catch (e) { this.restartRecognition(); }
    }

    private setWelcomePlayed() {
        this.hasWelcomed = true;
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('aiWelcomePlayed', 'true');
        }
    }

    private processCommand(text: string) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        let matchedConcept = '';
        const lang = this.currentLang();
        const dict = this.dictionary[lang] || this.dictionary['en-US'];

        for (const [concept, keywords] of Object.entries(dict)) {
            if (keywords.some(kw => text.includes(kw))) {
                matchedConcept = concept;
                break;
            }
        }

        // Small talk
        if (matchedConcept === 'smalltalk' || text.includes('how are you') || text.includes('bagunnara') || text.includes('kaise ho')) {
            if (text.includes('how') || text.includes('bagunnara') || text.includes('kaise')) {
                this.speak(this.getPersonaRes('how_are_you'));
            } else if (text.includes('who') || text.includes('miru') || text.includes('kaun')) {
                this.speak(this.getPersonaRes('who_are_you'));
            } else if (text.includes('joke') || text.includes('chutkula')) {
                this.speak(this.getPersonaRes('joke'));
            } else {
                this.isProcessing = false;
            }
            return;
        }

        // Actions
        if (matchedConcept === 'dark' || matchedConcept === 'light') {
            this.handleTheme(matchedConcept);
        } else if (matchedConcept === 'scroll_up') {
            this.scrollBy(-window.innerHeight * 0.5, 'up');
        } else if (matchedConcept === 'scroll_down') {
            this.scrollBy(window.innerHeight * 0.5, 'down');
        } else if (matchedConcept) {
            this.navigate(matchedConcept);
        } else if (text.includes('linkedin') || text.includes('github') || text.includes('email')) {
            this.handleLinks(text);
        } else {
            if (text.length > 3) {
                this.speak(this.getPersonaRes('confused'));
            } else {
                // If it's a very short sound or irrelevant, unlock processing
                this.isProcessing = false;
                this.transcript.set(''); // Clear small noises
            }
        }
        
        // Clear transcript after a short delay if processing is done
        setTimeout(() => {
            if (!this.isProcessing && !this.isSpeaking()) {
                this.transcript.set('');
            }
        }, 3000);
    }

    private handleTheme(type: string) {
        const current = document.documentElement.getAttribute('data-theme');
        const btn = document.querySelector('.theme-switch') as HTMLElement;
        if (type === current) {
            this.speak(this.getPersonaRes('already', type));
        } else if (btn) {
            btn.click();
            this.speak(this.getPersonaRes(type));
        } else {
            this.isProcessing = false;
        }
    }

    private navigate(concept: string) {
        const routeMap: any = { home:'/home', about:'/about', projects:'/projects', awards:'/awards', showcase:'/home', contact:'/contact' };
        const path = routeMap[concept];
        
        if (!path) {
            this.isProcessing = false;
            return;
        }

        const currentUrl = this.router.url;
        const targetId = concept === 'showcase' ? 'showcase' : concept;

        if (currentUrl.includes(path) || (currentUrl === '/' && concept === 'home')) {
            this.speak(this.getPersonaRes(concept));
            this.scrollToId(targetId);
        } else {
            this.speak(this.getPersonaRes(concept));
            this.router.navigate([path]).then(() => {
                const searchId = (concept === 'showcase') ? 'showcase' : concept;
                setTimeout(() => this.scrollToId(searchId), 600);
            });
        }
    }

    private handleLinks(text: string) {
        if (text.includes('linkedin')) window.open('https://linkedin.com/in/lok-prasanth', '_blank');
        else if (text.includes('github')) window.open('https://github.com/lokalamanda', '_blank');
        else if (text.includes('email')) window.open('mailto:lokalamanda@gmail.com', '_blank');
        const msg = (this.currentLang() === 'te-IN') ? "ఓపెన్ చేస్తున్నాను." : (this.currentLang() === 'hi-IN' ? "जी, ओपन कर रहा हूं।" : "Opening that for you!");
        this.speak(msg);
    }

    private scrollBy(y: number, direction: 'up' | 'down') {
        window.scrollBy({ top: y, behavior: 'smooth' });
        this.speak(this.getPersonaRes(direction === 'up' ? 'scroll_up' : 'scroll_down'));
    }

    private scrollToId(id: string) {
        const el = document.getElementById(id);
        if (el) {
            const yOffset = -100; // Account for fixed navbar
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
            const firstSection = document.querySelector('section');
            if (firstSection) firstSection.scrollIntoView({ behavior: 'smooth' });
        }
        this.isProcessing = false;
    }

    private getPersonaRes(key: string, meta = ''): string {
        const lang = this.currentLang();
        const templates = this.personas[lang][key] || this.personas['en-US'][key] || ["..."];
        const raw = templates[Math.floor(Math.random() * templates.length)];
        return raw.replace('${page}', meta).replace('${lang}', meta);
    }

    speak(text: string) {
        if (!text || !this.synthesis || !isPlatformBrowser(this.platformId)) {
            this.isProcessing = false;
            return;
        }

        // 1. Immediately signal we are speaking to prevent input processing
        this.isSpeaking.set(true);
        this.lastResponse.set(text);

        // 2. Stop recognition to prevent feedback
        try { this.recognition.abort(); } catch (e) {}
        
        // 3. Prepare and speak
        this.synthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = this.currentLang();
        
        const voices = this.synthesis.getVoices();
        let voice = voices.find(v => v.lang === u.lang && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Apple')));
        if (!voice) voice = voices.find(v => v.lang === u.lang);
        if (voice) u.voice = voice;

        u.onend = () => {
            // Give a tiny buffer before allowing recognition again
            setTimeout(() => {
                this.isSpeaking.set(false);
                this.isProcessing = false;
                this.restartRecognition();
            }, 100);
        };
        u.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            this.isSpeaking.set(false);
            this.isProcessing = false;
            this.restartRecognition();
        };

        this.synthesis.speak(u);
    }
}
