import { SvelteComponent } from 'svelte';

declare module 'svelte-easy-crop' {
  export default class Cropper extends SvelteComponent<{
    image: string;
    crop: { x: number; y: number };
    zoom: number;
    aspect?: number;
    // ... add any other props you use
    [key: string]: any; // This loose index signature allows on:cropcomplete
  }> {}
}