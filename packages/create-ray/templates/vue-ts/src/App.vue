<template>
  <div style="padding: 2.5rem; font-family: sans-serif; text-align: center;">
    <h1>Welcome to {{projectName}} on Ray</h1>
    <HelloWorld msg="Vue 3 SFC + TypeScript on Ray" />
  </div>
</template>

<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
</script>
