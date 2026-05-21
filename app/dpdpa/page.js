import dynamic from 'next/dynamic';

export const metadata = {
  title: "DPDPA Compliance | CalVant",
  description: "How CalVant helps organizations comply with India Digital Personal Data Protection Act.",
  openGraph: {
    title: "DPDPA Compliance | CalVant",
    description: "How CalVant helps organizations comply with India Digital Personal Data Protection Act.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/dpdpa",
  },
};

const DPDPA = dynamic(() => import('@/modules/dashboard/FrameWorks/DPDPA'), { ssr: false });

export default function Page() {
  return <DPDPA />;
}