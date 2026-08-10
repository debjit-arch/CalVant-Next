// // src/components/SiteHeader.jsx
// "use client";
// import Image from "next/image";
// import { useRouter, usePathname } from "next/navigation";
// import { LogIn } from "lucide-react";
// import { useIsMobile } from "@/hooks/useIsMobile";
// import "@/modules/dashboard/Dashboard.css";

// /**
//  * Guest-facing header — same markup/classes as the logged-out Dashboard.js
//  * header (dashboard-header / dashboard-header-content), pulled out so other
//  * static/marketing pages (Pricing, About, etc.) can reuse the real nav
//  * instead of shipping with no header at all.
//  */
// export default function SiteHeader() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const isMobile = useIsMobile();

//   return (
//     <header className="dashboard-header" style={{ padding: isMobile ? "10px 12px" : "16px 24px" }}>
//       <div
//         className="dashboard-header-content"
//         style={{
//           maxWidth: "1280px", margin: "0 auto", display: "flex",
//           justifyContent: "space-between", alignItems: "center",
//           gap: isMobile ? "8px" : "24px", position: "relative", zIndex: 1,
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", flex: "10px 0 auto" }}>
//           <Image
//             src="/CalVant Logo.svg"
//             alt="CalVant"
//             width={180}
//             height={60}
//             style={{
//               height: isMobile ? "30px" : "60px", width: "auto",
//               transform: isMobile ? "scale(3.9)" : "scale(2.9)",
//               transformOrigin: "center", cursor: "pointer",
//             }}
//             onClick={() => router.push("/")}
//           />
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "16px" }}>
//           {!isMobile && (
//             <button
//               onClick={() => router.push(pathname === "/pricing" ? "/" : "/pricing")}
//               style={{
//                 display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 12px",
//                 background: "transparent",
//                 border: "1px solid rgba(148, 163, 184, 0.35)", borderRadius: "8px",
//                 color: "#e5e7eb", fontSize: "14px", fontWeight: "500", cursor: "pointer",
//               }}
//             >
//               {pathname === "/pricing" ? "Home" : "Pricing"}
//             </button>
//           )}

//           <button
//             onClick={() => router.push("/login")}
//             style={{
//               display: "flex", alignItems: "center", gap: isMobile ? "2px" : "6px",
//               padding: isMobile ? "6px 10px" : "8px 16px", borderRadius: "8px",
//               border: "1px solid rgba(148, 163, 184, 0.45)", background: "rgba(15, 23, 42, 0.9)",
//               color: "#f9fafb", fontSize: isMobile ? "10px" : "12px", fontWeight: "600", cursor: "pointer",
//             }}
//           >
//             <LogIn size={isMobile ? 12 : 16} />
//             {!isMobile && "Login"}
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }

// src/components/SiteHeader.jsx
"use client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import "@/modules/dashboard/Dashboard.css";

/**
 * Guest-facing header — same markup/classes as the logged-out Dashboard.js
 * header (dashboard-header / dashboard-header-content), pulled out so other
 * static/marketing pages (Pricing, About, etc.) can reuse the real nav
 * instead of shipping with no header at all.
 */
export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <header className="dashboard-header" style={{ padding: isMobile ? "10px 12px" : "16px 24px" }}>
      <div
        className="dashboard-header-content"
        style={{
          maxWidth: "1280px", margin: "0 auto", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          gap: isMobile ? "8px" : "24px", position: "relative", zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flex: "10px 0 auto" }}>
          <Image
            src="/CalVant Logo.svg"
            alt="CalVant"
            width={180}
            height={60}
            style={{
              height: isMobile ? "30px" : "60px", width: "auto",
              transform: isMobile ? "scale(3.9)" : "scale(2.9)",
              transformOrigin: "center", cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "16px" }}>
          {!isMobile && (
            <>
              <button
                onClick={() => router.push("/")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 12px",
                  background: pathname === "/" ? "rgba(148, 163, 184, 0.15)" : "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.35)", borderRadius: "8px",
                  color: "#e5e7eb", fontSize: "14px", fontWeight: "500", cursor: "pointer",
                }}
              >
                Home
              </button>
              <button
                onClick={() => router.push("/pricing")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 12px",
                  background: pathname === "/pricing" ? "rgba(148, 163, 184, 0.15)" : "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.35)", borderRadius: "8px",
                  color: "#e5e7eb", fontSize: "14px", fontWeight: "500", cursor: "pointer",
                }}
              >
                Pricing
              </button>
            </>
          )}

          <button
            onClick={() => router.push("/login")}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? "2px" : "6px",
              padding: isMobile ? "6px 10px" : "8px 16px", borderRadius: "8px",
              border: "1px solid rgba(148, 163, 184, 0.45)", background: "rgba(15, 23, 42, 0.9)",
              color: "#f9fafb", fontSize: isMobile ? "10px" : "12px", fontWeight: "600", cursor: "pointer",
            }}
          >
            <LogIn size={isMobile ? 12 : 16} />
            {!isMobile && "Login"}
          </button>
        </div>
      </div>
    </header>
  );
}
