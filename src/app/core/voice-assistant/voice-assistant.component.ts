import { Component, inject, signal, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone, OnDestroy, PLATFORM_ID, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { VoiceControlService } from '../services/voice-control.service';
import { ThemeService } from '../services/theme.service';
import { trigger, transition, style, animate } from '@angular/animations';
import * as THREE from 'three';

@Component({
    selector: 'app-voice-assistant',
    standalone: true,
    imports: [CommonModule],
    animations: [
        trigger('bubbleScale', [
            transition(':enter', [
                style({ transform: 'scale(0.8) translateX(20px)', opacity: 0 }),
                animate('0.3s ease-out', style({ transform: 'scale(1) translateX(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('0.2s ease-in', style({ transform: 'scale(0.8) translateX(20px)', opacity: 0 }))
            ])
        ])
    ],
    template: `
    <div class="voice-assistant-container" 
         [class.listening]="voiceControl.isListening()"
         [class.processing]="voiceControl.isProcessing()"
         [class.speaking]="voiceControl.isSpeaking()"
         [class.sticky-visible]="shouldShowSticky()"
         [class.unsupported]="!voiceControl.isSupported()">
      
      <!-- Status Badge -->
      @if (voiceControl.isListening() || voiceControl.isProcessing()) {
        <div class="status-badge" @bubbleScale [class.processing]="voiceControl.isProcessing()">
          <span class="status-dot"></span>
          {{ voiceControl.isProcessing() ? 'Thinking' : 'Listening' }}
        </div>
      }

      <!-- Speech Bubble -->
      @if (voiceControl.transcript() || voiceControl.lastResponse() || voiceControl.isSpeaking() || voiceControl.isProcessing()) {
        <div class="transcript-bubble" @bubbleScale 
             [class.is-speaking]="voiceControl.isSpeaking()" 
             [class.is-processing]="voiceControl.isProcessing()">
          <div class="bubble-content">
            <div class="text-wrapper centered">
              {{ voiceControl.isSpeaking() ? voiceControl.lastResponse() : voiceControl.transcript() }}
            </div>
          </div>
          <div class="bubble-arrow"></div>
        </div>
      }

      <!-- Command Hint Bubble -->
      @if (!voiceControl.isListening() && !voiceControl.isSpeaking() && !voiceControl.isProcessing() && showSpeechBubble()) {
        <div class="hint-bubble" @bubbleScale>
          <div class="hint-label">Guided Navigation</div>
          <div class="hint-text">"{{ voiceControl.hints[voiceControl.hintIndex()] }}"</div>
        </div>
      }

      <!-- 3D Mini Robot Assistant -->
      <div class="robot-canvas-wrapper" 
           (click)="handleAssistantClick()"
           [class.pulse-active]="voiceControl.isListening()"
           [class.assistant-active]="voiceControl.isListening() || voiceControl.isSpeaking() || voiceControl.isProcessing()"
           [title]="voiceControl.isSupported() ? 'Click to talk' : 'Voice not supported'">
        <canvas #assistantCanvas class="assistant-canvas" [class.hidden]="!voiceControl.isSupported()"></canvas>
        
        @if (!voiceControl.isSupported()) { <div class="unsupported-icon">🚫</div> }

        @if (!voiceControl.isListening() && !voiceControl.isSpeaking() && !voiceControl.isProcessing()) {
            <div class="click-hint">Talk</div>
        }
      </div>
    </div>
    `,
    styles: [`
    .voice-assistant-container {
      position: fixed;
      right: 25px;
      bottom: 25px;
      z-index: 2500;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 15px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s var(--transition-spring);

      &.sticky-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        pointer-events: auto;
      }

      &:not(.sticky-visible) {
        visibility: hidden;
      }

      @media (max-width: 480px) {
        right: 20px;
        bottom: calc(20px + env(safe-area-inset-bottom));
        gap: 12px;
      }
    }

    .robot-canvas-wrapper {
      width: 80px;
      height: 80px;
      cursor: pointer;
      pointer-events: auto;
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(25px);
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.4s var(--transition-spring);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;

      &.pulse-active::before {
        content: '';
        position: absolute;
        inset: -10px;
        border-radius: 50%;
        border: 2px solid var(--accent-primary);
        animation: ripple 1.5s infinite;
        opacity: 0;
      }

      &.assistant-active {
        border-color: var(--accent-secondary);
        box-shadow: 0 0 40px rgba(var(--accent-secondary-rgb), 0.3);
      }

      @media (max-width: 480px) {
        width: 60px;
        height: 60px;
      }
    }

    .assistant-canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
      &.hidden { display: none; }
    }

    .click-hint {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        font-size: 0.7rem;
        color: var(--text-primary);
        opacity: 0;
        white-space: nowrap;
        pointer-events: none;
        transition: all 0.3s ease;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        z-index: 5;

        @media (max-width: 480px) {
            display: none;
        }
    }


    @keyframes ripple {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(1.3); opacity: 0; }
    }

    .status-badge {
      position: absolute;
      top: -35px;
      background: var(--bg-glass);
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--bg-glass-border);
      animation: badgeSlide 0.3s ease;

      .status-dot {
        width: 8px;
        height: 8px;
        background: #22c55e;
        border-radius: 50%;
        box-shadow: 0 0 10px #22c55e;
        animation: dotPulse 1s infinite alternate;
      }

      &.processing {
        .status-dot { background: var(--accent-secondary); box-shadow: 0 0 10px var(--accent-secondary); }
      }
    }

    @keyframes dotPulse {
      from { opacity: 0.5; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1.1); }
    }

    .transcript-bubble {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--bg-glass-border);
      padding: 14px 20px;
      border-radius: 20px;
      max-width: 300px;
      box-shadow: var(--shadow-lg);
      margin-right: 15px;
      position: relative;
      pointer-events: auto;

      @media (max-width: 480px) {
          max-width: calc(100vw - 40px);
          padding: 10px 18px;
          margin-right: 0;
          text-align: center;
          border-radius: 18px;
          font-size: 0.85rem;
      }

      &.is-speaking {
          border-color: var(--accent-primary);
          box-shadow: 0 0 20px var(--accent-glow);
      }

      &.is-processing {
          border-color: var(--accent-secondary);
          animation: thinkingPulse 1.5s infinite ease-in-out;
      }

      .bubble-content {
        display: flex;
        justify-content: center;
        color: var(--text-primary);

        .text-wrapper {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.5;
          text-align: left;

          &.centered {
            text-align: center;
          }
        }
      }

      .processing-dots {
          display: flex;
          gap: 4px;
          justify-content: flex-end;
          padding: 5px 0;
          
          span {
              width: 6px;
              height: 6px;
              background: var(--accent-secondary);
              border-radius: 50%;
              animation: dotFlashing 1s infinite alternate;
              
              &:nth-child(2) { animation-delay: 0.2s; }
              &:nth-child(3) { animation-delay: 0.4s; }
          }
      }

      .bubble-arrow {
        position: absolute;
        right: -8px;
        top: 50%;
        transform: translateY(-50%) rotate(45deg);
        width: 16px;
        height: 16px;
        background: var(--bg-glass);
        border-right: 1px solid var(--bg-glass-border);
        border-top: 1px solid var(--bg-glass-border);

        @media (max-width: 480px) {
            display: none; 
        }
      }
    }

    .hint-bubble {
      background: var(--bg-glass);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border: 1px solid var(--accent-glow);
      padding: 10px 15px;
      border-radius: 12px;
      margin-right: 15px;
      margin-bottom: 5px;
      pointer-events: auto;
      max-width: 200px;
      animation: floatHint 3s infinite ease-in-out;

      .hint-label {
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--accent-secondary);
        letter-spacing: 1px;
        margin-bottom: 2px;
        text-align: right;
      }

      .hint-text {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-style: italic;
        text-align: right;
      }
    }

    @keyframes floatHint {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    @keyframes thinkingPulse {
        0%, 100% { box-shadow: 0 0 10px rgba(var(--accent-secondary-rgb), 0.1); }
        50% { box-shadow: 0 0 30px rgba(var(--accent-secondary-rgb), 0.3); }
    }

    @keyframes dotFlashing {
        0% { opacity: 0.2; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1.2); }
    }
    `]
})
export class VoiceAssistantComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('assistantCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private platformId = inject(PLATFORM_ID);
    private ngZone = inject(NgZone);
    voiceControl = inject(VoiceControlService);
    private themeService = inject(ThemeService);

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private animationId = 0;
    private clock = new THREE.Clock();
    
    // Robot Parts
    private bodyGroup!: THREE.Group;
    private headGroup!: THREE.Group;
    private robotContainer!: THREE.Group;
    private leftEye!: THREE.Mesh;
    private rightEye!: THREE.Mesh;
    private leftArmGroup!: THREE.Group;
    private rightArmGroup!: THREE.Group;
    private leftLowerArmMin!: THREE.Group;
    private rightLowerArmMin!: THREE.Group;
    private leftHandGroup!: THREE.Group;
    private rightHandGroup!: THREE.Group;
    private leftFingersMin: THREE.Mesh[] = [];
    private rightFingersMin: THREE.Mesh[] = [];
    private currentGestureMin = 'idle';
    private gestureTimeMin = 0;
    private idleActivityMin = 'normal';
    private idleActivityTimeMin = 0;
    private thrusterGlow!: THREE.PointLight;
    private materials: Record<string, THREE.MeshStandardMaterial> = {};
    private lights: Record<string, THREE.Light> = {};

    isScrolledDown = signal(false);
    showSpeechBubble = signal(false);

    constructor() {
        effect(() => {
            const isListening = this.voiceControl.isListening();
            const isSpeaking = this.voiceControl.isSpeaking();
            const isProcessing = this.voiceControl.isProcessing();
            const transcript = this.voiceControl.transcript();
            
            if (isSpeaking || isProcessing || (isListening && transcript)) {
                this.showSpeechBubble.set(true);
            } else {
                // Keep bubble visible for hints when idle
                this.showSpeechBubble.set(true);
            }
        });

        effect(() => {
            const isDark = this.themeService.isDark();
            this.updateThemeColors(isDark);
        });
    }

    private updateThemeColors(isDark: boolean) {
        if (!this.scene) return;
        const accent1 = isDark ? 0x5fa879 : 0x2d8a4e;
        
        if (this.materials['glow']) {
            this.materials['glow'].color.setHex(accent1);
            this.materials['glow'].emissive.setHex(accent1);
        }
        if (this.thrusterGlow) {
            this.thrusterGlow.color.setHex(accent1);
        }
        if (this.lights['ambient']) {
            (this.lights['ambient'] as THREE.AmbientLight).intensity = isDark ? 0.6 : 1.0;
        }
    }

    ngOnInit() {
        this.checkScroll();
    }

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.initThreeJS(), 500);
        }
    }

    ngOnDestroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.renderer) this.renderer.dispose();
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.checkScroll();
    }

    private checkScroll() {
        if (typeof window !== 'undefined') {
            const threshold = window.innerWidth <= 480 ? 200 : 400;
            this.isScrolledDown.set(window.scrollY > threshold);
        }
    }

    shouldShowSticky(): boolean {
        return !this.voiceControl.isHeroVisible() || this.isScrolledDown();
    }

    handleAssistantClick() {
        this.voiceControl.toggleListening();
    }

    private initThreeJS() {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        this.camera.position.set(0, 0, 3.5);

        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        const isDark = this.themeService.isDark();
        const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 1.0);
        this.lights['ambient'] = ambient;
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(2, 2, 2);
        this.scene.add(mainLight);

        const accent1 = isDark ? 0x5fa879 : 0x2d8a4e;
        this.thrusterGlow = new THREE.PointLight(accent1, 1, 3);
        this.thrusterGlow.position.set(0, -1, 0.5);
        this.scene.add(this.thrusterGlow);

        this.createMiniRobot();
        
        this.ngZone.runOutsideAngular(() => this.animate());
    }

    private createMiniRobot() {
        this.robotContainer = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xa3c6b2, 
            metalness: 0.6, 
            roughness: 0.4 
        });
        const isDark = this.themeService.isDark();
        const glowMat = new THREE.MeshStandardMaterial({ 
            color: isDark ? 0x5fa879 : 0x2d8a4e, 
            emissive: isDark ? 0x5fa879 : 0x2d8a4e, 
            emissiveIntensity: 1 
        });
        this.materials['glow'] = glowMat;
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0x121413, 
            metalness: 0.9 
        });

        // Head
        this.headGroup = new THREE.Group();
        const headGeo = new THREE.BoxGeometry(0.7, 0.5, 0.5);
        const head = new THREE.Mesh(headGeo, bodyMat);
        this.headGroup.add(head);

        const screenGeo = new THREE.PlaneGeometry(0.6, 0.4);
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.251;
        this.headGroup.add(screen);

        const eyeGeo = new THREE.CapsuleGeometry(0.05, 0.08, 4, 8);
        this.leftEye = new THREE.Mesh(eyeGeo, glowMat.clone());
        this.leftEye.position.set(-0.15, 0, 0.26);
        this.headGroup.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, glowMat.clone());
        this.rightEye.position.set(0.15, 0, 0.26);
        this.headGroup.add(this.rightEye);

        this.headGroup.position.y = 0.4;
        this.robotContainer.add(this.headGroup);

        // Body
        this.bodyGroup = new THREE.Group();
        const torsoGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
        const torso = new THREE.Mesh(torsoGeo, bodyMat);
        this.bodyGroup.add(torso);

        // ARTICULATED ARMS
        const createMiniArm = (isLeft: boolean) => {
            const armGroup = new THREE.Group();
            const jointMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
            
            // Shoulder
            armGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat));
            
            // Upper Arm
            const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.3), bodyMat);
            upper.position.y = -0.15;
            armGroup.add(upper);

            // Elbow & Lower Arm
            const lowArmGroup = new THREE.Group();
            lowArmGroup.position.y = -0.3;
            lowArmGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), jointMat));
            
            const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.25), bodyMat);
            lower.position.y = -0.125;
            lowArmGroup.add(lower);

            // Hand
            const handGroup = new THREE.Group();
            handGroup.position.y = -0.25;
            handGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), bodyMat));
            
            // Fingers
            const fingerGeo = new THREE.CapsuleGeometry(0.012, 0.04, 4, 8);
            const fingers: THREE.Mesh[] = [];
            for (let i = 0; i < 4; i++) {
                const finger = new THREE.Mesh(fingerGeo, bodyMat);
                finger.position.set((i - 1.5) * 0.02, -0.1, 0);
                handGroup.add(finger);
                fingers.push(finger);
            }

            lowArmGroup.add(handGroup);
            armGroup.add(lowArmGroup);
            return { armGroup, handGroup, lowArmGroup, fingers };
        };

        const left = createMiniArm(true);
        this.leftArmGroup = left.armGroup;
        this.leftLowerArmMin = left.lowArmGroup;
        this.leftHandGroup = left.handGroup;
        this.leftFingersMin = left.fingers;
        
        const right = createMiniArm(false);
        this.rightArmGroup = right.armGroup;
        this.rightLowerArmMin = right.lowArmGroup;
        this.rightHandGroup = right.handGroup;
        this.rightFingersMin = right.fingers;

        this.leftArmGroup.position.set(-0.35, 0.1, 0);
        this.rightArmGroup.position.set(0.35, 0.1, 0);
        this.bodyGroup.add(this.leftArmGroup);
        this.bodyGroup.add(this.rightArmGroup);

        // Thruster
        const thrusterGeo = new THREE.CylinderGeometry(0.3, 0.1, 0.2, 16);
        const thruster = new THREE.Mesh(thrusterGeo, bodyMat);
        thruster.position.y = -0.35;
        this.bodyGroup.add(thruster);
        
        this.bodyGroup.position.y = -0.1;
        this.robotContainer.add(this.bodyGroup);

        this.robotContainer.position.y = -0.2;
        this.scene.add(this.robotContainer);
    }

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        const t = this.clock.getElapsedTime();

        if (this.shouldShowSticky()) {
            this.robotContainer.position.y = -0.1 + Math.sin(t * 2) * 0.08;
            this.robotContainer.rotation.y = Math.sin(t * 0.5) * 0.15;

            // Arm Gestures (State-based human gestures & Idle activities)
            this.gestureTimeMin += 0.016;
            this.idleActivityTimeMin += 0.016;
            const isSpeaking = this.voiceControl.isSpeaking();
            const isProcessing = this.voiceControl.isProcessing();
            
            if (isSpeaking || isProcessing) {
                this.idleActivityMin = 'normal';
                if (this.gestureTimeMin > 3.5) {
                    const gestures = isProcessing ? ['thinking'] : ['thinking', 'talking', 'ok', 'bye'];
                    this.currentGestureMin = gestures[Math.floor(Math.random() * gestures.length)];
                    this.gestureTimeMin = 0;
                }
                // Force thinking gesture if processing and no current gesture
                if (isProcessing && this.currentGestureMin === 'idle') {
                    this.currentGestureMin = 'thinking';
                }
            } else {
                // Random idle behaviors - High variety
                if (this.idleActivityTimeMin > 6) {
                    const activities = ['normal', 'look_around', 'check_palm', 'stretch', 'think_deep', 'posture_reset', 'shrug'];
                    this.idleActivityMin = activities[Math.floor(Math.random() * activities.length)];
                    this.idleActivityTimeMin = 0;
                }
                this.currentGestureMin = 'idle';
            }

            const lerpSpd = 0.1;
            let lArmRot = { x: -0.2, y: 0, z: 0.2 };
            let rArmRot = { x: -0.2, y: 0, z: -0.2 };
            let lElbowRot = -0.2;
            let rElbowRot = -0.2;

            if (isSpeaking) {
                switch (this.currentGestureMin) {
                    case 'thinking':
                        rArmRot = { x: -1.2, y: -0.6, z: -0.3 };
                        rElbowRot = -1.4;
                        break;
                    case 'ok':
                        rArmRot = { x: -0.8, y: 0.1, z: -0.6 };
                        rElbowRot = -0.8;
                        this.rightFingersMin[0].rotation.z = -1.2;
                        break;
                    case 'bye':
                        rArmRot = { x: -2.1, y: 0, z: -0.4 + Math.sin(t * 8) * 0.3 };
                        rElbowRot = -0.2;
                        break;
                    case 'talking':
                        const cadence = Math.sin(t * 5);
                        lArmRot = { x: -0.4 + cadence * 0.2, y: 0.2, z: 0.2 };
                        rArmRot = { x: -0.4 + Math.cos(t * 4) * 0.2, y: -0.2, z: -0.2 };
                        lElbowRot = -0.6 + cadence * 0.4;
                        rElbowRot = -0.6 + Math.cos(t * 4) * 0.4;
                        break;
                }
            } else {
                switch (this.idleActivityMin) {
                    case 'look_around':
                        if (this.headGroup) {
                            this.headGroup.rotation.y += Math.sin(t * 0.4) * 0.005;
                            this.headGroup.rotation.x += Math.cos(t * 0.3) * 0.003;
                        }
                        break;
                    case 'check_palm':
                        lArmRot = { x: -1.1, y: 0.7, z: 0.2 };
                        lElbowRot = -1.6;
                        if (this.headGroup) {
                            this.headGroup.rotation.y += (-0.3 - this.headGroup.rotation.y) * 0.05;
                        }
                        break;
                    case 'stretch':
                        lArmRot = { x: -0.2, y: 0, z: 0.7 };
                        rArmRot = { x: -0.2, y: 0, z: -0.7 };
                        break;
                    case 'think_deep':
                        rArmRot = { x: -1.1, y: -0.5, z: -0.3 };
                        rElbowRot = -1.5;
                        break;
                    case 'posture_reset':
                        lArmRot = { x: -0.4, y: 0.2, z: 0.1 };
                        rArmRot = { x: -0.4, y: -0.2, z: -0.1 };
                        lElbowRot = -0.6;
                        rElbowRot = -0.6;
                        break;
                    case 'shrug':
                        lArmRot = { x: -0.3, y: 0, z: 0.3 };
                        rArmRot = { x: -0.3, y: 0, z: -0.3 };
                        break;
                }
            }

            this.leftArmGroup.rotation.x += (lArmRot.x - this.leftArmGroup.rotation.x) * lerpSpd;
            this.leftArmGroup.rotation.y += (lArmRot.y - this.leftArmGroup.rotation.y) * lerpSpd;
            this.leftArmGroup.rotation.z += (lArmRot.z - this.leftArmGroup.rotation.z) * lerpSpd;
            this.rightArmGroup.rotation.x += (rArmRot.x - this.rightArmGroup.rotation.x) * lerpSpd;
            this.rightArmGroup.rotation.y += (rArmRot.y - this.rightArmGroup.rotation.y) * lerpSpd;
            this.rightArmGroup.rotation.z += (rArmRot.z - this.rightArmGroup.rotation.z) * lerpSpd;

            this.leftLowerArmMin.rotation.x += (lElbowRot - this.leftLowerArmMin.rotation.x) * lerpSpd;
            this.rightLowerArmMin.rotation.x += (rElbowRot - this.rightLowerArmMin.rotation.x) * lerpSpd;

            if (this.headGroup) {
                const headCadence = isSpeaking ? Math.sin(t * 12) * 0.06 : Math.sin(t * 1) * 0.03;
                this.headGroup.rotation.x += (headCadence - this.headGroup.rotation.x) * 0.1;
            }

            // Eye & Thruster color updates
            if (this.leftEye && this.rightEye) {
                const isListening = this.voiceControl.isListening();
                const isSpeaking = this.voiceControl.isSpeaking();
                const targetColor = isSpeaking ? 0xa88b5f : (isListening ? 0x5fa879 : 0x5f8ba8);
                const colorObj = new THREE.Color(targetColor);
                
                (this.leftEye.material as THREE.MeshStandardMaterial).color.lerp(colorObj, 0.1);
                (this.leftEye.material as THREE.MeshStandardMaterial).emissive.lerp(colorObj, 0.1);
                (this.rightEye.material as THREE.MeshStandardMaterial).color.lerp(colorObj, 0.1);
                (this.rightEye.material as THREE.MeshStandardMaterial).emissive.lerp(colorObj, 0.1);
                
                if (this.thrusterGlow) {
                    this.thrusterGlow.color.lerp(colorObj, 0.1);
                    this.thrusterGlow.intensity = 1 + Math.sin(t * 5) * 0.5;
                }
            }

            this.renderer.render(this.scene, this.camera);
        }
    }
}
