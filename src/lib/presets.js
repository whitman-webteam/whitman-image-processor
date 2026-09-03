// src/lib/presets.js

export const PRESET_GROUPS = {
  "Story Detail": [
    { id: 'story-detail-thumb', label: 'Thumbnail', width: 750, height: 600, aspect: 750 / 600, type: 'fixed', minKB: 50, maxKB: 200 },
    { id: 'story-detail-featured-image', label: 'Featured Image', width: 1152, height: 648, aspect: 1152/648, minKB: 100, maxKB: 300}
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

/** @type {Record<string, {w: number, h: number}[]>} */
export const COMMON_RATIOS = {
  '16:9': [{ w: 1920, h: 1080 }, { w: 1280, h: 720 }, { w: 1152, h: 648 }, { w: 854, h: 480 }],
  '4:3': [{ w: 1600, h: 1200 }, { w: 1024, h: 768 }, { w: 800, h: 600 }],
  '1:1': [{ w: 800, h: 800 }, { w: 600, h: 600 }],
  '3:2': [{ w: 1800, h: 1200 }, { w: 1080, h: 720 }],
  '2:3': [{ w: 1200, h: 1800 }, { w: 720, h: 1080 }],
};

/** @param {string} id */
export function getPresetById(id) {
  for (const group of Object.values(PRESET_GROUPS)) {
    const found = group.find(preset => preset.id === id);
    if (found) return found;
  }
  return null;
}