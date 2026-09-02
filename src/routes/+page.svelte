<script>
  import Dropzone from '$lib/components/Dropzone.svelte';
  import Workspace from '$lib/components/Workspace.svelte';
  import { batch, clearBatch } from '$lib/batchState.svelte.js';
  import { downloadBatchZip } from '$lib/processor.js';
  import { getPresetById } from '$lib/presets.js';

  let isProcessing = $state(false);

  async function handleProcess() {
      isProcessing = true;
      // Rearranged arguments to match: (images, format, quality, getPresetById)
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
    <h1>CMS Image Processor</h1>
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
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background-color: #f1f5f9;
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
    background: #6366f1;
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-primary:hover {
    background: #4f46e5;
  }
</style>