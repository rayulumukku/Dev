<script>
  let count = 0;
  function increment() {
    count += 1;
  }
</script>

<main>
  <h1>Svelte Basic App with Ray</h1>
  <button on:click={increment}>Count: {count}</button>
</main>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
    padding: 2rem;
  }
  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
