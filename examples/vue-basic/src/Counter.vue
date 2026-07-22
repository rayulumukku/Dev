<template>
  <div class="counter">
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
    };
  },
  methods: {
    increment() {
      this.count++;
    },
  },
};
</script>

<style>
.counter {
  margin-top: 10px;
}
button {
  padding: 8px 16px;
  cursor: pointer;
}
</style>
