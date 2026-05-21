import dynamic from 'next/dynamic';

export const metadata = {
  title: "Terms of Service | CalVant",
  description: "CalVant terms of service and usage policies.",
  openGraph: {
    title: "Terms of Service | CalVant",
    description: "CalVant terms of service and usage policies.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/terms",
  },
};

const FooterContentPage = dynamic(() => import('@/footer-pages/FooterContentPage'), { ssr: false });

export default function Page() {
  return <FooterContentPage type="terms" />;
}