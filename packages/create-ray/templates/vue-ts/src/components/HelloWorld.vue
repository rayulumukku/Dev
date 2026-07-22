<template>
  <div class="hello">
    <p>{{ msg }}</p>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  msg: string;
}>();

const count = ref(0);
</script>

<style scoped>
.hello {
  margin-top: 1rem;
}
button {
  background-color: #42b883;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
