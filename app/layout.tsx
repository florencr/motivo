import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://motivo.autos";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Motivo — Makina, motoçikleta, furgona, varka dhe kamionë në shitje në Shqipëri",
    template: "%s | Motivo",
  },
  description:
    "Shfleto dhe liston makina, motoçikleta, furgona, varka dhe kamionë në shitje në Shqipëri. Filtrim sipas markës, modelit, çmimit, kilometrazhit dhe më shumë në Motivo.",
  applicationName: "Motivo",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Motivo",
    url: "/",
    title: "Motivo — Mjete në shitje në Shqipëri",
    description:
      "Shfleto dhe liston makina, motoçikleta, furgona, varka dhe kamionë në shitje në Shqipëri.",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Motivo — Mjete në shitje në Shqipëri",
    description:
      "Shfleto dhe liston makina, motoçikleta, furgona, varka dhe kamionë në shitje në Shqipëri.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sq"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
