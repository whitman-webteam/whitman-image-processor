// src/lib/batchState.svelte.js
export const batch = $state({
  // Tell TypeScript this array is allowed to hold any object, not "never"
  /** @type {any[]} */
  images: [],
  globalPreset: 'story-detail-thumb', // Updated default ID
  mode: 'bulk', // 'bulk' | 'individual'
  activeIndex: 0,
  exportFormat: 'image/webp', // Default format
  exportQuality: 0.8          // Default quality
});

/** @param {FileList | File[]} fileList */
export function addFiles(fileList) {
  const MAX_FILES = 100;
  const currentCount = batch.images.length;
  const remainingSlots = MAX_FILES - currentCount;

  if (remainingSlots <= 0) {
    alert("Maximum limit of 100 images reached.");
    return;
  }

  const acceptedFiles = Array.from(fileList)
    .filter(file => file.type.startsWith('image/'))
    .slice(0, remainingSlots);

  acceptedFiles.forEach(file => {
    batch.images.push({
      id: crypto.randomUUID(),
      file: file,
      objectUrl: URL.createObjectURL(file),
      presetId: batch.globalPreset,
      customWidth: null,
      customHeight: null,
      cropCoordinates: null
    });
  });
}

export function clearBatch() {
  // Free up browser memory before clearing the array
  batch.images.forEach(img => URL.revokeObjectURL(img.objectUrl));
  batch.images = [];
}