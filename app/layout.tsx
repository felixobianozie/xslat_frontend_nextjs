import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LHS",
  description:
    "Lutheran High School, Obot Idim Ibesikpo Asutan L.G.A, Akwa Ibom State, Nigeria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
