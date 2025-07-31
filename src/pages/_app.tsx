import { AuthProvider } from "ideas/context/AuthContext";
import type { AppProps } from "next/app";
import Head from "next/head";

function Cypherverse({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Basic Info*/}
        <meta charSet="utf-8" />
        <meta name="language" content="english" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta httpEquiv="content-type" content="text/html" />
        <title>Cypherverse</title>
        {/* SEO tags */}
        <meta name="author" content="https://github.com/CypherVerseLabs" />
        <meta
          name="description"
          content="An npm library that provides a standardized reality for the future of the 3D Web."
        />
        <meta
          name="keywords"
          content="muse, cyengine, 3d, webxr, 3d website, framework, npm"
        />
        <meta name="distribution" content="web" />
        {/* open graph */}
        <meta property="og:url" content="https://www.cypherverse.space" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="cyengine" />
        <meta
          property="og:description"
          content="An npm library that provides a WebXR-first 3D framework built with React and Three.js."
        />
        <meta property="og:image" content="/android-chrome-512x512.ico" />
        {/* icons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.ico"
        />
        <link
          rel="icon"
          type="image/ico"
          sizes="32x32"
          href="/favicon-32x32.ico"
        />
        <link
          rel="icon"
          type="image/ico"
          sizes="16x16"
          href="/favicon-16x16.ico"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
    </>
  );
}

export default Cypherverse;