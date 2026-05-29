import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XO/RPS Rooms",
  description: "Create a private link and play XO or rock-paper-scissors in real time."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
