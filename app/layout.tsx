import JinniWidget from "@/components/JinniWidget";
import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://help.remotegenies.co"),
  title: {
    default: "RemoteGenies Help Center",
    template: "%s | RemoteGenies Help Center",
  },
  description:
    "Answers to your questions about RemoteGenies — pricing, tiers, tasks, payments, and hiring pre-vetted Filipino freelancers. Ask Jinni, our AI assistant, 24/7.",
  applicationName: "RemoteGenies Help Center",
  keywords: [
    "RemoteGenies",
    "hire Filipino freelancers",
    "virtual assistants",
    "help center",
    "pricing",
    "task management",
    "Genie tiers",
    "project coordinator",
  ],
  authors: [{ name: "RemoteGenies" }],
  creator: "RemoteGenies",
  publisher: "RemoteGenies",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "RemoteGenies Help Center",
    description:
      "Get sourced answers about RemoteGenies — pricing, tiers, tasks, payments. Ask Jinni, our AI assistant, 24/7.",
    url: "https://help.remotegenies.co",
    siteName: "RemoteGenies Help Center",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "RemoteGenies",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RemoteGenies Help Center",
    description:
      "Get sourced answers about RemoteGenies. Ask Jinni, our AI assistant, 24/7.",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased text-ink bg-white min-h-screen">
        {children}
        <JinniWidget />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-67122HLKN5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-67122HLKN5');
          `}
        </Script>

<Script id="brevo-conversations" strategy="afterInteractive">
          {`
            (function(d, w, c) {
              w.BrevoConversationsID = '5e1c75b5aec38d69bb54dbca';
              w.BrevoConversationsSetup = w.BrevoConversationsSetup || { startHidden: true };
              w[c] = w[c] || function() {
                (w[c].q = w[c].q || []).push(arguments);
              };
              var s = d.createElement('script');
              s.async = true;
              s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
              if (d.head) d.head.appendChild(s);
            })(document, window, 'BrevoConversations');
          `}
        </Script>
      </body>
    </html>
  );
}
