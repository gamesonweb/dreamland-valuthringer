<template>
    <div class="menu-overlay" @click.self="resumeGame">
      <div class="menu-content" :class="{ 'menu-enter': showMenu, 'menu-exit': !showMenu }">
        <div class="menu-header">
          <h2 class="menu-title">Escape the Dream</h2>
          <div class="menu-subtitle">Menu Principal</div>
        </div>
  
        <div class="menu-items">
          <button class="menu-item" @click="resumeGame">
            <span class="item-icon">▶</span>
            <span class="item-text">Reprendre</span>
          </button>
          
          <div class="volume-control menu-item">
          <span class="item-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            @input="updateVolume($event)"
            class="volume-slider"
          >
          <span class="volume-percent">{{ Math.round(volume * 100) }}%</span>
          </div>
        
          <button class="menu-item" @click="openControls">
            <span class="item-icon">🎮</span>
            <span class="item-text">Contrôles</span>
          </button>
          
          <button class="menu-item" @click="quitGame">
            <span class="item-icon">🚪</span>
            <span class="item-text">Quitter</span>
          </button>
        </div>
  
        <div class="menu-footer">
          <div class="version-info">Version 1.0.0</div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  
  export default defineComponent({
    name: 'GameMenu',
    props: {
        volume: {
        type: Number,
        required: true,
        default: 0.5
        }
    },
    emits: ['resume-game', 'quit-game', 'update-volume'],
    setup(_, { emit }) {
      const showMenu = ref(true);
  
      const resumeGame = () => {
        showMenu.value = false;
        setTimeout(() => emit('resume-game'), 300);
      };
  
      const quitGame = () => {
        showMenu.value = false;
        setTimeout(() => emit('quit-game'), 300);
      };
  
  
      const openControls = () => {
        console.log('Ouverture des contrôles');
        //todo
      };

      const updateVolume = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit('update-volume', parseFloat(target.value));
    };

    return {
      showMenu,
      resumeGame,
      quitGame,
      openControls,
      updateVolume
    };

    }
  });
  </script>
  
  <style scoped>
  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(5px);
    transition: backdrop-filter 0.3s ease;
  }
  
  .menu-content {
    background: linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98));
    border-radius: 16px;
    padding: 2rem;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateY(0);
    opacity: 1;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .menu-enter {
    animation: menuEnter 0.3s forwards;
  }
  
  .menu-exit {
    animation: menuExit 0.3s forwards;
  }
  
  @keyframes menuEnter {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes menuExit {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(20px);
    }
  }
  
  .menu-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .menu-title {
    font-family: 'Montserrat', sans-serif;
    color: #fff;
    font-size: 2.5rem;
    margin: 0;
    text-shadow: 0 0 10px rgba(110, 142, 251, 0.7);
    letter-spacing: 2px;
  }
  
  .menu-subtitle {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  
  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .menu-item:hover {
    background: rgba(110, 142, 251, 0.2);
    transform: translateX(5px);
  }
  
  .menu-item:active {
    transform: translateX(5px) scale(0.98);
  }
  
  .item-icon {
    margin-right: 1rem;
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
  }
  
  .item-text {
    flex-grow: 1;
  }
  
  .menu-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
  }
  
  .version-info {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
  }
  
  .menu-item:last-child:hover {
    background: rgba(255, 90, 90, 0.2);
  }
  
  /* Responsive */
  @media (max-width: 500px) {
    .menu-content {
      padding: 1.5rem;
      width: 95%;
    }
    
    .menu-title {
      font-size: 2rem;
    }
  }
  </style>