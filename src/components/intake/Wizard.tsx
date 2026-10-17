import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import bounceLogo from "@/bounce-the-pound-logo.png";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import { ChipGroup, FieldLabel, NumberStepper, Rating, Segmented, YesNo } from "./primitives";
import {
  initialState,
  buildPayload,
  DIET_RECALL_SLOTS,
  EXERCISE_TYPES,
  MEDICAL_HISTORY_ROWS,
  type MedicalRowKey,
  type WizardState,
  type WizardBranch,
} from "@/lib/intake/wizard-state";
import { submitIntake } from "@/lib/intake.functions";

const CLINIC_WHATSAPP = "+91 7045338184";

const COMPLAINTS = [
  "bloating",
  "acidity",
  "fatigue",
  "poor sleep",
  "weight gain",
  "weight loss difficulty",
  "hair fall",
  "skin issues",
  "low immunity",
  "sugar cravings",
  "hormonal issues",
  "joint pain",
  "constipation",
  "headaches",
  "low focus",
  "other",
];

const GOALS: { value: string; label: string }[] = [
  { value: "fat_loss", label: "Fat loss" },
  { value: "weight_gain", label: "Weight gain" },
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "energy", label: "More energy" },
  { value: "gut_health", label: "Gut health" },
  { value: "hormonal_balance", label: "Hormonal balance" },
  { value: "sports_performance", label: "Sports performance" },
  { value: "manage_medical_condition", label: "Manage a condition" },
  { value: "general_wellness", label: "General wellness" },
];

type StepDef = {
  id: string;
  title: string;
  subtitle?: string;
  render: () => React.ReactNode;
  validate: () => string | null;
};

function calcAge(dob: string): number | undefined {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age <= 120 ? age : undefined;
}

export function IntakeWizard() {
  const [state, setState] = React.useState<WizardState>(initialState);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const navigate = useNavigate();
  const submit = useServerFn(submitIntake);

  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  // ------------------- step definitions -------------------
  const steps: StepDef[] = [
    {
      id: "welcome",
      title: "Welcome to the beginning of your beautiful health journey! ✨",
      render: () => <WelcomeContent />,
      validate: () => null,
    },
    {
      id: "gender",
      title: "A few quick questions",
      subtitle: "These change what we ask you next.",
      render: () => (
        <div className="space-y-6">
          <div>
            <FieldLabel required>Gender</FieldLabel>
            <Segmented<WizardBranch>
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "other", label: "Others" },
              ]}
              value={state.branch}
              onChange={(v) => set("branch", v)}
            />
          </div>
          {state.branch === "female" && (
            <div>
              <FieldLabel required>Pregnancy / breastfeeding status</FieldLabel>
              <Segmented
                options={[
                  { value: "none", label: "None" },
                  { value: "trying", label: "Trying to conceive" },
                  { value: "pregnant", label: "Pregnant" },
                  { value: "lactating", label: "Breastfeeding" },
                ]}
                value={state.pregnancyStatus}
                onChange={(v) => set("pregnancyStatus", v)}
              />
            </div>
          )}
        </div>
      ),
      validate: () => {
        if (!state.branch) return "Please select your gender";
        if (state.branch === "female" && !state.pregnancyStatus)
          return "Please select a pregnancy status";
        return null;
      },
    },
    {
      id: "identity",
      title: "About you",
      subtitle: "Just the basics so we can reach you.",
      render: () => (
        <div className="space-y-5">
          <div>
            <Label htmlFor="fullName">
              Full name <span className="text-primary">*</span>
            </Label>
            <Input
              id="fullName"
              value={state.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Anaya Sharma"
              className="h-12"
            />
          </div>
          <div className="flex gap-3">
            <div className="min-w-0 flex-[3]">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={state.dob ?? ""}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const dob = e.target.value || undefined;
                  setState((s) => ({
                    ...s,
                    dob,
                    age: dob ? calcAge(dob) : s.age,
                  }));
                }}
                className="h-12 w-full"
              />
            </div>
            <div className="min-w-0 flex-[2]">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={0}
                max={120}
                value={state.age ?? ""}
                readOnly={!!state.dob}
                onChange={(e) => set("age", e.target.value ? Number(e.target.value) : undefined)}
                className={cn("h-12 w-full", state.dob && "bg-muted")}
              />
              {state.dob ? (
                <p className="mt-1 text-xs text-muted-foreground">Auto-calculated from DOB</p>
              ) : null}
            </div>
          </div>
          <div>
            <Label htmlFor="city">
              City <span className="text-primary">*</span>
            </Label>
            <Input
              id="city"
              value={state.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="City you live in"
              className="h-12"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={state.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street address (optional)"
              className="h-12"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">
                Phone <span className="text-primary">*</span>
              </Label>
              <Input
                id="phone"
                inputMode="tel"
                value={state.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="email">
                Email <span className="text-primary">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={state.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                className="h-12"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="profession">Profession</Label>
            <Input
              id="profession"
              value={state.profession ?? ""}
              onChange={(e) => set("profession", e.target.value)}
              placeholder="e.g. Teacher, Engineer"
              className="h-12"
            />
          </div>
          <div>
            <FieldLabel>Marital status</FieldLabel>
            <Segmented
              options={[
                { value: "single", label: "Single" },
                { value: "married", label: "Married" },
                { value: "divorced", label: "Divorced" },
                { value: "widowed", label: "Widowed" },
              ]}
              value={state.maritalStatus}
              onChange={(v) => set("maritalStatus", v)}
            />
          </div>
          <div>
            <FieldLabel>Children</FieldLabel>
            <Segmented
              options={[
                { value: "none", label: "None" },
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3+", label: "3+" },
              ]}
              value={state.childrenCount}
              onChange={(v) => set("childrenCount", v)}
            />
          </div>
          <div>
            <Label htmlFor="referredBy">Referred by</Label>
            <Input
              id="referredBy"
              value={state.referredBy ?? ""}
              onChange={(e) => set("referredBy", e.target.value)}
              placeholder="Friend, Instagram, etc."
              className="h-12"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your answers are private and used only by our nutrition team to plan your consultation.
            We never sell data.
          </p>
        </div>
      ),
      validate: () => {
        if (!state.fullName.trim()) return "Name is required";
        if (!state.city.trim()) return "City is required";
        if (!state.dob && !state.age) return "Provide date of birth or age";
        if (!state.phone?.trim()) return "Phone number is required";
        if (!/^[+0-9 ()-]{7,20}$/.test(state.phone.trim())) return "Enter a valid phone number";
        if (!state.email?.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) return "Enter a valid email";
        return null;
      },
    },
    ...(state.branch === "female" && state.pregnancyStatus === "trying"
      ? [
          {
            id: "fertility-details",
            title: "Fertility details",
            render: () => <FertilityStepContent state={state} set={set} />,
            validate: () => null,
          } satisfies StepDef,
        ]
      : []),
    {
      id: "goal",
      title: "What are your goals?",
      subtitle: "Pick all that apply.",
      render: () => (
        <ChipGroup
          options={GOALS}
          value={state.primaryGoals}
          onChange={(v) => set("primaryGoals", v as string[])}
          multi
        />
      ),
      validate: () => (state.primaryGoals.length ? null : "Pick at least one goal"),
    },
    {
      id: "complaints",
      title: "Top concerns right now",
      subtitle: "Pick all that apply.",
      render: () => (
        <ChipGroup
          options={COMPLAINTS.map((c) => ({ value: c, label: c }))}
          value={state.chiefComplaints}
          onChange={(v) => set("chiefComplaints", v as string[])}
          multi
        />
      ),
      validate: () => (state.chiefComplaints.length === 0 ? "Pick at least one" : null),
    },
    {
      id: "body",
      title: "Anthropometric measurement",
      render: () => (
        <div className="space-y-6">
          <div>
            <FieldLabel required>Current weight</FieldLabel>
            <NumberStepper
              value={state.weightKg}
              onChange={(v) => set("weightKg", v)}
              min={2}
              max={300}
              step={0.5}
              suffix="kg"
            />
          </div>
          <div>
            <FieldLabel required>Height</FieldLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberStepper
                value={state.heightFt}
                onChange={(v) => set("heightFt", v)}
                min={1}
                max={8}
                step={1}
                suffix="ft"
              />
              <NumberStepper
                value={state.heightIn}
                onChange={(v) => set("heightIn", v)}
                min={0}
                max={11}
                step={1}
                suffix="in"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => (!state.weightKg || !state.heightFt ? "Enter weight and height" : null),
    },
    {
      id: "lifestyle",
      title: "Daily rhythm",
      render: () => (
        <div className="space-y-6">
          <div>
            <FieldLabel required>Sleep per night</FieldLabel>
            <NumberStepper
              value={state.sleepHours}
              onChange={(v) => set("sleepHours", v)}
              min={3}
              max={14}
              step={0.5}
              suffix="hrs"
            />
          </div>
          <div>
            <FieldLabel required>Water intake</FieldLabel>
            <Segmented
              options={[
                { value: "<1L", label: "<1L" },
                { value: "1-2L", label: "1–2L" },
                { value: "2-3L", label: "2–3L" },
                { value: "3L+", label: "3L+" },
              ]}
              value={state.waterIntake}
              onChange={(v) => set("waterIntake", v)}
            />
          </div>
        </div>
      ),
      validate: () =>
        !state.sleepHours || !state.waterIntake ? "Complete sleep and water intake" : null,
    },
    {
      id: "symptoms",
      title: "How are you feeling lately?",
      subtitle: "1 = very poor, 5 = excellent.",
      render: () => (
        <div className="space-y-6">
          {(
            [
              ["rSleep", "Sleep quality", "5 = sleeping very well"],
              ["rDigestion", "Digestion", "5 = excellent digestion"],
              ["rEnergy", "Daily energy", "5 = high energy all day"],
              ["rFatigue", "Fatigue level", "1 = always tired · 5 = rarely tired"],
              ["rSkin", "Skin health", "5 = clear, healthy skin"],
              ["rHair", "Hair health", "5 = strong, healthy hair"],
            ] as const
          ).map(([k, label, hint]) => (
            <div key={k}>
              <FieldLabel required hint={hint}>
                {label}
              </FieldLabel>
              <Rating value={state[k] as number | undefined} onChange={(n) => set(k, n)} />
            </div>
          ))}
        </div>
      ),
      validate: () =>
        !state.rSleep ||
        !state.rDigestion ||
        !state.rEnergy ||
        !state.rFatigue ||
        !state.rSkin ||
        !state.rHair
          ? "Rate all six areas"
          : null,
    },
    {
      id: "optional",
      title: "Complete more details now",
      subtitle:
        "Optional — sharing more lets us prepare a deeper plan before your call. You can skip and submit.",
      render: () => <OptionalSections state={state} set={set} />,
      validate: () => null,
    },
  ];

  const safeStepIdx = Math.min(stepIdx, steps.length - 1);
  React.useEffect(() => {
    if (safeStepIdx !== stepIdx) setStepIdx(safeStepIdx);
  }, [safeStepIdx, stepIdx]);
  const step = steps[safeStepIdx];
  const total = steps.length;
  const isFirst = safeStepIdx === 0;
  const isLast = safeStepIdx === total - 1;
  const progress = ((safeStepIdx + 1) / total) * 100;

  const handleNext = async () => {
    const err = step.validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (safeStepIdx < total - 1) {
      setStepIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // submit
    await handleSubmit();
  };

  const handleSkipAndSubmit = () => handleSubmit();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = buildPayload(state);
      const res = await submit({ data: payload });
      navigate({ to: "/thank-you/$id", params: { id: res.submissionId } });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not submit. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top progress strip */}
      <header className="sticky top-0 z-10 border-b bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 pt-3 pb-3">
          {/* Bounce The Pound branding */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={bounceLogo} alt="Bounce The Pound" className="h-8 w-auto object-contain" />
              <div className="leading-none">
                <p className="text-xs font-semibold text-foreground">Bounce The Pound</p>
                <p className="text-[10px] text-muted-foreground">Sustainable Weight Loss</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {isFirst
                ? "Welcome"
                : `Step ${safeStepIdx} of ${total - 1} · ${isLast ? "Optional" : "Required"}`}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8">
        <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {step.title}
          </h1>
          {step.subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{step.subtitle}</p>
          ) : null}
          <div className="mt-8">{step.render()}</div>
        </div>
      </main>

      {/* Sticky bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          {isLast && (
            <button
              type="button"
              onClick={handleSkipAndSubmit}
              disabled={submitting}
              className="mb-2 block w-full text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50 sm:hidden"
            >
              Skip & submit
            </button>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={isFirst || submitting}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              <ArrowLeft /> Back
            </Button>

            {isLast ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipAndSubmit}
                    disabled={submitting}
                  >
                    Skip & submit
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-full px-6"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        Submit <Check />
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full px-6 sm:hidden"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Submit <Check />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={handleNext}
                disabled={submitting}
                className="rounded-full px-6"
              >
                {isFirst ? "Let's begin" : "Continue"} <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

// ------------------- welcome page -------------------

function WelcomeContent() {
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-foreground">
      <div className="text-sm">
        <p className="font-semibold">Dt. Saloni Bhatt Koradia</p>
        <p className="text-muted-foreground">Contact: {CLINIC_WHATSAPP}</p>
      </div>
      <p>
        This assessment form is not just a set of questions, it's a window into your lifestyle,
        habits, emotions, routines, food choices, sleep, stress, and the real YOU.
      </p>
      <p>
        The more honestly you share, the more precisely I can understand your body, your challenges,
        and what truly works for you.
      </p>
      <div className="space-y-1">
        <p>There is no right or wrong answer here.</p>
        <p>No judgement. No pressure. No perfection expected. :)</p>
        <p>This is simply about awareness and awareness is where transformation begins 🌱</p>
      </div>
      <p>
        Every answer you give helps me design a plan that fits your life, not one that forces you
        into unrealistic rules.
      </p>
      <p>Think of this as us laying the foundation together, strong, realistic, and sustainable.</p>
      <p>Once this form is filled, your personalised health journey officially begins!! :)</p>
      <div className="rounded-2xl border bg-secondary/40 p-4">
        <p className="mb-2 font-medium">
          A few important points to remember while filling the assessment form:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Take your time and fill it in a calm, relaxed state of mind</li>
          <li>Please answer honestly, even if you feel something isn't "ideal".</li>
          <li>If something doesn't apply to you, simply mention it</li>
          <li>
            This form is the first step towards understanding your body better and I'm excited to
            start this journey with you
          </li>
        </ul>
      </div>
      <p className="font-medium">✨ Let's begin! ✨</p>
      <div className="border-t pt-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Our Clinics:</p>
        <p>
          Mulund (East): Office no 107, HS Pearl Commercial, Abv HS Office, Sane Guruji Nagar,
          Mumbai 81
        </p>
        <p>Mulund (West): B/5 Suryaprakash Building, M.G. Road, Above Bank of Baroda, Mumbai 80</p>
        <p>Online: Global Consults Virtually 🌍</p>
      </div>
    </div>
  );
}

// ------------------- optional sections -------------------

function Section({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold",
          open ? "border-b bg-secondary/50" : "hover:bg-secondary/30",
        )}
      >
        {title}
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="space-y-6 p-5">{children}</div> : null}
    </div>
  );
}

type SetFn = <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;

function OptionalSections({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <div className="space-y-3">
      <Section title="Medical history" defaultOpen>
        <p className="-mt-2 text-sm text-muted-foreground">Tick whichever applies to you.</p>
        <MedicalRow row="heart" state={state} set={set} otherKey="heartOther" />
        <MedicalRow row="diabetes" state={state} set={set} />
        {state.branch === "female" && (
          <>
            <MedicalRow row="pcos" state={state} set={set} />
            <div>
              <Label htmlFor="lastPeriodDate">Last menstrual period (LMP)</Label>
              <Input
                id="lastPeriodDate"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={state.lastPeriodDate ?? ""}
                onChange={(e) => set("lastPeriodDate", e.target.value)}
                className="mt-2 h-12"
              />
            </div>
          </>
        )}
        <MedicalRow row="thyroid" state={state} set={set} />
        <MedicalRow row="kidney" state={state} set={set} otherKey="kidneyOther" />
        <div>
          <Label htmlFor="chronicIllnessOrSurgery">Any chronic illness / surgery done before</Label>
          <Textarea
            id="chronicIllnessOrSurgery"
            rows={2}
            maxLength={400}
            value={state.chronicIllnessOrSurgery ?? ""}
            onChange={(e) => set("chronicIllnessOrSurgery", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="orthopedicAilment">
            Any orthopedic ailment? (knee pain / joint pain / back)
          </Label>
          <Textarea
            id="orthopedicAilment"
            rows={2}
            maxLength={400}
            value={state.orthopedicAilment ?? ""}
            onChange={(e) => set("orthopedicAilment", e.target.value)}
            className="mt-2"
          />
        </div>
        <MedicalRow row="gut" state={state} set={set} otherKey="gutOther" />
        <div>
          <Label htmlFor="allergies">Allergies / intolerances</Label>
          <Input
            id="allergies"
            value={state.allergies ?? ""}
            onChange={(e) => set("allergies", e.target.value)}
            placeholder="e.g. Gluten, Lactose, Nuts"
            className="mt-2 h-12"
          />
        </div>
      </Section>

      <Section title="Medications & supplements">
        <MedicationsEditor state={state} set={set} />
      </Section>

      <Section title="Digestion detail">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel hint="5 = very severe acidity">Acidity severity (1–5)</FieldLabel>
            <Rating value={state.acidityRating} onChange={(n) => set("acidityRating", n)} />
          </div>
          <div>
            <FieldLabel hint="5 = very severe bloating">Bloating severity (1–5)</FieldLabel>
            <Rating value={state.bloatingRating} onChange={(n) => set("bloatingRating", n)} />
          </div>
          <div>
            <FieldLabel hint="5 = very severe constipation">Constipation severity (1–5)</FieldLabel>
            <Rating
              value={state.constipationRating}
              onChange={(n) => set("constipationRating", n)}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Bowel frequency</FieldLabel>
          <Segmented
            options={[
              { value: "<1/day", label: "<1/day" },
              { value: "1/day", label: "1/day" },
              { value: "2-3/day", label: "2–3/day" },
              { value: ">3/day", label: ">3/day" },
            ]}
            value={state.bowelFrequency}
            onChange={(v) => set("bowelFrequency", v)}
          />
        </div>
        <div>
          <FieldLabel>Stool consistency</FieldLabel>
          <ChipGroup
            options={["hard", "normal", "soft", "loose", "mucus"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={state.stoolConsistency}
            onChange={(v) => set("stoolConsistency", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Bloating timing</FieldLabel>
          <ChipGroup
            options={["morning", "after meals", "evening", "night", "all day"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={state.bloatingTiming}
            onChange={(v) => set("bloatingTiming", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Acidity triggers</FieldLabel>
          <ChipGroup
            options={["spicy", "fried", "coffee", "tea", "stress", "skipping meals"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={state.acidityTriggers}
            onChange={(v) => set("acidityTriggers", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Other digestive symptoms</FieldLabel>
          <ChipGroup
            options={["nausea", "vomiting", "reflux / heartburn", "none"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={state.digestiveSymptoms}
            onChange={(v) => set("digestiveSymptoms", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>IBS (Irritable Bowel Syndrome)?</FieldLabel>
          <YesNo value={state.ibs} onChange={(v) => set("ibs", v)} />
        </div>
      </Section>

      <Section title="Food pattern">
        <div>
          <FieldLabel>Diet type</FieldLabel>
          <Segmented
            options={[
              { value: "veg", label: "Veg" },
              { value: "non_veg", label: "Non-veg" },
              { value: "eggetarian", label: "Eggetarian" },
              { value: "pescatarian", label: "Pescatarian" },
              { value: "vegan", label: "Vegan" },
              { value: "jain", label: "Jain" },
            ]}
            value={state.dietType}
            onChange={(v) => set("dietType", v)}
          />
        </div>
        <div>
          <FieldLabel>Cuisines you eat most</FieldLabel>
          <ChipGroup
            options={[
              "north indian",
              "south indian",
              "street food / chaat",
              "continental",
              "chinese",
              "italian",
              "mexican",
              "thai",
              "japanese",
              "middle eastern",
            ].map((v) => ({ value: v, label: v }))}
            value={state.cuisines}
            onChange={(v) => set("cuisines", v as string[])}
            multi
            allowOther
          />
        </div>
        <div>
          <FieldLabel>Dining out (times/week)</FieldLabel>
          <NumberStepper
            value={state.eatsOutPerWeek}
            onChange={(v) => set("eatsOutPerWeek", v)}
            min={0}
            max={21}
          />
        </div>
        <div>
          <FieldLabel>Packaged / processed food</FieldLabel>
          <Segmented
            options={[
              { value: "rarely", label: "Rarely" },
              { value: "1-2_wk", label: "1–2/wk" },
              { value: "3-5_wk", label: "3–5/wk" },
              { value: "daily", label: "Daily" },
              { value: "multi_daily", label: "Multiple/day" },
            ]}
            value={state.packagedFoodFrequency}
            onChange={(v) => set("packagedFoodFrequency", v)}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Sugar drinks?</FieldLabel>
            <YesNo value={state.sugarDrinks} onChange={(v) => set("sugarDrinks", v)} />
          </div>
          <div>
            <FieldLabel>Energy / carbonated drinks</FieldLabel>
            <Segmented
              options={[
                { value: "never", label: "Never" },
                { value: "rarely", label: "Rarely" },
                { value: "sometimes", label: "Sometimes" },
                { value: "daily", label: "Daily" },
              ]}
              value={state.energyCarbonatedDrinks}
              onChange={(v) => set("energyCarbonatedDrinks", v)}
            />
          </div>
          <div>
            <FieldLabel>Tea / coffee per day</FieldLabel>
            <NumberStepper
              value={state.teaCoffeePerDay}
              onChange={(v) => set("teaCoffeePerDay", v)}
              min={0}
              max={20}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Primarily home cooked?</FieldLabel>
          <Segmented
            options={[
              { value: "yes", label: "Yes" },
              { value: "partially", label: "Partially" },
              { value: "rarely", label: "Rarely" },
            ]}
            value={state.homeCooked}
            onChange={(v) => set("homeCooked", v)}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Who cooks?</FieldLabel>
            <Segmented
              options={[
                { value: "self", label: "Self" },
                { value: "family", label: "Family" },
                { value: "cook_help", label: "Cook / help" },
                { value: "mix", label: "Mix" },
              ]}
              value={state.whoCooks}
              onChange={(v) => set("whoCooks", v)}
            />
          </div>
          <div>
            <Label htmlFor="cookingOil">Cooking oil / fat</Label>
            <Input
              id="cookingOil"
              value={state.cookingOil ?? ""}
              onChange={(e) => set("cookingOil", e.target.value)}
              placeholder="Ghee, coconut oil..."
              className="h-12"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="cravings">Cravings</Label>
          <Input
            id="cravings"
            value={state.cravings ?? ""}
            onChange={(e) => set("cravings", e.target.value)}
            placeholder="e.g. Sweets, salty"
            className="mt-2 h-12"
          />
        </div>
        <div>
          <FieldLabel>How long do you take to finish a meal?</FieldLabel>
          <Segmented
            options={[
              { value: "quick_10_15", label: "Within 10–15 mins (quick eater)" },
              { value: "slow_20_plus", label: "20 mins or more (slow eater)" },
            ]}
            value={state.eatingSpeed}
            onChange={(v) => set("eatingSpeed", v)}
          />
        </div>
        <div>
          <FieldLabel>Binge / emotional eating?</FieldLabel>
          <Segmented
            options={[
              { value: "no", label: "No" },
              { value: "occasionally", label: "Occasionally" },
              { value: "frequently", label: "Frequently" },
            ]}
            value={state.bingeEating}
            onChange={(v) => set("bingeEating", v)}
          />
        </div>
        <div>
          <FieldLabel hint="Write down everything you ate and drank yesterday, with the time.">
            24 hr diet recall
          </FieldLabel>
          <DietRecallEditor state={state} set={set} />
        </div>
      </Section>

      <Section title="Lifestyle">
        <div>
          <FieldLabel hint="Fill in only the ones you do.">
            What form of exercise do you do?
          </FieldLabel>
          <ExerciseEditor state={state} set={set} />
        </div>
        <div>
          <FieldLabel>Do you smoke?</FieldLabel>
          <YesNo value={state.smokingActive} onChange={(v) => set("smokingActive", v)} />
          {state.smokingActive ? (
            <Input
              placeholder="How often? (e.g. daily, occasionally)"
              value={state.smokingFreq ?? ""}
              onChange={(e) => set("smokingFreq", e.target.value)}
              className="mt-3 h-12"
            />
          ) : null}
        </div>
        <div>
          <FieldLabel>Do you drink alcohol?</FieldLabel>
          <YesNo value={state.alcoholActive} onChange={(v) => set("alcoholActive", v)} />
          {state.alcoholActive ? (
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>How often?</FieldLabel>
                <Segmented
                  options={[
                    { value: "occasionally", label: "Occasionally" },
                    { value: "1-2x/week", label: "1–2x/week" },
                    { value: "3-5x/week", label: "3–5x/week" },
                    { value: "daily", label: "Daily" },
                  ]}
                  value={
                    state.alcoholFreq as
                      | "occasionally"
                      | "1-2x/week"
                      | "3-5x/week"
                      | "daily"
                      | undefined
                  }
                  onChange={(v) => set("alcoholFreq", v)}
                />
              </div>
              <div>
                <FieldLabel>How much in one sitting?</FieldLabel>
                <Segmented
                  options={[
                    { value: "1-2 drinks", label: "1–2 drinks" },
                    { value: "3-4 drinks", label: "3–4 drinks" },
                    { value: "5-6 drinks", label: "5–6 drinks" },
                    { value: "7+ drinks", label: "7+ drinks" },
                  ]}
                  value={
                    state.alcoholDrinksPerSession as
                      | "1-2 drinks"
                      | "3-4 drinks"
                      | "5-6 drinks"
                      | "7+ drinks"
                      | undefined
                  }
                  onChange={(v) => set("alcoholDrinksPerSession", v)}
                />
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      {state.branch === "female" && <FemaleSection state={state} set={set} />}

      <Section title="Anything else">
        <div>
          <FieldLabel hint="Blood tests, prescriptions or any other medical reports.">
            How will you share your reports?
          </FieldLabel>
          <Segmented
            options={[
              { value: "email", label: "Email attachment" },
              { value: "whatsapp", label: "Send separately on WhatsApp" },
              { value: "none", label: "No reports" },
            ]}
            value={state.reportsSharing}
            onChange={(v) => set("reportsSharing", v)}
          />
          {state.reportsSharing === "whatsapp" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Please send them on WhatsApp to {CLINIC_WHATSAPP}.
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="specialRequest">Any special request</Label>
          <Textarea
            id="specialRequest"
            rows={3}
            maxLength={500}
            value={state.specialRequest ?? ""}
            onChange={(e) => set("specialRequest", e.target.value)}
            className="mt-2"
          />
        </div>
      </Section>
    </div>
  );
}

function MedicationsEditor({ state, set }: { state: WizardState; set: SetFn }) {
  const meds = state.medications;
  const update = (i: number, patch: Partial<{ name: string; frequency: string }>) => {
    const next = meds.map((m, idx) => (idx === i ? { ...m, ...patch } : m));
    set("medications", next);
  };
  const add = () => set("medications", [...meds, { name: "" }]);
  const remove = (i: number) =>
    set(
      "medications",
      meds.filter((_, idx) => idx !== i),
    );
  return (
    <div className="space-y-3">
      {meds.length === 0 ? <p className="text-sm text-muted-foreground">None added yet.</p> : null}
      {meds.map((m, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            className="h-11 min-w-0 flex-[3]"
            placeholder="Name"
            value={m.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <Input
            className="h-11 min-w-0 flex-[2]"
            placeholder="Freq."
            value={m.frequency ?? ""}
            onChange={(e) => update(i, { frequency: e.target.value })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md p-1 text-sm text-muted-foreground hover:text-destructive"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add}>
        + Add medication
      </Button>
    </div>
  );
}

const EXCLUSIVE_OPTIONS = ["None", "Don't know"];

// One row of the medical history table. "None" / "Don't know" can't be combined
// with anything else in the row.
function MedicalRow({
  row,
  state,
  set,
  otherKey,
}: {
  row: MedicalRowKey;
  state: WizardState;
  set: SetFn;
  otherKey?: "heartOther" | "kidneyOther" | "gutOther";
}) {
  const { label, options } = MEDICAL_HISTORY_ROWS[row];
  const value = state.medical[row];
  const onChange = (next: string[]) => {
    const added = next.find((v) => !value.includes(v));
    const cleaned =
      added && EXCLUSIVE_OPTIONS.includes(added)
        ? [added]
        : next.filter((v) => !EXCLUSIVE_OPTIONS.includes(v));
    set("medical", { ...state.medical, [row]: cleaned });
  };
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <ChipGroup
        options={options.map((o) => ({ value: o, label: o }))}
        value={value}
        onChange={(v) => onChange(v as string[])}
        multi
      />
      {otherKey && value.includes("Others") ? (
        <Input
          placeholder="Please mention"
          maxLength={120}
          value={state[otherKey] ?? ""}
          onChange={(e) => set(otherKey, e.target.value)}
          className="mt-3 h-12"
        />
      ) : null}
    </div>
  );
}

function ExerciseEditor({ state, set }: { state: WizardState; set: SetFn }) {
  const rows = state.exercises;
  const update = (i: number, patch: Partial<WizardState["exercises"][number]>) =>
    set(
      "exercises",
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  const num = (v: string, max: number) =>
    v === "" ? undefined : Math.min(max, Math.max(0, Math.round(Number(v))));
  return (
    <div className="space-y-4">
      {EXERCISE_TYPES.map((type, i) => (
        <div key={type} className="rounded-xl border p-3">
          {type === "Others" ? (
            <Input
              placeholder="Others, please mention"
              maxLength={60}
              value={state.exerciseOtherName ?? ""}
              onChange={(e) => set("exerciseOtherName", e.target.value)}
              className="mb-2 h-10"
            />
          ) : (
            <p className="mb-2 text-sm font-medium">{type}</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-xs text-muted-foreground">Duration (min)</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={600}
                value={rows[i]?.durationMin ?? ""}
                onChange={(e) => update(i, { durationMin: num(e.target.value, 600) })}
                className="h-10"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Times / week</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={21}
                value={rows[i]?.timesPerWeek ?? ""}
                onChange={(e) => update(i, { timesPerWeek: num(e.target.value, 21) })}
                className="h-10"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Timing</span>
              <Input
                type="time"
                value={rows[i]?.timing ?? ""}
                onChange={(e) => update(i, { timing: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DietRecallEditor({ state, set }: { state: WizardState; set: SetFn }) {
  const rows = state.dietRecall;
  const update = (i: number, patch: Partial<{ time: string; food: string }>) => {
    set(
      "dietRecall",
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  };
  return (
    <div className="space-y-5">
      {DIET_RECALL_SLOTS.map((label, i) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <Input
              type="time"
              className="h-9 w-[9rem] shrink-0"
              value={rows[i]?.time ?? ""}
              onChange={(e) => update(i, { time: e.target.value })}
            />
          </div>
          <Textarea
            rows={2}
            maxLength={400}
            placeholder="What did you eat / drink, and how much?"
            value={rows[i]?.food ?? ""}
            onChange={(e) => update(i, { food: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function FertilityStepContent({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>How long trying to conceive?</FieldLabel>
        <Segmented
          options={[
            { value: "under_6mo", label: "< 6 months" },
            { value: "6_12mo", label: "6–12 months" },
            { value: "1_2yr", label: "1–2 years" },
            { value: "2yr_plus", label: "2+ years" },
          ]}
          value={state.fertilityTryingDuration}
          onChange={(v) => set("fertilityTryingDuration", v)}
        />
      </div>
      <div>
        <FieldLabel>Fertility treatments</FieldLabel>
        <Segmented
          options={[
            { value: "none", label: "None" },
            { value: "iui", label: "IUI" },
            { value: "ivf", label: "IVF" },
            { value: "other", label: "Other" },
          ]}
          value={state.fertilityTreatment}
          onChange={(v) => set("fertilityTreatment", v)}
        />
      </div>
      <div>
        <Label htmlFor="fertilityConditions">Diagnosed fertility conditions</Label>
        <Textarea
          id="fertilityConditions"
          rows={3}
          maxLength={300}
          placeholder="e.g. Low AMH, endometriosis..."
          value={state.fertilityConditions ?? ""}
          onChange={(e) => set("fertilityConditions", e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  );
}

function FemaleSection({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <Section title="Women's health (confidential)">
      <div>
        <FieldLabel>Periods status</FieldLabel>
        <Segmented
          options={[
            { value: "regular", label: "Regular" },
            { value: "irregular", label: "Irregular" },
            { value: "absent", label: "Absent" },
            { value: "menopausal", label: "Menopausal" },
          ]}
          value={state.periodsStatus}
          onChange={(v) => set("periodsStatus", v)}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Cycle length</FieldLabel>
          <NumberStepper
            value={state.cycleLengthDays}
            onChange={(v) => set("cycleLengthDays", v)}
            min={10}
            max={90}
            suffix="days"
          />
        </div>
        <div>
          <FieldLabel>Period days</FieldLabel>
          <NumberStepper
            value={state.periodDays}
            onChange={(v) => set("periodDays", v)}
            min={1}
            max={15}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Flow</FieldLabel>
        <ChipGroup
          options={["light", "moderate", "heavy", "very_heavy", "clots"].map((v) => ({
            value: v,
            label: v.replace("_", " "),
          }))}
          value={state.flow}
          onChange={(v) => set("flow", v as string[])}
          multi
        />
      </div>
      <div>
        <FieldLabel>PMS symptoms</FieldLabel>
        <ChipGroup
          options={[
            "mood swings",
            "cramps",
            "bloating",
            "breast tenderness",
            "headaches",
            "cravings",
            "fatigue",
          ].map((v) => ({ value: v, label: v }))}
          value={state.pmsSymptoms}
          onChange={(v) => set("pmsSymptoms", v as string[])}
          multi
        />
      </div>
      <div>
        <FieldLabel hint="5 = very severe pain">Pain severity (1–5)</FieldLabel>
        <Rating value={state.painSeverity} onChange={(n) => set("painSeverity", n)} />
      </div>
      <div>
        <FieldLabel>Pain medication for periods?</FieldLabel>
        <YesNo value={state.periodPainMeds} onChange={(v) => set("periodPainMeds", v)} />
      </div>
      <div>
        <FieldLabel>Keyhole surgery / laparoscopy for endometriosis?</FieldLabel>
        <YesNo
          value={state.endometriosisSurgery}
          onChange={(v) => set("endometriosisSurgery", v)}
        />
      </div>
      <div>
        <FieldLabel>Hysterectomy?</FieldLabel>
        <YesNo value={state.hysterectomy} onChange={(v) => set("hysterectomy", v)} />
      </div>
      <div>
        <FieldLabel>On hormonal intervention?</FieldLabel>
        <YesNo value={state.hormonalActive} onChange={(v) => set("hormonalActive", v)} />
        {state.hormonalActive ? (
          <div className="mt-3">
            <ChipGroup
              options={[
                { value: "ocp", label: "OCPs" },
                { value: "hormonal_iud", label: "Hormonal IUD" },
                { value: "hrt", label: "HRT" },
                { value: "fertility_meds", label: "Fertility meds" },
                { value: "none", label: "None" },
              ]}
              value={state.hormonalTypes}
              onChange={(v) => set("hormonalTypes", v as string[])}
              multi
            />
          </div>
        ) : null}
      </div>
      <div>
        <FieldLabel>Menopause reached?</FieldLabel>
        <YesNo value={state.menopauseReached} onChange={(v) => set("menopauseReached", v)} />
        {state.menopauseReached ? (
          <div className="mt-3 space-y-4">
            <div>
              <FieldLabel>Age at menopause</FieldLabel>
              <NumberStepper
                value={state.menopauseAgeAt}
                onChange={(v) => set("menopauseAgeAt", v)}
                min={20}
                max={80}
              />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <Segmented
                options={[
                  { value: "natural", label: "Natural" },
                  { value: "induced_surgical", label: "Induced — surgical" },
                  { value: "induced_medical", label: "Induced — medical" },
                ]}
                value={state.menopauseType}
                onChange={(v) => set("menopauseType", v)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
