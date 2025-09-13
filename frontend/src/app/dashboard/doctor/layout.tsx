import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Dashboard",
  description: "Patient case management and video analysis dashboard for healthcare professionals",
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
