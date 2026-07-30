"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { getStarterPackage, getAddOns } from "../api/billingApi";
import {
  formatINR,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  perCycleRateFor,
} from "../utils/billingFormat";
import "./PricingPage.css";

const CYCLE_ANNUAL = "ANNUAL";
const CYCLE_HALF_YEARLY = "HALF_YEARLY";

const ENTERPRISE_FEATURES = [
  "Unlimited users & departments",
  "All frameworks, unlimited framework choices",
  "Dedicated Customer Success Manager",
  "Custom SLA & priority support",
  "SSO / SCIM & advanced access controls",
  "Custom integrations & data residency options",
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState(CYCLE_ANNUAL);
  const [starter, setStarter] = useState(null);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sp, ao] = await Promise.all([getStarterPackage(), getAddOns()]);
        if (cancelled) return;
        setStarter(sp);
        setAddOns(Array.isArray(ao) ? ao : []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Couldn't load live pricing right now — showing may be incomplete.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const starterPrice = useMemo(() => {
    if (!starter) return null;
    return billingCycle === CYCLE_ANNUAL ? starter.priceAnnual : starter.priceHalfYearly;
  }, [starter, billingCycle]);

  // Per-cycle-year equivalent so both toggles are visually comparable
  const starterPricePerMonth = useMemo(() => {
    if (starterPrice === null || starterPrice === undefined) return null;
    return starterPrice / 12;
  }, [starterPrice]);

  const scalingAddOns = useMemo(() => {
    const recurring = addOns.filter((a) => a.billingType === "PER_UNIT_MONTHLY");
    const groups = {};
    for (const a of recurring) {
      groups[a.category] = groups[a.category] || [];
      groups[a.category].push(a);
    }
    return CATEGORY_ORDER.filter((c) => c !== "SERVICE" && groups[c]).map((c) => ({
      category: c,
      label: CATEGORY_LABELS[c],
      items: groups[c],
    }));
  }, [addOns]);

  const goToSignup = () => {
    router.push(`/signup?billingCycle=${billingCycle}`);
  };

  const goToDemo = () => {
    router.push("/demo");
  };

  return (
    <div className="pricing-page">
      <div className="pricing-bg-glow" aria-hidden="true" />

      <div className="pricing-container">
        <div className="pricing-header">
          <span className="pricing-eyebrow">
            <Sparkles size={14} /> Simple, transparent pricing
          </span>
          <h1>One plan. Scale it exactly how you need.</h1>
          <p className="pricing-sub">
            Start with everything you need to run compliance, risk, and audits — then add
            frameworks, seats, modules, or integrations only when you actually need them.
          </p>

          <div className="cycle-toggle" role="tablist" aria-label="Billing cycle">
            <button
              role="tab"
              aria-selected={billingCycle === CYCLE_ANNUAL}
              className={billingCycle === CYCLE_ANNUAL ? "active" : ""}
              onClick={() => setBillingCycle(CYCLE_ANNUAL)}
            >
              Annual
              <span className="save-badge">Save more</span>
            </button>
            <button
              role="tab"
              aria-selected={billingCycle === CYCLE_HALF_YEARLY}
              className={billingCycle === CYCLE_HALF_YEARLY ? "active" : ""}
              onClick={() => setBillingCycle(CYCLE_HALF_YEARLY)}
            >
              Half-yearly
            </button>
          </div>
        </div>

        {error && <div className="pricing-error">{error}</div>}

        <div className="pricing-cards">
          {/* ── Starter (Growth folded in via add-ons) ───────────────────── */}
          <div className="pricing-card pricing-card--highlight">
            <div className="pricing-card-badge">Most popular</div>
            <h2>Starter</h2>
            <p className="pricing-card-tagline">
              Everything a lean compliance team needs — scale seats, frameworks, and modules
              as you grow, without switching plans.
            </p>

            <div className="pricing-amount">
              {loading ? (
                <span className="pricing-skeleton" />
              ) : (
                <>
                  <span className="pricing-amount-value">{formatINR(starterPricePerMonth)}</span>
                  <span className="pricing-amount-unit">/month</span>
                </>
              )}
            </div>
            <div className="pricing-amount-note">
              {loading
                ? " "
                : billingCycle === CYCLE_ANNUAL
                ? `Billed annually at ${formatINR(starterPrice)}/year, excl. GST`
                : `Billed half-yearly — ${formatINR(starterPrice ? starterPrice / 2 : null)} every 6 months, excl. GST`}
            </div>

            <button className="pricing-cta pricing-cta--primary" onClick={goToSignup}>
              Start your 14-day free trial <ArrowRight size={16} />
            </button>
            <p className="pricing-cta-note">No card required to start. Cancel anytime.</p>

            <ul className="pricing-feature-list">
              {(starter?.includedCoreModules || [
                "Compliance", "Risk", "Audits", "Policies", "Tasks", "Trust Centre", "Reports",
              ]).map((m) => (
                <li key={m}>
                  <Check size={16} /> {m}
                </li>
              ))}
              <li>
                <Check size={16} /> {starter?.includedFrameworkChoiceCount ?? 1} framework of your choice
              </li>
              <li>
                <Check size={16} /> {starter?.includedAdminUsers ?? 1} admin + {starter?.includedNormalUsers ?? 4} team seats included
              </li>
              <li>
                <Check size={16} /> {starter?.includedIntegrations ?? 2} integrations included
              </li>
              <li>
                <Check size={16} /> {starter?.supportSlaHours ?? 48}-hour support SLA
              </li>
            </ul>

            {scalingAddOns.length > 0 && (
              <div className="pricing-scale-block">
                <div className="pricing-scale-title">Scale it up anytime</div>
                {scalingAddOns.map((group) => (
                  <div key={group.category} className="pricing-scale-group">
                    <span className="pricing-scale-group-label">{group.label}</span>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.addOnCode}>
                          <span>{item.displayName}</span>
                          <span className="pricing-scale-price">
                            {formatINR(perCycleRateFor(item, billingCycle))}
                            <span className="pricing-scale-price-unit">
                              {billingCycle === CYCLE_ANNUAL ? "/yr" : "/6mo"}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Enterprise ─────────────────────────────────────────────── */}
          <div className="pricing-card">
            <h2>Enterprise</h2>
            <p className="pricing-card-tagline">
              For organizations with 100+ employees, multi-entity structures, or bespoke
              compliance programs.
            </p>

            <div className="pricing-amount">
              <span className="pricing-amount-value">Custom</span>
            </div>
            <div className="pricing-amount-note">Pricing tailored to your org's scope</div>

            <button className="pricing-cta pricing-cta--secondary" onClick={goToDemo}>
              Book a demo <ArrowRight size={16} />
            </button>
            <p className="pricing-cta-note">Our team will scope a plan with you.</p>

            <ul className="pricing-feature-list">
              {ENTERPRISE_FEATURES.map((f) => (
                <li key={f}>
                  <Check size={16} /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pricing-footnote">
          <ShieldCheck size={14} /> All prices shown exclude GST, applied at checkout. Starter
          plan add-ons can be adjusted anytime from Manage Subscription.
        </div>
      </div>
    </div>
  );
}
