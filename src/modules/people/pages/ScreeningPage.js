"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import SectionPageHeader from "../components/SectionPageHeader";
import ScreeningPanel from "../components/ScreeningPanel";
import { canWrite } from "../utils/peopleFormat";
import { captureActivity, ACTIONS } from "@/services/activities";

function useUserRoles() {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    try {
      const token =
        (typeof window !== "undefined" &&
          (sessionStorage.getItem("token") || localStorage.getItem("token"))) ||
        "";
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const raw = payload.roles || payload.role || [];
      setRoles((Array.isArray(raw) ? raw : [raw]).filter(Boolean).map((r) => String(r).toLowerCase()));
    } catch {
      setRoles([]);
    }
  }, []);
  return roles;
}

export default function ScreeningPage() {
  const roles = useUserRoles();
  const canEdit = canWrite(roles);

  useEffect(() => {
    captureActivity({ action: ACTIONS.PAGE_LOAD, item: "People · Viewed Screening (BGV)", url: "/people/screening" });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-20">
        <SectionPageHeader
          icon={ShieldCheck}
          iconGradient="from-emerald-500 to-emerald-600"
          title="Background Verification"
          description="Screening status per person, initiated with the connected BGV vendor where one is configured, or recorded manually by HR."
        />
        <div className="mt-6">
          <ScreeningPanel canEdit={canEdit} />
        </div>
      </main>
    </div>
  );
}
