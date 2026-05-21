import "../src/styles/GlobalStyles.css";
import { UIProvider } from "@/context/UIContext";
import { FrameworkProvider } from "@/context/FrameworkContex";
import { LayoutProvider } from "@/context/LayoutContext";
import { SessionProvider } from "@/context/SessionContext";
import { SEOProvider } from "@/context/SEOContext";
import SidebarWrapper from "@/components/SidebarWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import DynamicSEO from "@/components/DynamicSEO";

export const metadata = {
  title: "CalVant | ISO Compliance & Risk Management Platform",
  description: "Empower your organization with CalVant's industry-leading ISO 27001 & 27701 compliance platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SEOProvider>
          <UIProvider>
            <SessionProvider>
              <FrameworkProvider>
                <LayoutProvider>
                  <DynamicSEO />
                  <SidebarWrapper />
                  <MainContentWrapper>
                    {children}
                  </MainContentWrapper>
                </LayoutProvider>
              </FrameworkProvider>
            </SessionProvider>
          </UIProvider>
        </SEOProvider>
      </body>
    </html>
  );
}