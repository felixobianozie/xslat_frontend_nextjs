import Leftbar from "@/app/dashboard/components/Leftbar";
import Topbar from "@/app/dashboard/components/Topbar";
import { LeftbarProvider } from "@/app/dashboard/context/Leftbarprovider";
import Rightbar from "./components/Rightbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LeftbarProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Leftbar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:mx-5 ">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-4 lg:px-1 scrollbar-hide">
            <div className="mx-auto py-6 lg:py-8">{children}</div>
          </main>
        </div>

        <Rightbar />
      </div>
    </LeftbarProvider>
  );
}
