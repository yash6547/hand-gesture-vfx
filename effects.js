export class SpecialEffectsEngine {
    constructor() {
        // DOM nodes targeting verified (.webm transparent files)
        this.plasmaIntro = document.getElementById('plasma_intro');
        this.plasmaLoop = document.getElementById('plasma_loop');
        this.portalIntro = document.getElementById('portal_intro');
        this.portalLoop = document.getElementById('portal_loop');

        // State Trackers
        this.activePlasmaVideo = null;
        this.activePortalVideo = null;

        // Strict boolean guards to ensure intro runs EXACTLY ONCE
        this.isPlasmaIntroDone = false;
        this.isPortalIntroDone = false;

        // FIXED: Magic number to skip invisible blank frames in webm
        this.loopSeekStart = 0.08; 
    }

    renderPlasmaSphere(ctx, x, y, currentDistanceRadius) {
        if (!this.plasmaIntro || !this.plasmaLoop) return;

        if (!this.activePlasmaVideo) {
            this.activePlasmaVideo = this.plasmaIntro;
            this.plasmaLoop.pause();
            this.plasmaLoop.currentTime = this.loopSeekStart; 
            this.plasmaIntro.currentTime = 0.01;
            
            this.plasmaIntro.muted = false;
            this.plasmaIntro.volume = 0.8;
            this.plasmaIntro.play().catch(() => {});
        }

        const isIntroEnding = this.plasmaIntro.ended || (this.plasmaIntro.currentTime >= this.plasmaIntro.duration - 0.2);
        
        if (!this.isPlasmaIntroDone) {
            if (isIntroEnding) {
                this.plasmaIntro.pause();
                this.plasmaIntro.currentTime = 0.01;
                this.isPlasmaIntroDone = true; 
                this.activePlasmaVideo = this.plasmaLoop;
                this.plasmaLoop.muted = false;
                this.plasmaLoop.volume = 0.6;
                this.plasmaLoop.currentTime = this.loopSeekStart;
                this.plasmaLoop.play().catch(() => {});
            } else if (this.plasmaIntro.paused) {
                this.plasmaIntro.play().catch(() => {});
            }
        } else {
            this.activePlasmaVideo = this.plasmaLoop;
            
            if (this.plasmaLoop.currentTime >= this.plasmaLoop.duration - 0.15) {
                this.plasmaLoop.currentTime = this.loopSeekStart; 
            }
            if (this.plasmaLoop.paused) {
                this.plasmaLoop.muted = false;
                this.plasmaLoop.volume = 0.6;
                this.plasmaLoop.play().catch(() => {});
            }
        }

        const finalSize = currentDistanceRadius * 1.85;
        this.drawEnhancedVFX(ctx, this.activePlasmaVideo, x, y, finalSize, '#00d2ff');
    }

    renderMysticPortal(ctx, x, y, currentDistanceRadius) {
        if (!this.portalIntro || !this.portalLoop) return;

        if (!this.activePortalVideo) {
            this.activePortalVideo = this.portalIntro;
            this.portalLoop.pause();
            this.portalLoop.currentTime = this.loopSeekStart;
            this.portalIntro.currentTime = 0.01;

            this.portalIntro.muted = false;
            this.portalIntro.volume = 0.8;
            this.portalIntro.play().catch(() => {});
        }

        const isIntroEnding = this.portalIntro.ended || (this.portalIntro.currentTime >= this.portalIntro.duration - 0.2);
        
        if (!this.isPortalIntroDone) {
            if (isIntroEnding) {
                this.portalIntro.pause();
                this.portalIntro.currentTime = 0.01;
                this.isPortalIntroDone = true; 
                this.activePortalVideo = this.portalLoop;
                this.portalLoop.muted = false;
                this.portalLoop.volume = 0.6;
                this.portalLoop.currentTime = this.loopSeekStart;
                this.portalLoop.play().catch(() => {});
            } else if (this.portalIntro.paused) {
                this.portalIntro.play().catch(() => {});
            }
        } else {
            this.activePortalVideo = this.portalLoop;
            
            if (this.portalLoop.currentTime >= this.portalLoop.duration - 0.15) {
                this.portalLoop.currentTime = this.loopSeekStart; 
            }
            if (this.portalLoop.paused) {
                this.portalLoop.muted = false;
                this.portalLoop.volume = 0.6;
                this.portalLoop.play().catch(() => {});
            }
        }

        const finalSize = currentDistanceRadius * 2.35;
        const shiftedY = y - (finalSize * 0.15);
        this.drawEnhancedVFX(ctx, this.activePortalVideo, x, shiftedY, finalSize, '#ff6600');
    }

    resetVFXTracks() {
        if (this.plasmaIntro) { this.plasmaIntro.pause(); this.plasmaIntro.muted = true; }
        if (this.plasmaLoop) { this.plasmaLoop.pause(); this.plasmaLoop.muted = true; }
        if (this.portalIntro) { this.portalIntro.pause(); this.portalIntro.muted = true; }
        if (this.portalLoop) { this.portalLoop.pause(); this.portalLoop.muted = true; }

        this.activePlasmaVideo = null;
        this.activePortalVideo = null;
        this.isPlasmaIntroDone = false;
        this.isPortalIntroDone = false;
    }

    drawEnhancedVFX(ctx, videoElement, x, y, size, glowColor) {
        if (!videoElement || videoElement.paused || size < 10 || videoElement.readyState < 2) return;

        ctx.save();
        
        // FIXED: Opacity reduced to 0.55 for a lighter blend
        ctx.globalAlpha = 0.65; 
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 3;
        ctx.shadowColor = glowColor;

        ctx.drawImage(videoElement, x - size / 2, y - size / 2, size, size);
        ctx.restore();
    }
}