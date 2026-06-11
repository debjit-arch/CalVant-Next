import "../src/styles/GlobalStyles.css";
import { UIProvider } from "@/context/UIContext";
import { FrameworkProvider } from "@/context/FrameworkContex";
import { LayoutProvider } from "@/context/LayoutContext";
import { SessionProvider } from "@/context/SessionContext";
import SidebarWrapper from "@/components/SidebarWrapper";
import MainContentWrapper from "@/components/MainContentWrapper";
import { getPageMetadata } from '@/utils/getPageMetadata';
import CalVantAIPanel from "@/components/CalVantAIPanel";

export async function generateMetadata() {
  return getPageMetadata('/', {
    title: {
      default: 'CalVant | ISO Compliance & Risk Management Platform',
      template: '%s | CalVant',
    },
    description: 'Empower your organization with CalVant compliance platform.',
    verification: { google: '41e5318870c428ec' },
    icons: {
      icon: [
        { url: '/favicon-light.png', media: '(prefers-color-scheme: light)' },
        { url: '/favicon-dark.png', media: '(prefers-color-scheme: dark)' },
      ],
      apple: '/favicon-light.png',
    },
  });
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <UIProvider>
          <SessionProvider>
            <FrameworkProvider>
              <LayoutProvider>
                <SidebarWrapper />
                <MainContentWrapper>{children}</MainContentWrapper>
                <CalVantAIPanel />
              </LayoutProvider>
            </FrameworkProvider>
          </SessionProvider>
        </UIProvider>
      </body>
    </html>
  );
}