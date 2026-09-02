import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
		compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',// Important for routing on GitHub Pages
      precompress: false,
      strict: true
    }),
    // Tell SvelteKit to use your repository name as the base path in production
    paths: {
      base: process.argv.includes('dev') ? '' : '/whitman-image-processor'
    }
  }
};

export default config;