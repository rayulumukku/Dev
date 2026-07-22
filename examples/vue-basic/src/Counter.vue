<template>
  <div class="counter-card">
    <h3>{{ title }}</h3>
    <p>Count: {{ count }} (Double: {{ doubleCount }})</p>
    <div class="actions">
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useCounter } from './useCounter';

const props = defineProps({
  title: {
    type: String,
    default: 'Interactive Counter',
  },
});

const emit = defineEmits(['change']);

const { count, doubleCount, increment, decrement } = useCounter(0);
</script>

<style>
.counter-card {
  border: 1px solid #ccc;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
}
.actions button {
  margin-right: 8px;
  padding: 6px 12px;
}
</style>
