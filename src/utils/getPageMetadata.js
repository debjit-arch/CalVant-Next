// utils/getPageMetadata.js

const BASE_URL = process.env.NEXT_PUBLIC_CFTB || 'https://api.calvant.com';

const normalizePath = (path) => {
  if (!path) return '/';
  return path.toLowerCase().trim().replace(/\/$/, '') || '/';
};

const matchDynamicRoute = (currentPath, routePattern) => {
  const pattern = routePattern.replace(/:[^\s/]+/g, '([\\w-]+)');
  return new RegExp(`^${pattern}$`, 'i').test(currentPath);
};

export async function getPageMetadata(path, fallback = {}) {
  try {
    const res = await fetch(`${BASE_URL}/seo-form/api/seo`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('SEO fetch failed');

    const entries = await res.json();
    const normalizedPath = normalizePath(path);

    // Static exact match first
    let entry = entries.find(
      (e) => normalizePath(e.url) === normalizedPath
    );

    // Dynamic route match (e.g. /blog/:slug)
    if (!entry) {
      entry = entries.find((e) => {
        if (e.url?.includes(':')) {
          return matchDynamicRoute(normalizedPath, e.url);
        }
        return false;
      });
    }

    if (!entry) return fallback;

    // Decode advanced JSON packed into metaKeywords
    let advanced = {};
    const keywordData = entry.metaKeywords || '';
    if (keywordData.includes(' | {')) {
      try {
        advanced = JSON.parse(keywordData.split(' | ')[1]);
      } catch {}
    }

    const title = entry.pageTitle || fallback.title;
    const description = entry.metaDesc || fallback.description;
    const keywords = keywordData.split(' | ')[0] || '';
    const ogImage = advanced.og_img;
    const canonical = advanced.canonical || `https://calvant.com${path}`;

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
    };
  } catch {
    return fallback;
  }
}