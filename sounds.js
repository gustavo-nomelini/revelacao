// Gerador de sons para a experiência
class SoundGenerator {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.heartbeatInterval = null;
    this.isHeartbeatPlaying = false;
    this.activeOscillators = new Set();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Criar contexto de áudio com compatibilidade para WebKit
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Tentar retomar o contexto se estiver suspenso
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('✅ AudioContext inicializado:', this.audioContext.state);
    } catch (error) {
      console.log('❌ Audio context não suportado:', error);
    }
  }

  async ensureAudioContextRunning() {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('✅ AudioContext retomado');
      } catch (error) {
        console.log('❌ Erro ao retomar AudioContext:', error);
      }
    }
  }

  // Gerar batimento cardíaco sintético
  async generateHeartbeat() {
    await this.ensureAudioContextRunning();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Primeiro som do batimento (lub)
    this.createHeartbeatSound(now, 80, 0.1);
    // Segundo som do batimento (dub)
    this.createHeartbeatSound(now + 0.15, 60, 0.08);
  }

  createHeartbeatSound(startTime, frequency, duration) {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Adicionar à lista de osciladores ativos
      this.activeOscillators.add(oscillator);

      // Configurar filtro para som mais realista
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, startTime);

      // Configurar oscilador
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, startTime);

      // Envelope do som - volume mais baixo para mobile
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      // Conectar nós
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Limpar da lista quando terminar
      oscillator.onended = () => {
        this.activeOscillators.delete(oscillator);
      };

      // Iniciar e parar
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      console.log('❌ Erro ao criar som de batimento:', error);
    }
  }

  // Som de suspense
  async generateSuspenseSound() {
    await this.ensureAudioContextRunning();
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

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Adicionar à lista de osciladores ativos
      this.activeOscillators.add(oscillator);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, startTime);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.frequency.linearRampToValueAtTime(frequency * 0.8, startTime + duration);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1); // Volume mais baixo
      gainNode.gain.linearRampToValueAtTime(0.08, startTime + duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Limpar da lista quando terminar
      oscillator.onended = () => {
        this.activeOscillators.delete(oscillator);
      };

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      console.log('❌ Erro ao criar som de suspense:', error);
    }
  }

  // Som de celebração
  async generateCelebrationSound() {
    await this.ensureAudioContextRunning();
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

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Adicionar à lista de osciladores ativos
      this.activeOscillators.add(oscillator);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05); // Volume mais baixo
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Limpar da lista quando terminar
      oscillator.onended = () => {
        this.activeOscillators.delete(oscillator);
      };

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      console.log('❌ Erro ao criar nota de celebração:', error);
    }
  }

  createSparkleSound(startTime) {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Adicionar à lista de osciladores ativos
      this.activeOscillators.add(oscillator);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800 + Math.random() * 400, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.01); // Volume mais baixo
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Limpar da lista quando terminar
      oscillator.onended = () => {
        this.activeOscillators.delete(oscillator);
      };

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    } catch (error) {
      console.log('❌ Erro ao criar som de brilho:', error);
    }
  }

  // Iniciar loop de batimento cardíaco
  async startHeartbeatLoop() {
    if (!this.audioContext) return;

    this.isHeartbeatPlaying = true;
    await this.generateHeartbeat();

    // Repetir a cada ~1.2 segundos (como um batimento real)
    this.heartbeatInterval = setInterval(async () => {
      if (this.isHeartbeatPlaying) {
        await this.generateHeartbeat();
      }
    }, 1200);
  }

  stopHeartbeatLoop() {
    this.isHeartbeatPlaying = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  forceStopAllSounds() {
    // Parar todos os osciladores ativos
    this.activeOscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch (error) {
        // Ignora erros se o oscilador já parou
      }
    });
    this.activeOscillators.clear();
  }

  stopAllSounds() {
    // Parar loop de batimentos
    this.stopHeartbeatLoop();

    // Parar todos os osciladores ativos
    this.forceStopAllSounds();

    console.log('✅ Todos os sons sintéticos foram parados');
  }
}

// Tornar disponível globalmente
window.SoundGenerator = SoundGenerator;
