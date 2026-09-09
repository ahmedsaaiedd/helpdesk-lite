import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const themeInitializer = `(function(){try{var t=localStorage.getItem("helpdesk-theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "HelpDesk Lite",
    template: "%s · HelpDesk Lite",
  },
  description: "A lightweight internal support workspace for clear ownership and fast resolution.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Script id="helpdesk-theme-initializer" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
