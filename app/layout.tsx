import type { Metadata } from "next";
import { Orbitron, Space_Grotesk, JetBrains_Mono, Pathway_Gothic_One, Pixelify_Sans, Rubik_Glitch, Tektur } from "next/font/google";
import "./globals.css";

const fontOrbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const fontSpace = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fontPathway = Pathway_Gothic_One({
  weight: "400",
  variable: "--font-pathway",
  subsets: ["latin"],
});

const fontPixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
});

const fontRubik = Rubik_Glitch({
  weight: "400",
  variable: "--font-rubik",
  subsets: ["latin"],
});

const fontTektur = Tektur({
  variable: "--font-tektur",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MANUEL ARIAS | Creative Developer",
  description: "Neon Brutalist Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontOrbitron.variable} ${fontSpace.variable} ${fontMono.variable} ${fontPathway.variable} ${fontPixelify.variable} ${fontRubik.variable} ${fontTektur.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.cdnfonts.com/css/porter-sans-block" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/post-no-bills-colombo" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-mono bg-void text-on-dark m-0 p-0 selection:bg-primary selection:text-on-primary">
        {children}
      </body>
    </html>
  );
}
