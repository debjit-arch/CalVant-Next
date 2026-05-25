"use client";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedPage({ children }) {
  const { isAuthenticated } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  // Before client mount — render same empty shell as server
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50" />
    );
  }

  // After mount, session still checking
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) return null;

  return children;
}