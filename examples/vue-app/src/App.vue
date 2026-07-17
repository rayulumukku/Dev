<template>
  <div>
    <h1>Hello Ray + Vue!</h1>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>
<script>
export default {
  data() {
    return { count: 0 };
  }
};
</script>
