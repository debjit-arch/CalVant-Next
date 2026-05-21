import dynamic from 'next/dynamic';

export const metadata = {
  title: "Blog | CalVant",
  description: "Latest insights on compliance, security and data privacy from CalVant.",
  openGraph: {
    title: "Blog | CalVant",
    description: "Latest insights on compliance, security and data privacy from CalVant.",
    siteName: 'CalVant',
  },
  alternates: {
    canonical: "https://calvant.com/blog",
  },
};

const BlogPage = dynamic(() => import('@/static-pages/blog'), { ssr: false });

export default function Page() {
  return <BlogPage />;
}