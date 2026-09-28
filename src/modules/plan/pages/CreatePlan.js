"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import PlanMultiStepManager from "../components/forms/PlanMultiStepManager";

/**
 * CreatePlan — thin page wrapper for the Plan creation/edit wizard.
 * Reads an optional `id` query param (set by PlanDashboard's Edit/Resume
 * action) and passes it through to PlanMultiStepManager, which owns all
 * wizard state, step navigation, and submit/save behavior.
 */
const CreatePlan = () => {
  const searchParams = useSearchParams();
  const planId = searchParams ? searchParams.get("id") : null;

  return <PlanMultiStepManager initialPlanId={planId} />;
};

export default CreatePlan;
