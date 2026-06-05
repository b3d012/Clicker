import '../styles.css';
import SveltePlayground from './svelte-playground.svelte';

new SveltePlayground({
  target: document.querySelector('#app') as HTMLElement,
});
