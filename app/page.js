import { getPageMetadata } from '@/utils/getPageMetadata';
import HomePageClient from '@/components/HomePageClient';

export async function generateMetadata() {
  return getPageMetadata('/', {
    title: 'CalVant | ISO Compliance & Risk Management Platform',
    description: 'Empower your organization with CalVant compliance platform.',
  });
}

export default function Page() {
  return <HomePageClient />;
}