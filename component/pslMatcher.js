// Fuzzy matcher: finds the best sign name in the PSL library for a spoken phrase.
// Tries exact → substring → word subset → word overlap before giving up.
// Accepts `keys` as an array of sign-label strings (matches psl_index.json shape).

export function findBestMatch(spoken, keys) {
  const normalized = spoken.toLowerCase().trim();

  if (keys.includes(normalized)) return normalized;

  const containsMatch = keys.find(k => normalized.includes(k));
  if (containsMatch) return containsMatch;

  const words = normalized.split(/\s+/);
  const allWordsMatch = keys.find(k => words.every(w => k.includes(w)));
  if (allWordsMatch) return allWordsMatch;

  let bestKey = null;
  let bestScore = 0;
  keys.forEach(k => {
    const kWords = k.split(/\s+/);
    const overlap = words.filter(w =>
      kWords.some(kw => kw.includes(w) || w.includes(kw)),
    ).length;
    const score = overlap / Math.max(words.length, kWords.length);
    if (score > bestScore) {
      bestScore = score;
      bestKey = k;
    }
  });

  return bestScore > 0.4 ? bestKey : null;
}