import { CONFIG } from './utils.js';

export class BeamRenderer {
    constructor() {
        this.currentFrameIndex = 0;
        this.lastFrameSwitchTime = 0;
        this.isReady = false;

        this.folderNames = ['finger_thumb', 'finger_index', 'finger_middle', 'finger_ring', 'finger_pinky'];
        
        this.fingerBeamsData = {
            finger_thumb: [],
            finger_index: [],
            finger_middle: [],
            finger_ring: [],
            finger_pinky: []
        };

        this.totalExpectedImages = 25; 
        this.loadedImagesCount = 0;

        this.preloadAllFingerAssets();
    }

    preloadAllFingerAssets() {
        const totalFramesPerFinger = 5;

        this.folderNames.forEach((folder) => {
            for (let i = 1; i <= totalFramesPerFinger; i++) {
                const img = new Image();
                img.src = `./assets/images/${folder}/beam${i}.png?v=9`; 
                
                img.onload = () => {
                    this.loadedImagesCount++;
                    if (this.loadedImagesCount === this.totalExpectedImages) {
                        this.isReady = true;
                    }
                };
                this.fingerBeamsData[folder].push(img);
            }
        });
    }

    renderEnergyMatrix(ctx, leftHand, rightHand) {
        if (!this.isReady || !leftHand || !rightHand) return;

        const now = performance.now();
        if (now - this.lastFrameSwitchTime > 35) { 
            this.currentFrameIndex = (this.currentFrameIndex + 1) % 5;
            this.lastFrameSwitchTime = now;
        }

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const fingerTips = [4, 8, 12, 16, 20];

        fingerTips.forEach((index, i) => {
            const ptL = leftHand[index];
            const ptR = rightHand[index];

            if (ptL && ptR) {
                const p1 = { x: ptL.x * ctx.canvas.width, y: ptL.y * ctx.canvas.height };
                const p2 = { x: ptR.x * ctx.canvas.width, y: ptR.y * ctx.canvas.height };
                
                const activeFolder = this.folderNames[i];
                const activeImage = this.fingerBeamsData[activeFolder][this.currentFrameIndex];

                this.drawTiledImageBeam(ctx, p1, p2, activeImage);
            }
        });

        ctx.restore();
    }

    drawTiledImageBeam(ctx, p1, p2, activeImage) {
        if (!activeImage) return;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const totalDistance = Math.hypot(dx, dy);

        if (totalDistance < 15) return;

        const angle = Math.atan2(dy, dx);
        const beamHeight = 160; 

        ctx.save();
        ctx.translate(p1.x, p1.y);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.95;

        const tileWidth = 320; 
        let currentX = 0;

        while (currentX < totalDistance) {
            const remainingDistance = totalDistance - currentX;
            const drawWidth = remainingDistance < tileWidth ? remainingDistance + 2 : tileWidth;
            
            ctx.drawImage(
                activeImage,
                currentX, 
                -beamHeight / 2, 
                drawWidth, 
                beamHeight
            );
            
            currentX += tileWidth - 2; 
        }

        ctx.restore();
    }
}