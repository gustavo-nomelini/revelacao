// Configurações da experiência
const EXPERIENCE_CONFIG = {
  sounds: {
    heartbeat: true,
    suspense: true,
    celebration: true,
  },
  timing: {
    countdown: 2,
    phases: {
      mystery: 14000,
      buildup: 17000,
      duel: 12000, // Nova fase: Duelo de Possibilidades
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

    this.initializeElements();
    this.bindEvents();
    this.loadCelebrationMusic();
    this.loadClimaxMusic();

    // Preparações específicas para mobile
    if (this.isMobile) {
      this.prepareMobileAudio();
    }
  }

  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  }

  prepareMobileAudio() {
    // Função para desbloqueio de áudio mais controlada
    const unlockAudio = (event) => {
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
        // Tentar reproduzir um som silencioso para desbloquear o contexto de áudio
        if (this.celebrationMusic) {
          const originalVolume = this.celebrationMusic.volume;
          this.celebrationMusic.volume = 0;
          const playPromise = this.celebrationMusic.play();
          if (playPromise) {
            playPromise
              .then(() => {
                this.celebrationMusic.pause();
                this.celebrationMusic.currentTime = 0;
                this.celebrationMusic.volume = originalVolume;
                this.audioUnlocked = true;
                console.log('Áudio desbloqueado no mobile');

                // Remover listeners após desbloqueio
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('touchend', unlockAudio);
                document.removeEventListener('click', unlockAudio);
              })
              .catch(() => {
                console.log('Falha ao desbloquear áudio');
              });
          }
        }
      }
    };

    // Adicionar listeners para primeira interação válida
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('touchend', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio);
  }

  async preAuthorizeMobileAudio() {
    if (this.allAudiosPreAuthorized) return;

    console.log('🔓 Pré-autorizando todos os áudios para mobile...');

    try {
      // 1. Inicializar contexto de áudio sintético
      if (this.soundGenerator && !this.soundGenerator.isInitialized) {
        await this.soundGenerator.initialize();
      }

      // 2. Pré-autorizar música do clímax
      if (this.climaxMusic) {
        this.climaxMusic.volume = 0;
        const climaxPlay = this.climaxMusic.play();
        if (climaxPlay) {
          await climaxPlay
            .then(() => {
              this.climaxMusic.pause();
              this.climaxMusic.currentTime = 0;
              console.log('✅ Música do clímax pré-autorizada');
            })
            .catch(() => console.log('❌ Falha ao pré-autorizar música do clímax'));
        }
      }

      // 3. Pré-autorizar música de celebração
      if (this.celebrationMusic) {
        this.celebrationMusic.volume = 0;
        const celebrationPlay = this.celebrationMusic.play();
        if (celebrationPlay) {
          await celebrationPlay
            .then(() => {
              this.celebrationMusic.pause();
              this.celebrationMusic.currentTime = 0;
              console.log('✅ Música de celebração pré-autorizada');
            })
            .catch(() => console.log('❌ Falha ao pré-autorizar música de celebração'));
        }
      }

      // 4. Testar batimento cardíaco sintético
      if (this.soundGenerator && this.soundGenerator.audioContext) {
        try {
          // Criar um som silencioso para desbloquear o contexto
          const oscillator = this.soundGenerator.audioContext.createOscillator();
          const gainNode = this.soundGenerator.audioContext.createGain();
          gainNode.gain.setValueAtTime(0, this.soundGenerator.audioContext.currentTime);
          oscillator.connect(gainNode);
          gainNode.connect(this.soundGenerator.audioContext.destination);
          oscillator.start();
          oscillator.stop(this.soundGenerator.audioContext.currentTime + 0.1);
          console.log('✅ Contexto de áudio sintético desbloqueado');
        } catch (error) {
          console.log('❌ Erro ao desbloquear contexto sintético:', error);
        }
      }

      this.allAudiosPreAuthorized = true;
      this.audioUnlocked = true;
      console.log('🎉 TODOS os áudios pré-autorizados com sucesso!');
    } catch (error) {
      console.log('❌ Erro na pré-autorização:', error);
    }
  }

  scheduleAutoAudioPlayback() {
    console.log('📅 Agendando reprodução automática dos áudios...');

    // Calcular os momentos exatos para cada áudio
    const countdownTime = EXPERIENCE_CONFIG.timing.countdown * 1000;
    const mysteryTime = countdownTime + EXPERIENCE_CONFIG.timing.phases.mystery;
    const buildupTime = mysteryTime + EXPERIENCE_CONFIG.timing.phases.buildup;
    const celebrationTime =
      buildupTime + EXPERIENCE_CONFIG.timing.phases.duel + EXPERIENCE_CONFIG.timing.phases.reveal;

    // Agendar música do clímax (durante buildup)
    setTimeout(() => {
      if (this.currentPhase === 'buildup' && this.climaxMusic && this.allAudiosPreAuthorized) {
        console.log('🎵 Auto-reproduzindo música do clímax...');
        this.climaxMusic.currentTime = 0;
        this.climaxMusic.volume = 0.8;
        this.climaxMusic
          .play()
          .then(() => console.log('✅ Música do clímax auto-reproduzida'))
          .catch((err) => console.log('❌ Falha na auto-reprodução do clímax:', err));
      }
    }, buildupTime - 1000); // 1 segundo antes da fase buildup para garantir

    // Agendar música de celebração
    setTimeout(() => {
      if (
        this.currentPhase === 'celebration' &&
        this.celebrationMusic &&
        this.allAudiosPreAuthorized
      ) {
        console.log('🎵 Auto-reproduzindo música de celebração...');
        this.celebrationMusic.currentTime = 0;
        this.celebrationMusic.volume = 0;
        this.celebrationMusic
          .play()
          .then(() => {
            console.log('✅ Música de celebração auto-reproduzida');
            // Fade in
            let volume = 0;
            const fadeIn = setInterval(() => {
              volume += 0.05;
              if (volume >= 0.7) {
                volume = 0.7;
                clearInterval(fadeIn);
              }
              this.celebrationMusic.volume = volume;
            }, 100);
          })
          .catch((err) => console.log('❌ Falha na auto-reprodução da celebração:', err));
      }
    }, celebrationTime);

    console.log(`📅 Áudios agendados:
      - Clímax: ${buildupTime / 1000}s
      - Celebração: ${celebrationTime / 1000}s`);
  }

  initializeElements() {
    this.landingScreen = document.getElementById('landingScreen');
    this.experienceScreen = document.getElementById('experienceScreen');
    this.enterButton = document.getElementById('enterButton');
    this.buttonText = document.getElementById('buttonText');
    this.countdownElement = document.getElementById('countdown');
  }

  bindEvents() {
    // Evento específico para o botão de entrada
    this.enterButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.startExperience();
    });

    // Prevenir cliques acidentais em outras áreas da tela inicial
    this.landingScreen.addEventListener('click', (event) => {
      // Só permitir cliques no botão de entrada
      if (!event.target.closest('#enterButton')) {
        event.preventDefault();
        event.stopPropagation();

        // Feedback visual para cliques fora do botão
        const button = this.enterButton;
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
    });

    // Detectar se é mobile para vibração
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  loadCelebrationMusic() {
    this.celebrationMusic = new Audio(
      './O Espírito da Coisa - Ligeiramente Grávida [zdeKhxfiSVs].mp3'
    );

    // Configurações otimizadas para mobile
    if (this.isMobile) {
      this.celebrationMusic.preload = 'metadata'; // Carregar apenas metadados no mobile
      this.celebrationMusic.volume = 0.8; // Volume um pouco mais alto no mobile
    } else {
      this.celebrationMusic.preload = 'auto';
      this.celebrationMusic.volume = 0.7;
    }

    // Adicionar listeners para feedback de carregamento
    this.celebrationMusic.addEventListener('canplaythrough', () => {
      console.log('Música de celebração carregada e pronta');
    });

    this.celebrationMusic.addEventListener('error', (e) => {
      console.error('Erro ao carregar música de celebração:', e);
    });
  }

  loadClimaxMusic() {
    this.climaxMusic = new Audio('./Climax 1⧸2 (Suspense) sound effects [NQRbIrEHY3M].mp3');

    // Configurações otimizadas para mobile
    if (this.isMobile) {
      this.climaxMusic.preload = 'metadata';
      this.climaxMusic.volume = 0.9; // Volume um pouco mais alto no mobile
    } else {
      this.climaxMusic.preload = 'auto';
      this.climaxMusic.volume = 0.8;
    }

    // Adicionar listeners para feedback
    this.climaxMusic.addEventListener('canplaythrough', () => {
      console.log('Música do clímax carregada e pronta');
    });

    this.climaxMusic.addEventListener('error', (e) => {
      console.error('Erro ao carregar música do clímax:', e);
    });
  }

  vibrate(pattern = [100, 50, 100]) {
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  async startExperience() {
    // Prevenir múltiplas execuções
    if (this.experienceStarted) {
      console.log('Experiência já foi iniciada, ignorando clique duplicado');
      return;
    }

    this.experienceStarted = true;

    try {
      // Marcar o início da experiência
      this.experienceStartTime = Date.now();

      // NO MOBILE: Pré-autorizar TODOS os áudios após este clique
      if (this.isMobile) {
        await this.preAuthorizeMobileAudio();
        // Agendar reprodução automática dos áudios nos momentos corretos
        this.scheduleAutoAudioPlayback();
      }

      // Calcular quando a música de celebração poderá tocar
      // Tempo total até celebration = countdown + mystery + buildup + duel + reveal
      const totalTimeUntilCelebration =
        EXPERIENCE_CONFIG.timing.countdown * 1000 +
        EXPERIENCE_CONFIG.timing.phases.mystery +
        EXPERIENCE_CONFIG.timing.phases.buildup +
        EXPERIENCE_CONFIG.timing.phases.duel +
        EXPERIENCE_CONFIG.timing.phases.reveal;

      console.log(`Timing da experiência:
        - Countdown: ${EXPERIENCE_CONFIG.timing.countdown}s
        - Mystery: ${EXPERIENCE_CONFIG.timing.phases.mystery / 1000}s
        - Buildup: ${EXPERIENCE_CONFIG.timing.phases.buildup / 1000}s  
        - Duel: ${EXPERIENCE_CONFIG.timing.phases.duel / 1000}s
        - Reveal: ${EXPERIENCE_CONFIG.timing.phases.reveal / 1000}s
        - Total até celebração: ${totalTimeUntilCelebration / 1000}s`);

      // Permitir música apenas após o tempo total (com margem de segurança)
      setTimeout(() => {
        this.celebrationMusicAllowed = true;
        console.log(
          '🎵 Música de celebração LIBERADA após',
          totalTimeUntilCelebration / 1000,
          'segundos'
        );
      }, totalTimeUntilCelebration);

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
    await this.soundGenerator.initialize();
    // Iniciar batimento cardíaco
    this.soundGenerator.startHeartbeatLoop();
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

    // Parar áudio de batimento
    this.soundGenerator.stopHeartbeatLoop();

    // Som de suspense (arquivo de áudio)
    if (this.climaxMusic) {
      this.climaxMusic.currentTime = 0;
      this.climaxMusic.volume = 0.8; // Garantir volume

      const playPromise = this.climaxMusic.play();
      if (playPromise) {
        playPromise
          .then(() => {
            console.log('✅ Música do clímax iniciada com sucesso');
          })
          .catch((e) => {
            console.log('❌ Erro ao tocar música do clímax:', e);
            // Se falhar, tentar novamente após um pequeno delay
            setTimeout(() => {
              this.climaxMusic
                .play()
                .catch(() => console.log('Segunda tentativa de clímax falhou'));
            }, 100);
          });
      }
    }

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

    // Animação do VS com carregamento
    versusContainer.innerHTML = `
      <div class="versus-loading text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl text-white font-bold">
        <div class="vs-spinner">⚡ VS ⚡</div>
        <div class="loading-dots text-base sm:text-lg md:text-xl mt-2">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
      <div class="loading-bar-container mt-4">
        <div class="loading-bar"></div>
      </div>
    `;

    // Vibração de início de carregamento
    this.vibrate([100, 50, 100]);

    // Vibração no meio do carregamento
    setTimeout(() => {
      this.vibrate([150, 75, 150]);
    }, 1500);

    // Após 3 segundos, iniciar a sequência dinâmica
    setTimeout(() => {
      this.startDynamicDominance();
    }, 3000);
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

    // ========== FASE 3: VOLTA TRIUNFAL DA MENINA! (10-12 segundos do duelo total) ==========
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

      // Indicador de vitória final
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
    }, 7000); // Ajustado de 8000 para 7000 (7s após início da fase 1 = 10s do duelo total)

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

    // Fase 3: Explosão de partículas rosa (vitória menina)
    setTimeout(() => {
      createPhaseParticles('#ec4899', 'menina', 15);
      // Partículas extras para vitória
      setTimeout(() => createPhaseParticles('#f472b6', 'menina', 12), 500);
      setTimeout(() => createPhaseParticles('#ec4899', 'menina', 10), 1000);
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

    // Parar TODOS os outros áudios antes da celebração
    this.stopAllAudioExceptCelebration();

    // Forçar permissão da música (caso esteja atrasada)
    this.celebrationMusicAllowed = true;

    // Aguardar um momento maior para garantir que os áudios pararam completamente
    setTimeout(() => {
      // Só então iniciar a música de celebração
      this.playCelebrationMusic();
    }, 1000); // Delay de 1 segundo para garantir que outros áudios pararam

    this.experienceScreen.innerHTML = `
            <div class="celebration-phase relative h-full overflow-hidden">
                <!-- Fundo festivo -->
                <div class="absolute inset-0 celebration-bg"></div>
                
                <!-- Balões flutuantes -->
                <div id="balloons" class="absolute inset-0"></div>
                
                <!-- Conteúdo principal -->
                <div class="relative z-10 flex flex-col items-center justify-start min-h-full text-center px-1 sm:px-2 md:px-4 py-2 sm:py-4 overflow-y-auto">
                    <div class="celebration-content max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-4xl mx-auto w-full">
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
                    
                    /* Melhor scroll em telas pequenas */
                    .celebration-phase {
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
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
                
                /* Otimizações específicas para iPhone */
                @media screen and (max-device-width: 414px) {
                    .celebration-phase {
                        min-height: -webkit-fill-available;
                    }
                    
                    .celebration-content {
                        min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
                        padding-bottom: calc(1rem + env(safe-area-inset-bottom));
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
  playCelebrationMusic() {
    // Verificar se a música está permitida (baseado no timing da experiência)
    if (!this.celebrationMusicAllowed) {
      console.log('Música de celebração ainda não permitida - aguardando timing correto');
      return;
    }

    if (this.celebrationMusic) {
      // Reset audio to beginning
      this.celebrationMusic.currentTime = 0;
      this.celebrationMusic.volume = 0;

      // Nova estratégia: tentar autoplay mesmo no mobile se foi pré-autorizado
      const shouldAttemptAutoplay = !this.isMobile || this.allAudiosPreAuthorized;

      if (shouldAttemptAutoplay) {
        // Tentar reproduzir automaticamente
        const playPromise = this.celebrationMusic.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Música de celebração iniciada automaticamente');
              // Aumentar volume gradualmente
              let volume = 0;
              const fadeIn = setInterval(() => {
                volume += 0.05;
                if (volume >= 0.7) {
                  volume = 0.7;
                  clearInterval(fadeIn);
                }
                this.celebrationMusic.volume = volume;
              }, 100);
            })
            .catch((error) => {
              console.log('❌ Autoplay bloqueado mesmo após pré-autorização:', error);
              // Fallback: tentar novamente após pequeno delay
              setTimeout(() => {
                this.celebrationMusic
                  .play()
                  .then(() => {
                    console.log('✅ Segunda tentativa de celebração bem-sucedida');
                    this.celebrationMusic.volume = 0.7;
                  })
                  .catch(() =>
                    console.log('❌ Segunda tentativa falhou - usuário deve controlar manualmente')
                  );
              }, 500);
            });
        }
      } else {
        console.log('Mobile sem pré-autorização - música será controlada manualmente');
      }
    }
  }

  stopAllAudioExceptCelebration() {
    console.log('Parando todos os áudios antes da celebração...');

    // Parar batimentos cardíacos
    if (this.soundGenerator) {
      this.soundGenerator.stopHeartbeatLoop();
      console.log('Batimentos cardíacos parados');
    }

    // Parar música do clímax
    if (this.climaxMusic) {
      this.climaxMusic.pause();
      this.climaxMusic.currentTime = 0;
      console.log('Música do clímax parada');
    }

    // Parar qualquer som sintético que possa estar tocando
    if (this.soundGenerator && this.soundGenerator.audioContext) {
      try {
        // Parar todas as fontes de áudio ativas
        this.soundGenerator.stopAllSounds();
        console.log('Sons sintéticos parados');
      } catch (error) {
        console.log('Erro ao parar sons sintéticos:', error);
      }
    }

    // Pausar qualquer música de celebração que possa estar tocando prematuramente
    if (this.celebrationMusic && !this.celebrationMusic.paused) {
      this.celebrationMusic.pause();
      this.celebrationMusic.currentTime = 0;
      console.log('Música de celebração resetada');
    }

    console.log('Todos os áudios anteriores foram parados para a celebração');
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
  const experience = new RevealExperience();
});

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
