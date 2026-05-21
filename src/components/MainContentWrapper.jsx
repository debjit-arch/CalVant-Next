"use client";
import React, { useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { usePathname } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";

export default function MainContentWrapper({ children }) {
  const { isAuthenticated } = useSession();
  const pathname = usePathname();
  const { isMobile, sidebarWidth } = useLayout();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const authRoutes = ["/login", "/register", "/forgot-password", "/auth-bridge"];
  const isAuthPage = authRoutes.includes(pathname);

  // If not authenticated or on an auth page, we don't render the sidebar or navbar
  if (!isAuthenticated || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        marginLeft: isMobile ? 0 : sidebarWidth,
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="pt-14 sm:pt-16 lg:pt-[72px] min-h-screen"
    >
      {children}
    </div>
  );
}
