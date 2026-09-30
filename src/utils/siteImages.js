/**
 * siteImages.js - High-Quality Open Nature Reserve Imagery ($0 Cost)
 * 
 * Provides verified open-access nature photos for Israeli parks and reserves,
 * with category fallbacks and graceful error handling.
 */

export const SITE_IMAGES = {
  // Flagship Reserves & Parks
  101: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80', // תל דן
  102: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80', // מצדה
  103: 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=800&q=80', // עין גדי
  104: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // קיסריה
  105: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', // בית גוברין
  106: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', // ציפורי
  107: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', // נחל שניר
  108: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80', // מכתש רמון
  109: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // אפולוניה
  110: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', // הכרמל
};

export const CATEGORY_FALLBACK_IMAGES = {
  water: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
  desert: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
  forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  coast: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  safe_haven: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
};

/**
 * Get image URL for a given asset with reliable fallback
 * @param {object} asset
 * @returns {string}
 */
export function getSiteImageUrl(asset) {
  if (!asset) return CATEGORY_FALLBACK_IMAGES.default;

  // Direct ID match
  if (asset.id && SITE_IMAGES[asset.id]) {
    return SITE_IMAGES[asset.id];
  }

  // Name keyword heuristics
  const name = (asset.name || '').toLowerCase();
  if (name.includes('דן')) return SITE_IMAGES[101];
  if (name.includes('מצדה')) return SITE_IMAGES[102];
  if (name.includes('עין גדי') || name.includes('ערוגות')) return SITE_IMAGES[103];
  if (name.includes('קיסריה') || name.includes('דור')) return SITE_IMAGES[104];
  if (name.includes('גוברין') || name.includes('מערות')) return SITE_IMAGES[105];
  if (name.includes('שניר') || name.includes('חצבני') || name.includes('בניאס')) return SITE_IMAGES[107];
  if (name.includes('רמון') || name.includes('מכתש') || name.includes('סהרונים')) return SITE_IMAGES[108];
  if (name.includes('אפולוניה') || name.includes('חוף')) return SITE_IMAGES[109];
  if (name.includes('כרמל') || name.includes('מירון') || name.includes('יער')) return SITE_IMAGES[110];

  // Category fallback
  const cat = asset.category || (asset.type?.includes('מים') ? 'water' : 'forest');
  return CATEGORY_FALLBACK_IMAGES[cat] || CATEGORY_FALLBACK_IMAGES.default;
}
