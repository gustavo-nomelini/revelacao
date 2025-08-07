// Gerador de sons para a experiência
class SoundGenerator {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.log('Audio context não suportado:', error);
    }
  }

  // Gerar batimento cardíaco sintético
  generateHeartbeat() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Primeiro som do batimento (lub)
    this.createHeartbeatSound(now, 80, 0.1);
    // Segundo som do batimento (dub)
    this.createHeartbeatSound(now + 0.15, 60, 0.08);
  }

  createHeartbeatSound(startTime, frequency, duration) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Configurar filtro para som mais realista
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, startTime);

    // Configurar oscilador
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Envelope do som
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Conectar nós
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Iniciar e parar
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  // Som de suspense
  generateSuspenseSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Tom baixo e ominoso
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.createSuspenseTone(now + i * 0.5, 40 + i * 5, 0.8);
      }, i * 500);
    }
  }

  createSuspenseTone(startTime, frequency, duration) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, startTime);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.linearRampToValueAtTime(frequency * 0.8, startTime + duration);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.1, startTime + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  // Som de celebração
  generateCelebrationSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Acordes alegres
    const frequencies = [261.63, 329.63, 392.0, 523.25]; // C, E, G, C

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.createCelebrationNote(now + index * 0.1, freq, 0.5);
      }, index * 100);
    });

    // Efeito de "confete sonoro"
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        this.createSparkleSound(now + 1 + i * 0.1);
      }, 1000 + i * 100);
    }
  }

  createCelebrationNote(startTime, frequency, duration) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  createSparkleSound(startTime) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800 + Math.random() * 400, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  }

  // Iniciar loop de batimento cardíaco
  startHeartbeatLoop() {
    if (!this.audioContext) return;

    this.generateHeartbeat();

    // Repetir a cada ~1.2 segundos (como um batimento real)
    this.heartbeatInterval = setInterval(() => {
      this.generateHeartbeat();
    }, 1200);
  }

  stopHeartbeatLoop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Tornar disponível globalmente
window.SoundGenerator = SoundGenerator;
