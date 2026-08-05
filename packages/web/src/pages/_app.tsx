import type { AppProps } from 'next/app';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/graphql/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import '@/styles/globals.css';

function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '16px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: 500,
          background: theme === 'dark' ? '#1e293b' : '#fff',
          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          border: '1px solid',
          borderColor: theme === 'dark' ? 'rgba(51,65,85,0.6)' : 'rgba(226,232,240,0.6)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        },
        success: {
          iconTheme: { primary: '#059669', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#fff' },
        },
      }}
    />
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SocialApp - Connect & Share</title>
        <meta name="description" content="A modern social media platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ApolloProvider client={client}>
        <ThemeProvider>
          <AppToaster />
          <AuthProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </AuthProvider>
        </ThemeProvider>
      </ApolloProvider>
    </>
  );
}