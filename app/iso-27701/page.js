import dynamic from 'next/dynamic';

export const metadata = {
  title: "ISO 27701 Compliance | CalVant",
  description: "Privacy Information Management with ISO 27701 on CalVant.",
  openGraph: {
    title: "ISO 27701 Compliance | CalVant",
    description: "Privacy Information Management with ISO 27701 on CalVant.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/iso-27701",
  },
};

const ISO_27701 = dynamic(() => import('@/modules/dashboard/FrameWorks/ISO_27701'), { ssr: false });

export default function Page() {
  return <ISO_27701 />;
}