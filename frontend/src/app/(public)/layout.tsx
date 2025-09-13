import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Medicly – Modern healthcare",
  description: "Marketing and public pages for Medicly.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}


