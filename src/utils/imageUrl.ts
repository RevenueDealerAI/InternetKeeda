export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  const normalized = url.trim();

  if (!normalized) {
    return '';
  }

  if (normalized.includes('drive.google.com')) {
    const fileMatch = normalized.match(/\/file\/d\/([^/]+)\//);
    if (fileMatch && fileMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
    }

    const idParamMatch = normalized.match(/[?&]id=([^&]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idParamMatch[1]}`;
    }
  }

  if (normalized.includes('dropbox.com')) {
    return normalized.replace('dl=0', 'raw=1');
  }

  if (normalized.startsWith('www.')) {
    return `https://${normalized}`;
  }

  return normalized;
}




