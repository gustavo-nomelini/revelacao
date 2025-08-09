// Configurações da experiência
const EXPERIENCE_CONFIG = {
  sounds: {
    heartbeat: true,
    suspense: true,
    celebration: true,
  },
  timing: {
    countdown: 10,
    phases: {
      mystery: 14000,
      buildup: 17000,
      duel: 20000, // Duelo expandido: 3s carregamento + 3s fase1 + 4s fase2 + 10s fase3
      reveal: 8000, // Aumentado de 3000 para 8000ms (8 segundos)
      celebration: 20000,
    },
  },
  colors: {
    mystery: ['#1e1e2e', '#2d1b69', '#11047a'],
    buildup: ['#ff6b6b', '#ee5a24', '#f9ca24'],
    duel: ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981'], // Cores neutras para o duelo
    reveal: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1'],
    celebration: ['#ff69b4', '#87ceeb', '#98fb98', '#dda0dd'],
  },
};

class RevealExperience {
  constructor() {
    this.currentPhase = 'landing';
    this.soundGenerator = new SoundGenerator();
    this.particles = [];
    this.animationId = null;
    this.celebrationMusic = null;
    this.climaxMusic = null;
    this.isMobile = this.detectMobile();
    this.audioUnlocked = false;
    this.experienceStartTime = null;
    this.celebrationMusicAllowed = false;
    this.allAudiosPreAuthorized = false;
    this.experienceStarted = false;

    console.log('🎬 Construtor RevealExperience chamado');
    console.log('📱 Mobile detectado:', this.isMobile);

    this.initializeElements();
    this.bindEvents();
    this.loadCelebrationMusic();
    this.loadClimaxMusic();

    // Preparações específicas para mobile
    if (this.isMobile) {
      this.prepareMobileAudio();
    }

    console.log('✅ Construtor RevealExperience concluído');
  }

  // Método de debug para testar manualmente
  debugButton() {
    console.log('🔍 DEBUG: Estado do botão');
    console.log('Botão encontrado:', !!this.enterButton);
    console.log('Experiência iniciada:', this.experienceStarted);

    if (this.enterButton) {
      console.log('Botão habilitado:', !this.enterButton.disabled);
      console.log('Estilo do botão:', this.enterButton.style.cssText);
      console.log('Classes do botão:', this.enterButton.className);
    }

    // Tentar forçar início da experiência
    if (!this.experienceStarted) {
      console.log('🚀 Forçando início da experiência via debug...');
      this.startExperience();
    }
  }

  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  }

  prepareMobileAudio() {
    // Função simplificada para desbloqueio de áudio no mobile
    const unlockAudio = async (event) => {
      // Verificar se o clique foi no botão de entrada ou em um elemento válido
      const target = event.target;
      const isValidTarget =
        target.id === 'enterButton' ||
        target.closest('#enterButton') ||
        target.closest('button') ||
        target.closest('.music-button') ||
        target.closest('.share-button') ||
        target.closest('.repeat-button');

      if (!this.audioUnlocked && isValidTarget) {
        console.log('🔓 Tentando desbloquear áudio no mobile...');

        try {
          // 1. Desbloquear AudioContext sintético primeiro
          if (this.soundGenerator && !this.soundGenerator.isInitialized) {
            await this.soundGenerator.initialize();
          }

          if (this.soundGenerator?.audioContext?.state === 'suspended') {
            await this.soundGenerator.audioContext.resume();
          }

          // 2. Tentar desbloqueio com os arquivos de áudio
          const unlockPromises = [];

          if (this.celebrationMusic) {
            this.celebrationMusic.volume = 0;
            this.celebrationMusic.muted = true;
            const promise = this.celebrationMusic
              .play()
              .then(() => {
                this.celebrationMusic.pause();
                this.celebrationMusic.currentTime = 0;
                this.celebrationMusic.muted = false;
                console.log('✅ Música de celebração desbloqueada');
              })
              .catch((e) => console.log('❌ Falha ao desbloquear celebração:', e));
            unlockPromises.push(promise);
          }

          if (this.climaxMusic) {
            this.climaxMusic.volume = 0;
            this.climaxMusic.muted = true;
            const promise = this.climaxMusic
              .play()
              .then(() => {
                this.climaxMusic.pause();
                this.climaxMusic.currentTime = 0;
                this.climaxMusic.muted = false;
                console.log('✅ Música do clímax desbloqueada');
              })
              .catch((e) => console.log('❌ Falha ao desbloquear clímax:', e));
            unlockPromises.push(promise);
          }

          // Aguardar todas as tentativas de desbloqueio
          await Promise.allSettled(unlockPromises);

          this.audioUnlocked = true;
          console.log('🎉 Áudio desbloqueado no mobile com sucesso!');

          // Remover listeners após desbloqueio bem-sucedido
          document.removeEventListener('touchstart', unlockAudio);
          document.removeEventListener('touchend', unlockAudio);
          document.removeEventListener('click', unlockAudio);
        } catch (error) {
          console.log('❌ Erro ao desbloquear áudio:', error);
        }
      }
    };

    // Adicionar listeners para primeira interação válida
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('touchend', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio);
  }

  stopAllAudio() {
    console.log('🛑 Parando todos os áudios...');

    // Parar música do clímax
    if (this.climaxMusic && !this.climaxMusic.paused) {
      this.climaxMusic.pause();
      this.climaxMusic.currentTime = 0;
      console.log('✅ Música do clímax parada');
    }

    // Parar música de celebração
    if (this.celebrationMusic && !this.celebrationMusic.paused) {
      this.celebrationMusic.pause();
      this.celebrationMusic.currentTime = 0;
      console.log('✅ Música de celebração parada');
    }

    // Parar sons sintéticos
    if (this.soundGenerator) {
      try {
        this.soundGenerator.stopHeartbeatLoop();
        this.soundGenerator.stopAllSounds();
        console.log('✅ Sons sintéticos parados');
      } catch (error) {
        console.log('❌ Erro ao parar sons sintéticos:', error);
      }
    }
  }

  // Função para parar qualquer áudio inadequado para a fase atual
  stopInappropriateAudio() {
    console.log(`🧹 Limpando áudios inadequados para fase: ${this.currentPhase}`);

    // Durante mystery e countdown, NENHUM áudio de clímax deve tocar
    if (this.currentPhase === 'mystery' || this.currentPhase === 'countdown') {
      if (this.climaxMusic && !this.climaxMusic.paused) {
        this.climaxMusic.pause();
        this.climaxMusic.currentTime = 0;
        console.log('🛑 Áudio do clímax parado - fase não permite clímax');
      }
    }

    // Durante duelo e depois, clímax deve estar parado
    if (
      this.currentPhase === 'duel' ||
      this.currentPhase === 'reveal' ||
      this.currentPhase === 'celebration'
    ) {
      if (this.climaxMusic && !this.climaxMusic.paused) {
        this.climaxMusic.pause();
        this.climaxMusic.currentTime = 0;
        console.log('🛑 Áudio do clímax parado - fase posterior ao buildup');
      }
    }
  }

  async preAuthorizeMobileAudio() {
    if (this.allAudiosPreAuthorized) return;

    console.log('🔓 Preparando áudios para mobile...');

    try {
      // 1. Inicializar contexto de áudio sintético
      if (this.soundGenerator && !this.soundGenerator.isInitialized) {
        console.log('🎵 Inicializando soundGenerator...');
        await this.soundGenerator.initialize();

        if (this.soundGenerator.audioContext?.state === 'suspended') {
          await this.soundGenerator.audioContext.resume();
        }
        console.log(
          `✅ SoundGenerator: ${this.soundGenerator.isInitialized}, Estado: ${this.soundGenerator.audioContext?.state}`
        );
      }

      // 2. Preparar arquivos de áudio sem reproduzir
      if (this.climaxMusic) {
        this.climaxMusic.preload = 'auto';
        this.climaxMusic.volume = 0.8;
        console.log('✅ Música do clímax preparada');
      }

      if (this.celebrationMusic) {
        this.celebrationMusic.preload = 'auto';
        this.celebrationMusic.volume = 0.7;
        console.log('✅ Música de celebração preparada');
      }

      // 3. Marcar como preparado
      this.allAudiosPreAuthorized = true;
      console.log('🎉 Áudios preparados para reprodução!');
    } catch (error) {
      console.log('❌ Erro na preparação:', error);
    }
  }

  scheduleAutoAudioPlayback() {
    console.log('📅 Configurando reprodução automática de áudio...');

    // Calcular os momentos exatos para cada áudio
    const countdownTime = EXPERIENCE_CONFIG.timing.countdown * 1000;
    const mysteryTime = countdownTime + EXPERIENCE_CONFIG.timing.phases.mystery;
    const buildupTime = mysteryTime + EXPERIENCE_CONFIG.timing.phases.buildup;
    const celebrationTime =
      buildupTime + EXPERIENCE_CONFIG.timing.phases.duel + EXPERIENCE_CONFIG.timing.phases.reveal;

    // Monitorar e tocar música do clímax na fase buildup
    const checkClimaxMusic = setInterval(() => {
      if (this.currentPhase === 'buildup' && this.climaxMusic && this.climaxMusic.paused) {
        console.log('🎵 Verificação: Tentando tocar música do clímax...');
        this.playClimaxMusic();
        clearInterval(checkClimaxMusic);
      } else if (
        this.currentPhase !== 'buildup' &&
        this.currentPhase !== 'mystery' &&
        this.currentPhase !== 'countdown'
      ) {
        clearInterval(checkClimaxMusic);
      }
    }, 1000);

    // Monitorar e tocar música de celebração na fase celebration
    const checkCelebrationMusic = setInterval(() => {
      if (
        this.currentPhase === 'celebration' &&
        this.celebrationMusic &&
        this.celebrationMusic.paused
      ) {
        console.log('� Verificação: Tentando tocar música de celebração...');
        // REMOVIDO: this.playCelebrationMusic(); - agora usa timing calculado
        clearInterval(checkCelebrationMusic);
      } else if (this.currentPhase !== 'celebration') {
        // Continuar verificando até chegar na celebração
      }
    }, 1000);

    // Timeout de segurança para limpar intervalos
    setTimeout(() => {
      clearInterval(checkClimaxMusic);
    }, buildupTime + 10000);

    setTimeout(() => {
      clearInterval(checkCelebrationMusic);
    }, celebrationTime + 30000);

    console.log(`📅 Monitoramento de áudio ativado:
      - Clímax: fase buildup
      - Celebração: fase celebration`);
  }

  async playClimaxMusic() {
    if (!this.climaxMusic) {
      console.log('❌ Música do clímax não carregada');
      return;
    }

    console.log('🎵 Iniciando reprodução da música do clímax...');

    try {
      // Forçar parada e reset
      this.climaxMusic.pause();
      this.climaxMusic.currentTime = 0;

      // Definir volume antes de tocar
      this.climaxMusic.volume = this.isMobile ? 0.9 : 0.8;

      // Aguardar carregamento se necessário
      if (this.climaxMusic.readyState < 2) {
        console.log('⏳ Aguardando carregamento da música do clímax...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout ao carregar')), 5000);
          this.climaxMusic.addEventListener(
            'canplay',
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );
        });
      }

      // Tentar reproduzir
      console.log('▶️ Tentando reproduzir música do clímax...');
      await this.climaxMusic.play();
      console.log('✅ Música do clímax reproduzindo com sucesso!');
    } catch (error) {
      console.log('❌ Erro ao reproduzir música do clímax:', error);

      // Retry mais agressivo para mobile
      if (this.isMobile) {
        console.log('📱 Tentativa adicional para mobile...');
        try {
          // Tentar desbloqueio silencioso
          this.climaxMusic.volume = 0;
          await this.climaxMusic.play();
          this.climaxMusic.pause();
          this.climaxMusic.currentTime = 0;
          this.climaxMusic.volume = 0.9;
          await this.climaxMusic.play();
          console.log('✅ Música do clímax desbloqueada e reproduzindo!');
        } catch (e2) {
          console.log('❌ Falha completa na reprodução do clímax:', e2);
        }
      }
    }
  }
  async playCelebrationMusic() {
    if (!this.celebrationMusic) {
      console.log('❌ Música de celebração não carregada');
      return;
    }

    console.log('🎉 Iniciando reprodução da música de celebração...');

    // Para mobile, tentar primeiro um desbloqueio específico
    if (this.isMobile && !this.audioUnlocked) {
      console.log('📱 Mobile detectado sem áudio desbloqueado - fazendo desbloqueio específico');
      try {
        this.celebrationMusic.muted = true;
        this.celebrationMusic.volume = 0;
        await this.celebrationMusic.play();
        this.celebrationMusic.pause();
        this.celebrationMusic.currentTime = 0;
        this.celebrationMusic.muted = false;
        this.audioUnlocked = true;
        console.log('✅ Áudio desbloqueado especificamente para celebração');
      } catch (unlockError) {
        console.log('⚠️ Não foi possível desbloquear automaticamente:', unlockError);
      }
    }

    try {
      // Forçar parada e reset
      this.celebrationMusic.pause();
      this.celebrationMusic.currentTime = 0;

      // Aguardar carregamento se necessário
      if (this.celebrationMusic.readyState < 2) {
        console.log('⏳ Aguardando carregamento da música de celebração...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout ao carregar')), 5000);
          this.celebrationMusic.addEventListener(
            'canplay',
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );
        });
      }

      // Começar com volume baixo para fade in
      this.celebrationMusic.volume = 0;

      // Tentar reproduzir
      console.log('▶️ Tentando reproduzir música de celebração...');
      await this.celebrationMusic.play();
      console.log('✅ Música de celebração reproduzindo com sucesso!');

      // Fade in suave
      let volume = 0;
      const targetVolume = this.isMobile ? 0.8 : 0.7;
      const fadeIn = setInterval(() => {
        volume += 0.05;
        if (volume >= targetVolume) {
          volume = targetVolume;
          clearInterval(fadeIn);
        }
        this.celebrationMusic.volume = volume;
      }, 100);
    } catch (error) {
      console.log('❌ Erro ao reproduzir música de celebração:', error);

      // Retry específico para mobile
      if (this.isMobile) {
        console.log('� Tentativa de recuperação para mobile...');
        this.showManualPlayButtonMobile();
      } else {
        // Retry para desktop
        try {
          console.log('🔄 Tentativa adicional de reprodução para desktop...');
          this.celebrationMusic.volume = 0;
          await this.celebrationMusic.play();

          // Fade in após retry
          let volume = 0;
          const targetVolume = 0.7;
          const fadeIn = setInterval(() => {
            volume += 0.05;
            if (volume >= targetVolume) {
              volume = targetVolume;
              clearInterval(fadeIn);
            }
            this.celebrationMusic.volume = volume;
          }, 100);

          console.log('✅ Música de celebração reproduzindo após retry!');
        } catch (e2) {
          console.log('❌ Falha completa na reprodução da celebração:', e2);
          this.showManualPlayButton();
        }
      }
    }
  }

  showManualPlayButton() {
    console.log('🔘 Mostrando botão manual para música');

    // Criar botão manual
    const manualButton = document.createElement('button');
    manualButton.innerHTML = '🎵 Tocar Música';
    manualButton.className =
      'fixed top-4 right-4 z-50 bg-pink-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-pink-600';

    manualButton.onclick = async () => {
      try {
        this.celebrationMusic.volume = 0;
        await this.celebrationMusic.play();

        // Fade in
        let volume = 0;
        const targetVolume = this.isMobile ? 0.8 : 0.7;
        const fadeIn = setInterval(() => {
          volume += 0.05;
          if (volume >= targetVolume) {
            volume = targetVolume;
            clearInterval(fadeIn);
          }
          this.celebrationMusic.volume = volume;
        }, 100);

        // Remover botão após sucesso
        manualButton.remove();
        console.log('✅ Música tocando via botão manual');
      } catch (e) {
        console.log('❌ Falha mesmo com botão manual:', e);
      }
    };

    document.body.appendChild(manualButton);
  }

  async playCelebrationMusicWithTiming() {
    console.log('🎵 EXECUTANDO MÚSICA DE CELEBRAÇÃO COM TIMING CALCULADO');

    if (!this.celebrationMusic) {
      console.log('❌ Música de celebração não carregada');
      return;
    }

    try {
      // Preparação simples e direta
      this.celebrationMusic.pause();
      this.celebrationMusic.currentTime = 0;

      // Para mobile: tentar desbloqueio se necessário
      if (this.isMobile && this.celebrationMusic.paused) {
        console.log('📱 Desbloqueio específico para mobile...');
        this.celebrationMusic.muted = true;
        await this.celebrationMusic.play();
        this.celebrationMusic.pause();
        this.celebrationMusic.currentTime = 0;
        this.celebrationMusic.muted = false;
      }

      // Reprodução direta
      this.celebrationMusic.volume = this.isMobile ? 0.9 : 0.7;
      await this.celebrationMusic.play();

      console.log('✅ MÚSICA DE CELEBRAÇÃO TOCANDO - TIMING PERFEITO!');
    } catch (error) {
      console.log('❌ Erro no timing da música:', error);

      // Fallback único: botão simples apenas se falhar
      if (this.isMobile) {
        this.showSimpleMusicButton();
      }
    }
  }

  showSimpleMusicButton() {
    const btn = document.createElement('button');
    btn.innerHTML = '🎵 Música';
    btn.className =
      'fixed top-4 right-4 z-50 bg-pink-500 text-white px-3 py-2 rounded-full font-bold';
    btn.onclick = async () => {
      try {
        this.celebrationMusic.volume = 0.9;
        await this.celebrationMusic.play();
        btn.remove();
      } catch (e) {
        console.log('Erro manual:', e);
      }
    };
    document.body.appendChild(btn);
  }

  async playCelebrationMusicDefinitive() {
    console.log('🎵 MÉTODO DEFINITIVO - FORÇANDO MÚSICA DE CELEBRAÇÃO!');

    if (!this.celebrationMusic) {
      console.log('❌ Música de celebração não carregada');
      return;
    }

    // Parar qualquer reprodução anterior
    this.celebrationMusic.pause();
    this.celebrationMusic.currentTime = 0;

    try {
      // ESTRATÉGIA 1: Reprodução direta (funciona se áudio já foi desbloqueado)
      this.celebrationMusic.volume = this.isMobile ? 0.9 : 0.7;
      await this.celebrationMusic.play();
      console.log('✅ MÚSICA TOCANDO - MÉTODO DIRETO!');
      return; // Sucesso - sair da função
    } catch (directError) {
      console.log('⚠️ Método direto falhou:', directError);

      // ESTRATÉGIA 2: Desbloqueio agressivo para mobile
      if (this.isMobile) {
        try {
          console.log('📱 Tentando desbloqueio agressivo...');

          // Múltiplas tentativas de desbloqueio
          for (let i = 0; i < 3; i++) {
            this.celebrationMusic.muted = true;
            this.celebrationMusic.volume = 0;
            await this.celebrationMusic.play();
            this.celebrationMusic.pause();
            this.celebrationMusic.currentTime = 0;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Tentar reprodução real
          this.celebrationMusic.muted = false;
          this.celebrationMusic.volume = 0.9;
          await this.celebrationMusic.play();
          console.log('✅ MÚSICA TOCANDO - DESBLOQUEIO AGRESSIVO!');
          return;
        } catch (mobileError) {
          console.log('❌ Desbloqueio agressivo falhou:', mobileError);
        }
      }

      // ESTRATÉGIA 3: Fallback com interação do usuário
      console.log('🔘 Ativando fallback com botão...');
      this.showCelebrationMusicButton();
    }
  }

  showCelebrationMusicButton() {
    // Remover botões existentes
    const existingBtns = document.querySelectorAll('.celebration-music-btn');
    existingBtns.forEach((btn) => btn.remove());

    const btn = document.createElement('button');
    btn.innerHTML = '🎵 Tocar Música de Celebração';
    btn.className =
      'celebration-music-btn fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-2xl animate-bounce';

    btn.onclick = async () => {
      try {
        this.celebrationMusic.volume = this.isMobile ? 0.9 : 0.7;
        await this.celebrationMusic.play();
        btn.remove();
        console.log('✅ MÚSICA TOCANDO - BOTÃO MANUAL!');
      } catch (e) {
        console.log('❌ Erro mesmo com botão:', e);
        btn.innerHTML = '❌ Erro - Tente novamente';
      }
    };

    document.body.appendChild(btn);

    // Auto-remover após 15 segundos
    setTimeout(() => {
      if (btn.parentNode) btn.remove();
    }, 15000);
  }

  showManualPlayButtonMobile() {
    console.log('📱 Mostrando botão manual otimizado para mobile');

    // Criar botão mais visível para mobile
    const manualButton = document.createElement('button');
    manualButton.innerHTML = '🎵 Tocar Música de Celebração';
    manualButton.className =
      'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl text-lg animate-pulse';

    // Adicionar fundo escuro para melhor visibilidade
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40';

    manualButton.onclick = async () => {
      try {
        console.log('📱 Tentativa manual de reprodução no mobile...');

        // Desbloqueio mais agressivo para mobile
        this.celebrationMusic.muted = false;
        this.celebrationMusic.volume = 0;
        this.celebrationMusic.currentTime = 0;

        await this.celebrationMusic.play();

        // Fade in mais rápido para mobile
        let volume = 0;
        const targetVolume = 0.9; // Volume mais alto para mobile
        const fadeIn = setInterval(() => {
          volume += 0.1; // Fade mais rápido
          if (volume >= targetVolume) {
            volume = targetVolume;
            clearInterval(fadeIn);
          }
          this.celebrationMusic.volume = volume;
        }, 50);

        // Remover overlay e botão após sucesso
        overlay.remove();
        manualButton.remove();
        this.audioUnlocked = true;
        console.log('✅ Música tocando via botão manual mobile!');
      } catch (e) {
        console.log('❌ Falha mesmo com botão manual mobile:', e);
        manualButton.innerHTML = '❌ Erro - Tente novamente';
        manualButton.className = manualButton.className.replace(
          'from-pink-500 to-purple-600',
          'from-red-500 to-red-700'
        );
      }
    };

    document.body.appendChild(overlay);
    document.body.appendChild(manualButton);

    // Auto-remover após 30 segundos se não usado
    setTimeout(() => {
      if (manualButton.parentNode) {
        overlay.remove();
        manualButton.remove();
      }
    }, 30000);
  }

  initializeElements() {
    console.log('🔧 Inicializando elementos...');
    this.landingScreen = document.getElementById('landingScreen');
    this.experienceScreen = document.getElementById('experienceScreen');
    this.enterButton = document.getElementById('enterButton');
    this.buttonText = document.getElementById('buttonText');
    this.countdownElement = document.getElementById('countdown');

    // Debug: verificar se elementos foram encontrados
    console.log('🔍 Elementos encontrados:', {
      landingScreen: !!this.landingScreen,
      experienceScreen: !!this.experienceScreen,
      enterButton: !!this.enterButton,
      buttonText: !!this.buttonText,
      countdownElement: !!this.countdownElement,
    });

    if (!this.enterButton) {
      console.error('❌ ERRO: Botão de entrada não encontrado!');
    }
  }

  bindEvents() {
    console.log('🔗 Vinculando eventos...');

    // Verificar se o botão existe antes de adicionar o evento
    if (!this.enterButton) {
      console.error('❌ ERRO: Não é possível vincular eventos - botão não encontrado!');
      return;
    }

    console.log('✅ Botão encontrado, adicionando evento de clique...');

    // Evento específico para o botão de entrada
    this.enterButton.addEventListener('click', (event) => {
      console.log('🖱️ Botão clicado!');
      event.preventDefault();
      event.stopPropagation();
      this.startExperience();
    });

    // Prevenir cliques acidentais em outras áreas da tela inicial
    if (this.landingScreen) {
      this.landingScreen.addEventListener('click', (event) => {
        // Só permitir cliques no botão de entrada
        if (!event.target.closest('#enterButton')) {
          event.preventDefault();
          event.stopPropagation();

          console.log('🖱️ Clique fora do botão - dando feedback visual');

          // Feedback visual para cliques fora do botão
          const button = this.enterButton;
          if (button) {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 0 20px rgba(255, 105, 180, 0.8)';

            setTimeout(() => {
              button.style.transform = '';
              button.style.boxShadow = '';
            }, 200);

            // Vibração de feedback no mobile
            if (this.isMobile) {
              this.vibrate([50]);
            }
          }
        }
      });
    }

    // Detectar se é mobile para vibração
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    console.log('🔗 Eventos vinculados com sucesso!');
  }

  loadCelebrationMusic() {
    this.celebrationMusic = new Audio(
      './O Espírito da Coisa - Ligeiramente Grávida [zdeKhxfiSVs].mp3'
    );

    // Configurações otimizadas para compatibilidade mobile
    this.celebrationMusic.preload = 'auto';
    this.celebrationMusic.volume = this.isMobile ? 0.8 : 0.7;

    // Adicionar listeners para monitoramento
    this.celebrationMusic.addEventListener('loadstart', () => {
      console.log('🎵 Iniciando carregamento da música de celebração');
    });

    this.celebrationMusic.addEventListener('canplay', () => {
      console.log('✅ Música de celebração pronta para reprodução');
    });

    this.celebrationMusic.addEventListener('error', (e) => {
      console.error('❌ Erro ao carregar música de celebração:', e);
    });

    this.celebrationMusic.addEventListener('stalled', () => {
      console.log('⚠️ Carregamento da música de celebração travado');
    });
  }

  loadClimaxMusic() {
    this.climaxMusic = new Audio('./Climax 1⧸2 (Suspense) sound effects [NQRbIrEHY3M].mp3');

    // Configurações otimizadas para compatibilidade mobile
    this.climaxMusic.preload = 'auto';
    this.climaxMusic.volume = this.isMobile ? 0.9 : 0.8;

    // Adicionar listeners para monitoramento
    this.climaxMusic.addEventListener('loadstart', () => {
      console.log('🎵 Iniciando carregamento da música do clímax');
    });

    this.climaxMusic.addEventListener('canplay', () => {
      console.log('✅ Música do clímax pronta para reprodução');
    });

    this.climaxMusic.addEventListener('error', (e) => {
      console.error('❌ Erro ao carregar música do clímax:', e);
    });

    this.climaxMusic.addEventListener('stalled', () => {
      console.log('⚠️ Carregamento da música do clímax travado');
    });
  }

  vibrate(pattern = [100, 50, 100]) {
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  async startExperience() {
    console.log('🚀 INICIANDO EXPERIÊNCIA...');

    // Prevenir múltiplas execuções
    if (this.experienceStarted) {
      console.log('⚠️ Experiência já foi iniciada, ignorando clique duplicado');
      return;
    }

    console.log('✅ Primeira execução, prosseguindo...');

    // Garantir que todos os áudios estão parados antes de iniciar
    this.stopAllAudio();

    this.experienceStarted = true;
    console.log('🎯 Marcado como iniciado');

    try {
      // Marcar o início da experiência
      this.experienceStartTime = Date.now();
      console.log('⏰ Tempo de início marcado');

      // Preparar áudios para mobile
      if (this.isMobile) {
        console.log('📱 Dispositivo mobile detectado, preparando áudios...');
        await this.preAuthorizeMobileAudio();
        // Aguardar um momento para garantir que a preparação foi concluída
        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log('✅ Áudios mobile preparados');
      }

      // Configurar reprodução automática de áudios
      this.scheduleAutoAudioPlayback();

      // Calcular quando a música de celebração deverá tocar (SINCRONIZADO com a tela)
      // A tela de celebração aparece DEPOIS do período de reveal, então ajustamos o timing
      const totalTimeUntilCelebration =
        EXPERIENCE_CONFIG.timing.countdown * 1000 +
        EXPERIENCE_CONFIG.timing.phases.mystery +
        EXPERIENCE_CONFIG.timing.phases.buildup +
        EXPERIENCE_CONFIG.timing.phases.duel +
        EXPERIENCE_CONFIG.timing.phases.reveal + // Tempo até o reveal terminar
        EXPERIENCE_CONFIG.timing.phases.reveal; // + tempo do próprio reveal para sincronizar com a tela

      console.log(`⏰ Timing CORRIGIDO da experiência:
        - Countdown: ${EXPERIENCE_CONFIG.timing.countdown}s
        - Mystery: ${EXPERIENCE_CONFIG.timing.phases.mystery / 1000}s
        - Buildup: ${EXPERIENCE_CONFIG.timing.phases.buildup / 1000}s  
        - Duel: ${EXPERIENCE_CONFIG.timing.phases.duel / 1000}s
        - Reveal: ${EXPERIENCE_CONFIG.timing.phases.reveal / 1000}s
        - Transição p/ celebração: ${EXPERIENCE_CONFIG.timing.phases.reveal / 1000}s
        - 🎵 MÚSICA CELEBRAÇÃO (SINCRONIZADA): ${totalTimeUntilCelebration / 1000}s`);

      // DESABILITADO: Timing antigo (agora música toca diretamente na tela)
      // setTimeout(() => {
      //   console.log('🎵 TEMPO EXATO ATINGIDO - Iniciando música de celebração...');
      //   this.playCelebrationMusicWithTiming();
      // }, totalTimeUntilCelebration);

      // Habilitar áudio
      await this.initializeAudio();

      // Preparar música de celebração para mobile (pré-carregamento)
      if (this.celebrationMusic) {
        this.celebrationMusic.load();
        // Tentar uma reprodução silenciosa para "acordar" o contexto de áudio
        this.celebrationMusic.volume = 0;
        const silentPlay = this.celebrationMusic.play();
        if (silentPlay) {
          silentPlay
            .then(() => {
              this.celebrationMusic.pause();
              this.celebrationMusic.currentTime = 0;
              console.log('Música de celebração preparada para mobile');
            })
            .catch((e) => {
              console.log('Preparação silenciosa falhou, música será ativada manualmente');
            });
        }
      }

      // Atualizar botão
      this.enterButton.disabled = true;
      this.buttonText.textContent = 'Preparando...';
      this.vibrate();

      // Aguardar e iniciar countdown
      setTimeout(() => {
        this.buttonText.textContent = 'Experiência Iniciada!';
        this.startCountdown();
      }, 1000);
    } catch (error) {
      console.log('Erro ao inicializar áudio:', error);
      // Continuar sem áudio
      this.startCountdown();
    }
  }

  async initializeAudio() {
    console.log('🎵 Inicializando áudio...');

    try {
      await this.soundGenerator.initialize();

      // CORREÇÃO MOBILE: Verificar se o contexto foi realmente inicializado
      if (this.soundGenerator.audioContext) {
        console.log(`📱 AudioContext estado: ${this.soundGenerator.audioContext.state}`);

        // Se estiver suspenso, tentar retomar
        if (this.soundGenerator.audioContext.state === 'suspended') {
          console.log('⚠️ Tentando retomar AudioContext suspenso...');
          await this.soundGenerator.audioContext.resume();
          console.log(`✅ AudioContext retomado: ${this.soundGenerator.audioContext.state}`);
        }
      }

      // Iniciar batimento cardíaco apenas se o contexto estiver ativo
      if (
        this.soundGenerator.audioContext &&
        this.soundGenerator.audioContext.state === 'running'
      ) {
        this.soundGenerator.startHeartbeatLoop();
        console.log('✅ Batimento cardíaco iniciado');
      } else {
        console.log('⚠️ AudioContext não está rodando, batimento será iniciado quando possível');
        // Tentar novamente após um delay
        setTimeout(() => {
          if (
            this.soundGenerator.audioContext &&
            this.soundGenerator.audioContext.state === 'running'
          ) {
            this.soundGenerator.startHeartbeatLoop();
            console.log('✅ Batimento cardíaco iniciado (segunda tentativa)');
          }
        }, 1000);
      }
    } catch (error) {
      console.log('❌ Erro na inicialização de áudio:', error);
    }
  }

  startCountdown() {
    let count = EXPERIENCE_CONFIG.timing.countdown;

    const countdownInterval = setInterval(() => {
      count--;
      this.countdownElement.textContent = count;
      this.vibrate([50]);

      if (count <= 0) {
        clearInterval(countdownInterval);
        this.transitionToMystery();
      }
    }, 1000);
  }

  transitionToMystery() {
    // Fade out da landing
    this.landingScreen.style.transition = 'opacity 1s ease-out';
    this.landingScreen.style.opacity = '0';

    setTimeout(() => {
      this.landingScreen.style.display = 'none';
      this.experienceScreen.classList.remove('hidden');
      this.startMysteryPhase();
    }, 1000);
  }

  startMysteryPhase() {
    this.currentPhase = 'mystery';

    // Limpeza de áudios inadequados
    this.stopInappropriateAudio();

    // PROTEÇÃO: Garantir que música do clímax não está tocando na fase mystery
    if (this.climaxMusic) {
      this.climaxMusic.pause();
      this.climaxMusic.currentTime = 0;
      console.log('🛡️ Áudio do clímax parado durante entrada na fase mystery');
    }

    // CORREÇÃO MOBILE: Verificar se batimento cardíaco está funcionando
    if (this.soundGenerator && this.soundGenerator.audioContext) {
      console.log(
        `💓 Verificando batimento cardíaco - Estado do contexto: ${this.soundGenerator.audioContext.state}`
      );

      if (this.soundGenerator.audioContext.state === 'suspended') {
        console.log('⚠️ AudioContext suspenso na fase mystery, tentando retomar...');
        this.soundGenerator.audioContext.resume().then(() => {
          console.log('✅ AudioContext retomado na fase mystery');
          if (!this.soundGenerator.isHeartbeatPlaying) {
            this.soundGenerator.startHeartbeatLoop();
            console.log('💓 Batimento cardíaco reiniciado na fase mystery');
          }
        });
      } else if (
        !this.soundGenerator.isHeartbeatPlaying &&
        this.soundGenerator.audioContext.state === 'running'
      ) {
        this.soundGenerator.startHeartbeatLoop();
        console.log('💓 Batimento cardíaco iniciado na fase mystery');
      }
    }

    // Criar conteúdo da fase mistério
    this.experienceScreen.innerHTML = `
            <div class="mystery-phase relative h-full overflow-hidden">
                <!-- Fundo com gradiente escuro -->
                <div class="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-black"></div>
                
                <!-- Partículas misteriosas -->
                <div id="mysteryParticles" class="absolute inset-0"></div>
                
                <!-- Conteúdo central -->
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
                    <div class="mystery-content opacity-0 animate-pulse max-w-sm sm:max-w-lg md:max-w-4xl mx-auto">
                        <!-- Símbolos misteriosos -->
                        <div class="mystery-symbols text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-4 sm:mb-6 md:mb-8 space-x-2 sm:space-x-3 md:space-x-4">
                            <span class="inline-block animate-bounce" style="animation-delay: 0s">🔮</span>
                            <span class="inline-block animate-bounce" style="animation-delay: 0.2s">✨</span>
                            <span class="inline-block animate-bounce" style="animation-delay: 0.4s">🌟</span>
                        </div>
                        
                        <!-- Texto misterioso -->
                        <h2 class="dancing-script text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white mb-3 sm:mb-4 md:mb-6">
                            Os segredos do universo estão se alinhando...
                        </h2>
                        
                        <p class="poppins text-base sm:text-lg md:text-xl lg:text-2xl text-purple-200 mb-4 sm:mb-6 md:mb-8">
                            As estrelas sussurram o destino do nosso pequeno tesouro
                        </p>
                        
                        <!-- Indicador de progresso -->
                        <div class="progress-bar w-48 sm:w-56 md:w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
                            <div id="progressFill" class="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000 w-0"></div>
                        </div>
                        
                        <p class="poppins text-xs sm:text-sm text-white/70 mt-2 sm:mt-3 md:mt-4">
                            Decifrando os mistérios...
                        </p>
                    </div>
                </div>
            </div>
        `;

    // Animar entrada do conteúdo
    setTimeout(() => {
      const content = this.experienceScreen.querySelector('.mystery-content');
      content.style.transition = 'opacity 2s ease-in';
      content.style.opacity = '1';
    }, 500);

    // Criar partículas misteriosas
    this.createMysteryParticles();

    // Animar barra de progresso
    this.animateProgress('progressFill', EXPERIENCE_CONFIG.timing.phases.mystery);

    // Vibração misteriosa
    this.createMysteryVibes();

    // Transição para próxima fase
    setTimeout(() => {
      this.startBuildupPhase();
    }, EXPERIENCE_CONFIG.timing.phases.mystery);
  }

  createMysteryParticles() {
    const container = document.getElementById('mysteryParticles');

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full opacity-60';

      // Cores místicas
      const colors = ['bg-purple-400', 'bg-blue-400', 'bg-indigo-400', 'bg-white'];
      particle.classList.add(colors[Math.floor(Math.random() * colors.length)]);

      // Tamanho
      const size = Math.random() * 6 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';

      // Posição
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';

      // Animação
      particle.style.animation = `float ${Math.random() * 4 + 3}s ease-in-out infinite`;
      particle.style.animationDelay = Math.random() * 2 + 's';

      container.appendChild(particle);
    }
  }

  createMysteryVibes() {
    const vibePattern = [100, 100, 200, 100, 300];
    let vibeIndex = 0;

    const vibeInterval = setInterval(() => {
      this.vibrate([vibePattern[vibeIndex % vibePattern.length]]);
      vibeIndex++;

      if (vibeIndex > 10) {
        clearInterval(vibeInterval);
      }
    }, 800);
  }

  animateProgress(elementId, duration) {
    const progressElement = document.getElementById(elementId);
    if (!progressElement) return;

    let progress = 0;
    const increment = 100 / (duration / 50);

    const progressInterval = setInterval(() => {
      progress += increment;
      progressElement.style.width = Math.min(progress, 100) + '%';

      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 50);
  }

  startBuildupPhase() {
    this.currentPhase = 'buildup';
    console.log('🔥 INICIANDO FASE BUILDUP');

    // Limpeza de áudios inadequados antes de iniciar o buildup
    this.stopInappropriateAudio();

    // Parar áudio de batimento
    this.soundGenerator.stopHeartbeatLoop();

    // Tocar música do clímax usando o método robusto
    console.log('🎵 Iniciando música do clímax na fase buildup...');
    this.playClimaxMusic();

    this.experienceScreen.innerHTML = `
            <div class="buildup-phase relative h-full overflow-hidden">
                <!-- Fundo dinâmico -->
                <div class="absolute inset-0 buildup-bg"></div>
                
                <!-- Conteúdo central -->
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
                    <div class="buildup-content max-w-sm sm:max-w-lg md:max-w-4xl mx-auto">
                        <!-- Título dramático -->
                        <h2 class="dancing-script text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6 md:mb-8 buildup-title">
                            O momento chegou!
                        </h2>
                        
                        <!-- Subtítulo -->
                        <p class="poppins text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-6 sm:mb-8 md:mb-12 buildup-subtitle">
                            Nosso pequeno tesouro é...
                        </p>
                        
                        <!-- Pontos de suspense -->
                        <div class="suspense-dots text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-4 sm:mb-6 md:mb-8">
                            <span class="dot-1">.</span>
                            <span class="dot-2">.</span>
                            <span class="dot-3">.</span>
                        </div>
                        
                        <!-- Contador final -->
                        <div id="finalCountdown" class="final-countdown text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white mb-4 sm:mb-6 md:mb-8">
                            5
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .buildup-bg {
                    background: linear-gradient(-45deg, #ff6b6b, #ee5a24, #f9ca24, #ff9ff3);
                    background-size: 400% 400%;
                    animation: buildupGradient 2s ease infinite;
                }
                
                @keyframes buildupGradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                
                .buildup-title {
                    animation: titlePulse 1s ease-in-out infinite;
                }
                
                @keyframes titlePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .suspense-dots span {
                    animation: dotBounce 1.5s ease-in-out infinite;
                }
                
                .dot-1 { animation-delay: 0s; }
                .dot-2 { animation-delay: 0.2s; }
                .dot-3 { animation-delay: 0.4s; }
                
                @keyframes dotBounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-20px); }
                }
                
                .final-countdown {
                    animation: countdownPulse 1s ease-in-out;
                    text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
                }
                
                @keyframes countdownPulse {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            </style>
        `;

    // Contador final 3, 2, 1
    this.startFinalCountdown();
  }

  startFinalCountdown() {
    const countdownElement = document.getElementById('finalCountdown');
    let count = 5;

    const finalInterval = setInterval(() => {
      count--;

      if (count > 0) {
        countdownElement.textContent = count;
        countdownElement.style.animation = 'none';
        setTimeout(() => {
          countdownElement.style.animation = 'countdownPulse 1s ease-in-out';
        }, 10);

        // Vibração intensa
        this.vibrate([200, 100, 200]);
      } else {
        clearInterval(finalInterval);
        // Ir para o duelo de possibilidades antes do reveal!
        this.startDuelPhase();
      }
    }, 1200);
  }

  startDuelPhase() {
    this.currentPhase = 'duel';

    // Limpeza de áudios inadequados
    this.stopInappropriateAudio();

    // Parar música do clímax
    if (this.climaxMusic) {
      this.climaxMusic.pause();
      this.climaxMusic.currentTime = 0;
    }

    this.experienceScreen.innerHTML = `
      <div class="duel-phase relative h-full overflow-hidden">
        <!-- Fundo dinâmico para o duelo -->
        <div class="absolute inset-0 duel-bg"></div>
        
        <!-- Efeitos de energia -->
        <div id="energyEffects" class="absolute inset-0"></div>
        
        <!-- Conteúdo principal -->
        <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
          <div class="duel-content max-w-sm sm:max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
            <!-- Título dramático -->
            <h2 class="dancing-script text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white mb-4 sm:mb-6 md:mb-8 duel-title">
              O Duelo Final das Possibilidades
            </h2>
            
            <p class="poppins text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 mb-6 sm:mb-8 md:mb-12">
              Quem será escolhido pelo destino?
            </p>
            
            <!-- Container das imagens do duelo -->
            <div class="duel-container flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-16 mb-4 sm:mb-6 md:mb-8">
              <!-- Lado Menino -->
              <div class="duel-side menino-side">
                <div class="image-container relative">
                  <div class="energy-aura menino-aura"></div>
                  <img src="menino.jpeg" alt="Possível Menino" class="duel-image menino-image rounded-full border-2 sm:border-3 md:border-4 border-blue-400 shadow-2xl w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-cover" />
                  <div class="image-overlay menino-overlay"></div>
                </div>
                <h3 class="dancing-script text-lg sm:text-xl md:text-2xl lg:text-3xl text-blue-300 mt-2 sm:mt-3 md:mt-4">Francisco</h3>
                <div class="power-indicator menino-power">
                  <div class="power-bar menino-bar"></div>
                </div>
              </div>
              
              <!-- Versus -->
              <div class="versus-container">
                <div class="versus-symbol text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl text-white font-bold">
                  ⚡ VS ⚡
                </div>
                <div class="versus-energy"></div>
              </div>
              
              <!-- Lado Menina -->
              <div class="duel-side menina-side">
                <div class="image-container relative">
                  <div class="energy-aura menina-aura"></div>
                  <img src="menina.jpeg" alt="Possível Menina" class="duel-image menina-image rounded-full border-2 sm:border-3 md:border-4 border-pink-400 shadow-2xl w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-cover" />
                  <div class="image-overlay menina-overlay"></div>
                </div>
                <h3 class="dancing-script text-lg sm:text-xl md:text-2xl lg:text-3xl text-pink-300 mt-2 sm:mt-3 md:mt-4">Celina</h3>
                <div class="power-indicator menina-power">
                  <div class="power-bar menina-bar"></div>
                </div>
              </div>
            </div>
            
            <!-- Indicador de decisão -->
            <div class="decision-indicator mb-8">
              <p class="poppins text-lg text-white/80 mb-4">O universo está decidindo...</p>
              <div class="cosmic-spinner"></div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .duel-bg {
          background: linear-gradient(-45deg, #8b5cf6, #3b82f6, #ec4899, #10b981);
          background-size: 400% 400%;
          animation: duelGradient 3s ease infinite;
        }
        
        @keyframes duelGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .duel-title {
          animation: titleGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes titleGlow {
          from {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
          to {
            text-shadow: 0 0 40px rgba(255, 255, 255, 0.9);
          }
        }
        
        .duel-image {
          width: 200px;
          height: 200px;
          object-fit: cover;
          animation: imageFloat 3s ease-in-out infinite;
          transition: all 0.5s ease;
        }
        
        @keyframes imageFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        
        .energy-aura {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          opacity: 0.7;
          animation: auraGlow 2s ease-in-out infinite alternate;
        }
        
        .menino-aura {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.3);
          animation: meninoAuraWeak 3s ease-in-out infinite alternate;
        }
        
        .menina-aura {
          background: radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, transparent 70%);
          box-shadow: 0 0 60px rgba(236, 72, 153, 0.8);
          animation: meninaAuraStrong 1.5s ease-in-out infinite alternate;
        }
        
        @keyframes meninoAuraWeak {
          from { opacity: 0.1; transform: scale(0.9); }
          to { opacity: 0.3; transform: scale(1); }
        }
        
        @keyframes meninaAuraStrong {
          from { opacity: 0.6; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1.3); }
        }
        
        .versus-symbol {
          animation: versusGlow 1.5s ease-in-out infinite;
        }
        
        @keyframes versusGlow {
          0%, 100% { 
            transform: scale(1); 
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          }
          50% { 
            transform: scale(1.1); 
            text-shadow: 0 0 40px rgba(255, 255, 255, 1);
          }
        }
        
        .power-indicator {
          width: 150px;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin: 0 auto;
        }
        
        .power-bar {
          height: 100%;
          border-radius: 4px;
          transition: all 0.5s ease;
        }
        
        .menino-bar {
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          width: 0%; /* Barra vazia para o menino */
          animation: none; /* Sem animação para o menino */
        }
        
        .menina-bar {
          background: linear-gradient(90deg, #ec4899, #f472b6);
          width: 100%; /* Barra cheia para a menina */
          animation: meninaGlow 1.5s ease-in-out infinite; /* Animação de brilho */
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
        }
        
        @keyframes meninaGlow {
          0%, 100% { 
            opacity: 0.8;
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
          }
          50% { 
            opacity: 1;
            box-shadow: 0 0 30px rgba(236, 72, 153, 1);
          }
        }
        
        .cosmic-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #fff;
          border-radius: 50%;
          animation: cosmicSpin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes cosmicSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .duel-content {
          animation: contentSlideIn 1s ease-out;
        }
        
        @keyframes contentSlideIn {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Efeito de energia para a escolhida - MELHORADO */
        .chosen-energy {
          animation: chosenGlow 2s ease-in-out infinite;
        }
        
        @keyframes chosenGlow {
          0% { 
            filter: brightness(1.2) saturate(1.3) hue-rotate(0deg);
            transform: scale(1.05);
          }
          50% { 
            filter: brightness(1.8) saturate(2) hue-rotate(10deg);
            transform: scale(1.15);
          }
          100% { 
            filter: brightness(1.2) saturate(1.3) hue-rotate(0deg);
            transform: scale(1.05);
          }
        }
        
        .chosen-energy .menina-image {
          box-shadow: 0 0 40px rgba(236, 72, 153, 1) !important;
          border-color: #ff69b4 !important;
          border-width: 4px !important;
        }
        
        /* Efeito de fade para o oponente - MELHORADO */
        .fade-opponent {
          animation: fadeOut 1s ease-in-out forwards;
        }
        
        @keyframes fadeOut {
          to {
            opacity: 0.3;
            filter: grayscale(100%) brightness(0.5);
            transform: scale(0.9);
          }
        }
        
        .fade-opponent .menino-image {
          border-color: #6b7280 !important;
          box-shadow: none !important;
        }
      </style>
    `;

    // Criar efeitos de energia
    this.createEnergyEffects();

    // Som de suspense épico
    this.soundGenerator.generateSuspenseSound();

    // Vibração de duelo
    this.createDuelVibes();

    // SEQUÊNCIA COMPLETA DO DUELO com fase de carregamento inicial!
    this.startDuelSequence();

    // Transição para reveal após duração total (12 segundos)
    setTimeout(() => {
      this.startRevealPhase();
    }, EXPERIENCE_CONFIG.timing.phases.duel);
  }

  createEnergyEffects() {
    const container = document.getElementById('energyEffects');

    // Criar partículas de energia (mais partículas rosas para favorecer a menina)
    for (let i = 0; i < 35; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full energy-particle';

      // Cores de energia - MAIS ROSAS para favorecer a menina
      const colors = [
        'rgba(59, 130, 246, 0.4)', // azul mais fraco
        'rgba(236, 72, 153, 0.9)', // rosa forte
        'rgba(255, 105, 180, 0.8)', // rosa médio
        'rgba(255, 20, 147, 0.9)', // rosa vibrante
        'rgba(255, 182, 193, 0.7)', // rosa claro
        'rgba(255, 255, 255, 0.6)', // branco suave
      ];

      // 70% de chance de ser uma cor rosa/menina
      const randomIndex =
        Math.random() < 0.3 ? 0 : Math.floor(Math.random() * (colors.length - 1)) + 1;
      particle.style.backgroundColor = colors[randomIndex];

      // Tamanho (partículas rosas um pouco maiores)
      const isRosa = randomIndex > 0;
      const size = isRosa ? Math.random() * 10 + 6 : Math.random() * 6 + 3;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';

      // Posição
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';

      // Animação de energia (partículas rosas com animação diferente)
      if (isRosa) {
        particle.style.animation = `energyFlowMenina ${Math.random() * 2 + 2}s linear infinite`;
      } else {
        particle.style.animation = `energyFlowMenino ${Math.random() * 4 + 3}s linear infinite`;
      }
      particle.style.animationDelay = Math.random() * 2 + 's';

      container.appendChild(particle);
    }

    // CSS para partículas de energia
    const style = document.createElement('style');
    style.textContent = `
      @keyframes energyFlowMenina {
        0% {
          opacity: 0;
          transform: translateY(100vh) translateX(-20px) rotate(0deg) scale(0.5);
        }
        20% {
          opacity: 1;
          transform: translateY(80vh) translateX(20px) rotate(90deg) scale(1);
        }
        80% {
          opacity: 1;
          transform: translateY(20vh) translateX(-10px) rotate(270deg) scale(1.2);
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) translateX(30px) rotate(360deg) scale(0.8);
        }
      }
      
      @keyframes energyFlowMenino {
        0% {
          opacity: 0;
          transform: translateY(100vh) rotate(0deg) scale(0.3);
        }
        30% {
          opacity: 0.6;
          transform: translateY(70vh) rotate(120deg) scale(0.8);
        }
        70% {
          opacity: 0.4;
          transform: translateY(30vh) rotate(240deg) scale(0.6);
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) rotate(360deg) scale(0.2);
        }
      }
      
      /* Novas animações para o duelo dinâmico */
      @keyframes meninoGlow {
        0%, 100% { 
          opacity: 0.8;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          filter: brightness(1.2);
        }
        50% { 
          opacity: 1;
          box-shadow: 0 0 30px rgba(59, 130, 246, 1);
          filter: brightness(1.8);
        }
      }
      
      @keyframes meninaVictory {
        0%, 100% { 
          transform: scale(1);
        }
        50% { 
          transform: scale(1.05);
        }
      }
      
      @keyframes meninaEnergyFlow {
        0% {
          opacity: 0;
          transform: translateY(100vh) translateX(-20px) rotate(0deg) scale(0.5);
        }
        20% {
          opacity: 1;
          transform: translateY(80vh) translateX(20px) rotate(90deg) scale(1);
        }
        80% {
          opacity: 1;
          transform: translateY(20vh) translateX(-10px) rotate(270deg) scale(1.2);
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) translateX(30px) rotate(360deg) scale(0.8);
        }
      }
      
      @keyframes meninoEnergyFlow {
        0% {
          opacity: 0;
          transform: translateY(100vh) rotate(0deg) scale(0.3);
        }
        30% {
          opacity: 0.6;
          transform: translateY(70vh) rotate(120deg) scale(0.8);
        }
        70% {
          opacity: 0.4;
          transform: translateY(30vh) rotate(240deg) scale(0.6);
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) rotate(360deg) scale(0.2);
        }
      }
      
      /* Animações para a fase de carregamento inicial */
      @keyframes loadingPulse {
        0%, 100% { 
          opacity: 0.7;
          transform: scale(1);
        }
        50% { 
          opacity: 1;
          transform: scale(1.02);
        }
      }
      
      .vs-spinner {
        animation: vsSpinnerGlow 2s ease-in-out infinite;
      }
      
      @keyframes vsSpinnerGlow {
        0%, 100% { 
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          transform: scale(1);
        }
        50% { 
          text-shadow: 0 0 40px rgba(255, 255, 255, 1), 0 0 60px rgba(138, 92, 246, 0.8);
          transform: scale(1.1);
        }
      }
      
      .loading-dots span {
        animation: loadingDot 1.5s ease-in-out infinite;
      }
      
      .loading-dots span:nth-child(1) { animation-delay: 0s; }
      .loading-dots span:nth-child(2) { animation-delay: 0.5s; }
      .loading-dots span:nth-child(3) { animation-delay: 1s; }
      
      @keyframes loadingDot {
        0%, 80%, 100% { 
          opacity: 0.3;
          transform: scale(1);
        }
        40% { 
          opacity: 1;
          transform: scale(1.5);
        }
      }
      
      .loading-bar-container {
        width: 200px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin: 0 auto;
      }
      
      .loading-bar {
        height: 100%;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6, #ec4899, #10b981);
        background-size: 200% 100%;
        animation: loadingBarFill 3s ease-in-out forwards, loadingBarGradient 1.5s ease-in-out infinite;
        width: 0%;
      }
      
      @keyframes loadingBarFill {
        from { width: 0%; }
        to { width: 100%; }
      }
      
      @keyframes loadingBarGradient {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      /* === ANIMAÇÕES ÉPICAS PARA FASE 0 === */
      
      .versus-loading-epic {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
      }
      
      /* Círculos de energia pulsante */
      .energy-ring {
        position: absolute;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        animation: energyRingPulse 2s ease-in-out infinite;
      }
      
      .ring-1 {
        width: 100px;
        height: 100px;
        animation-delay: 0s;
        border-color: rgba(139, 92, 246, 0.6);
      }
      
      .ring-2 {
        width: 150px;
        height: 150px;
        animation-delay: 0.5s;
        border-color: rgba(59, 130, 246, 0.6);
      }
      
      .ring-3 {
        width: 200px;
        height: 200px;
        animation-delay: 1s;
        border-color: rgba(236, 72, 153, 0.6);
      }
      
      @keyframes energyRingPulse {
        0%, 100% {
          transform: scale(0.8);
          opacity: 0.3;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.8;
        }
      }
      
      /* Partículas de energia flutuantes */
      .particle {
        position: absolute;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #fff, transparent);
        border-radius: 50%;
        opacity: 0.8;
      }
      
      .p1 { 
        top: 20%; left: 20%; 
        animation: particleFloat1 3s ease-in-out infinite;
      }
      .p2 { 
        top: 30%; right: 20%; 
        animation: particleFloat2 2.5s ease-in-out infinite 0.5s;
      }
      .p3 { 
        bottom: 30%; left: 30%; 
        animation: particleFloat3 2.8s ease-in-out infinite 1s;
      }
      .p4 { 
        bottom: 20%; right: 30%; 
        animation: particleFloat1 3.2s ease-in-out infinite 1.5s;
      }
      .p5 { 
        top: 50%; left: 10%; 
        animation: particleFloat2 2.7s ease-in-out infinite 2s;
      }
      .p6 { 
        top: 60%; right: 10%; 
        animation: particleFloat3 3.1s ease-in-out infinite 0.3s;
      }
      
      @keyframes particleFloat1 {
        0%, 100% { transform: translateY(0px) scale(1); opacity: 0.8; }
        50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
      }
      
      @keyframes particleFloat2 {
        0%, 100% { transform: translateX(0px) scale(1); opacity: 0.6; }
        50% { transform: translateX(15px) scale(1.3); opacity: 1; }
      }
      
      @keyframes particleFloat3 {
        0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.7; }
        50% { transform: translate(10px, -15px) scale(1.1); opacity: 1; }
      }
      
      /* Loading dots melhorado */
      .loading-dots-enhanced span {
        display: inline-block;
        margin: 0 4px;
        animation: enhancedDot 2s ease-in-out infinite;
      }
      
      .dot-1 { animation-delay: 0s; color: #8b5cf6; }
      .dot-2 { animation-delay: 0.3s; color: #3b82f6; }
      .dot-3 { animation-delay: 0.6s; color: #ec4899; }
      
      @keyframes enhancedDot {
        0%, 80%, 100% { 
          transform: scale(1) translateY(0px);
          opacity: 0.5;
        }
        40% { 
          transform: scale(1.5) translateY(-8px);
          opacity: 1;
        }
      }
      
      /* Barra de progresso épica */
      .loading-bar-container-enhanced {
        position: relative;
        width: 300px;
        margin: 0 auto;
      }
      
      .loading-bar-bg {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }
      
      .loading-bar-epic {
        height: 100%;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6, #ec4899, #10b981, #f59e0b);
        background-size: 300% 100%;
        animation: epicBarFill 3s ease-out forwards, epicBarShine 1.5s ease-in-out infinite;
        width: 0%;
        border-radius: 4px;
      }
      
      .loading-bar-glow {
        position: absolute;
        top: -2px;
        left: 0;
        width: 100%;
        height: 12px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        border-radius: 6px;
        animation: glowSweep 2s ease-in-out infinite;
        opacity: 0;
      }
      
      @keyframes epicBarFill {
        from { width: 0%; }
        to { width: 100%; }
      }
      
      @keyframes epicBarShine {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      @keyframes glowSweep {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }
      
      /* VS subtitle animado */
      .vs-subtitle {
        animation: subtitleGlow 2.5s ease-in-out infinite;
      }
      
      @keyframes subtitleGlow {
        0%, 100% { 
          opacity: 0.7;
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        50% { 
          opacity: 1;
          text-shadow: 0 0 20px rgba(168, 85, 247, 1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  createDuelVibes() {
    // Padrão de vibração de duelo épico
    const duelPattern = [150, 50, 150, 50, 300, 100, 100, 50, 400];

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.vibrate(duelPattern);
      }, i * 1500);
    }
  }

  startDuelSequence() {
    // ========== FASE 0: CARREGAMENTO INICIAL (0-3 segundos) ==========
    console.log('🎭 FASE 0: Carregamento inicial do duelo...');

    const versusContainer = document.querySelector('.versus-container');
    const meninaSide = document.querySelector('.menina-side');
    const meninoSide = document.querySelector('.menino-side');
    const meninaBar = document.querySelector('.menina-bar');
    const meninoBar = document.querySelector('.menino-bar');

    if (!versusContainer) return;

    // Manter ambos os lados neutros
    if (meninaSide) meninaSide.classList.remove('chosen-energy', 'fade-opponent');
    if (meninoSide) meninoSide.classList.remove('chosen-energy', 'fade-opponent');

    // Barras em estado neutro/carregando
    if (meninaBar) {
      meninaBar.style.width = '50%';
      meninaBar.style.animation = 'loadingPulse 1.5s ease-in-out infinite';
      meninaBar.style.opacity = '0.7';
    }
    if (meninoBar) {
      meninoBar.style.width = '50%';
      meninoBar.style.animation = 'loadingPulse 1.5s ease-in-out infinite';
      meninoBar.style.opacity = '0.7';
    }

    // Animação do VS com carregamento ÉPICO
    versusContainer.innerHTML = `
      <div class="versus-loading-epic relative">
        <!-- Círculos de energia pulsante -->
        <div class="energy-rings absolute inset-0 flex items-center justify-center">
          <div class="energy-ring ring-1"></div>
          <div class="energy-ring ring-2"></div>
          <div class="energy-ring ring-3"></div>
        </div>
        
        <!-- VS principal com efeitos -->
        <div class="vs-main text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white font-bold relative z-10">
          <div class="vs-spinner">⚡ VS ⚡</div>
          <div class="vs-subtitle text-lg sm:text-xl md:text-2xl mt-2 text-purple-300">
            CALCULANDO DESTINO...
          </div>
        </div>
        
        <!-- Partículas de energia -->
        <div class="loading-particles absolute inset-0">
          <div class="particle p1"></div>
          <div class="particle p2"></div>
          <div class="particle p3"></div>
          <div class="particle p4"></div>
          <div class="particle p5"></div>
          <div class="particle p6"></div>
        </div>
        
        <!-- Loading dots melhorado -->
        <div class="loading-dots-enhanced text-base sm:text-lg md:text-xl mt-4 relative z-10">
          <span class="dot-1">●</span>
          <span class="dot-2">●</span>
          <span class="dot-3">●</span>
        </div>
      </div>
      
      <!-- Barra de progresso melhorada -->
      <div class="loading-bar-container-enhanced mt-6">
        <div class="loading-bar-bg">
          <div class="loading-bar-epic"></div>
          <div class="loading-bar-glow"></div>
        </div>
        <div class="loading-percentage text-white text-sm mt-2">0%</div>
      </div>
    `;

    // Vibração de início de carregamento
    this.vibrate([100, 50, 100]);

    // Animar porcentagem de carregamento
    this.animateLoadingPercentage();

    // Efeitos sonoros extras durante carregamento
    setTimeout(() => {
      this.soundGenerator.generateSuspenseSound();
    }, 500);

    // Vibração no meio do carregamento
    setTimeout(() => {
      this.vibrate([150, 75, 150]);
    }, 1500);

    // Efeito final de carregamento
    setTimeout(() => {
      this.vibrate([200, 100, 200]);
      // Adicionar efeito de "carregamento completo"
      const percentage = document.querySelector('.loading-percentage');
      if (percentage) {
        percentage.textContent = '100%';
        percentage.style.color = '#10b981';
        percentage.style.fontWeight = 'bold';
      }
    }, 2800);

    // Após 3 segundos, iniciar a sequência dinâmica
    setTimeout(() => {
      this.startDynamicDominance();
    }, 3000);
  }

  animateLoadingPercentage() {
    const percentage = document.querySelector('.loading-percentage');
    if (!percentage) return;

    let current = 0;
    const target = 100;
    const duration = 3000; // 3 segundos
    const increment = target / (duration / 50); // Atualizar a cada 50ms

    const animate = () => {
      current += increment;
      if (current > target) current = target;

      percentage.textContent = `${Math.floor(current)}%`;

      // Mudar cor conforme progresso
      if (current < 30) {
        percentage.style.color = '#ef4444'; // Vermelho
      } else if (current < 70) {
        percentage.style.color = '#f59e0b'; // Amarelo
      } else if (current < 100) {
        percentage.style.color = '#3b82f6'; // Azul
      } else {
        percentage.style.color = '#10b981'; // Verde
        percentage.style.fontWeight = 'bold';
      }

      if (current < target) {
        setTimeout(animate, 50);
      }
    };

    animate();
  }

  startDynamicDominance() {
    const meninaSide = document.querySelector('.menina-side');
    const meninoSide = document.querySelector('.menino-side');
    const versusContainer = document.querySelector('.versus-container');
    const meninaBar = document.querySelector('.menina-bar');
    const meninoBar = document.querySelector('.menino-bar');

    if (!meninaSide || !meninoSide || !versusContainer) return;

    // ========== FASE 1: MENINA DOMINA (3-6 segundos do duelo total) ==========
    console.log('🎭 FASE 1: Menina começa dominando...');

    // Menina brilha desde o início
    meninaSide.classList.add('chosen-energy');
    meninoSide.classList.add('fade-opponent');

    // Barras iniciais - resetar opacity para estado normal
    if (meninaBar) {
      meninaBar.style.width = '85%';
      meninaBar.style.animation = 'meninaGlow 1.5s ease-in-out infinite';
      meninaBar.style.opacity = '1';
    }
    if (meninoBar) {
      meninoBar.style.width = '15%';
      meninoBar.style.animation = 'none';
      meninoBar.style.opacity = '1';
    }

    // Primeiro indicador
    setTimeout(() => {
      if (versusContainer) {
        versusContainer.innerHTML = `
          <div class="winner-indicator text-2xl sm:text-3xl md:text-4xl text-pink-400 font-bold dancing-script">
            👑 MENINA DOMINANDO! 👑
          </div>
        `;
      }
    }, 1000); // Ajustado de 1500 para 1000

    // Vibração de início
    this.vibrate([200, 100, 200]);

    // ========== FASE 2: VIRADA DO MENINO! (6-10 segundos do duelo total) ==========
    setTimeout(() => {
      console.log('🎭 FASE 2: VIRADA DRAMÁTICA! Menino assume o controle...');

      // REMOVER efeitos da menina
      meninaSide.classList.remove('chosen-energy');
      meninaSide.classList.add('fade-opponent');

      // ADICIONAR efeitos ao menino
      meninoSide.classList.remove('fade-opponent');
      meninoSide.classList.add('chosen-energy');

      // Inverter as barras dramatically
      if (meninaBar) {
        meninaBar.style.width = '25%';
        meninaBar.style.animation = 'none';
        meninaBar.style.opacity = '0.5';
      }
      if (meninoBar) {
        meninoBar.style.width = '75%';
        meninoBar.style.animation = 'meninoGlow 1.2s ease-in-out infinite';
        meninoBar.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
      }

      // Atualizar indicador
      if (versusContainer) {
        versusContainer.innerHTML = `
          <div class="winner-indicator text-2xl sm:text-3xl md:text-4xl text-blue-400 font-bold dancing-script">
            ⚡ MENINO REAGINDO! ⚡
          </div>
        `;
      }

      // Vibração de virada dramática
      this.vibrate([100, 50, 100, 50, 300, 150, 300]);
    }, 3000); // 3 segundos

    // ========== FASE 3: VOLTA TRIUNFAL DA MENINA! (10-20 segundos do duelo total - 10s de vitória!) ==========
    setTimeout(() => {
      console.log('🎭 FASE 3: REVIRAVOLTA FINAL! Menina retoma o controle definitivamente!');

      // MENINA RETOMA O PODER COM MAIS FORÇA!
      meninoSide.classList.remove('chosen-energy');
      meninoSide.classList.add('fade-opponent');
      meninaSide.classList.remove('fade-opponent');
      meninaSide.classList.add('chosen-energy');

      // Barras finais - menina domina completamente
      if (meninaBar) {
        meninaBar.style.width = '100%';
        meninaBar.style.animation =
          'meninaGlow 1s ease-in-out infinite, meninaVictory 2s ease-in-out infinite';
        meninaBar.style.opacity = '1';
        meninaBar.style.boxShadow = '0 0 30px rgba(236, 72, 153, 1)';
      }
      if (meninoBar) {
        meninoBar.style.width = '0%';
        meninoBar.style.animation = 'none';
        meninoBar.style.boxShadow = 'none';
      }

      // Indicador de vitória inicial
      if (versusContainer) {
        versusContainer.innerHTML = `
          <div class="winner-indicator text-2xl sm:text-3xl md:text-4xl text-pink-400 font-bold dancing-script animate-pulse">
            🎀 MENINA VENCEU! 🎀
          </div>
        `;
      }

      // Vibração de vitória épica
      this.vibrate([300, 100, 300, 100, 500, 200, 500]);

      // Som extra de triunfo
      this.soundGenerator.generateSuspenseSound();

      // === SEQUÊNCIA DE VITÓRIA SIMPLIFICADA (10 SEGUNDOS) ===

      // 1ª Frase: Vitória inicial (0-5s) - A frase já está definida acima

      // 4ª Frase: Final épico com nome (5-10s)
      setTimeout(() => {
        if (versusContainer) {
          versusContainer.innerHTML = `
            <div class="winner-indicator text-xl sm:text-2xl md:text-3xl text-pink-300 font-bold dancing-script animate-bounce">
              ✨ CELINA SERÁ NOSSA PRINCESA! ✨
            </div>
          `;
        }
        this.vibrate([500, 200, 500, 200, 800]);
        this.soundGenerator.generateSuspenseSound();
      }, 5000); // Mudado de 8500 para 5000 (meio da fase 3)
    }, 7000); // Mantido em 7s (início da fase 3 aos 10s do duelo total)

    // ========== EFEITOS VISUAIS EXTRAS ==========
    // Adicionar partículas durante toda a sequência
    this.createDynamicEnergyEffects();
  }

  createDynamicEnergyEffects() {
    const energyContainer = document.getElementById('energyEffects');
    if (!energyContainer) return;

    // Função para criar partículas específicas de cada fase
    const createPhaseParticles = (color, side, intensity) => {
      for (let i = 0; i < intensity; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.className = `energy-particle ${side}`;
          particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 8 + 4}px;
            height: ${Math.random() * 8 + 4}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            animation: ${side}EnergyFlow ${3 + Math.random() * 2}s linear infinite;
            left: ${side === 'menina' ? '70%' : '30%'};
            top: 90%;
            opacity: 0.8;
            box-shadow: 0 0 10px ${color};
          `;
          energyContainer.appendChild(particle);

          // Remover após animação
          setTimeout(() => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }, 5000);
        }, i * 100);
      }
    };

    // Fase 1: Partículas rosa (menina) - inicia após carregamento
    setTimeout(() => {
      createPhaseParticles('#ec4899', 'menina', 8);
    }, 0); // Imediatamente quando a função é chamada (já após os 3s de carregamento)

    // Fase 2: Partículas azuis (menino)
    setTimeout(() => {
      createPhaseParticles('#3b82f6', 'menino', 10);
    }, 3000); // 3s após início da fase 1 (6s do duelo total)

    // Fase 3: Explosão de partículas rosa (vitória menina) - 10 segundos simplificados!
    setTimeout(() => {
      // 1ª Sequência: Vitória inicial (0-5s) - "🎀 MENINA VENCEU! 🎀"
      createPhaseParticles('#ec4899', 'menina', 18);
      setTimeout(() => createPhaseParticles('#f472b6', 'menina', 15), 500);
      setTimeout(() => createPhaseParticles('#ec4899', 'menina', 12), 1500);
      setTimeout(() => createPhaseParticles('#ff69b4', 'menina', 16), 2500);
      setTimeout(() => createPhaseParticles('#ec4899', 'menina', 20), 3500);
      setTimeout(() => createPhaseParticles('#f472b6', 'menina', 18), 4500);

      // 2ª Sequência: Final épico (5-10s) - "✨ CELINA SERÁ NOSSA PRINCESA! ✨"
      setTimeout(() => {
        createPhaseParticles('#ec4899', 'menina', 25);
        createPhaseParticles('#f472b6', 'menina', 22);
        createPhaseParticles('#ff69b4', 'menina', 24);
      }, 5000);

      setTimeout(() => {
        createPhaseParticles('#ff69b4', 'menina', 28);
        createPhaseParticles('#ec4899', 'menina', 26);
      }, 6500);

      setTimeout(() => {
        createPhaseParticles('#ec4899', 'menina', 30);
        createPhaseParticles('#f472b6', 'menina', 28);
        createPhaseParticles('#ff69b4', 'menina', 32);
      }, 8000);

      // Chuva final épica (9-10s)
      setTimeout(() => {
        createPhaseParticles('#ec4899', 'menina', 35);
        createPhaseParticles('#f472b6', 'menina', 32);
        createPhaseParticles('#ff69b4', 'menina', 38);
      }, 9000);
    }, 7000); // 7s após início da fase 1 (10s do duelo total)
  }

  showDuelWinner() {
    // Esta função agora é chamada automaticamente no startMeninaAdvantage
    // Mantida para compatibilidade, mas pode ser removida futuramente
  }

  startRevealPhase() {
    this.currentPhase = 'reveal';

    this.experienceScreen.innerHTML = `
            <div class="reveal-phase relative h-full overflow-hidden">
                <!-- Explosão de confetes -->
                <div id="confettiContainer" class="absolute inset-0 z-20"></div>
                
                <!-- Fundo rosa vibrante -->
                <div class="absolute inset-0 reveal-bg"></div>
                
                <!-- Conteúdo principal -->
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
                    <div class="reveal-content max-w-sm sm:max-w-lg md:max-w-4xl mx-auto">
                        <!-- O grande reveal -->
                        <div class="reveal-text mb-4 sm:mb-6 md:mb-8">
                            <h1 class="dancing-script text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold text-white mb-2 sm:mb-3 md:mb-4 reveal-title">
                                É MENINA!
                            </h1>
                            
                            <div class="girl-emojis text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl mb-4 sm:mb-6 md:mb-8">
                                👧🏻💕👶🏻💖
                            </div>
                            
                            <p class="poppins text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-pink-100 mb-4 sm:mb-6 md:mb-8">
                                Nossa princesinha está chegando!
                            </p>
                        </div>
                        
            
            <style>
                .reveal-bg {
                    background: linear-gradient(-45deg, #ff69b4, #ff1493, #ffc0cb, #ffb6c1, #87ceeb);
                    background-size: 400% 400%;
                    animation: revealGradient 3s ease infinite;
                }
                
                @keyframes revealGradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                
                .reveal-title {
                    animation: revealBounce 2s ease-out;
                    text-shadow: 0 0 50px rgba(255, 255, 255, 0.8);
                }
                
                @keyframes revealBounce {
                    0% {
                        transform: scale(0) rotate(-180deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.3) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }
                
                .girl-emojis {
                    animation: emojiDance 2s ease-in-out infinite;
                }
                
                @keyframes emojiDance {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.1) rotate(5deg); }
                    75% { transform: scale(1.1) rotate(-5deg); }
                }
                
                .special-info {
                    animation: infoSlideUp 1s ease-out 1s both;
                }
                
                @keyframes infoSlideUp {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

    // Criar explosão de confetes
    this.createConfetti();

    // Som de celebração
    this.soundGenerator.generateCelebrationSound();

    // Vibração de celebração
    this.celebrationVibes();

    // Transição para fase de celebração
    setTimeout(() => {
      this.startCelebrationPhase();
    }, EXPERIENCE_CONFIG.timing.phases.reveal);
  }

  createConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1', '#87ceeb', '#98fb98', '#dda0dd'];

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'absolute rounded-full confetti-piece';

      // Cor aleatória
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      // Tamanho
      const size = Math.random() * 10 + 5;
      confetti.style.width = size + 'px';
      confetti.style.height = size + 'px';

      // Posição inicial
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-10px';

      // Animação de queda
      confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear infinite`;
      confetti.style.animationDelay = Math.random() * 2 + 's';

      container.appendChild(confetti);
    }

    // Adicionar CSS para animação de confete
    const style = document.createElement('style');
    style.textContent = `
            @keyframes confettiFall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                }
            }
        `;
    document.head.appendChild(style);
  }

  celebrationVibes() {
    // Padrão de vibração festivo
    const celebrationPattern = [200, 100, 200, 100, 400];

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.vibrate(celebrationPattern);
      }, i * 1000);
    }
  }

  startCelebrationPhase() {
    this.currentPhase = 'celebration';

    // CORREÇÃO MOBILE: Permitir scroll no body para a fase de celebração
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';

    // CORREÇÃO: Parada agressiva de TODOS os sons antes da celebração
    console.log('🛑 PARANDO TODOS OS SONS ANTES DA CELEBRAÇÃO...');

    // Parar batimento cardíaco imediatamente
    if (this.soundGenerator) {
      this.soundGenerator.stopHeartbeatLoop();
      if (this.soundGenerator.stopAllSounds) {
        this.soundGenerator.stopAllSounds();
      }
      console.log('💓 Batimento cardíaco parado FORÇADAMENTE');
    }

    // Parar música do clímax imediatamente
    if (this.climaxMusic) {
      this.climaxMusic.pause();
      this.climaxMusic.currentTime = 0;
      console.log('🎵 Música do clímax parada FORÇADAMENTE');
    }

    // Parar TODOS os outros áudios antes da celebração
    this.stopAllAudioExceptCelebration();

    // SOLUÇÃO DEFINITIVA: Tocar música IMEDIATAMENTE quando tela aparece
    console.log('🎉 Fase celebration iniciada - ACIONANDO MÚSICA IMEDIATAMENTE!');
    this.playCelebrationMusicDefinitive();

    this.experienceScreen.innerHTML = `
            <div class="celebration-phase relative min-h-screen overflow-y-auto">
                <!-- Fundo festivo -->
                <div class="absolute inset-0 celebration-bg"></div>
                
                <!-- Balões flutuantes -->
                <div id="balloons" class="absolute inset-0"></div>
                
                <!-- Conteúdo principal -->
                <div class="relative z-10 flex flex-col items-center justify-start min-h-screen text-center px-1 sm:px-2 md:px-4 py-4 sm:py-6">
                    <div class="celebration-content max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-4xl mx-auto w-full pb-8">
                        <!-- Título de celebração -->
                        <h1 class="dancing-script text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-white mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8 celebration-title leading-tight">
                            Bem-vinda, Celina ! 👑
                        </h1>
                        
                        <!-- Mensagem especial -->
                        <div class="celebration-message bg-white/30 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8">
                            <p class="poppins text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white mb-2 sm:mb-3 md:mb-4 lg:mb-6">
                                Uma nova estrela nasceu em nossos corações ! ⭐
                            </p>
                            
                            <!-- Grid de detalhes mais compacto -->
                            <div class="celebration-details grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 text-white">
                                <div class="detail-card bg-pink-500/30 rounded-md sm:rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4">
                                    <h3 class="dancing-script text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-0.5 sm:mb-1 md:mb-2">💖 Amor</h3>
                                    <p class="poppins text-xs sm:text-xs md:text-sm leading-tight">Preparados para amar incondicionalmente</p>
                                </div>
                                
                                <div class="detail-card bg-purple-500/30 rounded-md sm:rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4">
                                    <h3 class="dancing-script text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-0.5 sm:mb-1 md:mb-2">🌸 Doçura</h3>
                                    <p class="poppins text-xs sm:text-xs md:text-sm leading-tight">Ela trará toda a doçura do mundo</p>
                                </div>
                                
                                <div class="detail-card bg-blue-500/30 rounded-md sm:rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4">
                                    <h3 class="dancing-script text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-0.5 sm:mb-1 md:mb-2">✨ Magia</h3>
                                    <p class="poppins text-xs sm:text-xs md:text-sm leading-tight">Cada dia será uma nova aventura</p>
                                </div>
                                
                                <div class="detail-card bg-green-500/30 rounded-md sm:rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4">
                                    <h3 class="dancing-script text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-0.5 sm:mb-1 md:mb-2">🦋 Liberdade</h3>
                                    <p class="poppins text-xs sm:text-xs md:text-sm leading-tight">Para voar alto e sonhar grande</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Container de botões compacto -->
                        <div class="actions-container space-y-2 sm:space-y-3 md:space-y-4">
                            <!-- Botão de compartilhamento -->
                            <button id="shareButton" class="share-button bg-white text-pink-600 px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-4 rounded-full text-sm sm:text-base md:text-lg lg:text-xl font-bold hover:bg-pink-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto max-w-xs sm:max-w-sm">
                                📱 Compartilhar a Alegria!
                            </button>
                            
                            <!-- Controles de música compactos -->
                            <div class="music-controls bg-black/20 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/10">
                                <!-- Status da música -->
                                <div id="musicStatus" class="music-status text-white/90 text-xs sm:text-sm mb-2 text-center font-medium">
                                    ${
                                      this.isMobile
                                        ? '🎵 Toque para ouvir nossa música!'
                                        : '🎵 Música da celebração'
                                    }
                                </div>
                                
                                <!-- Botão de música e controles -->
                                <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                    <button id="musicToggle" class="music-button bg-gradient-to-r from-pink-500/80 to-purple-600/80 backdrop-blur-sm text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:from-pink-600/80 hover:to-purple-700/80 transition-all text-xs sm:text-sm font-semibold border border-white/20 shadow-lg min-h-[40px]">
                                        🎵 Tocar Música
                                    </button>
                                    <div class="volume-control flex items-center gap-2">
                                        <span class="text-white text-xs">🔊</span>
                                        <input type="range" id="volumeSlider" min="0" max="100" value="70" class="volume-slider w-12 sm:w-16 md:w-20">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Botão de repetir -->
                            <div class="repeat-section">
                                <button id="repeatButton" class="repeat-button bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-full text-sm sm:text-base md:text-lg font-bold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-110 shadow-2xl w-full sm:w-auto max-w-xs sm:max-w-sm min-h-[44px]">
                                    🔄 Repetir a Magia ✨
                                </button>
                                <p class="poppins text-xs sm:text-sm text-white/60 mt-1 sm:mt-2">
                                    Quer viver essa emoção novamente?
                                </p>
                            </div>
                        </div>
                        
                        <!-- Agradecimento -->
                        <p class="poppins text-xs sm:text-sm md:text-base lg:text-lg text-white/80 mt-3 sm:mt-4 md:mt-6 lg:mt-8 px-2">
                            Obrigado por compartilhar este momento mágico conosco! 💕
                        </p>
                    </div>
                </div>
            </div>
            
            <style>
                .celebration-bg {
                    background: linear-gradient(-45deg, #ff69b4, #87ceeb, #98fb98, #dda0dd, #ffb6c1);
                    background-size: 400% 400%;
                    animation: celebrationGradient 4s ease infinite;
                }
                
                @keyframes celebrationGradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                
                .celebration-title {
                    animation: celebrationBounce 2s ease-out;
                }
                
                @keyframes celebrationBounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-20px);
                    }
                    60% {
                        transform: translateY(-10px);
                    }
                }
                
                .celebration-message {
                    animation: messageSlideIn 1s ease-out 0.5s both;
                }
                
                @keyframes messageSlideIn {
                    from {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .detail-card {
                    animation: cardPopIn 0.6s ease-out both;
                }
                
                .detail-card:nth-child(1) { animation-delay: 1s; }
                .detail-card:nth-child(2) { animation-delay: 1.2s; }
                .detail-card:nth-child(3) { animation-delay: 1.4s; }
                .detail-card:nth-child(4) { animation-delay: 1.6s; }
                
                @keyframes cardPopIn {
                    from {
                        transform: scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .share-button {
                    animation: buttonGlow 2s ease-in-out infinite alternate;
                }
                
                @keyframes buttonGlow {
                    from {
                        box-shadow: 0 0 20px rgba(255, 105, 180, 0.5);
                    }
                    to {
                        box-shadow: 0 0 30px rgba(255, 105, 180, 0.8);
                    }
                }
                
                /* Responsividade móvel adicional - MELHORADA */
                @media (max-width: 640px) {
                    .celebration-content {
                        padding: 0 0.25rem;
                        max-width: 100%;
                    }
                    
                    .celebration-title {
                        line-height: 1.1;
                        margin-bottom: 0.75rem;
                        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                    }
                    
                    .celebration-message {
                        margin-bottom: 0.75rem;
                        padding: 0.75rem;
                        backdrop-filter: blur(8px);
                    }
                    
                    .celebration-details {
                        gap: 0.5rem;
                    }
                    
                    .detail-card {
                        padding: 0.5rem;
                        min-height: auto;
                    }
                    
                    .detail-card h3 {
                        margin-bottom: 0.25rem;
                        line-height: 1.2;
                    }
                    
                    .detail-card p {
                        line-height: 1.3;
                        margin: 0;
                    }
                    
                    .actions-container {
                        margin-top: 0.75rem;
                    }
                    
                    .share-button, .repeat-button {
                        width: 100%;
                        max-width: 280px;
                        margin: 0 auto;
                        font-size: 0.875rem;
                        padding: 0.75rem 1rem;
                    }
                    
                    .music-controls {
                        padding: 0.75rem;
                        margin: 0.5rem 0;
                    }
                    
                    .music-button {
                        width: 100%;
                        max-width: 200px;
                        padding: 0.625rem 1rem;
                        font-size: 0.75rem;
                    }
                    
                    .volume-control {
                        width: 100%;
                        justify-content: center;
                        margin-top: 0.5rem;
                    }
                    
                    .volume-slider {
                        width: 80px;
                    }
                    
                    /* CORREÇÃO MOBILE: Permitir scroll e visualização completa */
                    .celebration-phase {
                        overflow-y: auto !important;
                        -webkit-overflow-scrolling: touch;
                        min-height: 100vh;
                        height: auto;
                    }
                    
                    .celebration-content {
                        padding-bottom: 2rem;
                        min-height: calc(100vh - 2rem);
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                    }
                }
                
                @media (max-width: 480px) {
                    .celebration-content {
                        padding: 0 0.125rem;
                    }
                    
                    .celebration-title {
                        font-size: 1.5rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .celebration-message p {
                        font-size: 0.875rem;
                        margin-bottom: 0.75rem;
                    }
                    
                    .detail-card {
                        padding: 0.375rem;
                    }
                    
                    .detail-card h3 {
                        font-size: 0.875rem;
                    }
                    
                    .detail-card p {
                        font-size: 0.7rem;
                        line-height: 1.2;
                    }
                    
                    .share-button, .repeat-button {
                        font-size: 0.8rem;
                        padding: 0.625rem 0.875rem;
                        max-width: 260px;
                    }
                    
                    .music-button {
                        font-size: 0.7rem;
                        padding: 0.5rem 0.75rem;
                    }
                    
                    .volume-slider {
                        width: 60px;
                    }
                }
                
                /* Otimizações para altura de tela pequena */
                @media (max-height: 700px) {
                    .celebration-content {
                        padding-top: 0.5rem;
                        padding-bottom: 1rem;
                    }
                    
                    .celebration-title {
                        margin-bottom: 0.5rem;
                    }
                    
                    .celebration-message {
                        margin-bottom: 0.5rem;
                        padding: 0.5rem;
                    }
                    
                    .actions-container {
                        space-y: 0.375rem;
                    }
                    
                    .detail-card {
                        padding: 0.375rem;
                    }
                }
                
                @media (max-height: 600px) {
                    .celebration-title {
                        font-size: 1.25rem;
                        margin-bottom: 0.375rem;
                    }
                    
                    .celebration-message p {
                        font-size: 0.8rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .detail-card h3 {
                        font-size: 0.8rem;
                        margin-bottom: 0.125rem;
                    }
                    
                    .detail-card p {
                        font-size: 0.65rem;
                    }
                }
                
                /* Melhorias de toque e acessibilidade */
                @media (hover: none) and (pointer: coarse) {
                    .share-button:hover, .repeat-button:hover, .music-button:hover {
                        transform: none;
                    }
                    
                    .share-button:active, .repeat-button:active, .music-button:active {
                        transform: scale(0.98);
                    }
                    
                    /* Melhor feedback visual em dispositivos touch */
                    .detail-card {
                        transition: background-color 0.2s ease;
                    }
                    
                    .detail-card:active {
                        background-color: rgba(255, 255, 255, 0.15);
                    }
                }
                
                /* Otimizações específicas para iPhone e dispositivos móveis */
                @media screen and (max-device-width: 414px) {
                    body {
                        overflow: auto !important;
                        height: auto !important;
                    }
                    
                    .celebration-phase {
                        min-height: -webkit-fill-available;
                        height: auto;
                        overflow-y: auto !important;
                    }
                    
                    .celebration-content {
                        min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
                        padding-bottom: calc(2rem + env(safe-area-inset-bottom));
                    }
                }
                
                /* Correções globais para mobile - garantir scroll */
                @media screen and (max-width: 768px) {
                    body {
                        overflow: auto !important;
                        height: auto !important;
                        min-height: 100vh;
                    }
                    
                    #experienceScreen {
                        overflow-y: auto !important;
                        height: auto !important;
                        min-height: 100vh;
                    }
                    
                    .celebration-phase {
                        overflow-y: auto !important;
                        height: auto !important;
                        min-height: 100vh;
                    }
                }
                
                /* Correções para orientação landscape em mobile */
                @media screen and (max-height: 500px) and (orientation: landscape) {
                    .celebration-content {
                        padding-top: 0.5rem;
                        padding-bottom: 0.5rem;
                    }
                    
                    .celebration-title {
                        font-size: 1.25rem;
                        margin-bottom: 0.375rem;
                    }
                    
                    .celebration-message {
                        margin-bottom: 0.5rem;
                        padding: 0.5rem;
                    }
                    
                    .details-grid {
                        gap: 0.5rem;
                    }
                    
                    .detail-card {
                        padding: 0.375rem;
                    }
                    
                    .actions-container > div {
                        margin-bottom: 0.375rem;
                    }
                }
            </style>
        `;

    // Adicionar estilos para o botão de repetir
    const repeatStyles = document.createElement('style');
    repeatStyles.textContent = `
        .repeat-button {
            animation: repeatPulse 3s ease-in-out infinite;
            position: relative;
            overflow: hidden;
        }
        
        .repeat-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.5s;
        }
        
        .repeat-button:hover::before {
            left: 100%;
        }
        
        @keyframes repeatPulse {
            0%, 100% {
                box-shadow: 0 0 20px rgba(236, 72, 153, 0.6);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 0 40px rgba(147, 51, 234, 0.8);
                transform: scale(1.02);
            }
        }
        
        .music-button {
            transition: all 0.3s ease;
        }
        
        .music-button:hover {
            transform: translateY(-2px);
        }
        
        .volume-slider {
            width: 100px;
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.3);
            outline: none;
            appearance: none;
        }
        
        .volume-slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .volume-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        /* Estilos móveis globais */
        @media (max-width: 640px) {
            .volume-slider {
                width: 80px;
            }
            
            .music-button {
                font-size: 0.875rem;
                padding: 0.75rem 1rem;
                min-height: 44px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                animation: mobileMusicPulse 2s ease-in-out infinite;
            }
            
            .music-controls {
                background: rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                border-radius: 1rem;
                padding: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .music-status {
                font-weight: 600;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            }
        }
        
        @keyframes mobileMusicPulse {
            0%, 100% {
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(255, 105, 180, 0.7);
            }
            50% {
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 0 6px rgba(255, 105, 180, 0.3);
            }
        }
                padding: 0.5rem 0.75rem;
            }
            
            /* Garantir que textos não quebrem linha inadequadamente */
            .dancing-script {
                word-wrap: break-word;
                hyphens: auto;
            }
            
            /* Espaçamento otimizado para mobile */
            .text-center {
                text-align: center;
            }
            
            /* Botões com largura adequada */
            button {
                min-height: 44px; /* Tamanho mínimo recomendado para toque */
            }
        }
        
        @media (max-width: 480px) {
            .volume-slider {
                width: 60px;
            }
            
            .music-button {
                font-size: 0.75rem;
                padding: 0.375rem 0.5rem;
            }
        }
        
        /* Otimizações para altura de tela pequena */
        @media (max-height: 600px) {
            .celebration-content {
                padding-top: 1rem;
                padding-bottom: 1rem;
            }
            
            .buildup-content {
                gap: 0.5rem;
            }
            
            .reveal-content {
                gap: 0.5rem;
            }
        }
    `;
    document.head.appendChild(repeatStyles);

    // Criar balões
    this.createBalloons();

    // Adicionar funcionalidade de compartilhamento
    this.addShareFunctionality();
  }

  createBalloons() {
    const container = document.getElementById('balloons');
    const balloonColors = ['#ff69b4', '#87ceeb', '#98fb98', '#dda0dd', '#ffb6c1'];

    for (let i = 0; i < 15; i++) {
      const balloon = document.createElement('div');
      balloon.className = 'absolute balloon';
      balloon.innerHTML = '🎈';

      // Posição
      balloon.style.left = Math.random() * 100 + '%';
      balloon.style.fontSize = Math.random() * 30 + 20 + 'px';

      // Animação
      balloon.style.animation = `balloonFloat ${Math.random() * 4 + 6}s ease-in-out infinite`;
      balloon.style.animationDelay = Math.random() * 2 + 's';

      container.appendChild(balloon);
    }

    // CSS para balões
    const style = document.createElement('style');
    style.textContent = `
            @keyframes balloonFloat {
                0%, 100% {
                    transform: translateY(100vh) rotate(0deg);
                }
                50% {
                    transform: translateY(-100px) rotate(180deg);
                }
            }
        `;
    document.head.appendChild(style);
  }

  addShareFunctionality() {
    const shareButton = document.getElementById('shareButton');
    const musicToggle = document.getElementById('musicToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const repeatButton = document.getElementById('repeatButton');

    // Compartilhamento
    shareButton.addEventListener('click', () => {
      if (navigator.share) {
        navigator
          .share({
            title: 'É MENINA! 👧🏻💕',
            text: 'Nossa princesinha está chegando! Que alegria compartilhar este momento especial! 💖',
            url: window.location.href,
          })
          .catch(console.error);
      } else {
        // Fallback para copiar link
        navigator.clipboard.writeText(window.location.href).then(() => {
          shareButton.textContent = 'Link Copiado! 📋';
          setTimeout(() => {
            shareButton.textContent = 'Compartilhar a Alegria! 📱';
          }, 2000);
        });
      }

      this.vibrate([100, 100, 100]);
    });

    // Controle de música melhorado para mobile
    const musicStatus = document.getElementById('musicStatus');
    if (musicToggle && this.celebrationMusic) {
      // Definir estado inicial baseado no status da música
      const updateMusicButton = () => {
        if (this.celebrationMusic.paused) {
          musicToggle.innerHTML = '▶️ Tocar Música';
          musicToggle.className =
            'music-button bg-gradient-to-r from-green-500/80 to-blue-600/80 backdrop-blur-sm text-white px-4 sm:px-5 py-2 sm:py-3 rounded-full hover:from-green-600/80 hover:to-blue-700/80 transition-all text-sm sm:text-base font-semibold border border-white/20 shadow-lg animate-pulse';
          if (musicStatus) musicStatus.innerHTML = '🔇 Toque para ouvir a música';
        } else {
          musicToggle.innerHTML = '⏸️ Pausar Música';
          musicToggle.className =
            'music-button bg-gradient-to-r from-pink-500/80 to-purple-600/80 backdrop-blur-sm text-white px-4 sm:px-5 py-2 sm:py-3 rounded-full hover:from-pink-600/80 hover:to-purple-700/80 transition-all text-sm sm:text-base font-semibold border border-white/20 shadow-lg';
          if (musicStatus) musicStatus.innerHTML = '🎵 Música tocando';
        }
      };

      // Estado inicial
      updateMusicButton();

      musicToggle.addEventListener('click', () => {
        if (this.celebrationMusic.paused) {
          const playPromise = this.celebrationMusic.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                updateMusicButton();
              })
              .catch((error) => {
                console.log('Erro ao tocar música:', error);
                if (musicStatus) musicStatus.innerHTML = '❌ Erro ao tocar música';
              });
          }
        } else {
          this.celebrationMusic.pause();
          updateMusicButton();
        }
        this.vibrate([100]);
      });

      // Listeners para mudanças no estado da música
      this.celebrationMusic.addEventListener('play', updateMusicButton);
      this.celebrationMusic.addEventListener('pause', updateMusicButton);
      this.celebrationMusic.addEventListener('ended', updateMusicButton);
    }

    // Controle de volume
    if (volumeSlider && this.celebrationMusic) {
      volumeSlider.addEventListener('input', (e) => {
        this.celebrationMusic.volume = e.target.value / 100;
      });
    }

    // Botão de repetir experiência
    if (repeatButton) {
      repeatButton.addEventListener('click', () => {
        this.restartExperience();
      });
    }
  }

  restartExperience() {
    // Vibração de confirmação
    this.vibrate([100, 50, 100, 50, 200]);

    // Restaurar configurações do body para as configurações iniciais
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.minHeight = '100vh';

    // Reset das variáveis antes do reload
    this.experienceStarted = false;
    this.audioUnlocked = false;
    this.allAudiosPreAuthorized = false;
    this.celebrationMusicAllowed = false;

    // Pequeno delay para sentir a vibração antes do refresh
    setTimeout(() => {
      // Recarregar a página (equivalente ao F5)
      window.location.reload();
    }, 300);
  }

  stopAllAudioExceptCelebration() {
    console.log('Parando todos os áudios antes da celebração...');

    // CORREÇÃO: Parar batimentos cardíacos de forma mais robusta
    if (this.soundGenerator) {
      try {
        this.soundGenerator.stopHeartbeatLoop();
        // Verificação adicional para garantir que parou
        if (this.soundGenerator.isHeartbeatPlaying) {
          console.log('⚠️ Forçando parada do batimento cardíaco...');
          this.soundGenerator.forceStopAllSounds();
        }
        console.log('✅ Batimentos cardíacos parados definitivamente');
      } catch (error) {
        console.log('❌ Erro ao parar batimento cardíaco:', error);
      }
    }

    // Parar música do clímax
    if (this.climaxMusic) {
      this.climaxMusic.pause();
      this.climaxMusic.currentTime = 0;
      console.log('✅ Música do clímax parada');
    }

    // Parar qualquer som sintético que possa estar tocando
    if (this.soundGenerator && this.soundGenerator.audioContext) {
      try {
        // Parar todas as fontes de áudio ativas
        this.soundGenerator.stopAllSounds();
        console.log('✅ Sons sintéticos parados');
      } catch (error) {
        console.log('❌ Erro ao parar sons sintéticos:', error);
      }
    }

    // Pausar qualquer música de celebração que possa estar tocando prematuramente
    if (this.celebrationMusic && !this.celebrationMusic.paused) {
      this.celebrationMusic.pause();
      this.celebrationMusic.currentTime = 0;
      console.log('✅ Música de celebração resetada');
    }

    console.log('🎉 Todos os áudios anteriores foram parados para a celebração');
  }

  showAudioEnableButton() {
    // Criar botão para habilitar áudio no mobile
    const audioButton = document.createElement('button');
    audioButton.id = 'enableAudioButton';
    audioButton.className =
      'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse';
    audioButton.innerHTML = '🎵 Tocar Música';

    document.body.appendChild(audioButton);

    audioButton.addEventListener('click', () => {
      this.celebrationMusic.currentTime = 0;
      this.celebrationMusic.volume = 0;

      this.celebrationMusic
        .play()
        .then(() => {
          // Fade in da música
          let volume = 0;
          const fadeIn = setInterval(() => {
            volume += 0.05;
            if (volume >= 0.7) {
              volume = 0.7;
              clearInterval(fadeIn);
            }
            this.celebrationMusic.volume = volume;
          }, 100);

          // Remover botão após música começar
          audioButton.remove();
        })
        .catch((e) => {
          console.log('Erro ao tentar tocar música manualmente:', e);
        });
    });

    // Auto-remover botão após 10 segundos se não for usado
    setTimeout(() => {
      if (audioButton.parentNode) {
        audioButton.remove();
      }
    }, 10000);
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM carregado, inicializando experiência...');

  try {
    const experience = new RevealExperience();
    console.log('✅ Experiência inicializada com sucesso!');

    // Adicionar uma referência global para debug
    window.revelationExperience = experience;

    // Função global para fallback manual
    window.startExperienceManual = () => {
      console.log('🆘 Função manual chamada!');
      if (experience && !experience.experienceStarted) {
        experience.startExperience();
      } else if (experience && experience.experienceStarted) {
        console.log('⚠️ Experiência já iniciada');
      } else {
        console.log('❌ Experiência não encontrada');
      }
    };

    // Função global para debug
    window.debugButton = () => {
      if (experience && experience.debugButton) {
        experience.debugButton();
      }
    };
  } catch (error) {
    console.error('❌ ERRO ao inicializar experiência:', error);
  }
});

// Fallback adicional - tentar novamente após um pequeno delay se algo falhar
setTimeout(() => {
  if (!window.revelationExperience) {
    console.log('⚠️ Tentativa de inicialização via fallback...');
    try {
      const experience = new RevealExperience();
      window.revelationExperience = experience;
      console.log('✅ Experiência inicializada via fallback!');

      // Função global para fallback manual
      window.startExperienceManual = () => {
        console.log('🆘 Função manual chamada via fallback!');
        if (experience && !experience.experienceStarted) {
          experience.startExperience();
        }
      };
    } catch (error) {
      console.error('❌ ERRO no fallback de inicialização:', error);
    }
  }
}, 1000);

// Prevenir zoom no mobile
document.addEventListener('touchstart', function (event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
});

let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);
