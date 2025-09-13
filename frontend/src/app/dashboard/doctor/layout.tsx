import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Dashboard",
  description: "Patient case management and video analysis dashboard for healthcare professionals",
};

export default function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
