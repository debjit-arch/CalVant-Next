"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import {
  Shield,
  Globe,
  Lock,
  Key,
  FileText,
  Settings,
  Rocket,
  Handshake,
  Scale,
  User,
  Users,
  Puzzle,
  CheckCircle,
  AlertTriangle,
  Database,
  Server,
  BarChart,
  TrendingUp,
  Award,
  Star,
  Zap,
  UserCircle,
} from "lucide-react";
import "./framework-page.css";
import { useIsMobile } from "@/hooks/useIsMobile";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.calvant.com/framework/api";

// ── Icon resolver ─────────────────────────────────────────────────────────────
const ICON_MAP = {
  Shield,
  Globe,
  Lock,
  Key,
  FileText,
  Settings,
  Rocket,
  Handshake,
  Scale,
  User,
  Users,
  Puzzle,
  CheckCircle,
  AlertTriangle,
  Database,
  Server,
  BarChart,
  TrendingUp,
  Award,
  Star,
  Zap,
};

const DynamicIcon = ({ name, size = 24 }) => {
  const Icon = ICON_MAP[name] || Shield;
  return <Icon size={size} />;
};

const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export default function FrameworkPageClient({ frameworkId }) {
  const isMobile = useIsMobile();
  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);
  const storedUser = getStoredUser();
  const isLoggedIn = !!storedUser;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!frameworkId) return;
    axios
      .get(`${API_BASE}/frameworks/${frameworkId}`)
      .then((res) => setFramework(res.data))
      .catch(() => setFramework(null))
      .finally(() => setLoading(false));
  }, [frameworkId]);

  const goTo = (path) => {
    window.location.href = path;
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fw-loading">
        <div className="fw-spinner" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────
  if (!framework) {
    return (
      <div className="fw-not-found">
        <h2>Framework not found</h2>
        <p>The framework you're looking for doesn't exist.</p>
        <Link href="/">← Back to home</Link>
      </div>
    );
  }

  const pc = framework.pageContent;

  // ── Coming soon ───────────────────────────────────────────────────
  if (!pc) {
    return (
      <div className="fw-coming-soon">
        <div className="fw-coming-badge">
          {framework.label || framework.name}
        </div>
        <h2>Page coming soon</h2>
        <p>
          We're working on the <strong>{framework.name}</strong> page. Check
          back soon.
        </p>
        <Link href="/">← Back to home</Link>
      </div>
    );
  }

  // ── Full page ─────────────────────────────────────────────────────
  return (
    <div
      className="fw-root"
      style={{ "--fw-accent": framework.color || "#0066cc" }}
    >
      {/* ── HEADER ── */}
      <header className="fw-header">
        <div className="fw-header-inner">
          <Image
            src="/CalVant Logo.svg"
            alt="CalVant"
            width={180}
            height={60}
            style={{
              height: isMobile ? "30px" : "60px",
              width: "auto",
              transform: isMobile ? "scale(3.9)" : "scale(2.9)",
              transformOrigin: "center",
              cursor: "pointer",
              transition: "transform 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(3.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(3.5)";
            }}
            onClick={() => (window.location.href = "/")}
          />
          <nav className="fw-nav">
            <a href="/" className="fw-nav-link">
              Home
            </a>
            {pc.overviewTitle && (
              <button
                className="fw-nav-btn"
                onClick={() => scrollTo("fw-overview")}
              >
                Overview
              </button>
            )}
            {pc.clauseCards?.length > 0 && (
              <button
                className="fw-nav-btn"
                onClick={() => scrollTo("fw-clauses")}
              >
                Requirements
              </button>
            )}
            {pc.domainCards?.length > 0 && (
              <button
                className="fw-nav-btn"
                onClick={() => scrollTo("fw-controls")}
              >
                Controls
              </button>
            )}
            {pc.benefitCards?.length > 0 && (
              <button
                className="fw-nav-btn"
                onClick={() => scrollTo("fw-benefits")}
              >
                Benefits
              </button>
            )}
            {isLoggedIn ? (
              <div className="fw-user-pill">
                <UserCircle size={18} />
                <span>{storedUser.name || "User"}</span>
              </div>
            ) : (
              <button className="fw-nav-cta" onClick={() => goTo("/login")}>
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="fw-hero">
        <div className="fw-hero-inner">
          <div className="fw-hero-content">
            {pc.heroBadgeText && (
              <div className="fw-badge">{pc.heroBadgeText}</div>
            )}
            <h2 className="fw-hero-title">
              {pc.heroTitle}{" "}
              {pc.heroTitleHighlight && (
                <span className="fw-highlight">{pc.heroTitleHighlight}</span>
              )}
            </h2>
            {pc.heroDescription && (
              <p className="fw-hero-desc">{pc.heroDescription}</p>
            )}

            <div className="fw-hero-cta">
              {!isLoggedIn && pc.heroPrimaryCtaText && (
                <button
                  className="fw-btn-primary"
                  onClick={() => goTo("/demo")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M8 5v14l11-7z" />
                  </svg>
                  {pc.heroPrimaryCtaText}
                </button>
              )}
              {pc.heroScrollTarget && (
                <button
                  className="fw-btn-secondary"
                  onClick={() => scrollTo(`fw-${pc.heroScrollTarget}`)}
                >
                  Learn more
                </button>
              )}
            </div>

            {pc.heroStats?.length > 0 && (
              <div className="fw-hero-stats">
                {pc.heroStats.map((stat, i) => (
                  <div key={i} className="fw-stat">
                    <span className="fw-stat-value">{stat.value}</span>
                    <span className="fw-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accent orb */}
          <div className="fw-hero-visual">
            <div
              className="fw-orb"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${framework.color || "#0066cc"}33, ${framework.color || "#0066cc"}08)`,
              }}
            >
              <div className="fw-orb-ring fw-orb-r1" />
              <div className="fw-orb-ring fw-orb-r2" />
              <div className="fw-orb-ring fw-orb-r3" />
              <div className="fw-orb-center">
                <div className="fw-orb-badge">
                  <span>{framework.label || framework.code}</span>
                </div>
                <p className="fw-orb-sub">{framework.sub || framework.type}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OVERVIEW ── */}
      {(pc.overviewTitle || pc.overviewCards?.length > 0) && (
        <section id="fw-overview" className="fw-section">
          <div className="fw-section-header">
            {pc.overviewTitle && <h2>{pc.overviewTitle}</h2>}
            {pc.overviewDescription && <p>{pc.overviewDescription}</p>}
          </div>
          {pc.overviewCards?.length > 0 && (
            <div className="fw-card-grid fw-card-grid-3">
              {pc.overviewCards.map((card, i) => (
                <div key={i} className="fw-card">
                  <div className="fw-card-icon">
                    <DynamicIcon name={card.icon} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CLAUSES ── */}
      {(pc.clausesTitle || pc.clauseCards?.length > 0) && (
        <section id="fw-clauses" className="fw-section fw-section-alt">
          <div className="fw-section-header">
            {pc.clausesTitle && <h2>{pc.clausesTitle}</h2>}
            {pc.clausesDescription && <p>{pc.clausesDescription}</p>}
          </div>
          {pc.clauseCards?.length > 0 && (
            <div className="fw-card-grid fw-card-grid-3">
              {pc.clauseCards.map((card, i) => (
                <div key={i} className="fw-clause-card">
                  {card.clauseLabel && (
                    <span className="fw-clause-label">{card.clauseLabel}</span>
                  )}
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {card.bulletPoints?.length > 0 && (
                    <ul>
                      {card.bulletPoints.map((bp, j) => (
                        <li key={j}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CONTROLS / DOMAINS ── */}
      {(pc.controlsTitle || pc.domainCards?.length > 0) && (
        <section id="fw-controls" className="fw-section">
          <div className="fw-section-header">
            {pc.controlsTitle && <h2>{pc.controlsTitle}</h2>}
            {pc.controlsDescription && <p>{pc.controlsDescription}</p>}
          </div>
          {pc.domainCards?.length > 0 && (
            <div className="fw-card-grid fw-card-grid-auto">
              {pc.domainCards.map((card, i) => (
                <div key={i} className="fw-domain-card">
                  <h4>{card.domainTitle}</h4>
                  <p>{card.domainDescription}</p>
                  {card.controls?.length > 0 && (
                    <ul>
                      {card.controls.map((c, j) => (
                        <li key={j}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── BENEFITS ── */}
      {(pc.benefitsTitle || pc.benefitCards?.length > 0) && (
        <section id="fw-benefits" className="fw-section fw-section-alt">
          <div className="fw-section-header">
            {pc.benefitsTitle && <h2>{pc.benefitsTitle}</h2>}
            {pc.benefitsDescription && <p>{pc.benefitsDescription}</p>}
          </div>
          {pc.benefitCards?.length > 0 && (
            <div className="fw-card-grid fw-card-grid-3">
              {pc.benefitCards.map((card, i) => (
                <div key={i} className="fw-benefit-card">
                  <div className="fw-benefit-icon">
                    <DynamicIcon name={card.icon} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── STEPS ── */}
      {(pc.stepsTitle || pc.stepCards?.length > 0) && (
        <section id="fw-steps" className="fw-section">
          <div className="fw-section-header">
            {pc.stepsTitle && <h2>{pc.stepsTitle}</h2>}
            {pc.stepsDescription && <p>{pc.stepsDescription}</p>}
          </div>
          {pc.stepCards?.length > 0 && (
            <div className="fw-card-grid fw-card-grid-3">
              {pc.stepCards.map((card, i) => (
                <div key={i} className="fw-step-card">
                  <div className="fw-step-num">{card.stepNumber}</div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {card.bulletPoints?.length > 0 && (
                    <ul>
                      {card.bulletPoints.map((bp, j) => (
                        <li key={j}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CTA ── */}
      {(pc.ctaTitle || pc.ctaDescription) && (
        <section className="fw-section">
          <div className="fw-cta-box">
            {pc.ctaTitle && <h2>{pc.ctaTitle}</h2>}
            {pc.ctaDescription && <p>{pc.ctaDescription}</p>}
            <div className="fw-cta-btns">
              {!isLoggedIn && (
                <button
                  className="fw-btn-primary"
                  onClick={() => goTo("/demo")}
                >
                  Get a demo
                </button>
              )}
              <button
                className="fw-btn-secondary"
                onClick={() => goTo("/contact")}
              >
                Talk to an expert
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="fw-footer">
        <div className="fw-footer-inner">
          <div>
            <h4>CalVant</h4>
            <p>
              {pc.footerTagline ||
                `One platform to operationalize ${framework.name} and your compliance program.`}
            </p>
          </div>
          <div>
            <h4>Frameworks</h4>
            <ul>
              <li>
                <Link href="/">All frameworks</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="fw-footer-bottom">
          © {new Date().getFullYear()} CalVant ·{" "}
          {framework.label || framework.name} · Made in India
        </div>
      </footer>
    </div>
  );
}
