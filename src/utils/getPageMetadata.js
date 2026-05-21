const BASE_URL = process.env.NEXT_PUBLIC_CFTB || 'https://api.calvant.com';

export async function getPageMetadata(path, fallback = {}) {
  try {
    const res = await fetch(`${BASE_URL}/seo-form/api/seo`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('SEO fetch failed');
    const entries = await res.json();

    const entry = entries.find(
      (e) => e.url?.toLowerCase().replace(/\/$/, '') === path.toLowerCase()
    );
    if (!entry) return fallback;

    let advanced = {};
    const keywordData = entry.metaKeywords || '';
    if (keywordData.includes(' | {')) {
      const [, jsonPart] = keywordData.split(' | ');
      try { advanced = JSON.parse(jsonPart); } catch {}
    }

    return {
      title: entry.pageTitle || fallback.title,
      description: entry.metaDesc || fallback.description,
      keywords: entry.metaKeywords?.split(' | ')[0] || '',
      robots: advanced.robots || 'index, follow',
      openGraph: {
        title: entry.pageTitle || fallback.title,
        description: entry.metaDesc || fallback.description,
        siteName: 'CalVant',
        images: advanced.og_img ? [{ url: advanced.og_img }] : [],
      },
      alternates: {
        canonical: advanced.canonical || `https://calvant.com${path}`,
      },
    };
  } catch {
    return fallback;
  }
}