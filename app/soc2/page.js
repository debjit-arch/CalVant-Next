import dynamic from 'next/dynamic';

export const metadata = {
  title: "SOC 2 Compliance | CalVant",
  description: "Automate your SOC 2 compliance program with CalVant.",
  openGraph: {
    title: "SOC 2 Compliance | CalVant",
    description: "Automate your SOC 2 compliance program with CalVant.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/soc2",
  },
};

const SOC2 = dynamic(() => import('@/modules/dashboard/FrameWorks/SOC2'), { ssr: false });

export default function Page() {
  return <SOC2 />;
}