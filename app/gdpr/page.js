import dynamic from 'next/dynamic';

export const metadata = {
  title: "GDPR Compliance | CalVant",
  description: "Achieve GDPR compliance with CalVant automated tools and frameworks.",
  openGraph: {
    title: "GDPR Compliance | CalVant",
    description: "Achieve GDPR compliance with CalVant automated tools and frameworks.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/gdpr",
  },
};

const GDPR = dynamic(() => import('@/modules/dashboard/FrameWorks/GDPR'), { ssr: false });

export default function Page() {
  return <GDPR />;
}