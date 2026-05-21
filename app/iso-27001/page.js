import dynamic from 'next/dynamic';

export const metadata = {
  title: "ISO 27001 Compliance | CalVant",
  description: "Streamline your ISO 27001 certification journey with CalVant.",
  openGraph: {
    title: "ISO 27001 Compliance | CalVant",
    description: "Streamline your ISO 27001 certification journey with CalVant.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/iso-27001",
  },
};

const ISO_27001 = dynamic(() => import('@/modules/dashboard/FrameWorks/ISO_27001'), { ssr: false });

export default function Page() {
  return <ISO_27001 />;
}