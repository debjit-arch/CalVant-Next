// app/frameworks/[id]/page.jsx
import dynamic from "next/dynamic";
import { getPageMetadata } from "@/utils/getPageMetadata";

export async function generateMetadata({ params }) {
  const { id } = params;
  return getPageMetadata(`/frameworks/${id}`, {
    title: `Framework Compliance | CalVant`,
    description: `Learn about compliance with CalVant.`,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/frameworks/${id}` },
  });
}

const FrameworkPageClient = dynamic(
  () => import("./FrameworkPageClient"),
  { ssr: false }
);

export default function Page({ params }) {
  return <FrameworkPageClient frameworkId={params.id} />;
}