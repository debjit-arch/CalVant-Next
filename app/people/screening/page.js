"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Screening (BGV) is no longer its own tab/page — it now lives inline in the
 * People Directory (table column + per-person drawer), matching the "one
 * view" pattern the MLD screen uses. Keep this route alive so old links/
 * bookmarks land somewhere useful instead of 404ing. */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/people/directory");
  }, [router]);
  return null;
}
