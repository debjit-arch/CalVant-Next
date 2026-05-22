const BASE_URL = process.env.NEXT_PUBLIC_CFTB || 'https://api.calvant.com';

const normalizePath = (path) => {
  if (!path) return '/';
  return path.toLowerCase().trim().replace(/\/$/, '') || '/';
};

export async function getPageMetadata(path, fallback = {}) {
  try {
    const normalizedPath = normalizePath(path);
    const url = `${BASE_URL}/seo-form/api/seo/by-path?path=${normalizedPath}`;

    console.log('[SEO] fetching:', url);

    const res = await fetch(url, { cache: 'no-store' });

    console.log('[SEO] status:', res.status);

    if (res.status === 404) {
      console.log('[SEO] 404 - no entry found, using fallback');
      return fallback;
    }
    if (!res.ok) {
      console.log('[SEO] error response:', res.status, res.statusText);
      return fallback;
    }

    const entry = await res.json();
    console.log('[SEO] success - pageTitle:', entry.pageTitle);

    let advanced = {};
    const keywordData = entry.metaKeywords || '';
    if (keywordData.includes(' | {')) {
      try {
        advanced = JSON.parse(keywordData.split(' | ')[1]);
      } catch {
        console.warn('[SEO] malformed JSON in metaKeywords');
      }
    }

    const title = entry.pageTitle || fallback.title;
    const description = entry.metaDesc || fallback.description;
    const keywords = keywordData.split(' | ')[0] || '';
    const ogImage = advanced.og_img;
    const canonical = advanced.canonical || `https://calvant.com${normalizedPath}`;

    return {
      title,
      description,
      keywords,
      robots: advanced.robots || 'index, follow',
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'CalVant',
        type: 'website',
        ...(ogImage && { images: [{ url: ogImage }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(ogImage && { images: [ogImage] }),
      },
      ...Object.fromEntries(
        Object.entries(fallback).filter(
          ([key]) => !['title', 'description'].includes(key)
        )
      ),
    };
  } catch (err) {
    console.error('[SEO] fetch failed:', err.message);  // ← this will show the real error
    return fallback;
  }
}