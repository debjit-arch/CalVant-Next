"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { selfServeSignup } from "../api/billingApi";
import { FRAMEWORK_CHOICES } from "../utils/frameworkChoices";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./SignupPage.css";

const CYCLE_ANNUAL = "ANNUAL";
const CYCLE_HALF_YEARLY = "HALF_YEARLY";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCycle = searchParams.get("billingCycle") === CYCLE_HALF_YEARLY
    ? CYCLE_HALF_YEARLY
    : CYCLE_ANNUAL;

  const [form, setForm] = useState({
    orgName: "",
    rootAdminName: "",
    rootAdminEmail: "",
    rootAdminPassword: "",
    frameworkChoice: FRAMEWORK_CHOICES[0].code,
    billingCycle: initialCycle,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.orgName.trim() || !form.rootAdminEmail.trim() || !form.rootAdminPassword.trim()) {
      setError("Organization name, email, and password are required.");
      return;
    }
    if (form.rootAdminPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await selfServeSignup(form);
      setResult(data);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Something went wrong creating your account. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const trialEndsAt = result.trialEndsAt ? new Date(result.trialEndsAt) : null;
    return (
      <>
        <SiteHeader />
        <div className="signup-page">
          <div className="signup-card signup-success">
            <CheckCircle2 size={40} className="signup-success-icon" />
            <h1>You're all set!</h1>
            <p>
              Your 14-day free trial for <strong>{form.orgName}</strong> is live — every module
              and add-on is unlocked while you explore.
            </p>
            {trialEndsAt && (
              <p className="signup-trial-note">
                Trial ends on <strong>{trialEndsAt.toLocaleDateString()}</strong>. Add a payment
                method anytime before then from Manage Subscription to keep everything you tried.
              </p>
            )}
            <button className="signup-cta" onClick={() => router.push("/login")}>
              Go to login <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="signup-page">
        <form className="signup-card" onSubmit={handleSubmit}>
        <h1>Start your free trial</h1>
        <p className="signup-sub">
          14 days, every add-on unlocked, no card required.
        </p>

        <label className="signup-field">
          <span>Organization name</span>
          <input
            type="text"
            value={form.orgName}
            onChange={update("orgName")}
            placeholder="Acme Inc."
            required
          />
        </label>

        <label className="signup-field">
          <span>Your name</span>
          <input
            type="text"
            value={form.rootAdminName}
            onChange={update("rootAdminName")}
            placeholder="Jane Doe"
          />
        </label>

        <label className="signup-field">
          <span>Work email</span>
          <input
            type="email"
            value={form.rootAdminEmail}
            onChange={update("rootAdminEmail")}
            placeholder="jane@acme.com"
            required
          />
        </label>

        <label className="signup-field">
          <span>Password</span>
          <div className="signup-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={form.rootAdminPassword}
              onChange={update("rootAdminPassword")}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
            <button
              type="button"
              className="signup-password-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="signup-field">
          <span>Included framework</span>
          <select value={form.frameworkChoice} onChange={update("frameworkChoice")}>
            {FRAMEWORK_CHOICES.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <div className="signup-field">
          <span>Billing cycle</span>
          <div className="signup-cycle-toggle">
            <button
              type="button"
              className={form.billingCycle === CYCLE_ANNUAL ? "active" : ""}
              onClick={() => setForm((f) => ({ ...f, billingCycle: CYCLE_ANNUAL }))}
            >
              Annual
            </button>
            <button
              type="button"
              className={form.billingCycle === CYCLE_HALF_YEARLY ? "active" : ""}
              onClick={() => setForm((f) => ({ ...f, billingCycle: CYCLE_HALF_YEARLY }))}
            >
              Half-yearly
            </button>
          </div>
        </div>

        {error && <div className="signup-error">{error}</div>}

        <button type="submit" className="signup-cta" disabled={submitting}>
          {submitting ? "Creating your account…" : "Start free trial"}
          {!submitting && <ArrowRight size={16} />}
        </button>

        <p className="signup-footnote">
          <ShieldCheck size={13} /> You won't be charged until you add a payment method.
        </p>
        </form>
      </div>
      <SiteFooter />
    </>
  );
}
