import { defineConfig, loadEnv} from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => {
  const { VITE_BASE } = loadEnv(mode, process.cwd(), '');

  return {
    base: VITE_BASE + '/',
    plugins: [svelte()],
  };
});
