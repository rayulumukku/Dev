<template>
  <div class="flex flex-col items-center justify-between p-4 bg-slate-900 text-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold">Vue 3 + Tailwind CSS on Ray</h1>
    <button @click="count++" class="px-4 py-2 bg-sky-500 text-white rounded mt-4">
      Count: {{ count }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import './index.css';

const count = ref(0);
</script>
