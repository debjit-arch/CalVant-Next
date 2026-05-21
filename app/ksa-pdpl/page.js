import dynamic from 'next/dynamic';

export const metadata = {
  title: "KSA PDPL Compliance | CalVant",
  description: "Saudi Arabia Personal Data Protection Law compliance with CalVant.",
  openGraph: {
    title: "KSA PDPL Compliance | CalVant",
    description: "Saudi Arabia Personal Data Protection Law compliance with CalVant.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/ksa-pdpl",
  },
};

const KSA_PDPL = dynamic(() => import('@/modules/dashboard/FrameWorks/KSA_PDPL'), { ssr: false });

export default function Page() {
  return <KSA_PDPL />;
}