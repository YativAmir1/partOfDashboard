import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/context/DemoContext";
import { HazardProvider } from "@/context/HazardContext";
import { MapStateProvider } from "@/context/MapStateContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AlertBanner } from "@/components/layout/AlertBanner";
import { HazardToast } from "@/components/layout/HazardToast";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מערכת שליטה ובקרה | עיריית רמת גן",
  description: "מערכת שליטה ובקרה חכמה מבוססת בינה מלאכותית לעיריית רמת גן",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark-mode");
  }
} catch (_) {}
          `.trim(),
          }}
        />
      </head>
      <body className="bg-[#f4f4f4] text-[#1a1a1a] antialiased">
        <HazardProvider>
        <MapStateProvider>
        <DemoProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <AlertBanner />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
          <HazardToast />
        </DemoProvider>
        </MapStateProvider>
        </HazardProvider>
      </body>
    </html>
  );
}
