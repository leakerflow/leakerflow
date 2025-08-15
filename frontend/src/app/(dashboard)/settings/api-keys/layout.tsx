import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys | Leaker Flow',
  description: 'Manage your API keys for programmatic access to Leaker Flow',
  openGraph: {
    title: 'API Keys | Leaker Flow',
    description: 'Manage your API keys for programmatic access to Leaker Flow',
    type: 'website',
  },
};

export default async function APIKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
