"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Home } from "lucide-react";
import { helpMarkdownComponents } from "@/components/shared/markdownComponents";

// ── helpers ────────────────────────────────────────────────────────────────

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// Pull every H2/H3 out of the raw markdown so the left nav mirrors the
// document's own headings exactly — no separately maintained TOC data.
const extractToc = (markdown) => {
  const lines = markdown.split("\n");
  const toc = [];
  const seen = {};
  for (const line of lines) {
    const m2 = line.match(/^##\s+(.*)$/);
    const m3 = line.match(/^###\s+(.*)$/);
    const level = m2 ? 2 : m3 ? 3 : null;
    if (!level) continue;
    const text = (m2 ? m2[1] : m3[1]).trim();
    let slug = slugify(text);
    if (seen[slug] != null) {
      seen[slug] += 1;
      slug = `${slug}-${seen[slug]}`;
    } else {
      seen[slug] = 0;
    }
    toc.push({ level, text, slug });
  }
  return toc;
};

// Docs live under /public/docs, but the markdown itself is fetched and
// rendered from an unrelated page URL (/help-center/<slug>). Any relative
// image path in the source (e.g. "images/foo.png" or "./foo.png") would
// otherwise resolve against the current page URL and 404. Absolute paths
// (starting with "/"), and full http(s)/data URLs, are left untouched.
const resolveDocAssetUrl = (src) => {
  if (!src) return src;
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:") || src.startsWith("/")) {
    return src;
  }
  return `/docs/${src.replace(/^\.?\//, "")}`;
};

const HelpCenterArticle = ({ slug }) => {
  const router = useRouter();
  const articleRef = useRef(null);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | notfound

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const manifestRes = await fetch("/docs/help-manifest.json");
        const manifest = await manifestRes.json();
        const mod = (manifest.modules || []).find((m) => m.slug === slug);

        if (!mod) {
          if (!cancelled) setStatus("notfound");
          return;
        }

        const docRes = await fetch(mod.file);
        const text = await docRes.text();

        if (!cancelled) {
          setModuleInfo(mod);
          setContent(text);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) setStatus("notfound");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toc = useMemo(() => (content ? extractToc(content) : []), [content]);

  // Plain visual components — no id logic here. IDs are stamped onto the
  // real DOM nodes after render (see effect below), so they can never drift
  // out of sync with the TOC list.
  const components = useMemo(
    () => ({
      ...helpMarkdownComponents,
      h2: ({ node, ...props }) => (
        <h2
          className="text-lg font-bold text-slate-900 mt-8 mb-3 scroll-mt-24 pb-2 border-b border-slate-100"
          {...props}
        />
      ),
      h3: ({ node, ...props }) => (
        <h3
          className="text-base font-semibold text-slate-800 mt-6 mb-2 scroll-mt-24"
          {...props}
        />
      ),
      img: ({ node, src, ...props }) => (
        <img
          className="rounded-lg border border-slate-200 shadow-sm my-4 w-full block"
          loading="lazy"
          src={resolveDocAssetUrl(src)}
          {...props}
        />
      ),
    }),
    []
  );

  // After the markdown has actually painted, walk the H2/H3 nodes in
  // document order and assign them the exact same slugs the left nav is
  // using — guarantees TOC clicks always find a matching element.
  useEffect(() => {
    if (status !== "ready" || !articleRef.current) return;
    const headings = articleRef.current.querySelectorAll("h2, h3");
    headings.forEach((el, i) => {
      if (toc[i]) el.id = toc[i].slug;
    });
  }, [toc, status]);

  const handleTocClick = (targetSlug) => {
    const el = document.getElementById(targetSlug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <p className="text-slate-500 text-sm">
          We couldn't find a guide for "{slug}".
        </p>
        <button
          onClick={() => router.push("/help-center")}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => router.push("/help-center")}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium"
          >
            <Home size={14} />
            Help Center
          </button>
          <span>/</span>
          <span className="text-slate-800 font-medium">{moduleInfo?.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-64 flex-shrink-0">
          <button
            onClick={() => router.push("/help-center")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-4"
          >
            <ArrowLeft size={13} />
            All modules
          </button>

          <div className="lg:sticky lg:top-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              In this article
            </p>
            <nav className="space-y-0.5 border-l border-slate-200">
              {toc.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => handleTocClick(item.slug)}
                  className={`block w-full text-left text-xs py-1.5 border-l-2 -ml-px transition-colors ${
                    item.level === 3 ? "pl-7" : "pl-4"
                  } border-transparent hover:border-blue-400 text-slate-500 hover:text-blue-600`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <article
          ref={articleRef}
          className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm px-6 sm:px-10 py-8"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

export default HelpCenterArticle;