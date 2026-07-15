export const CONFIG = {
    powerMode: 'neon-laser',
    beamThickness: 6,
    glowIntensity: 25,
    mirrorMode: true,
    fpsLimit: 60,
    width: 1280,
    height: 720,
    activeCameraId: null,
    audioPulseEnabled: false,
    chromaKeyEnabled: false 
};

export function getDistance2D(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export class ExponentialSmoothingFilter {
    constructor(alpha = 0.4) {
        this.alpha = alpha;
        this.savedX = null;
        this.savedY = null;
    }

    filter(currentX, currentY) {
        if (this.savedX === null || this.savedY === null) {
            this.savedX = currentX;
            this.savedY = currentY;
            return { x: currentX, y: currentY };
        }
        this.savedX = this.alpha * currentX + (1 - this.alpha) * this.savedX;
        this.savedY = this.alpha * currentY + (1 - this.alpha) * this.savedY;
        return { x: this.savedX, y: this.savedY };
    }

    reset() {
        this.savedX = null;
        this.savedY = null;
    }
}