"use client";
import React, { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import SectionPageHeader from "../components/SectionPageHeader";
import TrainingPanel from "../components/TrainingPanel";
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

export default function LearningPage() {
  const roles = useUserRoles();
  const canEdit = canWrite(roles);

  useEffect(() => {
    captureActivity({ action: ACTIONS.PAGE_LOAD, item: "People · Viewed Learning", url: "/people/learning" });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-20">
        <SectionPageHeader
          icon={GraduationCap}
          iconGradient="from-sky-500 to-sky-600"
          title="Learning"
          description="Security, privacy, and AI training records — who has completed what, and what's still outstanding."
        />
        <div className="mt-6">
          <TrainingPanel canEdit={canEdit} />
        </div>
      </main>
    </div>
  );
}
