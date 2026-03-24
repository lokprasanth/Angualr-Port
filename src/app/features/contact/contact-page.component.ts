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
    private materials: Record<string, THREE.PointsMaterial | THREE.LineBasicMaterial | THREE.ShaderMaterial | THREE.MeshPhongMaterial> = {};
    
    // Mouse Interactive State
    private mouseX = 0;
    private mouseY = 0;
    private targetX = 0;
    private targetY = 0;
    private baseRotationY = 0;
    private resizeObserver!: ResizeObserver;
    
    // Mouse Interactive State
    private onMouseMove = (event: MouseEvent) => {
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        this.mouseX = (event.clientX - windowHalfX) * 0.001;
        this.mouseY = (event.clientY - windowHalfY) * 0.001;
    };

    // Resize Handler
    private onWindowResize = () => {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas || !this.camera || !this.renderer) return;
        
        const parent = canvas.parentElement;
        const width = parent?.clientWidth || window.innerWidth;
        const height = parent?.clientHeight || window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Pass false to ensure Three.js does not overwrite the CSS inline width/height rules
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

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
        if (isPlatformBrowser(this.platformId)) {
            document.removeEventListener('mousemove', this.onMouseMove);
            if (this.resizeObserver) this.resizeObserver.disconnect();
        }
    }

    private initThreeJS() {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.z = 4;

        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.createGlobe();
        
        if (isPlatformBrowser(this.platformId)) {
            document.addEventListener('mousemove', this.onMouseMove);
            const parent = canvas.parentElement;
            if (parent) {
                this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
                this.resizeObserver.observe(parent);
            }
        }

        this.ngZone.runOutsideAngular(() => this.animate());
    }

    private createGlobe() {
        this.globe = new THREE.Group();
        const isDark = this.themeService.isDark();
        const accent = isDark ? 0x5fa879 : 0x2d8a4e;

        const loader = new THREE.TextureLoader();
        
        // High-contrast clean Earth maps
        const textureUrl = isDark 
            ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg' 
            : 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

        const bumpMapUrl = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
        const specularMapUrl = 'https://unpkg.com/three-globe/example/img/earth-water.png';

        const mapTexture = loader.load(textureUrl);
        const bumpTexture = loader.load(bumpMapUrl);
        const specularTexture = loader.load(specularMapUrl);

        mapTexture.anisotropy = 16;
        
        // Premium Physically-based render material
        const globeGeo = new THREE.SphereGeometry(1.5, 64, 64);
        const globeMat = new THREE.MeshPhongMaterial({
            map: mapTexture,
            bumpMap: bumpTexture,
            bumpScale: 0.02,
            specularMap: specularTexture,
            specular: new THREE.Color('grey'),
            shininess: isDark ? 15 : 35
        });
        
        this.materials['globe'] = globeMat as any;
        const globeMesh = new THREE.Mesh(globeGeo, globeMat);
        (globeMesh as any).isCore = true;
        this.globe.add(globeMesh);

        // Atmosphere Glow (Shader)
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
                    intensity = pow( 0.65 - dot( vNormal, vNormel ), 3.0 );
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
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.materials['halo'] = atmosMat as any;
        const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.65, 64, 64), atmosMat);
        this.globe.add(atmosphere);

        // Add Marker for location
        this.addMarker(20, 78, accent);

        this.scene.add(this.globe);
        
        // Premium Lighting Setup for the Phong Material
        const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.3 : 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.2 : 0.8);
        dirLight.position.set(5, 3, 5);
        this.scene.add(dirLight);
        
        // Subtle back light for rim effect
        const backLight = new THREE.DirectionalLight(accent, 0.8);
        backLight.position.set(-5, -3, -5);
        this.scene.add(backLight);

        // Initial subtle tilt
        this.globe.rotation.x = 0.2;
    }

    private createCircleTexture() {
        if (!isPlatformBrowser(this.platformId)) return null;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
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
        const accent = isDark ? 0x5fa879 : 0x2d8a4e;
        if (this.materials['halo']) (this.materials['halo'] as THREE.ShaderMaterial).uniforms['glowColor'].value.setHex(accent);
        
        // Reload textures dynamically on theme toggle
        if (this.globe && this.materials['globe']) {
            const textureUrl = isDark 
                ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg' 
                : 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
            const loader = new THREE.TextureLoader();
            const mat = this.materials['globe'] as unknown as THREE.MeshPhongMaterial;
            mat.map = loader.load(textureUrl);
            mat.shininess = isDark ? 15 : 35;
        }
    }

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        
        // Smooth target interpolation for mouse offset
        this.targetX += (this.mouseX * 0.8 - this.targetX) * 0.05;
        this.targetY += (this.mouseY * 0.8 - this.targetY) * 0.05;

        if (this.globe) {
            // Constant auto-rotation independent of mouse
            this.baseRotationY += 0.0015; 
            
            // Apply auto-rotation + mouse offset
            this.globe.rotation.y = this.baseRotationY + this.targetX;
            this.globe.rotation.x = this.targetY;

            // Constrain X tilt
            this.globe.rotation.x = Math.max(-0.5, Math.min(0.5, this.globe.rotation.x));

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
