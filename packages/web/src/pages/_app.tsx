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
          background: 'var(--surface)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
          boxShadow: '0 12px 40px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)',
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