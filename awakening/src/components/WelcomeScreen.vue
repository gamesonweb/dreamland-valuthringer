<template>
    <div :class="['welcome-screen', mode]">
        <div class="parallax-bg" :style="parallaxStyle"></div>
        
        <canvas ref="starsCanvas" class="stars-canvas" v-if="mode === 'night'"></canvas>
        
        <div class="floating-island" v-if="mode === 'day'">
        <div class="island"></div>
        <div class="palm-tree"></div>
        </div>
        

        <div class="clouds-container">
        <div class="cloud" v-for="(cloud, index) in clouds" :key="index" 
                :style="cloud.style"></div>
        </div>
        
        <!-- Mode nuit - éléments -->
        <div v-if="mode === 'night'" class="night-elements">
        <div class="constellation" v-for="(star, index) in constellations" :key="'c'+index"
                :style="star.style"></div>
        </div>
        
        <!-- Contenu principal -->
        <div class="content" :class="{ 'night-content': mode === 'night' }">
        <h1 class="dream-title">
            <span class="title-gradient">Escape</span>
            <span class="title-outline">the</span>
            <span class="title-gradient">Dream</span>
        </h1>
        <h1 class="awakening-title">
            <span class="title-subtitle">Awakening</span>
        </h1>

        
        <div class="buttons">
            <button @click="startGame" class="btn-holographic primary">
            <span class="btn-text">Commencer</span>
            <span class="btn-hover"></span>
            </button>
        </div>
        </div>
        
        <div class="interactive-elements">
        <div class="butterfly" v-for="(butterfly, index) in butterflies" :key="'b'+index"
                :style="butterfly.style" @mouseenter="butterflyHover(index)"></div>
        </div>
        
        <!-- jour/nuit  -->
        <button class="mode-toggle" @click="toggleMode">
        <div class="toggle-inner" :class="{ 'night': mode === 'night' }">
            <span class="sun"></span>
            <span class="moon"></span>
        </div>
        </button>
        
        <div class="footer">
        <div class="footer-wave"></div>
        <div class="footer-content">
            <span class="version">Version 1.0</span>
        </div>
        </div>
    </div>
    </template>
    
    <script lang="ts">
    import { defineComponent, ref, reactive, onMounted, onBeforeUnmount } from 'vue';
    
    interface Cloud {
    style: {
        top: string;
        left: string;
        width: string;
        height: string;
        opacity: string;
        animationDuration: string;
        animationDelay: string;
    };
    }
    
    interface Butterfly {
    style: {
        top: string;
        left: string;
        transform: string;
        animationDuration: string;
        filter: string;
    };
    direction: number;
    }
    
    interface Constellation {
    style: {
        top: string;
        left: string;
        width: string;
        height: string;
    };
    }
    
    export default defineComponent({
    name: 'WelcomeScreen',
    emits: ['start-game'],
    setup(_, { emit }) {
        const mode = ref<'day' | 'night'>('day');
        const starsCanvas = ref<HTMLCanvasElement | null>(null);
        const parallaxOffset = reactive({ x: 0, y: 0 });
        const clouds = reactive<Cloud[]>([]);
        const butterflies = reactive<Butterfly[]>([]);
        const constellations = reactive<Constellation[]>([]);
        const specialEffect = ref(false);
    
        // Initialisation
        onMounted(() => {
        initClouds();
        initButterflies();
        if (mode.value === 'night') initConstellations();
        initParallax();
        initKeyboardListener();
        if (starsCanvas.value) initStars();
        });
    
        // Nettoyage
        onBeforeUnmount(() => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('keydown', handleKeyDown);
        });
    

        const startGame = () => emit('start-game');
        const openMenu = () => console.log('Menu ouvert');
    
        const toggleMode = () => {
        mode.value = mode.value === 'day' ? 'night' : 'day';
        if (mode.value === 'night') {
            initConstellations();
        } else {
            constellations.splice(0, constellations.length);
        }
        };
    

        const initClouds = () => {
        for (let i = 0; i < 8; i++) {
            clouds.push({
            style: {
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                width: `${100 + Math.random() * 200}px`,
                height: `${50 + Math.random() * 100}px`,
                opacity: `${0.4 + Math.random() * 0.3}`,
                animationDuration: `${30 + Math.random() * 40}s`,
                animationDelay: `${Math.random() * 20}s`
            }
            });
        }
        };
    
        const initButterflies = () => {
        for (let i = 0; i < 5; i++) {
            butterflies.push(createButterfly());
        }
        };
    
        const createButterfly = (): Butterfly => {
        return {
            style: {
            top: `${10 + Math.random() * 80}%`,
            left: `${Math.random() * 100}%`,
            transform: `scale(${0.5 + Math.random() * 0.7})`,
            animationDuration: `${15 + Math.random() * 20}s`,
            filter: `hue-rotate(${Math.random() * 360}deg)`
            },
            direction: Math.random() > 0.5 ? 1 : -1
        };
        };
    
        const initConstellations = () => {
        const shapes = [
            //constellations
            { points: [[0,0], [30,10], [60,0], [90,20]] },
            { points: [[0,20], [20,0], [40,20], [60,0], [80,20]] },
            { points: [[0,0], [20,20], [40,0], [60,20], [80,0]] }
        ];
    
        shapes.forEach((shape, index) => {
            constellations.push({
            style: {
                top: `${10 + (index * 25)}%`,
                left: `${10 + (index * 20)}%`,
                width: '100px',
                height: '30px'
            }
            });
        });
        };
    
        const initParallax = () => {
        window.addEventListener('mousemove', handleMouseMove);
        };
    
        const initKeyboardListener = () => {
        window.addEventListener('keydown', handleKeyDown);
        };
    
        const initStars = () => {
            //todo
        };
    
        // Gestion des interactions
        const handleMouseMove = (e: MouseEvent) => {
        parallaxOffset.x = (e.clientX / window.innerWidth - 0.5) * 40;
        parallaxOffset.y = (e.clientY / window.innerHeight - 0.5) * 40;
        };
    
        const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            specialEffect.value = !specialEffect.value;
            if (specialEffect.value) {
            butterflies.forEach((butterfly, index) => {
                butterfly.style.animationDuration = `${5 + Math.random() * 10}s`;
                butterflyHover(index);
            }); 
            }
        }
        };
    
        const butterflyHover = (index: number) => {
        butterflies[index].direction *= -1;
        butterflies[index].style.animationDuration = `${10 + Math.random() * 15}s`;
        };
    
        // Styles parallax
        const parallaxStyle = reactive({
        transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`
        });
    
        return {
        mode,
        starsCanvas,
        startGame,
        openMenu,
        toggleMode,
        clouds,
        butterflies,
        constellations,
        parallaxStyle,
        butterflyHover
        };
    }
    });
    </script>
    









    <style scoped>
    .welcome-screen {
    position: relative;
    overflow: hidden;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: all 1.5s cubic-bezier(0.65, 0, 0.35, 1);
    }

    .parallax-bg {
    position: absolute;
    top: -10%;
    left: -10%;
    width: 120%;
    height: 120%;
    background: radial-gradient(ellipse at center, 
        var(--bg-color-1) 0%, 
        var(--bg-color-2) 70%, 
        var(--bg-color-3) 100%);
    transition: transform 0.1s ease-out, background 1.5s ease;
    z-index: -1;
    }
    
    .welcome-screen.day {
    --bg-color-1: #ffd1f7;
    --bg-color-2: #a5c8ff;
    --bg-color-3: #87cefa;
    --text-color: #4b2a5e;
    --accent-color: #ff6ec7;
    }
    
    .welcome-screen.night {
    --bg-color-1: #0b1441;
    --bg-color-2: #1e2a63;
    --bg-color-3: #2c3a7a;
    --text-color: #e0d6ff;
    --accent-color: #8888ff;
    }
    
    .dream-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 6rem;
    margin-bottom: 1rem;
    text-align: center;
    line-height: 1;
    perspective: 1000px;
    }

    .awakening-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 3rem;
    margin-bottom: 2rem;
    text-align: center;
    line-height: 1;
    perspective: 1000px;
    }
    
    .title-gradient {
    background: linear-gradient(135deg, var(--accent-color), #0402a3);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
    animation: titleFloat 6s ease-in-out infinite;
    }
    
    
    .title-outline {
    color: transparent;
    -webkit-text-stroke: 2px var(--accent-color);
    text-stroke: 2px var(--accent-color);
    display: inline-block;
    margin-left: 1rem;
    animation: titleFloat 6s ease-in-out infinite reverse;
    }
    
    .title-subtitle {
    color: var(--text-color);
    font-size: 2.5rem;
    margin-top: 1rem;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    display: inline-block;
    animation: subtitleFloat 6s ease-in-out infinite;
    }

    .subtitle {
    font-size: 2rem;
    color: var(--text-color);
    margin-bottom: 3rem;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }
    
    
    @keyframes titleFloat {
    0%, 100% { transform: translateY(0) rotateX(0deg); }
    50% { transform: translateY(-20px) rotateX(10deg); }
    }

    @keyframes subtitleFloat {
    0%, 100% { transform: translateY(0) rotateX(0deg); }
    50% { transform: translateY(-10px) rotateX(5deg); }
    }
    
    .btn-holographic {
    position: relative;
    padding: 1.5rem 3rem;
    font-size: 1.5rem;
    border: none;
    border-radius: 50px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    color: white;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1;
    margin: 0 1rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    
    .btn-holographic.primary {
    border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .btn-holographic.secondary {
    border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .btn-holographic:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    }
    
    .btn-holographic .btn-text {
    position: relative;
    z-index: 2;
    }
    
    .btn-holographic .btn-hover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, 
        transparent, 
        rgba(255, 255, 255, 0.2), 
        transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
    }
    
    .btn-holographic:hover .btn-hover {
    transform: translateX(100%);
    }
    
    .cloud {
    position: absolute;
    background: white;
    border-radius: 50%;
    filter: blur(20px);
    opacity: 0.6;
    animation-name: floatCloud;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    }
    
    @keyframes floatCloud {
    0% { transform: translateX(0) translateZ(0); }
    100% { transform: translateX(-100vw) translateZ(0); }
    }
    
    .butterfly {
    position: absolute;
    width: 40px;
    height: 40px;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,10 C60,30 80,30 90,50 C80,70 60,70 50,90 C40,70 20,70 10,50 C20,30 40,30 50,10 Z" fill="white"/></svg>') no-repeat center;
    background-size: contain;
    animation-name: butterflyFly;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    z-index: 10;
    }
    
    @keyframes butterflyFly {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-20px) rotate(5deg); }
    50% { transform: translateY(0) rotate(0deg); }
    75% { transform: translateY(20px) rotate(-5deg); }
    }
    
    .mode-toggle {
    position: fixed;
    top: 30px;
    right: 30px;
    width: 70px;
    height: 30px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 15px;
    cursor: pointer;
    z-index: 100;
    padding: 0;
    overflow: hidden;
    transition: all 0.5s ease;
    }
    
    .toggle-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.5s ease;
    }
    
    
    .sun, .moon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: all 0.5s ease;
    }
    
    .sun {
    left: 3px;
    background: #ffcc00;
    box-shadow: 0 0 10px #ffcc00;
    }
    
    .moon {
    right: 3px;
    background: #e0e0ff;
    box-shadow: 0 0 10px #e0e0ff;
    }
    
    .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 5;
    }
    
    .footer-content {
    position: absolute;
    bottom: 10px;
    width: 100%;
    text-align: center;
    color: var(--text-color);
    font-size: 0.9rem;
    display: flex;
    justify-content: space-between;
    padding: 0 2rem;
    }
    

    .special-effect .dream-title .awakening-title {
    animation: rainbow 2s linear infinite;
    }
    
    @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
    .dream-title {
        font-size: 3.5rem;
    }
    .awakening-title {
        font-size: 2.5rem;
    }
    
    .buttons {
        flex-direction: column;
        gap: 1rem;
    }
    
    .btn-holographic {
        padding: 1rem 2rem;
        font-size: 1.2rem;
    }
    }
    </style>