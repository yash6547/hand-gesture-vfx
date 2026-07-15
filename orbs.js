import { CONFIG } from './utils.js';

export class OrbRenderer {
    constructor() {
        this.timeCounter = 0;
        this.fallingParticles = [];
        
        this.orbImages = {
            thumb: new Image(),
            index: new Image(),
            middle: new Image(),
            ring: new Image(),
            pinky: new Image()
        };

        this.orbImages.thumb.src = './assets/images/thumb.png';
        this.orbImages.index.src = './assets/images/index.png';
        this.orbImages.middle.src = './assets/images/middle.png';
        this.orbImages.ring.src = './assets/images/ring.png';
        this.orbImages.pinky.src = './assets/images/pinky.png';
    }

    renderOrbs(ctx, leftHand, rightHand) {
        const fingerTips = [4, 8, 12, 16, 20];
        const imageKeys = ['thumb', 'index', 'middle', 'ring', 'pinky'];
        const fingerHues = [280, 200, 120, 35, 0]; 
        
        const currentSize = 10; 
        const currentShake = 2.8;       
        const rotSpeed = 1.15;           

        this.timeCounter += 0.1 * rotSpeed; 

        // Update and draw particles first so they stay layered correctly
        this.updateAndDrawParticles(ctx);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        const drawHandOrbs = (landmarks) => {
            if (!landmarks) return;
            
            fingerTips.forEach((index, i) => {
                const pt = landmarks[index];
                if (!pt) return;

                const baseScale = (CONFIG.beamThickness || 6) * currentSize; 
                const shakeX = Math.sin(this.timeCounter * 12 + i) * currentShake;
                const shakeY = Math.cos(this.timeCounter * 10 + i) * currentShake;

                const x = pt.x * ctx.canvas.width + shakeX;
                const y = pt.y * ctx.canvas.height + shakeY;

                const imgKey = imageKeys[i];
                const imgNode = this.orbImages[imgKey];
                const ballHue = fingerHues[i];

                if (Math.random() > 0.4) {
                    const blastAngle = Math.random() * Math.PI * 2;
                    const blastSpeed = 2.0 + Math.random() * 3.0;
                    const spawnOffset = baseScale * 0.7; 
                    const spawnX = x + Math.cos(blastAngle) * spawnOffset;
                    const spawnY = y + Math.sin(blastAngle) * spawnOffset;

                    this.fallingParticles.push({
                        x: spawnX, y: spawnY, lastX: spawnX, lastY: spawnY,
                        vx: Math.cos(blastAngle) * blastSpeed, 
                        vy: Math.sin(blastAngle) * blastSpeed, 
                        radius: 0.7 + Math.random() * 1.3,
                        alpha: 1.0, hue: ballHue 
                    });
                }

                if (imgNode.complete && imgNode.naturalWidth > 0) {
                    ctx.save();
                    ctx.globalAlpha = 0.78; 
                    ctx.translate(x, y);
                    ctx.rotate(this.timeCounter * 2.5 + i); 
                    ctx.drawImage(imgNode, -baseScale, -baseScale, baseScale * 2, baseScale * 2);
                    ctx.restore();
                }
            });
        };

        drawHandOrbs(leftHand);
        drawHandOrbs(rightHand);
        ctx.restore();
    }

    updateAndDrawParticles(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        for (let i = this.fallingParticles.length - 1; i >= 0; i--) {
            const p = this.fallingParticles[i];
            p.lastX = p.x; p.lastY = p.y;
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.15; p.vx *= 0.94; p.alpha -= 0.035; 

            if (p.alpha <= 0) {
                this.fallingParticles.splice(i, 1);
                continue;
            }

            ctx.shadowBlur = 6;
            ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
            ctx.strokeStyle = `hsla(${p.hue}, 100%, 85%, ${p.alpha * 0.75})`;
            ctx.lineWidth = p.radius;
            ctx.beginPath();
            ctx.moveTo(p.lastX, p.lastY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}