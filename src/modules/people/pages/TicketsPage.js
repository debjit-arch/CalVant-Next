"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gavel } from "lucide-react";
import SectionPageHeader, { SegmentedTabs } from "../components/SectionPageHeader";
import TicketsTable from "../components/TicketsTable";
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

const CATEGORIES = {
  DISCIPLINARY: {
    label: "Disciplinary actions",
    title: "Disciplinary actions",
    description: "History of disciplinary breaches, the action taken for each, and how it was resolved.",
  },
  SECURITY_EVENT: {
    label: "Event log",
    title: "Event log",
    description: "Reported security events. Add tasks to each event and assign them — the event completes when all its tasks are done.",
  },
};

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roles = useUserRoles();
  const canEdit = canWrite(roles);

  const categoryParam = searchParams.get("category");
  const activeCategory = CATEGORIES[categoryParam] ? categoryParam : "DISCIPLINARY";
  const active = CATEGORIES[activeCategory];

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: `People · Viewed Tickets (${activeCategory})`,
      url: "/people/tickets",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const changeCategory = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", key);
    router.replace(`/people/tickets?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-20">
        <SectionPageHeader
          icon={Gavel}
          iconGradient="from-amber-500 to-amber-600"
          title="Tickets"
          description="Disciplinary actions and the event log, kept separate — pick the section below."
          right={
            <SegmentedTabs
              tabs={Object.entries(CATEGORIES).map(([key, v]) => ({ key, label: v.label }))}
              active={activeCategory}
              onChange={changeCategory}
            />
          }
        />
        <div className="mt-6">
          <TicketsTable
            key={activeCategory}
            category={activeCategory}
            title={active.title}
            description={active.description}
            canEdit={canEdit}
          />
        </div>
      </main>
    </div>
  );
}
