import { CONFIG } from './utils.js';

class EnergyParticle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.hue = hue;
        this.radius = 1 + Math.random() * CONFIG.particleSize;
        
        const speed = CONFIG.particleSpeed;
        const angle = Math.random() * Math.PI * 2;
        const velocityMagnitude = 0.5 + Math.random() * speed;
        
        this.vx = Math.cos(angle) * velocityMagnitude;
        this.vy = Math.sin(angle) * velocityMagnitude;
        
        this.maxLife = 30 + Math.floor(Math.random() * 40);
        this.life = this.maxLife;
        this.alpha = 1.0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply slight air resistance deceleration
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        this.life--;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.shadowBlur = this.radius * 2;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, ${this.alpha})`;
        ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, ${this.alpha})`;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleEngine {
    constructor() {
        this.activeParticles = [];
    }

    /**
     * Spawns particles from key finger coordinates
     */
    emitFromHandTips(ctx, leftHand, rightHand, globalTime) {
        const fingerTips = [4, 8, 12, 16, 20];
        const count = CONFIG.particleCount;
        if (count === 0) return;

        const spawnGroup = (landmarks, phaseOffset) => {
            fingerTips.forEach((index, pos) => {
                const pt = landmarks[index];
                const screenX = pt.x * ctx.canvas.width;
                const screenY = pt.y * ctx.canvas.height;
                const baseHue = ((pos * 45) + (globalTime * 30) + phaseOffset) % 360;

                for (let c = 0; c < count; c++) {
                    if (Math.random() > 0.3) { // Regulate generation rate density limits
                        this.activeParticles.push(new EnergyParticle(screenX, screenY, baseHue));
                    }
                }
            });
        };

        if (leftHand) spawnGroup(leftHand, 0);
        if (rightHand) spawnGroup(rightHand, 180);
    }

    /**
     * Manual injection entry point for temporary high energy event states
     */
    injectExplosionBurst(x, y, hue, totalParticles = 60) {
        for (let i = 0; i < totalParticles; i++) {
            const customParticle = new EnergyParticle(x, y, hue);
            // Amplify speed coefficients dynamically for shockwave representation
            customParticle.vx *= 2.5;
            customParticle.vy *= 2.5;
            customParticle.maxLife += 20;
            this.activeParticles.push(customParticle);
        }
    }

    processFrame(ctx) {
        // Double evaluation cleanup loops optimizing dead arrays memory collections
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.update();
            if (p.life <= 0) {
                this.activeParticles.splice(i, 1);
            } else {
                p.draw(ctx);
            }
        }
    }

    clear() {
        this.activeParticles = [];
    }
}