import './app.css';
import './lib/hook-fetch';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app'),
});

export default app;
