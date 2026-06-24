import "./globals.css";
import { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import TanstackProvider from "@/app/context/Tanstackprovider";
import CustomSessionProvider from "./context/Customsessionprovider";

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
      <body className="min-h-full flex flex-col text-black">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />
        <CustomSessionProvider>
          <TanstackProvider>{children}</TanstackProvider>
        </CustomSessionProvider>
      </body>
    </html>
  );
}
