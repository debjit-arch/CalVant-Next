"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/context/SessionContext";
import { usePathname } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";

export default function MainContentWrapper({ children }) {
  const { isAuthenticated } = useSession();
  const pathname = usePathname();
  const { isMobile, sidebarWidth } = useLayout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const authRoutes = ["/login", "/register", "/forgot-password", "/auth-bridge"];
  const isAuthPage = authRoutes.includes(pathname);

  if (!isAuthenticated || isAuthPage) {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="pt-14 sm:pt-16 lg:pt-[72px] min-h-screen">
        {children}
      </div>
    );
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