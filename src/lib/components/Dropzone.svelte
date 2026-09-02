<script>
  import { addFiles } from '../batchState.svelte.js';

  let isDragging = $state(false);
  /** @type {HTMLInputElement} */
  let fileInput;

  /** @param {DragEvent} e */
  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  /** @param {DragEvent} e */
  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    
    // The ?. will safely evaluate to undefined instead of crashing if dataTransfer is null
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  }

  /** @param {Event} e */
  function handleFileSelect(e) {
    // Cast e.target to an HTMLInputElement
    const target = /** @type {HTMLInputElement | null} */ (e.target);
    
    // Check if target and its files exist
    if (target && target.files) {
      addFiles(target.files);
    }
  }
</script>

<div
  class="dropzone {isDragging ? 'dragging' : ''}"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={() => fileInput.click()}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
>
  <input
    bind:this={fileInput}
    type="file"
    multiple
    accept="image/*"
    onchange={handleFileSelect}
    style="display: none;"
  />
  
  <div class="upload-icon">📁</div>
  <p>Drag & drop up to 100 images here, or <strong>browse</strong></p>
  <span class="subtext">Supports PNG, JPG, WebP</span>
</div>

<style>
  .dropzone {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    user-select: none;
  }
  .dropzone:hover, .dropzone.dragging {
    border-color: #6366f1;
    background: #eef2ff;
  }
  .upload-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  .subtext {
    font-size: 0.85rem;
    color: #64748b;
    display: block;
    margin-top: 4px;
  }
</style>