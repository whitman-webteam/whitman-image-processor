<script>
  import Dropzone from '$lib/components/Dropzone.svelte';
  import Workspace from '$lib/components/Workspace.svelte';
  import { batch, clearBatch } from '$lib/batchState.svelte.js';
  import { downloadBatchZip } from '$lib/processor.js';
  import { getPresetById } from '$lib/presets.js';
  
  import { resolve } from '$app/paths';

  let isProcessing = $state(false);

  async function handleProcess() {
      isProcessing = true;
      await downloadBatchZip(
        batch.images, 
        batch.exportFormat, 
        batch.exportQuality, 
        getPresetById
      );
      isProcessing = false;
    }
</script>

<main class="container">
  <header class="app-header">
    <div class="brand-title">
      <!-- Added a wrapper box for contrast -->
      <div class="logo-box">
        <img src={resolve('/whitman-college.svg')} alt="Whitman College" class="header-logo" />
      </div>
      <h1>CMS Image Processor</h1>
    </div>
    
    {#if batch.images.length > 0}
      <div class="actions">
        <button onclick={clearBatch} class="btn-clear" disabled={isProcessing}>Start Over</button>
        <button onclick={handleProcess} class="btn-primary" disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Process & Download'}
        </button>
      </div>
    {/if}
  </header>

  {#if batch.images.length === 0}
    <Dropzone />
  {:else}
    <Workspace />
  {/if}
</main>

<style>
  /* Import Whitman's brand fonts from Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Montserrat:wght@400;500;600;700&display=swap');

  :global(body) {
    margin: 0;
    /* Apply Montserrat (Vito alternative) to the main body */
    font-family: 'Montserrat', Calibri, system-ui, -apple-system, sans-serif;
    background-color: #f1f5f9;
  }
  
  /* Apply Lora to all headings */
  :global(h1, h2, h3, h4, h5, h6) {
    font-family: 'Lora', Georgia, serif;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .brand-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .logo-box {
    background-color: #002868; /* Whitman Blue */
    padding: 8px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-logo {
    height: 20px; 
    width: auto;
    display: block;
  }
  
  h1 {
    color: #0f172a;
    margin: 0;
  }
  .actions {
    display: flex;
    gap: 12px;
  }
  .btn-clear {
    background: white;
    color: #ef4444;
    border: 1px solid #fca5a5;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-primary {
    background: #002868; /* Updated button to Whitman Blue to match logo box */
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-primary:hover {
    background: #010E30; /* Whitman Navy for hover state */
  }
</style>