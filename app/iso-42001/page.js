import dynamic from 'next/dynamic';

export const metadata = {
  title: "ISO 42001 AI Management | CalVant",
  description: "Manage AI risks and compliance with ISO 42001 using CalVant.",
  openGraph: {
    title: "ISO 42001 AI Management | CalVant",
    description: "Manage AI risks and compliance with ISO 42001 using CalVant.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/iso-42001",
  },
};

const ISO_42001 = dynamic(() => import('@/modules/dashboard/FrameWorks/ISO_42001'), { ssr: false });

export default function Page() {
  return <ISO_42001 />;
}