import { CONFIG, ExponentialSmoothingFilter } from './utils.js';

export class MediaPipeManager {
    constructor(videoElement, onResultsCallback) {
        this.videoElement = videoElement;
        this.onResultsCallback = onResultsCallback;
        this.handsEngine = null;
        this.cameraUtilsInstance = null;
        this.isProcessingHalted = false;
        this.currentStream = null; 

        this.smoothFilters = {
            Left: Array.from({ length: 21 }, () => new ExponentialSmoothingFilter(0.4)),
            Right: Array.from({ length: 21 }, () => new ExponentialSmoothingFilter(0.4))
        };
    }

    async initializePipeline() {
        if (typeof window.Hands === 'undefined') {
            throw new Error("MediaPipe library not loaded.");
        }

        this.handsEngine = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.handsEngine.setOptions({
            maxNumHands: 2,
            modelComplexity: 1, 
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.55
        });

        this.handsEngine.onResults((results) => {
            if (this.isProcessingHalted) return;
            const parsedHands = this.preprocessTrackingCoordinates(results);
            this.onResultsCallback(parsedHands);
        });

        await this.startCameraCapture();
    }

    async startCameraCapture() {
        if (this.cameraUtilsInstance) {
            try {
                await this.cameraUtilsInstance.stop();
            } catch(e) {}
            this.cameraUtilsInstance = null;
        }

        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        const targetWidth = CONFIG.width || 1280;
        const targetHeight = CONFIG.height || 720;

        const constraints = {
            video: {
                deviceId: CONFIG.activeCameraId ? { exact: CONFIG.activeCameraId } : undefined,
                width: { ideal: targetWidth },
                height: { ideal: targetHeight },
                facingMode: "user"
            },
            audio: false
        };

        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.currentStream;
        } catch (err) {
            this.currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.videoElement.srcObject = this.currentStream;
        }

        this.cameraUtilsInstance = new window.Camera(this.videoElement, {
            onFrame: async () => {
                if (!this.isProcessingHalted) {
                    await this.handsEngine.send({ image: this.videoElement });
                }
            },
            width: targetWidth,
            height: targetHeight
        });

        await this.cameraUtilsInstance.start();
    }

    preprocessTrackingCoordinates(results) {
        const output = { Left: null, Right: null };
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            return output;
        }

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const rawLandmarks = results.multiHandLandmarks[i];
            const classification = results.multiHandedness[i];
            
            let handedness = classification.label; 
            if (CONFIG.mirrorMode) {
                handedness = handedness === 'Left' ? 'Right' : 'Left';
            }

            const smoothedLandmarks = rawLandmarks.map((lm, idx) => {
                let initialX = lm.x;
                if (CONFIG.mirrorMode) {
                    initialX = 1 - initialX;
                }
                
                const smoothPoint = this.smoothFilters[handedness][idx].filter(initialX, lm.y);
                return {
                    x: smoothPoint.x,
                    y: smoothPoint.y,
                    z: lm.z
                };
            });

            output[handedness] = smoothedLandmarks;
        }

        if (!output.Left) this.smoothFilters.Left.forEach(f => f.reset());
        if (!output.Right) this.smoothFilters.Right.forEach(f => f.reset());

        return output;
    }

    async changeResolution() {
        await this.startCameraCapture();
    }

    async updateCameraDevice(deviceId) {
        CONFIG.activeCameraId = deviceId;
        await this.startCameraCapture();
    }

    pause() {
        this.isProcessingHalted = true;
        this.videoElement.pause();
    }

    resume() {
        this.isProcessingHalted = false;
        this.videoElement.play();
    }
}