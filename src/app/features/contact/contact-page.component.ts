import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone, inject, PLATFORM_ID, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { fadeInUp, fadeInLeft, fadeInRight } from '../../shared/animations/animations';
import * as THREE from 'three';

@Component({
    selector: 'app-contact-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    animations: [fadeInUp, fadeInLeft, fadeInRight],
    templateUrl: './contact-page.component.html',
    styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent implements AfterViewInit, OnDestroy {
    @ViewChild('globeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private platformId = inject(PLATFORM_ID);
    private ngZone = inject(NgZone);
    private themeService = inject(ThemeService);

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private animationId = 0;
    private globe!: THREE.Group;
    private materials: Record<string, THREE.PointsMaterial> = {};
    formData = {
        name: '',
        email: '',
        subject: '',
        message: '',
        honeypot: '' // Anti-spam field
    };

    isSubmitting = signal(false);
    isSubmitted = signal(false);

    contactInfo = [
        { icon: '📧', label: 'Email', value: 'lokalamanda@gmail.com', link: 'mailto:lokalamanda@gmail.com' },
        { icon: '📍', label: 'Location', value: 'Visakhapatnam, India', link: '' },
        { icon: '💼', label: 'LinkedIn', value: 'linkedin.com/in/lok-prasanth', link: 'https://linkedin.com/in/lok-prasanth' },
        { icon: '🐙', label: 'GitHub', value: 'github.com/lokalamanda', link: 'https://github.com/lokalamanda' }
    ];

    constructor() {
        effect(() => {
            const isDark = this.themeService.isDark();
            this.updateGlobeTheme(isDark);
        });
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

    private initThreeJS() {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.z = 4;

        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.createGlobe();
        this.ngZone.runOutsideAngular(() => this.animate());
    }

    private createGlobe() {
        this.globe = new THREE.Group();
        const isDark = this.themeService.isDark();
        const accent = isDark ? 0x5fa879 : 0x2d8a4e;

        const loader = new THREE.TextureLoader();
        
        // High-contrast clean maps
        const textureUrl = isDark 
            ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg' 
            : 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

        const mapTexture = loader.load(textureUrl);
        mapTexture.anisotropy = 16;

        // Base Earth Sphere - Even lighting (BasicMaterial ignores light)
        const globeGeo = new THREE.SphereGeometry(1.5, 64, 64);
        const globeMat = new THREE.MeshBasicMaterial({
            map: mapTexture,
            transparent: true,
            opacity: 1.0,
            color: isDark ? 0xffffff : 0xeeeeee // Slight tint for light mode
        });
        const globeMesh = new THREE.Mesh(globeGeo, globeMat);
        this.globe.add(globeMesh);

        // Atmosphere Glow (Shader) - Optimized for flat look
        const atmosMat = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                glowColor: { value: new THREE.Color(accent) },
                viewVector: { value: this.camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                    vec3 vNormal = normalize( normalMatrix * normal );
                    vec3 vNormel = normalize( viewVector );
                    intensity = pow( 0.6 - dot( vNormal, vNormel ), 3.0 );
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4( glow, intensity );
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.55, 64, 64), atmosMat);
        this.globe.add(atmosphere);

        // Add User Location Marker (India: ~20, 78)
        this.addMarker(20, 78, accent);

        this.scene.add(this.globe);
        
        // Uniform Ambient Light Only (No shadows)
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    }

    private addMarker(lat: number, lon: number, color: number) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(1.52 * Math.sin(phi) * Math.cos(theta));
        const z = (1.52 * Math.sin(phi) * Math.sin(theta));
        const y = (1.52 * Math.cos(phi));

        const markerGeo = new THREE.SphereGeometry(0.04, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: color });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(x, y, z);
        this.globe.add(marker);

        // Pulse Ring
        const ringGeo = new THREE.RingGeometry(0.06, 0.08, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, y, z);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        
        // Custom animation data
        (ring as any).isPulse = true;
        this.globe.add(ring);
    }

    private updateGlobeTheme(isDark: boolean) {
        if (!this.materials['globe']) return;
        const accent = isDark ? 0x5fa879 : 0x2d8a4e;
        this.materials['globe'].color.setHex(accent);
    }

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        if (this.globe) {
            // Slow, steady rotation
            this.globe.rotation.y += 0.0015;

            // Pulse Animation for location marker
            this.globe.children.forEach(child => {
                if ((child as any).isPulse) {
                    const s = 1 + Math.sin(Date.now() * 0.005) * 0.5;
                    child.scale.set(s, s, s);
                    ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.8 - (s - 1);
                }
            });
        }
        this.renderer.render(this.scene, this.camera);
    };

    async onSubmit(): Promise<void> {
        // Honeypot check: If bot filled the hidden field, silently stop
        if (this.formData.honeypot) {
            console.warn('Bot submission prevented');
            return;
        }

        this.isSubmitting.set(true);
        // Simulate submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
        this.formData = { name: '', email: '', subject: '', message: '', honeypot: '' };

        setTimeout(() => this.isSubmitted.set(false), 4000);
    }
}
