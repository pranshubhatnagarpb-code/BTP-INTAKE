import { createFileRoute } from "@tanstack/react-router";
import { IntakeWizard } from "@/components/intake/Wizard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bounce The Pound - Assessment Form" },
      {
        name: "description",
        content: "A private assessment form to prepare your sustainable weight-loss consultation with the Bounce The Pound team.",
      },
      { property: "og:title", content: "Bounce The Pound - Assessment Form" },
      {
        property: "og:description",
        content: "Start your sustainable weight-loss plan in a few thoughtful steps.",
      },
    ],
  }),
  component: IntakePage,
});

function IntakePage() {
  return <IntakeWizard />;
}
