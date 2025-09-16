import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import { AuthProvider } from "@/contexts/auth-context";
import { ClientLayoutWrapper } from "@/components/layout/client-layout-wrapper";
import { Toaster } from "@/components/ui/toaster";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const metadata: Metadata = {
  title: "Medicly - AI-Powered Movement Analysis",
  description: "Advanced pose detection and biomechanical analysis for healthcare professionals. Upload patient videos and get instant AI-powered movement tracking with precise pose landmarks.",
  keywords: ["pose detection", "healthcare", "medical AI", "movement analysis", "physical therapy", "biomechanics", "MediaPipe"],
  authors: [{ name: "Medicly Team" }],
  openGraph: {
    title: "Medicly - AI-Powered Movement Analysis",
    description: "Advanced pose detection and biomechanical analysis for healthcare professionals",
    type: "website",
    siteName: "Medicly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medicly - AI-Powered Movement Analysis",
    description: "Advanced pose detection and biomechanical analysis for healthcare professionals",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d4a2b', // Medicly darker green
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialUser: any = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded")
      .eq("id", user.id)
      .maybeSingle();
    initialUser = {
      id: user.id,
      email: user.email!,
      name: (user.user_metadata?.full_name || user.email?.split("@")[0] || "User") as string,
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      role: (profile?.role as any) || (user.user_metadata?.role as any) || "patient",
      onboarded: profile?.onboarded ?? false,
    };
  }

  return (
    <html lang="en" className={`scroll-smooth ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased font-sans" suppressHydrationWarning={true}>
        <AuthProvider initialUser={initialUser}>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
