import { getPageMetadata } from '@/utils/getPageMetadata';
import BlogPostClient from '@/components/BlogPostClient';

export async function generateMetadata({ params }) {
  return getPageMetadata(`/blog/${params.slug}`, {
    title: 'Blog | CalVant',
    description: 'Insights on ISO compliance, risk management and cybersecurity.',
  });
}

export default function Page() {
  return <BlogPostClient />;
}