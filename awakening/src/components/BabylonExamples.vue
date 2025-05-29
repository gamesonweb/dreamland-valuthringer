<template>
  <canvas ref="gameCanvas"></canvas>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BasicScene } from '../BabylonExamples/BasicScene'; // adapte si le chemin change

export default defineComponent({
  name: 'BabylonExamples',
  mounted() {
    const canvas = this.$refs.gameCanvas as HTMLCanvasElement;
    const game = new BasicScene(canvas);

    game.loadKaykitAssets().then(() => {
      game.assetPack = "kaykit-variety";
      game.generateDropperLayers(25, -10, 10, 5, 25, 20, 40, 5, 10);
    });
  }
});
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
