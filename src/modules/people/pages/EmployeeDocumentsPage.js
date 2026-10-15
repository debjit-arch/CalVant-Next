"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import SectionPageHeader, { SegmentedTabs } from "../components/SectionPageHeader";
import DocumentAcceptanceTable from "../components/DocumentAcceptanceTable";
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

/** One entry per tab — the tab defines everything DocumentAcceptanceTable
 * needs, so adding a new document type later means adding one entry here,
 * not a new route/page/component. */
const DOC_TYPES = {
  TERMS_OF_EMPLOYMENT: {
    label: "T&C of Employment",
    title: "Terms & Conditions of Employment",
    description: "Employees registered on the Calvant website, their T&C acceptance, and a link to the signed contract.",
    restrictToLinkedUsers: true,
  },
  NDA: {
    label: "NDA",
    title: "Non-Disclosure Agreements",
    description: "NDA acceptance per person, with a link to the signed document.",
  },
  POST_TERMINATION: {
    label: "Post-termination",
    title: "Post-termination requirements",
    description: "Acknowledgement of post-employment obligations, with a link to the signed document.",
  },
};

export default function EmployeeDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roles = useUserRoles();
  const canEdit = canWrite(roles);

  const typeParam = searchParams.get("type");
  const activeType = DOC_TYPES[typeParam] ? typeParam : "TERMS_OF_EMPLOYMENT";
  const active = DOC_TYPES[activeType];

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: `People · Viewed Employment Documents (${activeType})`,
      url: "/people/documents",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  const changeType = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", key);
    router.replace(`/people/documents?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-20">
        <SectionPageHeader
          icon={FileText}
          iconGradient="from-blue-500 to-blue-600"
          title="Employment Documents"
          description="Policy sign-off, tracked per document type. Switch types below — this is one screen with three entry points, not three separate pages."
          right={
            <SegmentedTabs
              tabs={Object.entries(DOC_TYPES).map(([key, v]) => ({ key, label: v.label }))}
              active={activeType}
              onChange={changeType}
            />
          }
        />
        <div className="mt-6">
          <DocumentAcceptanceTable
            key={activeType}
            policyType={activeType}
            title={active.title}
            description={active.description}
            restrictToLinkedUsers={active.restrictToLinkedUsers}
            canEdit={canEdit}
          />
        </div>
      </main>
    </div>
  );
}
