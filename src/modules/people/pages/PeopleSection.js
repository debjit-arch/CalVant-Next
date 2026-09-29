"use client";
import React, { useEffect, useState } from "react";
import { Users, ShieldCheck, FileText, FileSignature, FileWarning, Gavel, AlertTriangle, GraduationCap, LogOut } from "lucide-react";
import PeopleTabs from "../components/PeopleTabs";
import PersonDirectory from "../components/PersonDirectory";
import ScreeningPanel from "../components/ScreeningPanel";
import DocumentAcceptanceTable from "../components/DocumentAcceptanceTable";
import OffboardingList from "../components/OffboardingList";
import TicketsTable from "../components/TicketsTable";
import TrainingPanel from "../components/TrainingPanel";
import { canWrite } from "../utils/peopleFormat";

const TABS = [
  { key: "directory", label: "Directory", icon: Users },
  { key: "screening", label: "Screening (BGV)", icon: ShieldCheck },
  { key: "terms", label: "T&C of Employment", icon: FileText },
  { key: "post-termination", label: "Post-termination", icon: FileWarning },
  { key: "nda", label: "NDA", icon: FileSignature },
  { key: "disciplinary", label: "Disciplinary process", icon: Gavel },
  { key: "event-report", label: "Event report", icon: AlertTriangle },
  { key: "learning", label: "Learning", icon: GraduationCap },
  { key: "offboarding", label: "Offboarding", icon: LogOut },
];

/** Reads the decoded JWT roles the same way PersistentSidebar.jsx does, so
 * write-gating here matches what the backend will actually accept
 * (people-service SecurityConfig.WRITE_ROLES = SUPER_ADMIN, ROOT, HR_ADMIN). */
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

export default function PeopleSection() {
  const [active, setActive] = useState("directory");
  const roles = useUserRoles();
  const canEdit = canWrite(roles);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-800">People</h1>
        <p className="text-sm text-slate-500 mt-1">
          The compliance side of each employee — onboarding tasks, policy sign-off, training,
          screening, and access removal on exit. 
        </p>
      </div>

      <PeopleTabs tabs={TABS} active={active} onChange={setActive} />

      {active === "directory" && <PersonDirectory canEdit={canEdit} />}
      {active === "screening" && <ScreeningPanel canEdit={canEdit} />}
      {active === "terms" && (
        <DocumentAcceptanceTable
          policyType="TERMS_OF_EMPLOYMENT"
          title="Terms & Conditions of Employment"
          description="Employees registered on the Calvant website, their T&C acceptance, and a link to the signed contract."
          restrictToLinkedUsers
          canEdit={canEdit}
        />
      )}
      {active === "post-termination" && (
        <DocumentAcceptanceTable
          policyType="POST_TERMINATION"
          title="Post-termination requirements"
          description="Acknowledgement of post-employment obligations, with a link to the signed document."
          canEdit={canEdit}
        />
      )}
      {active === "nda" && (
        <DocumentAcceptanceTable
          policyType="NDA"
          title="Non-Disclosure Agreements"
          description="NDA acceptance per person, with a link to the signed document."
          canEdit={canEdit}
        />
      )}
      {active === "disciplinary" && (
        <TicketsTable
          category="DISCIPLINARY"
          title="Disciplinary process"
          description="History of disciplinary breaches and how each was handled — synced from the connected ticketing system where available, or tracked here directly."
          canEdit={canEdit}
        />
      )}
      {active === "event-report" && (
        <TicketsTable
          category="SECURITY_EVENT"
          title="Event report"
          description="Security events reported through the ticketing system, snapshotted here for audit evidence."
          canEdit={canEdit}
        />
      )}
      {active === "learning" && <TrainingPanel canEdit={canEdit} />}
      {active === "offboarding" && <OffboardingList canEdit={canEdit} />}
    </div>
  );
}
