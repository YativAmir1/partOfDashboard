import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "../globals.css";
import { CityMindProvider } from "@/context/CityMindContext";

// ─── CityMind AI — dedicated dark "control-room" root layout ────────────────
// Isolated root layout (its own <html>/<body>) so the cockpit is a full-screen
// immersive experience, independent of the light app shell in app/(shell)/.
// See node_modules/next/dist/docs/.../02-project-structure.md → "multiple root layouts".

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CityMind AI — מערכת הפעלה עירונית | רמת גן",
  description: "מערכת הפעלה עירונית מבוססת AI — מתובנות לפעולות בזמן אמת",
};

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved light preference before paint to avoid a dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('citymind-theme')==='light')document.documentElement.classList.add('citymind-light')}catch(e){}",
          }}
        />
      </head>
      <body className="bg-[#0b1220] text-slate-200 antialiased">
        <CityMindProvider>{children}</CityMindProvider>
      </body>
    </html>
  );
}
