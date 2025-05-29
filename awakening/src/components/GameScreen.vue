<template>
    <div class="game-container">
      <button class="menu-button" @click="openMenu">Menu</button>
      <BabylonExamples ref="babylonComponent" />
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import BabylonExamples from './BabylonExamples.vue';
  
  export default defineComponent({
    name: 'GameScreen',
    components: {
      BabylonExamples
    },
    emits: ['open-menu'],
    methods: {
      openMenu() {
        this.$emit('open-menu');
      }
    }
  });
  </script>
  
  <style scoped>
  .game-container {
    position: relative;
    width: 100%;
    height: 100vh;
  }
  
  .menu-button {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 0.5rem 1rem;
    background-color: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
  }
  
  .menu-button:hover {
    background-color: white;
  }
  </style>