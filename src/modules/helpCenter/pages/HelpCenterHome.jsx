"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  FileText,
  ClipboardCheck,
  ListChecks,
  ShieldCheck,
  Handshake,
  FileSearch,
  Search,
  ArrowRight,
} from "lucide-react";

const ICONS = {
  ShieldAlert,
  FileText,
  ClipboardCheck,
  ListChecks,
  ShieldCheck,
  Handshake,
  FileSearch,
};

const HelpCenterHome = () => {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/docs/help-manifest.json")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setModules(data.modules || []);
      })
      .catch(() => {
        if (!cancelled) setModules([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = modules.filter((m) =>
    (m.title + " " + m.description).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-14 sm:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            How can we help you today?
          </h1>
          <p className="text-slate-300 mt-2 text-sm sm:text-base">
            Browse the knowledge base for guides on every CalVant module.
          </p>

          <div className="mt-6 relative max-w-xl mx-auto">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a module…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Knowledge base</h2>

        {loading && (
          <div className="text-sm text-slate-400">Loading modules…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-sm text-slate-400">
            No modules match "{query}".
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mod) => {
            const Icon = ICONS[mod.icon] || FileText;
            return (
              <button
                key={mod.slug}
                onClick={() => router.push(`/help-center/${mod.slug}`)}
                className="text-left bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${mod.color}1A` }}
                >
                  <Icon size={18} style={{ color: mod.color }} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  {mod.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                  Learn more
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HelpCenterHome;
