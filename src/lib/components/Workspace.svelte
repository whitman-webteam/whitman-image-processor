<script>
  import { batch } from '../batchState.svelte.js';
  import { PRESET_GROUPS, getPresetById } from '../presets.js';
  import { processSingleImage } from '../processor.js';
  import Cropper from 'svelte-easy-crop';

  let activeImage = $derived(batch.images[batch.activeIndex]);

  /** @type {{ id: string, label: string, width: number, height: number, aspect: number, type: string, minKB: number, maxKB: number }} */
  let currentPreset = $derived(
    getPresetById(activeImage?.presetId || batch.globalPreset) ||
      getPresetById('story-detail-thumb') ||
        {
          id: 'fallback',
          label: 'Fallback',
          width: 1080,
          height: 1080,
          aspect: 1,
          type: 'crop',
          minKB: 0,
          maxKB: 1000
        }
  );

  // Size Estimation State
  let estimatedKB = $state(0);
  let isEstimating = $state(false);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let debounceTimer;

  // File Naming State
  let includeDate = $state(false);
  let includeResolution = $state(true);
  const todayString = new Date().toISOString().split('T')[0];

  let indicatorColor = $derived(() => {
    if (estimatedKB === 0) return '#cbd5e1';
    if (estimatedKB > 780) return '#ef4444';
    if (estimatedKB > currentPreset.maxKB) return '#eab308';
    if (estimatedKB < currentPreset.minKB) return '#3b82f6';
    return '#22c55e';
  });

  let nativeResolution = $state('Calculating...');

  /**
   * @param {string | undefined} mimeString
   * @returns {string}
   */
  function formatMimeType(mimeString) {
    if (!mimeString) return 'Unknown';
    return mimeString.replace('image/', '').toUpperCase();
  }

  /**
   * @param {number} bytes
   * @returns {string}
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  $effect(() => {
    if (activeImage?.objectUrl) {
      nativeResolution = 'Calculating...';
      const img = new Image();
      img.onload = () => {
        nativeResolution = `${img.width} × ${img.height} px`;
      };
      img.src = activeImage.objectUrl;
    } else {
      nativeResolution = 'N/A';
    }
  });

  // Initialize properties for incoming images
  $effect(() => {
    batch.images.forEach((img) => {
      if (img.file && img.baseFilename === undefined) {
        img.baseFilename = img.file.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(/[\s_]/g, '-');
      }
      
      // Give each image its own local crop/zoom state
      if (img.crop === undefined) {
        img.crop = { x: 0, y: 0 };
      }
      if (img.zoom === undefined) {
        img.zoom = 1;
      }
    });
  });

  /**
   * @param {Event} event
   * @param {any} img
   */
  function handleFilenameInput(event, img) {
    const input = /** @type {HTMLInputElement} */ (event.target);
    const sanitized = input.value.toLowerCase().replace(/[\s_]/g, '-');
    
    if (input.value !== sanitized) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = sanitized;
      input.setSelectionRange(start, end);
    }
    
    img.baseFilename = sanitized;
  }

  /**
   * @param {any} img
   */
  function getFinalFilename(img) {
    const preset = getPresetById(img.presetId || batch.globalPreset) || { width: 1080, height: 1080 };
    let name = img.baseFilename || 'image';

    if (includeDate) {
      name = `${todayString}-${name}`;
    }
    if (includeResolution) {
      name = `${name}-${preset.width}x${preset.height}`;
    }

    const extRaw = batch.exportFormat.split('/')[1] || 'webp';
    const finalExt = extRaw === 'jpeg' ? 'jpg' : extRaw;

    return `${name}.${finalExt}`;
  }

  // FIX: Continuously sync the finished filename to the global state for the downloader to use
  $effect(() => {
    batch.images.forEach((img) => {
      img.exportFilename = getFinalFilename(img);
    });
  });

  /** @param {Event} e */
  function handlePresetChange(e) {
    const selectElement = /** @type {HTMLSelectElement} */ (e.target);
    const newPresetId = selectElement.value;
    
    batch.globalPreset = newPresetId;

    if (batch.images[batch.activeIndex]) {
      batch.images[batch.activeIndex].presetId = newPresetId;
      batch.images[batch.activeIndex].cropCoordinates = null;
      
      batch.images[batch.activeIndex].crop = { x: Number.MIN_VALUE, y: Number.MIN_VALUE };

      setTimeout(() => {
        if (batch.images[batch.activeIndex]) {
          batch.images[batch.activeIndex].crop = { x: 0, y: 0 };
          batch.images[batch.activeIndex].zoom = 1;
        }
      }, 0);
    }

    triggerEstimation();
  }

  /** @param {{ detail?: { pixels: any }, pixels?: any }} e */
  function handleCropComplete(e) {
    if (batch.images[batch.activeIndex]) {
      const pixels = e.detail?.pixels || e.pixels;
      batch.images[batch.activeIndex].cropCoordinates = pixels;
      triggerEstimation();
    }
  }

  $effect(() => {
    activeImage?.cropCoordinates;
    currentPreset;
    batch.exportFormat;
    batch.exportQuality;
    triggerEstimation();
  });

  function triggerEstimation() {
    clearTimeout(debounceTimer);
    isEstimating = true;

    debounceTimer = setTimeout(async () => {
      if (!activeImage) return;

      const blob = await processSingleImage(
        activeImage,
        currentPreset,
        batch.exportFormat,
        batch.exportQuality
      );

      if (blob) {
        estimatedKB = parseFloat((blob.size / 1024).toFixed(2));
      }
      isEstimating = false;
    }, 500);
  }

  function applyPresetToAll() {
    if (!activeImage) return;
    const targetPreset = activeImage.presetId;

    batch.globalPreset = targetPreset;
    batch.images.forEach((img) => (img.presetId = targetPreset));

    triggerEstimation();
  }

  /**
   * @param {number} index
   * @param {Event} event
   */
  function removeImage(index, event) {
    event.stopPropagation();

    const removedImg = batch.images[index];
    if (removedImg?.objectUrl) {
      URL.revokeObjectURL(removedImg.objectUrl);
    }

    batch.images.splice(index, 1);

    if (batch.images.length === 0) {
      batch.activeIndex = 0; 
    } else if (batch.activeIndex === index) {
      batch.activeIndex = Math.max(0, index - 1);
      triggerEstimation();
    } else if (batch.activeIndex > index) {
      batch.activeIndex--;
    }
  }
</script>

<div class="workspace">
  <aside class="sidebar">
    <div class="queue-header">
      <h3>Queue ({batch.images.length})</h3>
    </div>
    <div class="thumbnail-list">
      {#each batch.images as img, i}
        <div
          class="thumb-card {i === batch.activeIndex ? 'active' : ''}"
          onclick={() => (batch.activeIndex = i)}
        >
          <img src={img.objectUrl} alt="Thumbnail {i}" />
          <span class="badge">{i + 1}</span>
          
          <button 
            class="delete-btn" 
            onclick={(e) => removeImage(i, e)} 
            aria-label="Remove image from queue"
            title="Remove Image"
          >
            &times;
          </button>
        </div>
      {/each}
    </div>

    {#if activeImage}
      <section class="image-info-panel">
        <h4 class="panel-title">Original File Info</h4>
        <ul class="info-list">
          <li>
            <span class="label">Type:</span> 
            <span class="value">{formatMimeType(activeImage.file?.type)}</span>
          </li>
          <li>
            <span class="label">Size:</span> 
            <span class="value">{formatBytes(activeImage.file?.size ?? 0)}</span>
          </li>
          <li>
            <span class="label">Dimensions:</span> 
            <span class="value">{nativeResolution}</span>
          </li>
        </ul>
      </section>
    {/if}
  </aside>

  <main class="editor">
    <header class="toolbar">
      <div class="control-group">
        <label for="preset">CMS Target:</label>
        <div class="flex-row">
          <select id="preset" value={currentPreset?.id} onchange={handlePresetChange}>
            {#each Object.entries(PRESET_GROUPS) as [groupName, presets]}
              <optgroup label={groupName}>
                {#each presets as preset}
                  <option value={preset.id}>{preset.label} ({preset.width}x{preset.height})</option>
                {/each}
              </optgroup>
            {/each}
          </select>
          <button class="apply-all-btn" onclick={applyPresetToAll} title="Apply this preset to all images in the queue">
            Apply to All
          </button>
        </div>
      </div>

      <div class="control-group">
        <label for="format">Format:</label>
        <select id="format" bind:value={batch.exportFormat} onchange={triggerEstimation}>
          <option value="image/webp">WebP (Recommended)</option>
          <option value="image/jpeg">JPG</option>
          <option value="image/png">PNG</option>
        </select>
      </div>

      <div class="control-group">
        <label for="quality">Quality: {Math.round(batch.exportQuality * 100)}%</label>
        <input
          id="quality"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          bind:value={batch.exportQuality}
          oninput={triggerEstimation}
        />
      </div>

      <div class="control-group">
        <label for="zoom">Zoom:</label>
        {#if activeImage?.zoom !== undefined}
          <input id="zoom" type="range" min="1" max="3" step="0.1" bind:value={activeImage.zoom} />
        {:else}
          <input id="zoom" type="range" min="1" max="3" step="0.1" value="1" disabled />
        {/if}
      </div>
    </header>

    <div class="indicator-bar">
      <div class="indicator-pill" style="background-color: {indicatorColor()}">
        {isEstimating ? 'Estimating...' : `${estimatedKB} KB`}
      </div>
      <span class="indicator-text">
        Optimal: {currentPreset?.minKB}-{currentPreset?.maxKB} KB | CMS Max: 780 KB
      </span>
    </div>

    <div class="canvas-container">
      {#if activeImage?.crop}
        <Cropper
          image={activeImage.objectUrl}
          bind:crop={activeImage.crop}
          bind:zoom={activeImage.zoom}
          aspect={currentPreset?.aspect}
          oncropcomplete={handleCropComplete}
        />
      {/if}
    </div>

    <div class="naming-pane">
      <header class="naming-header">
        <h4>Batch File Renaming</h4>
        <div class="naming-toggles">
          <label class="toggle-label">
            <input type="checkbox" bind:checked={includeDate} />
            Prepend Date
          </label>
          <label class="toggle-label">
            <input type="checkbox" bind:checked={includeResolution} />
            Append Resolution
          </label>
        </div>
      </header>
      
      <div class="naming-list">
        <table class="naming-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Base Filename (Editable)</th>
              <th>Final Output Preview</th>
            </tr>
          </thead>
          <tbody>
            {#each batch.images as img, i}
              <tr class={i === batch.activeIndex ? 'active-row' : ''}>
                <td class="col-index">{i + 1}</td>
                <td class="col-input">
                  <input 
                    type="text" 
                    value={img.baseFilename || ''} 
                    oninput={(e) => handleFilenameInput(e, img)}
                    placeholder="filename"
                    class="filename-input"
                  />
                </td>
                <td class="col-preview">
                  {getFinalFilename(img)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<style>
  .workspace {
    display: flex;
    height: 85vh;
    min-height: 700px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .sidebar {
    width: 280px;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
  }
  .queue-header {
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
  }
  .queue-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #0f172a;
  }
  .thumbnail-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-content: start;
  }
  .thumb-card {
    position: relative;
    aspect-ratio: 1;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: #e2e8f0;
  }
  .thumb-card.active {
    border-color: #6366f1;
  }
  .thumb-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .badge {
    position: absolute;
    top: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
  }
  .delete-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.8;
    transition: all 0.2s;
    padding: 0;
    padding-bottom: 2px;
  }
  .delete-btn:hover {
    background: #ef4444;
    opacity: 1;
    transform: scale(1.1);
  }

  .image-info-panel {
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 16px;
    font-size: 0.815rem;
  }
  .panel-title {
    margin: 0 0 12px 0;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }
  .info-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .info-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .info-list .label {
    color: #475569;
    font-weight: 500;
  }
  .info-list .value {
    color: #0f172a;
    font-family: monospace;
    font-weight: 600;
    background: #f8fafc;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  .editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .toolbar {
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    gap: 24px;
    background: white;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .control-group label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
  }
  .flex-row {
    display: flex;
    gap: 8px;
  }
  select,
  input[type='range'] {
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    font-size: 0.875rem;
    background-color: white;
  }
  
  .apply-all-btn {
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background-color: #f8fafc;
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
  }
  .apply-all-btn:hover {
    background-color: #e2e8f0;
    color: #0f172a;
  }

  .indicator-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  .indicator-pill {
    padding: 4px 12px;
    border-radius: 99px;
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    transition: background-color 0.3s;
    min-width: 80px;
    text-align: center;
  }
  .indicator-text {
    font-size: 0.75rem;
    color: #64748b;
  }

  .canvas-container {
    flex: 1;
    position: relative;
    background: #1e293b;
    min-height: 250px;
  }

  .naming-pane {
    height: 220px;
    flex-shrink: 0;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
  }
  .naming-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    background: white;
  }
  .naming-header h4 {
    margin: 0;
    font-size: 0.875rem;
    color: #0f172a;
  }
  .naming-toggles {
    display: flex;
    gap: 16px;
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.815rem;
    color: #475569;
    cursor: pointer;
  }
  .naming-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }
  .naming-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.815rem;
    text-align: left;
  }
  .naming-table th {
    position: sticky;
    top: 0;
    background: #f1f5f9;
    padding: 8px 16px;
    color: #475569;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
    z-index: 10;
  }
  .naming-table td {
    padding: 8px 16px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }
  .active-row td {
    background-color: #eef2ff;
  }
  .col-index {
    width: 40px;
    color: #64748b;
    font-weight: 500;
  }
  .col-input {
    width: 40%;
  }
  .filename-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.815rem;
    color: #0f172a;
  }
  .filename-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 1px #6366f1;
  }
  .col-preview {
    font-family: monospace;
    color: #16a34a;
    font-weight: 500;
  }
</style>