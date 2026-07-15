import { CONFIG, getDistance2D } from './utils.js?v=2.1';
import { MediaPipeManager } from './mediapipe.js?v=2.1';
import { BeamRenderer } from './beam.js?v=2.1';
import { OrbRenderer } from './orbs.js?v=2.1';
import { SpecialEffectsEngine } from './effects.js?v=2.1'; // FIXED: Added ?v=2.1 here
import { UIController } from './ui.js?v=2.1';

class CoreVFXEngine {
    constructor() {
        if (!CONFIG.fpsLimit) CONFIG.fpsLimit = 60;
        if (!CONFIG.width) CONFIG.width = 1280;
        if (!CONFIG.height) CONFIG.height = 720;

        this.vfxCanvas = document.getElementById('vfx-canvas');
        this.vfxCtx = this.vfxCanvas.getContext('2d');
        this.bgCanvas = document.getElementById('bg-canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.webcamElement = document.getElementById('webcam');

        this.mpManager = new MediaPipeManager(this.webcamElement, this.handleTrackingResults.bind(this));
        this.ui = new UIController(this.mpManager);
        this.beams = new BeamRenderer();
        this.orbs = new OrbRenderer(); 
        this.fx = new SpecialEffectsEngine();

        this.trackedHands = { Left: null, Right: null };
        this.globalTime = 0;
        this.lastFrameTimestamp = 0;
        this.fpsFrameCount = 0;
        this.fpsLastMeasuredTime = performance.now();
        this.measuredFps = 0;
    }

    async bootstrap() {
        const powerDropdown = document.getElementById('power-mode');
        if (powerDropdown) {
            powerDropdown.addEventListener('change', (e) => {
                CONFIG.powerMode = e.target.value;
                if (this.fx && typeof this.fx.resetVFXTracks === 'function') {
                    this.fx.resetVFXTracks();
                }
                this.ui.showSystemAlert(`MODE CHANGED // ${CONFIG.powerMode.toUpperCase()}`);
            });
        }

        this.ui.initializeUIHooks();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        try {
            await this.mpManager.initializePipeline();
            this.ui.showSystemAlert("SYS LIGHTNING MATRIX ONLINE");
            requestAnimationFrame((t) => this.renderLoop(t));
        } catch(error) {
            console.error("BOOTSTRAP_ERROR //", error);
            this.ui.showSystemAlert("HARDWARE INITIALIZATION ERROR");
        }
    }

    handleResize() {
        this.vfxCanvas.width = window.innerWidth;
        this.vfxCanvas.height = window.innerHeight;
        this.bgCanvas.width = window.innerWidth;
        this.bgCanvas.height = window.innerHeight;
    }

    handleTrackingResults(handsData) {
        this.trackedHands = handsData;
    }

    renderLoop(currentTimestamp) {
        if(CONFIG.mirrorMode) {
            this.webcamElement.classList.remove('no-mirror');
        } else {
            this.webcamElement.classList.add('no-mirror');
        }

        const elapsed = currentTimestamp - this.lastFrameTimestamp;
        const frameInterval = 1000 / (CONFIG.fpsLimit || 60);
        
        if (elapsed < frameInterval) {
            requestAnimationFrame((t) => this.renderLoop(t));
            return;
        }
        
        this.lastFrameTimestamp = currentTimestamp - (elapsed % frameInterval);
        this.globalTime = currentTimestamp / 1000;

        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        this.vfxCtx.clearRect(0, 0, this.vfxCanvas.width, this.vfxCanvas.height);

        const left = this.trackedHands.Left;
        const right = this.trackedHands.Right;
        const ctx = this.vfxCtx;

        // 1. CONDITION: Jab dono haath screen par active hain
        if (left && right) {
            const wristL = { x: left[0].x * ctx.canvas.width, y: left[0].y * ctx.canvas.height };
            const wristR = { x: right[0].x * ctx.canvas.width, y: right[0].y * ctx.canvas.height };
            const midpoint = { x: (wristL.x + wristR.x) / 2, y: (wristL.y + wristR.y) / 2 };
            
            const absoluteHandDistance = Math.hypot(wristR.x - wristL.x, wristR.y - wristL.y);

            if (CONFIG.powerMode === "plasma-shield") {
                this.fx.renderPlasmaSphere(ctx, midpoint.x, midpoint.y, Math.max(80, absoluteHandDistance * 0.45));
            } 
            else if (CONFIG.powerMode === "doctor-strange") {
                this.fx.renderMysticPortal(ctx, midpoint.x, midpoint.y, Math.max(100, absoluteHandDistance * 0.5));
            } 
            else {
                this.beams.renderEnergyMatrix(ctx, left, right, this.globalTime);
                this.orbs.renderOrbs(ctx, left, right); 
            }
        } 
        // 2. CONDITION: Jab dono me se koi ek haath ya koi haath nahi hai
        else {
            // Video tracking loop safe state reset
            if (this.fx && typeof this.fx.resetVFXTracks === 'function') {
                this.fx.resetVFXTracks();
            }
            
            // Single hand rendering safe bypass tracker
            if (left || right) {
                this.orbs.renderOrbs(ctx, left, right); 
            }
        }

        this.fpsFrameCount++;
        const now = performance.now();
        if (now >= this.fpsLastMeasuredTime + 1000) {
            this.measuredFps = (this.fpsFrameCount * 1000) / (now - this.fpsLastMeasuredTime);
            this.fpsFrameCount = 0;
            this.fpsLastMeasuredTime = now;
        }
        
        this.ui.updatePerformanceMetrics(this.measuredFps);

        requestAnimationFrame((t) => this.renderLoop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const applicationInstance = new CoreVFXEngine();
    applicationInstance.bootstrap();
});