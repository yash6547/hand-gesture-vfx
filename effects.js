export class SpecialEffectsEngine {
    constructor() {
        // DOM nodes targeting verified
        this.plasmaIntro = document.getElementById('plasma_intro');
        this.plasmaLoop = document.getElementById('plasma_loop');
        this.portalIntro = document.getElementById('portal_intro');
        this.portalLoop = document.getElementById('portal_loop');

        // State Trackers
        this.activePlasmaVideo = null;
        this.activePortalVideo = null;

        // Offscreen canvas layer configuration
        this.chromaCanvas = document.createElement('canvas');
        this.chromaCtx = this.chromaCanvas.getContext('2d');
    }

    renderPlasmaSphere(ctx, x, y, currentDistanceRadius) {
        if (!this.plasmaIntro || !this.plasmaLoop) return;

        // Force initialize streams if tracking starts
        if (!this.activePlasmaVideo) {
            this.activePlasmaVideo = this.plasmaIntro;
            this.plasmaLoop.pause();
            this.plasmaLoop.currentTime = 0;
            this.plasmaIntro.currentTime = 0;
        }

        // Continuous playback check engine
        if (this.activePlasmaVideo.paused) {
            this.activePlasmaVideo.play().catch(() => {});
        }

        // Seamless bridge sequence from intro to loop
        if (this.activePlasmaVideo === this.plasmaIntro && this.plasmaIntro.ended) {
            this.activePlasmaVideo = this.plasmaLoop;
            this.plasmaLoop.currentTime = 0;
            this.plasmaLoop.play().catch(() => {});
        }

        this.drawVFXWithChromaOption(ctx, this.activePlasmaVideo, x, y, currentDistanceRadius * 2);
    }

    renderMysticPortal(ctx, x, y, currentDistanceRadius) {
        if (!this.portalIntro || !this.portalLoop) return;

        if (!this.activePortalVideo) {
            this.activePortalVideo = this.portalIntro;
            this.portalLoop.pause();
            this.portalLoop.currentTime = 0;
            this.portalIntro.currentTime = 0;
        }

        if (this.activePortalVideo.paused) {
            this.activePortalVideo.play().catch(() => {});
        }

        if (this.activePortalVideo === this.portalIntro && this.portalIntro.ended) {
            this.activePortalVideo = this.portalLoop;
            this.portalLoop.currentTime = 0;
            this.portalLoop.play().catch(() => {});
        }

        this.drawVFXWithChromaOption(ctx, this.activePortalVideo, x, y, currentDistanceRadius * 2.2);
    }

    resetVFXTracks() {
        if (this.activePlasmaVideo === this.plasmaLoop && this.plasmaLoop) this.plasmaLoop.pause();
        if (this.activePortalVideo === this.portalLoop && this.portalLoop) this.portalLoop.pause();
        this.activePlasmaVideo = null;
        this.activePortalVideo = null;
    }

    drawVFXWithChromaOption(ctx, videoElement, x, y, size) {
        // FIXED: Enforce buffer checking to block 0px drawing execution loops
        if (!videoElement || videoElement.paused || size < 10 || videoElement.readyState < 2) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        if (window.CONFIG && window.CONFIG.chromaKeyEnabled) {
            this.chromaCanvas.width = size;
            this.chromaCanvas.height = size;
            
            this.chromaCtx.drawImage(videoElement, 0, 0, size, size);
            
            const frameData = this.chromaCtx.getImageData(0, 0, size, size);
            const pixels = frameData.data;
            const totalPixels = pixels.length;

            for (let i = 0; i < totalPixels; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];

                // Dynamic background data alpha processing execution
                if ((r < 45 && g < 45 && b < 45) || (g > 100 && r < 90 && b < 90)) {
                    pixels[i + 3] = 0; 
                }
            }

            this.chromaCtx.putImageData(frameData, 0, 0);
            ctx.drawImage(this.chromaCanvas, x - size / 2, y - size / 2);

        } else {
            ctx.drawImage(videoElement, x - size / 2, y - size / 2, size, size);
        }

        ctx.restore();
    }
}