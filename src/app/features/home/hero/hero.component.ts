import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, AfterViewInit, NgZone, PLATFORM_ID, inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VoiceControlService } from '../../../core/services/voice-control.service';
import { fadeInLeft, fadeInRight } from '../../../shared/animations/animations';
import { ThemeService } from '../../../core/services/theme.service';
import * as THREE from 'three';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [CommonModule, RouterLink],
    animations: [fadeInLeft, fadeInRight],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('threeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private platformId = inject(PLATFORM_ID);
    private ngZone = inject(NgZone);
    voiceControl = inject(VoiceControlService);
    private themeService = inject(ThemeService);
    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private animationId = 0;
    private clock = new THREE.Clock();
    private mouseX = 0;
    private mouseY = 0;
    private headGroup!: THREE.Group;
    private bodyGroup!: THREE.Group;
    private robotGroup!: THREE.Group;
    private leftEye!: THREE.Mesh;
    private rightEye!: THREE.Mesh;
    private leftArmGroup!: THREE.Group;
    private rightArmGroup!: THREE.Group;
    private leftLowerArmGroup!: THREE.Group;
    private rightLowerArmGroup!: THREE.Group;
    private leftHandGroup!: THREE.Group;
    private rightHandGroup!: THREE.Group;
    private leftFingers: THREE.Mesh[] = [];
    private rightFingers: THREE.Mesh[] = [];
    private currentGesture = 'idle';
    private gestureTime = 0;
    private idleActivity = 'normal';
    private idleActivityTime = 0;
    private particles: THREE.Points | null = null;
    private floatingRings: THREE.Mesh[] = [];
    private isSpeaking = false;
    private speechBubbleTimeout: any;

    roles = ['UI/UX Developer', 'UI Engineer', 'UI Testing Specialist', 'Analytics Specialist'];
    currentRole = signal('UI Engineer');
    currentRoleIndex = 0;
    isTyping = signal(true);
    displayText = signal('');
    showSpeechBubble = signal(false);
    speechText = signal('');
    voiceEnabled = signal(true);
    isLoaded = signal(false);

    private typewriterTimer: any;
    private roleTimer: any;
    private materials: Record<string, THREE.MeshStandardMaterial> = {};
    private lights: Record<string, THREE.Light> = {};

    constructor() {
        effect(() => {
            const transcript = this.voiceControl.transcript();
            const isListening = this.voiceControl.isListening();
            const isSpeaking = this.voiceControl.isSpeaking();
            const lastResponse = this.voiceControl.lastResponse();

            if (isSpeaking) {
                this.speechText.set(lastResponse);
                this.showSpeechBubble.set(true);
            } else if (isListening && transcript) {
                this.speechText.set(transcript);
                this.showSpeechBubble.set(true);
            }

            // Auto-hide bubble if neither listening nor speaking for a while
            if (!isListening && !isSpeaking) {
                clearTimeout(this.speechBubbleTimeout);
                this.speechBubbleTimeout = setTimeout(() => {
                    this.showSpeechBubble.set(false);
                }, 2000);
            }
        });

        effect(() => {
            this.isSpeaking = this.voiceControl.isSpeaking();
        });

        effect(() => {
            const isDark = this.themeService.isDark();
            this.updateThemeColors(isDark);
        });
    }

    private updateThemeColors(isDark: boolean): void {
        if (!this.scene) return;

        // Vibrant "Pop" Palette for Light Mode
        const accent1 = isDark ? 0x5fa879 : 0x339af0; // Electric Blue
        const accent2 = isDark ? 0xa88b5f : 0xff00ff; // Vivid Magenta
        const accent3 = isDark ? 0x5f8ba8 : 0x7950f2; // Bright Indigo

        if (this.materials['body']) {
            this.materials['body'].color.setHex(isDark ? 0xffffff : 0xffffff);
            this.materials['body'].metalness = isDark ? 0.6 : 0.4;
            this.materials['body'].roughness = isDark ? 0.4 : 0.1; // More glossy in light mode
            this.materials['body'].emissive.setHex(isDark ? 0x121413 : 0xdedede);
            this.materials['body'].emissiveIntensity = isDark ? 0.2 : 0.1;
        }

        if (this.materials['glow']) {
            this.materials['glow'].color.setHex(accent1);
            this.materials['glow'].emissive.setHex(accent1);
        }
        if (this.materials['accent']) {
            this.materials['accent'].color.setHex(accent2);
            this.materials['accent'].emissive.setHex(accent2);
        }
        if (this.materials['flame']) {
            this.materials['flame'].color.setHex(accent1);
            this.materials['flame'].emissive.setHex(accent1);
        }

        this.floatingRings.forEach((ring, i) => {
            const color = i === 0 ? accent1 : i === 1 ? accent2 : accent3;
            (ring.material as THREE.MeshStandardMaterial).color.setHex(color);
            (ring.material as THREE.MeshStandardMaterial).emissive.setHex(color);
        });

        if (this.lights['rim']) this.lights['rim'].color.setHex(accent2);
        if (this.lights['bottom']) this.lights['bottom'].color.setHex(accent3);
        if (this.lights['ambient']) (this.lights['ambient'] as THREE.AmbientLight).intensity = isDark ? 0.4 : 1.5;
        if (this.lights['ambient']) (this.lights['ambient'] as THREE.AmbientLight).color.setHex(isDark ? 0x222724 : 0xffffff);

        if (this.materials['platform']) {
            this.materials['platform'].color.setHex(isDark ? 0x121413 : 0xced4da);
            this.materials['platform'].emissive.setHex(accent1);
            this.materials['platform'].emissiveIntensity = isDark ? 0.1 : 0.3;
        }
        if (this.materials['platformGlow']) {
            this.materials['platformGlow'].color.setHex(accent1);
            this.materials['platformGlow'].emissive.setHex(accent1);
            this.materials['platformGlow'].emissiveIntensity = isDark ? 1.0 : 2.0;
        }

        if (this.particles) {
            const mat = this.particles.material as THREE.PointsMaterial;
            mat.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
            mat.opacity = isDark ? 0.6 : 1.0;
            mat.needsUpdate = true;
        }
    }

    ngOnInit(): void {
        this.startTypewriter();
        this.voiceControl.isHeroVisible.set(true);
    }

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => {
                this.initThreeJS();
                this.isLoaded.set(true);
            }, 300);
        }
    }

    ngOnDestroy(): void {
        this.voiceControl.isHeroVisible.set(false);
        cancelAnimationFrame(this.animationId);
        clearInterval(this.typewriterTimer);
        clearTimeout(this.roleTimer);
        clearTimeout(this.speechBubbleTimeout);
        if (this.renderer) {
            this.renderer.dispose();
        }
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('resize', this.onResize);
    }

    // ===== TYPEWRITER =====
    private startTypewriter(): void {
        this.typeNextRole();
    }

    private typeNextRole(): void {
        const role = this.roles[this.currentRoleIndex];
        let charIndex = 0;
        this.isTyping.set(true);
        this.displayText.set('');

        this.typewriterTimer = setInterval(() => {
            if (charIndex < role.length) {
                this.displayText.set(role.substring(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(this.typewriterTimer);
                this.isTyping.set(false);

                this.roleTimer = setTimeout(() => {
                    this.eraseRole(role);
                }, 2000);
            }
        }, 80);
    }

    private eraseRole(role: string): void {
        let charIndex = role.length;
        this.isTyping.set(true);

        this.typewriterTimer = setInterval(() => {
            if (charIndex > 0) {
                charIndex--;
                this.displayText.set(role.substring(0, charIndex));
            } else {
                clearInterval(this.typewriterTimer);
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                this.currentRole.set(this.roles[this.currentRoleIndex]);
                setTimeout(() => this.typeNextRole(), 300);
            }
        }, 40);
    }

    toggleVoice(): void {
        this.voiceControl.toggleListening();
    }

    onCTAClick(action: string): void {
        const messages: Record<string, string> = {
            projects: "Great choice! Let me show you my work at LDEV and my data dashboards.",
            contact: "I'd love to connect with you! I'm currently based in India."
        };
        if (messages[action]) {
            this.speechText.set(messages[action]);
            this.showSpeechBubble.set(true);
            if (this.voiceEnabled()) {
                this.voiceControl.speak(messages[action]);
            }
            clearTimeout(this.speechBubbleTimeout);
            this.speechBubbleTimeout = setTimeout(() => {
                this.showSpeechBubble.set(false);
            }, 4000);
        }
    }

    // ===== THREE.JS =====
    private initThreeJS(): void {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        this.camera.position.set(0, 0.5, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Lighting
        this.setupLighting();

        // Robot
        this.createRobot();

        // Particles
        this.createParticles();

        // Platform
        this.createPlatform();

        // Event listeners
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('resize', this.onResize);

        // Animation loop
        this.ngZone.runOutsideAngular(() => {
            this.animate();
        });
    }

    private setupLighting(): void {
        const isDark = this.themeService.isDark();
        const ambient = new THREE.AmbientLight(0x222724, isDark ? 0.4 : 0.8);
        this.lights['ambient'] = ambient;
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(3, 5, 4);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x5f8ba8, 0.5);
        fillLight.position.set(-3, 2, -2);
        this.scene.add(fillLight);

        const rimLight = new THREE.PointLight(isDark ? 0xa88b5f : 0xb58900, 0.8, 10);
        rimLight.position.set(-2, 3, -3);
        this.lights['rim'] = rimLight;
        this.scene.add(rimLight);

        const bottomGlow = new THREE.PointLight(isDark ? 0x5fa879 : 0x2d8a4e, 0.6, 8);
        bottomGlow.position.set(0, -2, 2);
        this.lights['bottom'] = bottomGlow;
        this.scene.add(bottomGlow);
    }

    private createRobot(): void {
        this.robotGroup = new THREE.Group();

        // Materials
        const isDark = this.themeService.isDark();
        const bodyMat = new THREE.MeshStandardMaterial({
            color: isDark ? 0xffffff : 0xced4da,
            metalness: 0.6,
            roughness: 0.4,
            emissive: isDark ? 0x121413 : 0x343a40,
            emissiveIntensity: isDark ? 0.2 : 0.05
        });
        this.materials['body'] = bodyMat;

        const glowMat = new THREE.MeshStandardMaterial({
            color: isDark ? 0x5fa879 : 0x339af0,
            emissive: isDark ? 0x5fa879 : 0x339af0,
            emissiveIntensity: isDark ? 1.2 : 2.0,
            metalness: 0.8,
            roughness: 0.2
        });
        this.materials['glow'] = glowMat;

        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x121413,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x000000,
            emissiveIntensity: 0
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: isDark ? 0xa88b5f : 0xff00ff,
            emissive: isDark ? 0xa88b5f : 0xff00ff,
            emissiveIntensity: 1.0,
            metalness: 0.5,
            roughness: 0.5
        });
        this.materials['accent'] = accentMat;

        // HEAD (Monitor)
        this.headGroup = new THREE.Group();

        // Monitor Casing
        const headGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.castShadow = true;
        this.headGroup.add(head);

        // Monitor Screen
        const screenGeo = new THREE.PlaneGeometry(0.7, 0.5);
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 0, 0.301);
        this.headGroup.add(screen);

        // Digital Eyes
        const eyeGeo = new THREE.CapsuleGeometry(0.06, 0.1, 8, 8);
        this.leftEye = new THREE.Mesh(eyeGeo, glowMat.clone());
        this.leftEye.position.set(-0.16, 0, 0.31);
        this.headGroup.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, glowMat.clone());
        this.rightEye.position.set(0.16, 0, 0.31);
        this.headGroup.add(this.rightEye);

        // Antenna
        const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
        const antenna = new THREE.Mesh(antennaGeo, bodyMat);
        antenna.position.set(0.25, 0.4, -0.1);
        this.headGroup.add(antenna);

        const bulbGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const bulb = new THREE.Mesh(bulbGeo, accentMat);
        bulb.position.set(0.25, 0.52, -0.1);
        this.headGroup.add(bulb);

        this.headGroup.position.y = 1.0;
        this.robotGroup.add(this.headGroup);

        // BODY
        this.bodyGroup = new THREE.Group();

        // Torso Core
        const torsoGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 32);
        const torso = new THREE.Mesh(torsoGeo, bodyMat);
        torso.castShadow = true;
        this.bodyGroup.add(torso);

        // Chest Core Ring
        const coreRingGeo = new THREE.TorusGeometry(0.36, 0.04, 16, 32);
        const coreRing = new THREE.Mesh(coreRingGeo, accentMat);
        coreRing.rotation.x = Math.PI / 2;
        this.bodyGroup.add(coreRing);

        // HUMANOID ARMS - Creation Function
        const createRealisticArm = (isLeft: boolean) => {
            const armGroup = new THREE.Group();
            const jointMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
            
            // Shoulder Joint
            const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), jointMat);
            armGroup.add(shoulderJoint);

            // Upper Arm
            const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4), bodyMat);
            upperArm.position.y = -0.2;
            armGroup.add(upperArm);

            // Elbow Joint
            const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), jointMat);
            elbowJoint.position.y = -0.4;
            armGroup.add(elbowJoint);

            // Lower Arm
            const lowerArmGroup = new THREE.Group();
            lowerArmGroup.position.y = -0.4;
            const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.35), bodyMat);
            lowerArm.position.y = -0.2;
            lowerArmGroup.add(lowerArm);

            // Wrist
            const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), jointMat);
            wrist.position.y = -0.4;
            lowerArmGroup.add(wrist);

            // HAND
            const handGroup = new THREE.Group();
            handGroup.position.y = -0.4;
            
            // Palm
            const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), bodyMat);
            palm.position.y = -0.06;
            handGroup.add(palm);

            // Fingers (realistic set of 4)
            const fingerGeo = new THREE.CapsuleGeometry(0.015, 0.05, 4, 8);
            const fingers: THREE.Mesh[] = [];
            for (let i = 0; i < 4; i++) {
                const finger = new THREE.Mesh(fingerGeo, bodyMat);
                finger.position.set((i - 1.5) * 0.03, -0.15, 0);
                handGroup.add(finger);
                fingers.push(finger);
            }
            
            lowerArmGroup.add(handGroup);
            armGroup.add(lowerArmGroup);

            return { armGroup, handGroup, lowerArmGroup, fingers };
        };

        // Initialize Arms
        const leftArmData = createRealisticArm(true);
        this.leftArmGroup = leftArmData.armGroup;
        this.leftLowerArmGroup = leftArmData.lowerArmGroup;
        this.leftHandGroup = leftArmData.handGroup;
        this.leftFingers = leftArmData.fingers;
        
        const rightArmData = createRealisticArm(false);
        this.rightArmGroup = rightArmData.armGroup;
        this.rightLowerArmGroup = rightArmData.lowerArmGroup;
        this.rightHandGroup = rightArmData.handGroup;
        this.rightFingers = rightArmData.fingers;

        this.leftArmGroup.position.set(-0.45, 0.1, 0);
        this.rightArmGroup.position.set(0.45, 0.1, 0);
        
        // Initial pose
        this.leftArmGroup.rotation.set(0.2, 0, 0.3);
        this.rightArmGroup.rotation.set(0.2, 0, -0.3);

        this.bodyGroup.add(this.leftArmGroup);
        this.bodyGroup.add(this.rightArmGroup);

        this.bodyGroup.position.y = 0.3;
        this.robotGroup.add(this.bodyGroup);

        // BASE / THRUSTER
        const thrusterGeo = new THREE.CylinderGeometry(0.35, 0.15, 0.3, 32);
        const thruster = new THREE.Mesh(thrusterGeo, bodyMat);
        thruster.position.y = -0.15;
        this.robotGroup.add(thruster);

        const nozzleGeo = new THREE.CylinderGeometry(0.1, 0.25, 0.2, 16);
        const nozzle = new THREE.Mesh(nozzleGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
        nozzle.position.y = -0.4;
        this.robotGroup.add(nozzle);

        const flameGeo = new THREE.ConeGeometry(0.15, 0.5, 16);
        const flameMat = new THREE.MeshStandardMaterial({
            color: isDark ? 0x5fa879 : 0x4dabf7,
            emissive: isDark ? 0x5fa879 : 0x4dabf7,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.7
        });
        this.materials['flame'] = flameMat;
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.y = -0.7;
        flame.rotation.x = Math.PI;
        this.robotGroup.add(flame);

        // Floating rings around robot
        for (let i = 0; i < 3; i++) {
            const fRingGeo = new THREE.TorusGeometry(0.9 + i * 0.2, 0.006, 8, 64);
            const fRingMat = new THREE.MeshStandardMaterial({
                color: i === 0 ? 0x5fa879 : i === 1 ? 0xa88b5f : 0x5f8ba8,
                emissive: i === 0 ? 0x5fa879 : i === 1 ? 0xa88b5f : 0x5f8ba8,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.5
            });
            const fRing = new THREE.Mesh(fRingGeo, fRingMat);
            fRing.rotation.x = Math.PI / 2 + (i * 0.3);
            fRing.rotation.y = i * 0.5;
            fRing.position.y = 0.3;
            this.floatingRings.push(fRing);
            this.robotGroup.add(fRing);
        }

        this.robotGroup.position.y = -0.3;
        this.scene.add(this.robotGroup);
    }

    private createParticles(): void {
        const count = 200;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const palette = [
            new THREE.Color(0x5fa879),
            new THREE.Color(0xa88b5f),
            new THREE.Color(0x5f8ba8)
        ];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,
            transparent: true,
            opacity: this.themeService.isDark() ? 0.6 : 1.0,
            blending: this.themeService.isDark() ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }

    private createPlatform(): void {
        const isDark = this.themeService.isDark();
        const platformGeo = new THREE.CylinderGeometry(1, 1.1, 0.08, 32);
        const platformMat = new THREE.MeshStandardMaterial({
            color: isDark ? 0x121413 : 0xced4da,
            metalness: 0.8,
            roughness: 0.2,
            emissive: isDark ? 0x5fa879 : 0x339af0,
            emissiveIntensity: isDark ? 0.1 : 0.3,
            transparent: true,
            opacity: 0.7
        });
        this.materials['platform'] = platformMat;
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.y = -0.82;
        platform.receiveShadow = true;
        this.scene.add(platform);

        // Platform glow ring
        const glowRing = new THREE.TorusGeometry(1.05, 0.015, 8, 64);
        const glowMat = new THREE.MeshStandardMaterial({
            color: isDark ? 0x5fa879 : 0x339af0,
            emissive: isDark ? 0x5fa879 : 0x339af0,
            emissiveIntensity: isDark ? 1 : 2,
            transparent: true,
            opacity: 0.5
        });
        this.materials['platformGlow'] = glowMat;
        const glow = new THREE.Mesh(glowRing, glowMat);
        glow.rotation.x = Math.PI / 2;
        glow.position.y = -0.78;
        this.scene.add(glow);
    }

    private onMouseMove = (event: MouseEvent): void => {
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    private onResize = (): void => {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    private animate = (): void => {
        this.animationId = requestAnimationFrame(this.animate);
        const t = this.clock.getElapsedTime();

        // Robot breathing
        if (this.robotGroup) {
            this.robotGroup.position.y = -0.3 + Math.sin(t * 1.5) * 0.05;
        }

        // Head follows mouse with parallax
        if (this.headGroup) {
            const targetRotY = this.mouseX * 0.4;
            const targetRotX = -this.mouseY * 0.2;
            this.headGroup.rotation.y += (targetRotY - this.headGroup.rotation.y) * 0.05;
            this.headGroup.rotation.x += (targetRotX - this.headGroup.rotation.x) * 0.05;
        }

        // ===== GESTURE & IDLE STATE MACHINE =====
        this.gestureTime += 0.016;
        this.idleActivityTime += 0.016;
        
        if (this.isSpeaking) {
            this.idleActivity = 'normal';
            if (this.gestureTime > 3.5) {
                const gestures = ['thinking', 'ok', 'talking', 'bye'];
                this.currentGesture = gestures[Math.floor(Math.random() * gestures.length)];
                this.gestureTime = 0;
            }
        } else {
            // IDLE TIME ACTIVITIES - High variety
            if (this.idleActivityTime > 5) {
                const activities = ['normal', 'look_around', 'check_palm', 'stretch', 'think_deep', 'posture_reset', 'shrug'];
                this.idleActivity = activities[Math.floor(Math.random() * activities.length)];
                this.idleActivityTime = 0;
            }
            this.currentGesture = 'idle';
        }

        const lerpSpd = 0.08;
        let lArmRot = { x: -0.3, y: 0, z: 0.3 };
        let rArmRot = { x: -0.3, y: 0, z: -0.3 };
        let lElbowRot = -0.2;
        let rElbowRot = -0.2;
        let lHandRot = { x: 0, y: 0, z: 0 };
        let rHandRot = { x: 0, y: 0, z: 0 };

        // Apply Speaking Gestures
        if (this.isSpeaking) {
            switch (this.currentGesture) {
                case 'thinking':
                    rArmRot = { x: -1.3, y: -0.7, z: -0.3 };
                    rElbowRot = -1.5;
                    this.rightFingers.forEach((f, i) => f.rotation.x = -1.2 + Math.sin(t * 2) * 0.1);
                    break;
                case 'ok':
                    rArmRot = { x: -0.8, y: 0.1, z: -0.8 };
                    rElbowRot = -1.0;
                    this.rightFingers[0].rotation.z = -1.2;
                    break;
                case 'bye':
                    rArmRot = { x: -2.2, y: 0, z: -0.5 + Math.sin(t * 10) * 0.4 };
                    rElbowRot = -0.3;
                    break;
                case 'talking':
                    const cadence = Math.sin(t * 4);
                    rArmRot = { x: -0.8 + cadence * 0.3, y: -0.2, z: -0.4 };
                    lArmRot = { x: -0.6 + Math.cos(t * 3) * 0.2, y: 0.2, z: 0.4 };
                    rElbowRot = -1.2 + cadence * 0.5;
                    lElbowRot = -0.8 + Math.cos(t * 3) * 0.3;
                    break;
            }
        } else {
            // Apply Idle Activities
            switch (this.idleActivity) {
                case 'look_around':
                    if (this.headGroup) {
                        this.headGroup.rotation.y += Math.sin(t * 0.5) * 0.005;
                        this.headGroup.rotation.x += Math.cos(t * 0.3) * 0.002;
                    }
                    break;
                case 'check_palm':
                    // Lift left hand to look at it
                    lArmRot = { x: -1.0, y: 0.8, z: 0.2 };
                    lElbowRot = -1.5;
                    break;
                case 'stretch':
                    lArmRot = { x: -0.2, y: 0, z: 0.8 };
                    rArmRot = { x: -0.2, y: 0, z: -0.8 };
                    lElbowRot = -0.4;
                    rElbowRot = -0.4;
                    break;
                case 'think_deep':
                    // Right hand near mouth/chin
                    rArmRot = { x: -1.2, y: -0.5, z: -0.4 };
                    rElbowRot = -1.6;
                    break;
                case 'posture_reset':
                    // Formal hands in front
                    lArmRot = { x: -0.5, y: 0.2, z: 0.1 };
                    rArmRot = { x: -0.5, y: -0.2, z: -0.1 };
                    lElbowRot = -0.8;
                    rElbowRot = -0.8;
                    break;
                case 'shrug':
                    lArmRot = { x: -0.2, y: 0, z: 0.4 };
                    rArmRot = { x: -0.2, y: 0, z: -0.4 };
                    lElbowRot = -0.1;
                    rElbowRot = -0.1;
                    break;
            }
        }

        // Apply LERP for smooth transitions
        const lerpRot = (current: THREE.Euler, target: {x:number, y:number, z:number}) => {
            current.x += (target.x - current.x) * lerpSpd;
            current.y += (target.y - current.y) * lerpSpd;
            current.z += (target.z - current.z) * lerpSpd;
        };

        lerpRot(this.leftArmGroup.rotation, lArmRot);
        lerpRot(this.rightArmGroup.rotation, rArmRot);
        
        this.leftLowerArmGroup.rotation.x += (lElbowRot - this.leftLowerArmGroup.rotation.x) * lerpSpd;
        this.rightLowerArmGroup.rotation.x += (rElbowRot - this.rightLowerArmGroup.rotation.x) * lerpSpd;

        this.leftHandGroup.rotation.x += (lHandRot.x - this.leftHandGroup.rotation.x) * lerpSpd;
        this.rightHandGroup.rotation.x += (rHandRot.x - this.rightHandGroup.rotation.x) * lerpSpd;

        if (this.isSpeaking && this.headGroup) {
            this.headGroup.rotation.x += Math.sin(t * 8) * 0.02;
        }

        // Body slight sway
        if (this.bodyGroup) {
            this.bodyGroup.rotation.y += (this.mouseX * 0.1 - this.bodyGroup.rotation.y) * 0.03;
        }

        // Floating rings rotation
        this.floatingRings.forEach((ring, i) => {
            ring.rotation.z = t * (0.3 + i * 0.1);
            ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.2;
        });

        // Eye colors based on state
        if (this.leftEye && this.rightEye) {
            const isDark = this.themeService.isDark();
            const isListening = this.voiceControl.isListening();
            const isSpeaking = this.voiceControl.isSpeaking();
            
            // Dynamic theme colors - High Contrast for colorful vibe
            const listeningColor = isDark ? 0x5fa879 : 0x339af0;
            const speakingColor = isDark ? 0xa88b5f : 0xff00ff;
            const idleColor = isDark ? 0x5f8ba8 : 0x7950f2;

            const targetColor = isSpeaking ? speakingColor : (isListening ? listeningColor : idleColor);
            (this.leftEye.material as THREE.MeshStandardMaterial).color.lerp(new THREE.Color(targetColor), 0.1);
            (this.leftEye.material as THREE.MeshStandardMaterial).emissive.lerp(new THREE.Color(targetColor), 0.1);
            (this.rightEye.material as THREE.MeshStandardMaterial).color.lerp(new THREE.Color(targetColor), 0.1);
            (this.rightEye.material as THREE.MeshStandardMaterial).emissive.lerp(new THREE.Color(targetColor), 0.1);
        }

        // Particles drift
        if (this.particles) {
            this.particles.rotation.y = t * 0.02;
            const pos = this.particles.geometry.attributes['position'] as THREE.BufferAttribute;
            for (let i = 0; i < pos.count; i++) {
                const y = pos.getY(i);
                pos.setY(i, y + Math.sin(t + i * 0.1) * 0.001);
            }
            pos.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    };
}
