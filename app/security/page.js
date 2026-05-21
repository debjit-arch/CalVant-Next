import dynamic from 'next/dynamic';

export const metadata = {
  title: "Security | CalVant",
  description: "How CalVant keeps your data secure.",
  openGraph: {
    title: "Security | CalVant",
    description: "How CalVant keeps your data secure.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/security",
  },
};

const FooterContentPage = dynamic(() => import('@/footer-pages/FooterContentPage'), { ssr: false });

export default function Page() {
  return <FooterContentPage type="security" />;
}