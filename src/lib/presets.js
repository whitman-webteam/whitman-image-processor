// src/lib/presets.js

export const PRESET_GROUPS = {
  "Story Detail": [
    { id: 'story-detail-thumb', label: 'Thumbnail', width: 750, height: 600, aspect: 750 / 600, type: 'fixed', minKB: 100, maxKB: 300 }
  ],
  "Image Gallery": [
    { id: 'gallery-50-50', label: '50/50 Layout', width: 560, height: 500, aspect: 560 / 500, type: 'fixed', minKB: 80, maxKB: 250 },
    { id: 'gallery-30-60-large', label: '30/60 Layout (Large)', width: 758, height: 500, aspect: 758 / 500, type: 'fixed', minKB: 120, maxKB: 350 },
    { id: 'gallery-30-60-small', label: '30/60 Layout (Small)', width: 363, height: 500, aspect: 363 / 500, type: 'fixed', minKB: 60, maxKB: 200 },
    { id: 'gallery-single', label: 'Single-Large', width: 1152, height: 500, aspect: 1152 / 500, type: 'fixed', minKB: 200, maxKB: 500 }
  ],
  "Profile Detail": [
    { id: 'profile-detail-thumb', label: 'Thumbnail', width: 600, height: 600, aspect: 600/600, type: 'fixed', minKB: 75, maxKB: 200}
  ]
};

/** @param {string} id */
export function getPresetById(id) {
  for (const group of Object.values(PRESET_GROUPS)) {
    const found = group.find(preset => preset.id === id);
    if (found) return found;
  }
  return null;
}