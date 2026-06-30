// Central registry for all avatar models.
// Models live in android/app/src/main/assets/models/ and are loaded directly
// by the WebView via the file:///android_asset/ scheme — no Metro/network fetch needed.

export const AVATARS = [
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Where it all began',
    icon: 'user',
    gradientColors: ['#4F46E5', '#7C3AED'],
  },
  {
    id: 'old',
    name: 'Legacy',
    tagline: 'Refined & distinguished',
    icon: 'user-tie',
    gradientColors: ['#D97706', '#DC2626'],
  },
  {
    id: 'kid',
    name: 'Spark',
    tagline: 'Young & expressive',
    icon: 'child',
    gradientColors: ['#059669', '#0284C7'],
  },
  {
    id: 'women',
    name: 'Luna',
    tagline: 'Graceful & precise',
    icon: 'user-circle',
    gradientColors: ['#DB2777', '#7C3AED'],
  },
];

// file:///android_asset/ is the correct, WebView-resolvable scheme for reading
// files bundled under android/app/src/main/assets/. This is the ONLY uri used now —
// no Metro fallback, no network fetch, so loading is fast and works offline.
export const ANDROID_ASSET_URIS = {
  classic: 'file:///android_asset/models/avatar_model.glb',
  old: 'file:///android_asset/models/old-modal.glb',
  kid: 'file:///android_asset/models/kid-model.glb',
  women: 'file:///android_asset/models/women-modal.glb',
};