import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Changelog",
  description:
    "Stay up to date with VibeCodes releases — new features, improvements, and bug fixes across the AI-powered idea board platform.",
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
