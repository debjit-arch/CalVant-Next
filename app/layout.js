import "../src/styles/GlobalStyles.css";
import { UIProvider } from "@/context/UIContext";
import { FrameworkProvider } from "@/context/FrameworkContex";
import { LayoutProvider } from "@/context/LayoutContext";
import { SessionProvider } from "@/context/SessionContext";
import { SEOProvider } from "@/context/SEOContext";
import SidebarWrapper from "@/components/SidebarWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import DynamicSEO from "@/components/DynamicSEO";
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/', {
    title: 'CalVant | ISO Compliance & Risk Management Platform',
    description: 'Empower your organization with CalVant compliance platform.',
    verification: { google: '41e5318870c428ec' },
  });
}

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
                  <MainContentWrapper>{children}</MainContentWrapper>
                </LayoutProvider>
              </FrameworkProvider>
            </SessionProvider>
          </UIProvider>
        </SEOProvider>
      </body>
    </html>
  );
}
