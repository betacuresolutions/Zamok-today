import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Providers } from "@/store/Providers";
import { TravelpayoutsScript } from "@/components/TravelpayoutsScript";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { manrope } from "@/theme/fonts";
import { AppToaster } from "@/components/AppToaster";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { HomeInitialLoader } from "@/components/home/HomeInitialLoader";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

export const metadata: Metadata = {
  title: "Zamok Today — Flights",
  description: "Aviasales-style flight search starter",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <TravelpayoutsScript />
      </head>
      <body className={`${manrope.variable} font-sans antialiased`}>
        <Providers>
          <ThemeProvider>
            <I18nProvider>
              <AppToaster />
              <EmailVerificationBanner />
              <HomeInitialLoader />
              {children}
              <ScrollToTopButton />
            </I18nProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

