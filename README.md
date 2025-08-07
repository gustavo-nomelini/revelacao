# 🎀 Revelação do Bebê - É MENINA! 👧🏻

Uma experiência interativa completa para revelação de gênero que vai fazer todo mundo roer as unhas antes do grande momento!

## ✨ Características

### 🎭 Experiência Imersiva

- **Pré-show com suspense**: Landing page com partículas flutuantes, contador regressivo e trilha de batimento cardíaco
- **Fase Mistério**: Símbolos enigmáticos, partículas místicas e progressão visual
- **Buildup Dramático**: Contagem regressiva final com efeitos visuais intensos
- **Grande Reveal**: Explosão de confetes, animações celebrativas e "É MENINA!" épico
- **Celebração**: Balões, mensagens especiais e opção de compartilhamento

### 🔊 Áudio Dinâmico

- Batimento cardíaco sintético (Web Audio API)
- Sons de suspense durante fase mistério
- Acordes celebrativos no reveal
- Efeitos sonoros de "confete" para imersão total

### 📱 Mobile-First

- Vibração háptica sincronizada com áudio
- Design responsivo para todas as telas
- Otimizado para touch e gestos
- Prevenção de zoom indesejado

### 🎨 Design Moderno

- Gradientes animados e dinâmicos
- Partículas interativas e confetes
- Tipografia elegante (Dancing Script + Poppins)
- Animações CSS suaves
- Paleta de cores rosa vibrante

## 🚀 Como Usar

1. **Abra o arquivo `index.html` no navegador**
2. **Clique em "Entrar no Mistério"** para habilitar som e vibração
3. **Aguarde o contador regressivo** (10 segundos)
4. **Desfrute da experiência completa!**

## 📁 Estrutura do Projeto

```
revelacao/
├── index.html          # Página principal com landing
├── experience.js       # Lógica principal da experiência
├── sounds.js          # Gerador de áudio sintético
└── README.md          # Documentação
```

## 🛠️ Tecnologias

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Animações, gradientes e efeitos visuais
- **Tailwind CSS**: Estilização rápida via CDN
- **JavaScript ES6+**: Programação orientada a objetos
- **Web Audio API**: Geração de sons sintéticos
- **Vibration API**: Feedback háptico

## 🎯 Fases da Experiência

### 1. 🌟 Landing (Pré-show)

- Partículas flutuantes suaves
- Contador regressivo de 10 segundos
- Batimento cardíaco de fundo
- Botão de entrada interativo

### 2. 🔮 Mistério

- Símbolos enigmáticos animados
- Partículas místicas coloridas
- Barra de progresso
- Vibração em padrões misteriosos

### 3. 🎪 Buildup

- Gradientes dinâmicos vibrantes
- Contagem regressiva final (3, 2, 1)
- Sons de suspense crescente
- Vibração intensa

### 4. 🎉 Reveal

- "É MENINA!" com animação explosiva
- Chuva de confetes coloridos
- Emojis dançantes
- Acordes celebrativos

### 5. 🎈 Celebração

- Balões flutuantes
- Cards informativos
- Botão de compartilhamento
- Mensagem de agradecimento

## 🔧 Personalização

### Alterar Texto do Reveal

No arquivo `experience.js`, linha ~340:

```javascript
<h1 class="dancing-script text-6xl md:text-9xl font-bold text-white mb-4 reveal-title">
    É MENINA! <!-- Altere aqui para "É MENINO!" se necessário -->
</h1>
```

### Ajustar Timing

No início do `experience.js`:

```javascript
const EXPERIENCE_CONFIG = {
  timing: {
    countdown: 10, // Countdown inicial
    phases: {
      mystery: 8000, // Fase mistério (ms)
      buildup: 5000, // Buildup (ms)
      reveal: 3000, // Reveal (ms)
      celebration: 10000, // Celebração (ms)
    },
  },
};
```

### Cores Personalizadas

Edite as paletas de cores no `EXPERIENCE_CONFIG`:

```javascript
colors: {
    mystery: ['#1e1e2e', '#2d1b69', '#11047a'],
    reveal: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1'], // Rosa para menina
    // Para menino: ['#87ceeb', '#4169e1', '#0000ff', '#add8e6']
}
```

## 📱 Compatibilidade

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ✅ PWA Ready

## 🎪 Features Especiais

- **Prevenção de spoilers**: Não há como "pular" a experiência
- **Feedback háptico**: Vibração sincronizada (mobile)
- **Áudio sintético**: Funciona sem arquivos externos
- **Compartilhamento nativo**: API de compartilhamento do navegador
- **Experiência offline**: Todos os recursos são locais

## 💡 Dicas de Uso

1. **Teste em dispositivo mobile** para vibração completa
2. **Use fones de ouvido** para melhor experiência sonora
3. **Tela cheia** para imersão total
4. **Ambiente escuro** potencializa os efeitos visuais

## 🎭 Emotional Journey

```
😮 Curiosidade → 🔮 Mistério → 😰 Suspense → 🤯 Choque → 🥳 Alegria
```

---

_Feito com 💕 para celebrar momentos especiais_
