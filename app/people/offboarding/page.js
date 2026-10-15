"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** This used to be its own tab/page. Everything it showed now lives inline in
 * the People Directory (table columns + per-person drawer) — one view for
 * the whole module. Redirect so old links/bookmarks still land somewhere. */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/people/directory");
  }, [router]);
  return null;
}
