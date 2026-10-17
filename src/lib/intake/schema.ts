/**
 * Stable structured payload schema for intake submissions.
 *
 * Keys here are the contract between this intake project and the PMS.
 * Add fields, never rename or remove existing keys without versioning.
 */
import { z } from "zod";

export const PAYLOAD_VERSION = 1 as const;

// ---------- shared primitives ----------
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^[+0-9 ()-]+$/u, "Invalid phone");
const emailSchema = z.string().trim().email().max(254);

const ratingSchema = z.number().int().min(1).max(5);

const symptomSnapshot = z.object({
  sleep: ratingSchema,
  digestion: ratingSchema,
  energy: ratingSchema,
  fatigue: ratingSchema,
  skin: ratingSchema,
  hair: ratingSchema,
});

const lifestyleQuick = z.object({
  sleepHours: z.number().min(3).max(14),
  waterIntake: z.enum(["<1L", "1-2L", "2-3L", "3L+"]),
  // no longer asked (client review, Oct 2026) — kept for older submissions
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
});

const goalEnum = z.enum([
  "weight_loss",
  "fat_loss",
  "weight_gain",
  "muscle_gain",
  "energy",
  "gut_health",
  "hormonal_balance",
  "sports_performance",
  "manage_medical_condition",
  "general_wellness",
]);

const bodySnapshot = z.object({
  weightKg: z.number().min(2).max(400),
  heightCm: z.number().min(40).max(250),
  // As entered (current form asks feet + inches); heightCm is derived from these.
  heightFt: z.number().int().min(1).max(8).optional(),
  heightIn: z.number().int().min(0).max(11).optional(),
});

// ---------- required core (all branches) ----------
const requiredCore = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    dob: z.string().date().optional(),
    age: z.number().int().min(0).max(120).optional(),
    city: z.string().trim().min(1).max(120),
    // consent checkbox removed from the form — kept for older submissions
    consent: z.literal(true).optional(),
    // single goal (older submissions) or multiple goals (current form)
    primaryGoal: goalEnum.optional(),
    primaryGoals: z.array(goalEnum).min(1).max(10).optional(),
    chiefComplaints: z.array(z.string().min(1).max(60)).min(1).max(20),
    body: bodySnapshot,
    lifestyle: lifestyleQuick,
    symptoms: symptomSnapshot,
  })
  .refine((v) => Boolean(v.primaryGoal || v.primaryGoals?.length), {
    message: "Pick at least one goal",
    path: ["primaryGoals"],
  });

// ---------- optional sections (all branches) ----------
const mealSlot = z.object({
  time: z.string().max(10).optional(),
  items: z.array(z.string().max(60)).max(10).optional(),
});

const optionalCommon = z
  .object({
    address: z.string().max(300).optional(),
    // flat list of conditions — older submissions; current form sends medicalConditions
    medicalHistory: z.array(z.string().max(60)).max(30).optional(),
    // Medical history table from the BTP assessment form.
    medicalConditions: z
      .object({
        heart: z.array(z.string().max(40)).max(6).optional(),
        heartOther: z.string().max(120).optional(),
        diabetes: z.array(z.string().max(40)).max(6).optional(),
        pcos: z.array(z.string().max(60)).max(6).optional(),
        lastMenstrualPeriod: z.string().date().optional(),
        thyroid: z.array(z.string().max(40)).max(4).optional(),
        kidney: z.array(z.string().max(40)).max(6).optional(),
        kidneyOther: z.string().max(120).optional(),
        chronicIllnessOrSurgery: z.string().max(400).optional(),
        orthopedicAilment: z.string().max(400).optional(),
        gut: z.array(z.string().max(60)).max(8).optional(),
        gutOther: z.string().max(120).optional(),
      })
      .optional(),
    familyHistory: z.array(z.string().max(60)).max(30).optional(),
    medications: z
      .array(
        z.object({
          name: z.string().max(80),
          frequency: z.string().max(40).optional(),
        }),
      )
      .max(30)
      .optional(),
    allergies: z.string().max(200).optional(),
    surgicalHistory: z.string().max(400).optional(),
    oncology: z
      .object({
        diagnosis: z.string().max(200).optional(),
        type: z.string().max(120).optional(),
        diagnosisDate: z.string().date().optional(),
        treatment: z
          .array(
            z.enum([
              "chemotherapy",
              "radiation",
              "immunotherapy",
              "surgery",
              "bone_marrow_transplant",
              "other",
            ]),
          )
          .max(6)
          .optional(),
        treatmentStage: z.string().max(120).optional(),
        treatmentSymptoms: z
          .array(
            z.enum([
              "loss_of_appetite",
              "nausea",
              "vomiting",
              "taste_changes",
              "mouth_sores",
              "dry_mouth",
              "difficulty_swallowing",
              "early_satiety",
              "food_aversion",
              "diarrhea",
              "constipation",
              "fatigue",
              "weight_loss",
              "weight_gain",
            ]),
          )
          .max(14)
          .optional(),
        eatingPatternChanges: z.string().max(400).optional(),
        treatmentFoodPreferences: z.string().max(300).optional(),
        treatmentFoodIntolerances: z.string().max(300).optional(),
        supplements: z.string().max(300).optional(),
        tubeFeeding: z.boolean().optional(),
        foodSafetyConcerns: z
          .array(z.enum(["raw_sprouts", "street_food", "raw_eggs", "unpasteurized_dairy", "none"]))
          .max(5)
          .optional(),
      })
      .optional(),
    bodyMeasurements: z
      .object({
        bloodGroup: z
          .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"])
          .optional(),
        targetWeightKg: z.number().min(2).max(400).optional(),
        waistNavelCm: z.number().min(20).max(250).optional(),
        waistThinnestCm: z.number().min(20).max(250).optional(),
        hipCm: z.number().min(20).max(250).optional(),
        neckCm: z.number().min(10).max(100).optional(),
        bloodPressure: z.string().max(20).optional(),
        pulseRate: z.number().int().min(20).max(250).optional(),
        heaviestWeightKg: z.number().min(2).max(400).optional(),
        lightestWeightKg: z.number().min(2).max(400).optional(),
        weight6moAgoKg: z.number().min(2).max(400).optional(),
        weight3yrAgoKg: z.number().min(2).max(400).optional(),
      })
      .optional(),
    digestion: z
      .object({
        bowelFrequency: z.string().max(40).optional(),
        stoolConsistency: z.array(z.string().max(40)).max(10).optional(),
        bloatingTiming: z.array(z.string().max(40)).max(10).optional(),
        acidityTriggers: z.array(z.string().max(40)).max(10).optional(),
        digestiveSymptoms: z.array(z.string().max(40)).max(10).optional(),
        acidityRating: ratingSchema.optional(),
        bloatingRating: ratingSchema.optional(),
        constipationRating: ratingSchema.optional(),
        dailyRituals: z.array(z.string().max(60)).max(10).optional(),
        lunchDuration: z.enum(["under_10", "10_20", "over_20"]).optional(),
        ibs: z.boolean().optional(),
      })
      .optional(),
    foodPattern: z
      .object({
        dietType: z
          .enum(["veg", "non_veg", "eggetarian", "vegan", "jain", "pescatarian"])
          .optional(),
        cuisines: z.array(z.string().max(40)).max(15).optional(),
        mealsPerDay: z.number().int().min(1).max(8).optional(),
        eatsOutPerWeek: z.number().int().min(0).max(21).optional(),
        packagedFoodFrequency: z
          .enum(["rarely", "1-2_wk", "3-5_wk", "daily", "multi_daily"])
          .optional(),
        sugarDrinks: z.boolean().optional(),
        energyCarbonatedDrinks: z.enum(["never", "rarely", "sometimes", "daily"]).optional(),
        teaCoffeePerDay: z.number().int().min(0).max(20).optional(),
        teaCoffeeFirstCupTime: z.string().max(10).optional(),
        homeCooked: z.enum(["yes", "partially", "rarely"]).optional(),
        whoCooks: z.enum(["self", "family", "cook_help", "mix"]).optional(),
        cookingOil: z.string().max(80).optional(),
        foodLikes: z.string().max(200).optional(),
        foodDislikes: z.string().max(200).optional(),
        cravings: z.string().max(200).optional(),
        // slow/moderate/fast = older submissions; quick_10_15/slow_20_plus = current form
        eatingSpeed: z.enum(["slow", "moderate", "fast", "quick_10_15", "slow_20_plus"]).optional(),
        bingeEating: z.enum(["no", "occasionally", "frequently"]).optional(),
        dailyMeals: z
          .object({
            breakfast: mealSlot.optional(),
            midMorning: mealSlot.optional(),
            lunch: mealSlot.optional(),
            evening: mealSlot.optional(),
            dinner: mealSlot.optional(),
            postDinner: mealSlot.optional(),
          })
          .optional(),
        // 24 hr diet recall (replaces dailyMeals in the current form)
        dietRecall: z
          .array(
            z.object({
              slot: z.string().max(40),
              time: z.string().max(10).optional(),
              food: z.string().max(400).optional(),
            }),
          )
          .max(12)
          .optional(),
      })
      .optional(),
    lifestyleDepth: z
      .object({
        stress: ratingSchema.optional(),
        stressSource: z.enum(["work", "family", "health", "financial", "multiple"]).optional(),
        screenTimeHrs: z.number().min(0).max(24).optional(),
        smoking: z
          .object({ active: z.boolean(), frequency: z.string().max(40).optional() })
          .optional(),
        alcohol: z
          .object({
            active: z.boolean(),
            frequency: z.string().max(40).optional(),
            drinksPerSession: z.string().max(40).optional(),
          })
          .optional(),
        shiftWork: z.boolean().optional(),
        travelFrequency: z.string().max(40).optional(),
        sleepTime: z.string().max(10).optional(),
        wakeTime: z.string().max(10).optional(),
        dailySteps: z.number().int().min(0).max(100000).optional(),
        // free text — older submissions; current form sends exercises
        exerciseType: z.string().max(400).optional(),
        // "What form of exercise do you do?" table from the BTP assessment form.
        exercises: z
          .array(
            z.object({
              type: z.string().max(80),
              durationMin: z.number().int().min(0).max(600).optional(),
              timesPerWeek: z.number().int().min(0).max(21).optional(),
              timing: z.string().max(10).optional(),
            }),
          )
          .max(6)
          .optional(),
        exerciseDuration: z.enum(["none", "15_30", "30_45", "45_60", "60_plus"]).optional(),
        exerciseFrequency: z.enum(["daily", "4_5_wk", "2_3_wk", "rarely"]).optional(),
        wellnessRituals: z.array(z.string().max(60)).max(10).optional(),
      })
      .optional(),
    bloodParameters: z.array(z.string().max(60)).max(20).optional(),
    inflammationConcerns: z.boolean().optional(),
    goals: z
      .object({
        pastAttempts: z.string().max(500).optional(),
        pastAttemptsOutcome: z.string().max(500).optional(),
        biggestChallenge: z.string().max(500).optional(),
        programExpectations: z.string().max(500).optional(),
      })
      .optional(),
    notes: z.string().max(240).optional(),
    reportsSharing: z.enum(["email", "whatsapp", "none"]).optional(),
    specialRequest: z.string().max(500).optional(),
  })
  .partial();

// ---------- sex-specific optional ----------
const femaleOptional = z
  .object({
    periodsStatus: z.enum(["regular", "irregular", "absent", "menopausal"]).optional(),
    lastPeriodDate: z.string().date().optional(),
    cycleLengthDays: z.number().int().min(10).max(90).optional(),
    flow: z
      .array(z.enum(["light", "moderate", "heavy", "very_heavy", "clots"]))
      .max(5)
      .optional(),
    periodDays: z.number().int().min(1).max(15).optional(),
    pmsSymptoms: z.array(z.string().max(40)).max(15).optional(),
    painSeverity: ratingSchema.optional(),
    fertility: z
      .object({
        tryingDuration: z.enum(["under_6mo", "6_12mo", "1_2yr", "2yr_plus"]).optional(),
        treatment: z.enum(["none", "iui", "ivf", "other"]).optional(),
        diagnosedConditions: z.string().max(300).optional(),
      })
      .optional(),
    hormonalIntervention: z
      .object({
        active: z.boolean(),
        types: z
          .array(z.enum(["ocp", "hormonal_iud", "hrt", "fertility_meds", "none"]))
          .max(5)
          .optional(),
      })
      .optional(),
    pregnancy: z
      .object({
        status: z.enum(["none", "trying", "pregnant", "lactating"]),
        trimester: z.enum(["first", "second", "third"]).optional(),
        dueDate: z.string().date().optional(),
        prePregnancyWeightKg: z.number().min(2).max(400).optional(),
        gestationalDiabetes: z.boolean().optional(),
        pregnancyInducedHypertension: z.boolean().optional(),
        highRiskPregnancy: z.boolean().optional(),
        previousPregnanciesCount: z.number().int().min(0).max(20).optional(),
        prenatalSupplements: z.string().max(200).optional(),
        symptoms: z.array(z.string().max(40)).max(15).optional(),
      })
      .optional(),
    lactation: z
      .object({
        breastfeedingDifficulties: z.string().max(300).optional(),
        formulaSupplementing: z.boolean().optional(),
      })
      .optional(),
    menopause: z
      .object({
        reached: z.boolean(),
        ageAt: z.number().int().min(20).max(80).optional(),
        type: z.enum(["natural", "induced_surgical", "induced_medical"]).optional(),
      })
      .optional(),
    hysterectomy: z.boolean().optional(),
    periodPainMeds: z.boolean().optional(),
    endometriosisSurgery: z.boolean().optional(),
  })
  .partial();

const maleOptional = z
  .object({
    urinarySymptoms: z
      .array(
        z.enum(["frequency", "urgency", "hesitancy", "nocturia", "incomplete_emptying", "none"]),
      )
      .max(6)
      .optional(),
    libido: ratingSchema.optional(),
    erectileConcerns: z.boolean().optional(),
    testosteroneStatus: z.enum(["not_tested", "normal", "low", "high", "unsure"]).optional(),
    trtUse: z.boolean().optional(),
    steroidUse: z
      .object({
        status: z.enum(["never", "past", "current"]),
        substances: z.array(z.string().max(40)).max(10).optional(),
      })
      .optional(),
    prostateConcerns: z.boolean().optional(),
  })
  .partial();

const childOptional = z
  .object({
    gender: z.enum(["male", "female"]).optional(),
    birthWeightKg: z.number().min(0.3).max(10).optional(),
    weightForAgePercentile: z.number().min(0).max(100).optional(),
    heightForAgePercentile: z.number().min(0).max(100).optional(),
    motherMedicalHistory: z.string().max(400).optional(),
    fatherMedicalHistory: z.string().max(400).optional(),
    feeding: z
      .object({
        breastfed: z.boolean().optional(),
        breastfeedingDurationMonths: z.number().min(0).max(60).optional(),
        formulaFed: z.boolean().optional(),
        solidsStartAgeMonths: z.number().min(0).max(24).optional(),
        feedingDifficulties: z.string().max(300).optional(),
      })
      .optional(),
    schoolGrade: z.string().max(20).optional(),
    stamina: ratingSchema.optional(),
    attentionSpan: ratingSchema.optional(),
    focus: ratingSchema.optional(),
    appetite: z.enum(["poor", "variable", "good", "very_good", "excessive"]).optional(),
    pickyEater: ratingSchema.optional(),
    sportsPerWeek: z.number().int().min(0).max(21).optional(),
    sportsTiming: z
      .array(z.enum(["morning", "afternoon", "evening"]))
      .max(3)
      .optional(),
    outdoorSports: z.array(z.string().max(40)).max(15).optional(),
    indoorSports: z.array(z.string().max(40)).max(15).optional(),
    screenTimeHrs: z.number().min(0).max(24).optional(),
    packagedFoodFrequency: z
      .enum(["rarely", "1-2_wk", "3-5_wk", "daily", "multi_daily"])
      .optional(),
    memory: ratingSchema.optional(),
    growthConcerns: z.array(z.string().max(40)).max(10).optional(),
    feedingConcerns: z.array(z.string().max(60)).max(10).optional(),
  })
  .partial();

// ---------- branch payloads ----------
const guardianBlock = z.object({
  guardianName: z.string().trim().min(1).max(120),
  guardianRelationship: z.string().min(1).max(60),
  guardianPhone: phoneSchema,
  guardianEmail: emailSchema.optional(),
  referredBy: z.string().max(120).optional(),
});

const adultContact = z
  .object({
    // Both required in the current form; optional here so the refine below
    // still gives one clear message.
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    // "other" submits on the male branch (no gender-specific sections), so the
    // PMS / DB branch values stay female | male | child.
    gender: z.enum(["female", "male", "other"]).optional(),
    profession: z.string().max(120).optional(),
    maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
    childrenCount: z.enum(["none", "1", "2", "3+"]).optional(),
    referredBy: z.string().max(120).optional(),
  })
  .refine((v) => Boolean(v.phone && v.email), {
    message: "Provide both phone number and email",
    path: ["phone"],
  });

export const femaleSubmissionSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  branch: z.literal("female"),
  contact: adultContact,
  required: requiredCore,
  optional: optionalCommon.optional(),
  female: femaleOptional.optional(),
});

export const maleSubmissionSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  branch: z.literal("male"),
  contact: adultContact,
  required: requiredCore,
  optional: optionalCommon.optional(),
  male: maleOptional.optional(),
});

export const childSubmissionSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  branch: z.literal("child"),
  guardian: guardianBlock,
  required: requiredCore,
  optional: optionalCommon.omit({ lifestyleDepth: true }).optional(),
  child: childOptional.optional(),
});

export const submissionSchema = z.discriminatedUnion("branch", [
  femaleSubmissionSchema,
  maleSubmissionSchema,
  childSubmissionSchema,
]);

export type SubmissionInput = z.infer<typeof submissionSchema>;
