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
      mystery: 8000,
      buildup: 5000,
      reveal: 3000,
      celebration: 10000,
    },
  },
  colors: {
    mystery: ['#1e1e2e', '#2d1b69', '#11047a'],
    buildup: ['#ff6b6b', '#ee5a24', '#f9ca24'],
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

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.landingScreen = document.getElementById('landingScreen');
    this.experienceScreen = document.getElementById('experienceScreen');
    this.enterButton = document.getElementById('enterButton');
    this.buttonText = document.getElementById('buttonText');
    this.countdownElement = document.getElementById('countdown');
  }

  bindEvents() {
    this.enterButton.addEventListener('click', () => this.startExperience());

    // Detectar se é mobile para vibração
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  vibrate(pattern = [100, 50, 100]) {
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  async startExperience() {
    try {
      // Habilitar áudio
      await this.initializeAudio();

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
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                    <div class="mystery-content opacity-0 animate-pulse">
                        <!-- Símbolos misteriosos -->
                        <div class="mystery-symbols text-6xl md:text-8xl mb-8 space-x-4">
                            <span class="inline-block animate-bounce" style="animation-delay: 0s">🔮</span>
                            <span class="inline-block animate-bounce" style="animation-delay: 0.2s">✨</span>
                            <span class="inline-block animate-bounce" style="animation-delay: 0.4s">🌟</span>
                        </div>
                        
                        <!-- Texto misterioso -->
                        <h2 class="dancing-script text-4xl md:text-6xl text-white mb-6">
                            Os segredos do universo estão se alinhando...
                        </h2>
                        
                        <p class="poppins text-xl md:text-2xl text-purple-200 mb-8">
                            As estrelas sussurram o destino do nosso pequeno tesouro
                        </p>
                        
                        <!-- Indicador de progresso -->
                        <div class="progress-bar w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
                            <div id="progressFill" class="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000 w-0"></div>
                        </div>
                        
                        <p class="poppins text-sm text-white/70 mt-4">
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

    // Som de suspense
    this.soundGenerator.generateSuspenseSound();

    this.experienceScreen.innerHTML = `
            <div class="buildup-phase relative h-full overflow-hidden">
                <!-- Fundo dinâmico -->
                <div class="absolute inset-0 buildup-bg"></div>
                
                <!-- Conteúdo central -->
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                    <div class="buildup-content">
                        <!-- Título dramático -->
                        <h2 class="dancing-script text-5xl md:text-7xl text-white mb-8 buildup-title">
                            O momento chegou!
                        </h2>
                        
                        <!-- Subtítulo -->
                        <p class="poppins text-2xl md:text-3xl text-white mb-12 buildup-subtitle">
                            Nosso pequeno tesouro é...
                        </p>
                        
                        <!-- Pontos de suspense -->
                        <div class="suspense-dots text-6xl md:text-8xl text-white mb-8">
                            <span class="dot-1">.</span>
                            <span class="dot-2">.</span>
                            <span class="dot-3">.</span>
                        </div>
                        
                        <!-- Contador final -->
                        <div id="finalCountdown" class="final-countdown text-8xl md:text-9xl font-bold text-white mb-8">
                            3
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
    let count = 3;

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
        // Grande reveal!
        this.startRevealPhase();
      }
    }, 1000);
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
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                    <div class="reveal-content">
                        <!-- O grande reveal -->
                        <div class="reveal-text mb-8">
                            <h1 class="dancing-script text-6xl md:text-9xl font-bold text-white mb-4 reveal-title">
                                É MENINA!
                            </h1>
                            
                            <div class="girl-emojis text-8xl md:text-9xl mb-8">
                                👧🏻💕👶🏻💖
                            </div>
                            
                            <p class="poppins text-3xl md:text-4xl text-pink-100 mb-8">
                                Nossa princesinha está chegando!
                            </p>
                        </div>
                        
                        <!-- Informações especiais -->
                        <div class="special-info bg-white/20 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                            <h3 class="dancing-script text-3xl text-white mb-4">Detalhes da Princesa</h3>
                            <div class="poppins text-white/90 space-y-2">
                                <p>💕 Cheia de amor para dar</p>
                                <p>🌸 Delicada como uma flor</p>
                                <p>👑 Nossa pequena rainha</p>
                                <p>✨ Trazendo magia para nossas vidas</p>
                            </div>
                        </div>
                    </div>
                </div>
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

    this.experienceScreen.innerHTML = `
            <div class="celebration-phase relative h-full overflow-hidden">
                <!-- Fundo festivo -->
                <div class="absolute inset-0 celebration-bg"></div>
                
                <!-- Balões flutuantes -->
                <div id="balloons" class="absolute inset-0"></div>
                
                <!-- Conteúdo principal -->
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                    <div class="celebration-content max-w-4xl mx-auto">
                        <!-- Título de celebração -->
                        <h1 class="dancing-script text-5xl md:text-7xl font-bold text-white mb-8 celebration-title">
                            Bem-vinda, Princesinha! 👑
                        </h1>
                        
                        <!-- Mensagem especial -->
                        <div class="celebration-message bg-white/30 backdrop-blur-sm rounded-3xl p-8 mb-8">
                            <p class="poppins text-xl md:text-2xl text-white mb-6">
                                Uma nova estrela nasceu em nossos corações! ⭐
                            </p>
                            
                            <div class="celebration-details grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
                                <div class="detail-card bg-pink-500/30 rounded-xl p-4">
                                    <h3 class="dancing-script text-2xl mb-2">💖 Amor Infinito</h3>
                                    <p class="poppins text-sm">Preparados para amar incondicionalmente</p>
                                </div>
                                
                                <div class="detail-card bg-purple-500/30 rounded-xl p-4">
                                    <h3 class="dancing-script text-2xl mb-2">🌸 Doçura Pura</h3>
                                    <p class="poppins text-sm">Ela trará toda a doçura do mundo</p>
                                </div>
                                
                                <div class="detail-card bg-blue-500/30 rounded-xl p-4">
                                    <h3 class="dancing-script text-2xl mb-2">✨ Magia Diária</h3>
                                    <p class="poppins text-sm">Cada dia será uma nova aventura</p>
                                </div>
                                
                                <div class="detail-card bg-green-500/30 rounded-xl p-4">
                                    <h3 class="dancing-script text-2xl mb-2">🦋 Liberdade</h3>
                                    <p class="poppins text-sm">Para voar alto e sonhar grande</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Botão de compartilhamento -->
                        <button id="shareButton" class="share-button bg-white text-pink-600 px-8 py-4 rounded-full text-xl font-bold hover:bg-pink-50 transition-all duration-300 transform hover:scale-105">
                            Compartilhar a Alegria! 📱
                        </button>
                        
                        <!-- Agradecimento -->
                        <p class="poppins text-lg text-white/80 mt-8">
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
            </style>
        `;

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
