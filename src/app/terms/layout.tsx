import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Terms of Service",
  description: "Read the VibeCodes Terms of Service.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
