import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/thank-you/$id")({
  head: () => ({
    meta: [
      { title: "Thank you — Bounce The Pound" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const { id } = Route.useParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-8 w-8" />
        </div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Bounce The Pound
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Thank you — we&apos;ve received your assessment form.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The Bounce The Pound team will reach out within 24 hours to plan your consultation.
        </p>
        <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-left">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reference
          </div>
          <div className="mt-1 break-all font-mono text-sm text-foreground">{id}</div>
        </div>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start another assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
