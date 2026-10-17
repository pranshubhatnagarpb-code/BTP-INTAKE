import type { SubmissionInput } from "@/lib/intake/schema";

// The form is adults-only (client review, Oct 2026). The schema still accepts
// the "child" branch so older submissions keep parsing. "other" is the gender
// answer; it submits on the male branch (see buildPayload).
export type WizardBranch = "female" | "male" | "other";

// Medical history table, as in the BTP assessment form. "None" / "Don't know"
// clear the other picks in a row (handled in the wizard).
export const MEDICAL_HISTORY_ROWS = {
  heart: {
    label: "Heart related problem",
    options: ["Low BP", "High BP", "Panic / anxiety attack", "Others", "None"],
  },
  diabetes: {
    label: "Diabetes",
    options: ["Type 1 Diabetes", "Type 2 Diabetes", "Gestational diabetes", "None", "Don't know"],
  },
  pcos: {
    label: "PCOS",
    options: [
      "Bulky ovaries",
      "Delayed periods",
      "Hirsutism (hair around chin area)",
      "Acanthosis nigricans (blackening around neck)",
      "None",
      "Don't know",
    ],
  },
  thyroid: { label: "Thyroid", options: ["Hypothyroidism", "Hyperthyroidism", "None"] },
  kidney: {
    label: "Kidney disorder",
    options: ["Kidney stone", "Dialysis", "Chronic kidney disease", "Others", "None"],
  },
  gut: {
    label: "Gut issue",
    options: [
      "Constipation",
      "Diarrhea / leaky gut",
      "Acidity",
      "Gas (farting / burping / bloating)",
      "IBS (irritable bowel syndrome)",
      "Others",
      "None",
    ],
  },
} as const;

export type MedicalRowKey = keyof typeof MEDICAL_HISTORY_ROWS;

// "What form of exercise do you do?" table rows, as in the BTP assessment form.
export const EXERCISE_TYPES = [
  "Walk / Jog",
  "Swimming",
  "Gym",
  "Yoga",
  "Aerobics / Zumba / Dance",
  "Others",
] as const;

export type ExerciseRow = { durationMin?: number; timesPerWeek?: number; timing?: string };

export const heightToCm = (ft?: number, inch?: number) =>
  ft ? Math.round((ft * 12 + (inch ?? 0)) * 2.54 * 10) / 10 : undefined;

export const DIET_RECALL_SLOTS = [
  "Early morning (on waking)",
  "Breakfast",
  "Mid-morning",
  "Lunch",
  "Evening snack",
  "Dinner",
  "Post-dinner",
] as const;

export type DietRecallRow = { time?: string; food?: string };

export type WizardState = {
  branch?: WizardBranch;
  pregnancyStatus?: "none" | "trying" | "pregnant" | "lactating";
  // identity / contact
  fullName: string;
  dob?: string;
  age?: number;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  profession?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  childrenCount?: "none" | "1" | "2" | "3+";
  referredBy?: string;
  // required
  primaryGoals: string[];
  chiefComplaints: string[];
  weightKg?: number;
  heightFt?: number;
  heightIn?: number;
  sleepHours?: number;
  waterIntake?: "<1L" | "1-2L" | "2-3L" | "3L+";
  // symptom ratings (required — all 6)
  rSleep?: number;
  rDigestion?: number;
  rEnergy?: number;
  rFatigue?: number;
  rSkin?: number;
  rHair?: number;
  // medical history & medications
  medical: Record<MedicalRowKey, string[]>;
  heartOther?: string;
  kidneyOther?: string;
  gutOther?: string;
  chronicIllnessOrSurgery?: string;
  orthopedicAilment?: string;
  medications: { name: string; frequency?: string }[];
  allergies?: string;
  // digestion detail
  bowelFrequency?: string;
  stoolConsistency: string[];
  bloatingTiming: string[];
  acidityTriggers: string[];
  digestiveSymptoms: string[];
  acidityRating?: number;
  bloatingRating?: number;
  constipationRating?: number;
  ibs?: boolean;
  // food pattern
  dietType?: "veg" | "non_veg" | "eggetarian" | "vegan" | "jain" | "pescatarian";
  cuisines: string[];
  eatsOutPerWeek?: number;
  packagedFoodFrequency?: "rarely" | "1-2_wk" | "3-5_wk" | "daily" | "multi_daily";
  sugarDrinks?: boolean;
  energyCarbonatedDrinks?: "never" | "rarely" | "sometimes" | "daily";
  teaCoffeePerDay?: number;
  homeCooked?: "yes" | "partially" | "rarely";
  whoCooks?: "self" | "family" | "cook_help" | "mix";
  cookingOil?: string;
  cravings?: string;
  eatingSpeed?: "quick_10_15" | "slow_20_plus";
  bingeEating?: "no" | "occasionally" | "frequently";
  dietRecall: DietRecallRow[];
  // lifestyle
  exercises: ExerciseRow[];
  exerciseOtherName?: string;
  smokingActive?: boolean;
  smokingFreq?: string;
  alcoholActive?: boolean;
  alcoholFreq?: string;
  alcoholDrinksPerSession?: string;
  // female
  periodsStatus?: "regular" | "irregular" | "absent" | "menopausal";
  lastPeriodDate?: string;
  cycleLengthDays?: number;
  flow: string[];
  periodDays?: number;
  pmsSymptoms: string[];
  fertilityTryingDuration?: "under_6mo" | "6_12mo" | "1_2yr" | "2yr_plus";
  fertilityTreatment?: "none" | "iui" | "ivf" | "other";
  fertilityConditions?: string;
  painSeverity?: number;
  periodPainMeds?: boolean;
  endometriosisSurgery?: boolean;
  hormonalActive?: boolean;
  hormonalTypes: string[];
  menopauseReached?: boolean;
  menopauseAgeAt?: number;
  menopauseType?: "natural" | "induced_surgical" | "induced_medical";
  hysterectomy?: boolean;
  // anything else
  reportsSharing?: "email" | "whatsapp" | "none";
  specialRequest?: string;
};

export const initialState: WizardState = {
  fullName: "",
  city: "",
  primaryGoals: [],
  chiefComplaints: [],
  medical: { heart: [], diabetes: [], pcos: [], thyroid: [], kidney: [], gut: [] },
  medications: [],
  stoolConsistency: [],
  bloatingTiming: [],
  acidityTriggers: [],
  digestiveSymptoms: [],
  cuisines: [],
  dietRecall: DIET_RECALL_SLOTS.map(() => ({})),
  exercises: EXERCISE_TYPES.map(() => ({})),
  flow: [],
  pmsSymptoms: [],
  hormonalTypes: [],
};

const stripEmpty = <T extends object>(obj: T): T | undefined => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const s = stripEmpty(v as object);
      if (s) out[k] = s;
    } else {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? (out as T) : undefined;
};

export function buildPayload(s: WizardState): SubmissionInput {
  if (!s.branch) throw new Error("Gender is required");
  if (s.primaryGoals.length === 0) throw new Error("Primary goal is required");
  if (!s.waterIntake) throw new Error("Water intake is required");
  const heightCm = heightToCm(s.heightFt, s.heightIn);
  if (!heightCm) throw new Error("Height is required");

  const required = {
    fullName: s.fullName.trim(),
    dob: s.dob || undefined,
    age: s.age,
    city: s.city.trim(),
    primaryGoals: s.primaryGoals as never,
    chiefComplaints: s.chiefComplaints,
    body: { weightKg: s.weightKg!, heightCm, heightFt: s.heightFt, heightIn: s.heightIn ?? 0 },
    lifestyle: {
      sleepHours: s.sleepHours!,
      waterIntake: s.waterIntake,
    },
    symptoms: {
      sleep: s.rSleep!,
      digestion: s.rDigestion!,
      energy: s.rEnergy!,
      fatigue: s.rFatigue!,
      skin: s.rSkin!,
      hair: s.rHair!,
    },
  };

  const dietRecall = s.dietRecall
    .map((r, i) => ({
      slot: DIET_RECALL_SLOTS[i],
      time: r.time || undefined,
      food: r.food?.trim() || undefined,
    }))
    .filter((r) => r.time || r.food);

  const exercises = s.exercises
    .map((r, i) => ({
      type:
        EXERCISE_TYPES[i] === "Others" && s.exerciseOtherName?.trim()
          ? `Others: ${s.exerciseOtherName.trim()}`
          : EXERCISE_TYPES[i],
      durationMin: r.durationMin,
      timesPerWeek: r.timesPerWeek,
      timing: r.timing || undefined,
    }))
    .filter((r) => r.durationMin !== undefined || r.timesPerWeek !== undefined || r.timing);

  const optionalCommon = stripEmpty({
    address: s.address?.trim() || undefined,
    medicalConditions: stripEmpty({
      heart: s.medical.heart,
      heartOther: s.medical.heart.includes("Others") ? s.heartOther?.trim() : undefined,
      diabetes: s.medical.diabetes,
      pcos: s.branch === "female" ? s.medical.pcos : undefined,
      lastMenstrualPeriod: s.branch === "female" ? s.lastPeriodDate || undefined : undefined,
      thyroid: s.medical.thyroid,
      kidney: s.medical.kidney,
      kidneyOther: s.medical.kidney.includes("Others") ? s.kidneyOther?.trim() : undefined,
      chronicIllnessOrSurgery: s.chronicIllnessOrSurgery?.trim(),
      orthopedicAilment: s.orthopedicAilment?.trim(),
      gut: s.medical.gut,
      gutOther: s.medical.gut.includes("Others") ? s.gutOther?.trim() : undefined,
    }),
    medications: s.medications.filter((m) => m.name.trim().length > 0),
    allergies: s.allergies,
    digestion: stripEmpty({
      bowelFrequency: s.bowelFrequency,
      stoolConsistency: s.stoolConsistency,
      bloatingTiming: s.bloatingTiming,
      acidityTriggers: s.acidityTriggers,
      digestiveSymptoms: s.digestiveSymptoms,
      acidityRating: s.acidityRating,
      bloatingRating: s.bloatingRating,
      constipationRating: s.constipationRating,
      ibs: s.ibs,
    }),
    foodPattern: stripEmpty({
      dietType: s.dietType,
      cuisines: s.cuisines,
      eatsOutPerWeek: s.eatsOutPerWeek,
      packagedFoodFrequency: s.packagedFoodFrequency,
      sugarDrinks: s.sugarDrinks,
      energyCarbonatedDrinks: s.energyCarbonatedDrinks,
      teaCoffeePerDay: s.teaCoffeePerDay,
      homeCooked: s.homeCooked,
      whoCooks: s.whoCooks,
      cookingOil: s.cookingOil,
      cravings: s.cravings,
      eatingSpeed: s.eatingSpeed,
      bingeEating: s.bingeEating,
      dietRecall,
    }),
    lifestyleDepth: stripEmpty({
      exercises,
      smoking:
        s.smokingActive !== undefined
          ? { active: s.smokingActive, frequency: s.smokingFreq }
          : undefined,
      alcohol:
        s.alcoholActive !== undefined
          ? {
              active: s.alcoholActive,
              frequency: s.alcoholFreq,
              drinksPerSession: s.alcoholDrinksPerSession,
            }
          : undefined,
    }),
    reportsSharing: s.reportsSharing,
    specialRequest: s.specialRequest?.trim(),
  });

  const contact = {
    phone: s.phone?.trim() || undefined,
    email: s.email?.trim() || undefined,
    profession: s.profession?.trim() || undefined,
    maritalStatus: s.maritalStatus,
    childrenCount: s.childrenCount,
    referredBy: s.referredBy?.trim() || undefined,
    gender: s.branch,
  };

  if (s.branch === "female") {
    const female = stripEmpty({
      periodsStatus: s.periodsStatus,
      cycleLengthDays: s.cycleLengthDays,
      flow: s.flow,
      periodDays: s.periodDays,
      pmsSymptoms: s.pmsSymptoms,
      painSeverity: s.painSeverity,
      periodPainMeds: s.periodPainMeds,
      endometriosisSurgery: s.endometriosisSurgery,
      hysterectomy: s.hysterectomy,
      fertility:
        s.pregnancyStatus === "trying"
          ? stripEmpty({
              tryingDuration: s.fertilityTryingDuration,
              treatment: s.fertilityTreatment,
              diagnosedConditions: s.fertilityConditions,
            })
          : undefined,
      hormonalIntervention:
        s.hormonalActive !== undefined
          ? { active: s.hormonalActive, types: s.hormonalTypes }
          : undefined,
      pregnancy: s.pregnancyStatus ? { status: s.pregnancyStatus } : undefined,
      menopause:
        s.menopauseReached !== undefined
          ? {
              reached: s.menopauseReached,
              ageAt: s.menopauseAgeAt,
              type: s.menopauseType,
            }
          : undefined,
    });
    return {
      version: 1,
      branch: "female",
      contact,
      required,
      optional: optionalCommon as never,
      female: female as never,
    };
  }

  return {
    version: 1,
    branch: "male",
    contact,
    required,
    optional: optionalCommon as never,
  };
}
