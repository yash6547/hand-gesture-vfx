import { CONFIG } from './utils.js';

export class UIController {
    constructor(mediaPipeManagerInstance) {
        this.mpManager = mediaPipeManagerInstance;
        this.isMenuExpanded = false;
        
        this.toggleBtn = document.getElementById('toggle-settings');
        this.scrollArea = document.getElementById('settings-scroll-area');
        this.fpsVal = document.getElementById('fps-val');
        this.alertBanner = document.getElementById('gesture-alert');
        this.btnFullscreen = document.getElementById('btn-fullscreen');
        
        this.cameraSelect = document.getElementById('cameraSelect');
        this.resSelect = document.getElementById('resolutionScale');
        this.audioCheck = document.getElementById('audioPulse');
        this.statusIndicator = document.getElementById('engine-status');
        
        this.alertTimeout = null;
    }

    initializeUIHooks() {
        this.bindMenuControls();
        this.bindSliders();
        this.setupCameraDropdown();
        this.bindAdvancedFeatureHooks();
    }

    bindAdvancedFeatureHooks() {
        if (this.resSelect && this.mpManager) {
            this.resSelect.addEventListener('change', async (e) => {
                const targetRes = parseInt(e.target.value, 10);
                this.showSystemAlert(`RE-CALIBRATING ENGINE TO ${targetRes}p...`);
                
                if (targetRes === 1080) { CONFIG.width = 1920; CONFIG.height = 1080; }
                else if (targetRes === 720) { CONFIG.width = 1280; CONFIG.height = 720; }
                else { CONFIG.width = 640; CONFIG.height = 480; }

                try {
                    await this.mpManager.changeResolution();
                    this.showSystemAlert(`RESOLUTION LAYER READY`);
                } catch (err) {
                    this.showSystemAlert(`HARDWARE ENGINE REFUSED`);
                }
            });
        }

        if (this.audioCheck) {
            this.audioCheck.addEventListener('change', (e) => {
                CONFIG.audioPulseEnabled = e.target.checked;
                this.showSystemAlert(`HUD AUDIO: ${CONFIG.audioPulseEnabled ? 'ONLINE' : 'OFFLINE'}`);
            });
        }
    }

    async setupCameraDropdown() {
        if (!this.cameraSelect || !this.mpManager) return;

        try {
            await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {});
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            this.cameraSelect.innerHTML = '';

            if (videoDevices.length === 0) {
                this.cameraSelect.innerHTML = '<option value="">No Camera Found</option>';
                return;
            }

            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                if (CONFIG.activeCameraId === device.deviceId) option.selected = true;
                this.cameraSelect.appendChild(option);
            });

            this.cameraSelect.addEventListener('change', async (e) => {
                const targetId = e.target.value;
                if (!targetId) return;

                this.showSystemAlert("REFRESHING HARDWARE CAPTURE...");
                try {
                    await this.mpManager.updateCameraDevice(targetId);
                    this.showSystemAlert("WEBCAM MUTATED SUCCESSFULLY");
                } catch (err) {
                    this.showSystemAlert("STREAM INTERRUPT ERROR");
                }
            });

        } catch (error) {
            this.showSystemAlert("DEVICE ACCESS SCAN ERROR");
        }
    }

    bindMenuControls() {
        if (this.toggleBtn && this.scrollArea) {
            this.toggleBtn.addEventListener('click', () => {
                this.isMenuExpanded = !this.isMenuExpanded;
                if (this.isMenuExpanded) this.scrollArea.classList.remove('collapsed');
                else this.scrollArea.classList.add('collapsed');
            });
        }

        if (this.btnFullscreen) {
            this.btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                    this.btnFullscreen.textContent = "EXIT FULLSCREEN";
                } else {
                    document.exitFullscreen().catch(() => {});
                    this.btnFullscreen.textContent = "FULLSCREEN";
                }
            });
        }

        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.reload();
            });
        }
    }

    bindSliders() {
        const mappings = [
            { id: 'beam-thickness', prop: 'beamThickness', isFloat: false },
            { id: 'glow-intensity', prop: 'glowIntensity', isFloat: false }
        ];

        mappings.forEach(({ id, prop, isFloat }) => {
            const el = document.getElementById(id);
            const valSpan = document.getElementById(`v-${id}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    CONFIG[prop] = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                    if (valSpan) valSpan.textContent = e.target.value;
                });
            }
        });

        const mirrorCheck = document.getElementById('mirror-mode');
        if (mirrorCheck) {
            mirrorCheck.addEventListener('change', (e) => {
                CONFIG.mirrorMode = e.target.checked;
            });
        }
    }

    triggerBeepAudioAlert() {
        if (!CONFIG.audioPulseEnabled) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } catch (e) {}
    }

    showSystemAlert(message) {
        if (!this.alertBanner) return;
        if (this.alertTimeout) clearTimeout(this.alertTimeout);
        this.alertBanner.textContent = `SYS_ALERT: ${message}`;
        this.alertBanner.classList.remove('hidden');
        this.triggerBeepAudioAlert();
        this.alertTimeout = setTimeout(() => this.alertBanner.classList.add('hidden'), 2000);
    }

    updatePerformanceMetrics(fps) {
        if (this.fpsVal) {
            const frameInt = Math.round(fps);
            this.fpsVal.textContent = String(frameInt).padStart(2, '0');
            
            if (this.statusIndicator) {
                if (frameInt >= 50) { this.statusIndicator.textContent = "ULTRA"; this.statusIndicator.style.color = "#00ffcc"; }
                else if (frameInt >= 30) { this.statusIndicator.textContent = "STABLE"; this.statusIndicator.style.color = "#ffcc00"; }
                else { this.statusIndicator.textContent = "CRITICAL"; this.statusIndicator.style.color = "#ff3333"; }
            }
        }
    }
}
