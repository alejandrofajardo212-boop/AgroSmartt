export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

function tokenSimilarity(queryToken, candidate) {
  if (candidate === queryToken) return 1;
  if (candidate.includes(queryToken)) return 0.9;
  if (queryToken.includes(candidate)) return 0.85;
  return 1 - editDistance(queryToken, candidate) / Math.max(queryToken.length, candidate.length);
}

export function scoreSearchMatch(query, values) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return 0;

  const text = normalizeSearchText(values.join(' '));
  if (text.includes(normalizedQuery)) return text.startsWith(normalizedQuery) ? 1.2 : 1.1;

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const candidates = text.split(/\s+/).filter((token) => token.length >= 2);
  let score = 0;

  for (const token of queryTokens) {
    if (token.length < 3) {
      if (!candidates.includes(token)) return 0;
      score += 1;
      continue;
    }

    const best = Math.max(0, ...candidates.map((candidate) => tokenSimilarity(token, candidate)));
    if (best < 0.68) return 0;
    score += best;
  }

  return score / queryTokens.length;
}
