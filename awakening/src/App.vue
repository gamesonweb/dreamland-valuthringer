<template>
  <div id="app">
    <audio ref="backgroundMusic" loop></audio>
    <audio ref="harpSound" @ended="restoreMusicVolume"></audio>
    <audio ref="clickSound"></audio>
    <WelcomeScreen v-if="currentScreen === 'welcome'" @start-game="startGame" />
    <GameScreen v-else-if="currentScreen === 'game'" @open-menu="openMenu" />
    <GameMenu v-else-if="currentScreen === 'menu'" 
              @resume-game="resumeGame" 
              @quit-game="quitGame"
              :volume="volume"
              @update-volume="updateVolume"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WelcomeScreen from './components/WelcomeScreen.vue';
import GameScreen from './components/GameScreen.vue';
import GameMenu from './components/GameMenu.vue';

export default defineComponent({
  name: 'App',
  components: {
    WelcomeScreen,
    GameScreen,
    GameMenu
  },
  data() {
    return {
      currentScreen: 'welcome' as 'welcome' | 'game' | 'menu',
      volume: 0.5,
      originalVolume: 0.5,
      audioContext: null as AudioContext | null,
      volumeRestoreInterval: null as number | null
    };
  },
  mounted() {
    this.initAudio();
  },
  methods: {
    initAudio() {
      const bgMusic = this.$refs.backgroundMusic as HTMLAudioElement;
      bgMusic.src = require('@/assets/audio/music_background.mp3');
      bgMusic.volume = this.volume;
      this.originalVolume = this.volume;

      const harpSound = this.$refs.harpSound as HTMLAudioElement;
      harpSound.src = require('@/assets/audio/harpe_launch.mp3');

      const clickSound = this.$refs.clickSound as HTMLAudioElement;
      clickSound.src = require('@/assets/audio/clic.mp3');

      const handleFirstInteraction = () => {
        bgMusic.play().catch(e => console.log("Lecture audio:", e));
        window.removeEventListener('click', handleFirstInteraction);
      };
      
      window.addEventListener('click', handleFirstInteraction);
    },
    async playClickSound() {
      const clickSound = this.$refs.clickSound as HTMLAudioElement;
      const bgMusic = this.$refs.backgroundMusic as HTMLAudioElement;
      
      //réduit le son légerement
      const originalVol = bgMusic.volume;
      bgMusic.volume = originalVol * 0.7;
      
      //au clic, on lance le son CLIC
      clickSound.currentTime = 0;
      await clickSound.play().catch(e => console.log("Erreur son clic:", e));
      
      // restaure le volume après 200ms
      setTimeout(() => {
        bgMusic.volume = originalVol;
      }, 200);
    },
    async startGame() {
      const bgMusic = this.$refs.backgroundMusic as HTMLAudioElement;
      const harpSound = this.$refs.harpSound as HTMLAudioElement;
      
      // fondu sortant musique
      await this.fadeAudio(bgMusic, this.volume, 0.2, 300);
      
      // JOUER HARPE
      harpSound.currentTime = 0;
      await harpSound.play().catch(e => console.log("Erreur son harpe:", e));
      
      this.currentScreen = 'game';
    },
    async openMenu() {
      await this.playClickSound();
      this.currentScreen = 'menu';
    },
    async resumeGame() {
      await this.playClickSound();
      this.currentScreen = 'game';
    },
    async quitGame() {
      await this.playClickSound();
      this.currentScreen = 'welcome';
    },
    fadeAudio(
      element: HTMLAudioElement, 
      startVolume: number, 
      endVolume: number, 
      duration: number
    ): Promise<void> {
      return new Promise(resolve => {
        if (this.volumeRestoreInterval) {
          clearInterval(this.volumeRestoreInterval);
        }
        
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          element.volume = startVolume + (endVolume - startVolume) * progress;
          
          if (progress === 1) {
            clearInterval(interval);
            resolve();
          }
        }, 30);
      });
    },
    restoreMusicVolume() {
      const bgMusic = this.$refs.backgroundMusic as HTMLAudioElement;
      this.fadeAudio(bgMusic, 0.2, this.originalVolume, 1000);
    },
    updateVolume(newVolume: number) {
      this.volume = newVolume;
      this.originalVolume = newVolume;
      const audioElement = this.$refs.backgroundMusic as HTMLAudioElement;
      audioElement.volume = this.volume;
    }
  },
  beforeUnmount() {
    if (this.volumeRestoreInterval) {
      clearInterval(this.volumeRestoreInterval);
    }
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Cache les éléments audio */
audio {
  display: none;
}
</style>