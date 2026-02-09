import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
