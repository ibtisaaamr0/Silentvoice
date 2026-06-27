// Central registry for all avatar models.
// require() calls must be static strings — Metro resolves them at bundle time.

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

export const MODEL_REQUIRES = {
  classic: require('../assets/models/avatar_model.glb'),
  old: require('../assets/models/old-modal.glb'),
  kid: require('../assets/models/kid-model.glb'),
  women: require('../assets/models/women-modal.glb'),
};

export const ANDROID_ASSET_URIS = {
  classic: 'file:///android_asset/avatar_model.glb',
  old: 'file:///android_asset/old-modal.glb',
  kid: 'file:///android_asset/kid-model.glb',
  women: 'file:///android_asset/women-modal.glb',
};

export const METRO_FALLBACK_URIS = {
  classic: 'http://10.0.2.2:8081/assets/assets/models/avatar_model.glb',
  old: 'http://10.0.2.2:8081/assets/assets/models/old-modal.glb',
  kid: 'http://10.0.2.2:8081/assets/assets/models/kid-model.glb',
  women: 'http://10.0.2.2:8081/assets/assets/models/women-modal.glb',
};
