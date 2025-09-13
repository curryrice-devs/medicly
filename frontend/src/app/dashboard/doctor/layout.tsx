import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MediaPipe Pose Detection",
  description: "Simple pose detection using MediaPipe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
