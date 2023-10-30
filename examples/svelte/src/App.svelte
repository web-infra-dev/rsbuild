<script lang="ts">
  import Footer from './Footer.svelte';
  export let name: string;
  export let count: number = 0;
</script>

<main>
  <h1>Hello {name}!</h1>
  <div>
    <button
      on:click={() => {
        count += 1;
      }}>{count}</button
    >
  </div>
  <Footer />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }
</style>
