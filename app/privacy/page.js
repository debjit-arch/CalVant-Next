import dynamic from 'next/dynamic';

export const metadata = {
  title: "Privacy Policy | CalVant",
  description: "CalVant privacy policy and data handling practices.",
  openGraph: {
    title: "Privacy Policy | CalVant",
    description: "CalVant privacy policy and data handling practices.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/privacy",
  },
};

const FooterContentPage = dynamic(() => import('@/footer-pages/FooterContentPage'), { ssr: false });

export default function Page() {
  return <FooterContentPage type="privacy" />;
}