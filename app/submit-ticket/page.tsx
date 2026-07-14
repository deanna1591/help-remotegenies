import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SubmitTicketForm from "./SubmitTicketForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit a Ticket | RemoteGenies Help Center",
  description: "Contact RemoteGenies support — we'll get back to you as soon as possible.",
};

export default function SubmitTicketPage() {
  return (
    <div className="min-h-screen bg-gradient-radial">
      <Header />
      <section className="py-12 md:py-16">
        <div className="container-narrow animate-fade-up">
          <div className="mb-6">
            <a href="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              ← Back to help center
            </a>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-4">Submit a ticket</h1>

          <div className="bg-primary-soft border border-primary/10 rounded-2xl px-5 py-4 mb-8">
            <p className="text-sm text-ink leading-relaxed">
              Something not working, or just have a question? Send it our way — a real person
              will get back to you soon.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-hero">
            <SubmitTicketForm />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
