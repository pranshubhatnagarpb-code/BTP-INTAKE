import { createServerFn } from "@tanstack/react-start";
import { submissionSchema, type SubmissionInput } from "@/lib/intake/schema";
import { supabaseAdmin, serviceKeyConfigured } from "@/integrations/supabase/client.server";

export type SubmitIntakeResult = {
  submissionId: string;
  pmsStatus: "pending" | "sent" | "failed" | "duplicate_merged";
};

// ---------------------------------------------------------------------------
// Maps the intake form's richer enums onto Bounce The Pound's clients.goal /
// clients.diet_preference options (see src/components/clients/ClientFormDialog.tsx
// in Bounce_the_pound_pms for the exact option lists). Anything without a close
// match falls into the nearest general bucket — the original value is never
// lost, since the full payload is stored in intake_submissions either way.
// ---------------------------------------------------------------------------
const GOAL_MAP: Record<string, string> = {
  weight_loss: "weight_loss",
  fat_loss: "weight_loss",
  weight_gain: "weight_gain",
  muscle_gain: "muscle_building",
  sports_performance: "muscle_building",
  energy: "maintain",
  general_wellness: "maintain",
  gut_health: "disease_management",
  hormonal_balance: "disease_management",
  manage_medical_condition: "disease_management",
};

const DIET_PREFERENCE_MAP: Record<string, string> = {
  veg: "vegetarian",
  jain: "vegetarian",
  non_veg: "non-vegetarian",
  pescatarian: "non-vegetarian",
  eggetarian: "eggetarian",
  vegan: "vegan",
};

// ---------------------------------------------------------------------------
// Creates or updates a client record in the shared PMS database.
// Maps only the intake fields that have a matching clients table column;
// everything else (symptoms, lifestyle, medical history detail, etc.) is
// preserved in the intake_submissions.payload row for the Clients page
// "view full intake response" eye icon.
// ---------------------------------------------------------------------------
async function upsertClient(input: SubmissionInput, submissionId: string): Promise<string | null> {
  const isChild = input.branch === "child";
  const phone = isChild
    ? input.guardian.guardianPhone ?? null
    : input.contact.phone ?? null;
  const email = isChild
    ? input.guardian.guardianEmail ?? null
    : input.contact.email ?? null;
  const normalizedPhone = phone?.replace(/\s+/g, "") || null;
  const normalizedEmail = email?.trim().toLowerCase() || null;

  // Dedup: find existing client by phone, then email
  let existingId: string | null = null;
  if (normalizedPhone) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("phone", normalizedPhone)
      .limit(1)
      .maybeSingle();
    if (data) existingId = data.id as string;
  }
  if (!existingId && normalizedEmail) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (data) existingId = data.id as string;
  }

  // Safely access optional/branch sections (union type, cast to any)
  const opt = (input as any).optional as Record<string, any> | undefined;
  const child = (input as any).child as Record<string, any> | undefined;

  const gender = isChild ? child?.gender ?? null : input.branch;
  const address = [opt?.address, input.required.city].filter(Boolean).join(", ") || null;

  const payload: Record<string, unknown> = {
    name: input.required.fullName,
    date_of_birth: input.required.dob ?? null,
    address,
    gender,
    weight: input.required.body.weightKg,
    height: input.required.body.heightCm,
    // clients.goal holds one value — use the first goal picked
    goal: GOAL_MAP[input.required.primaryGoals?.[0] ?? input.required.primaryGoal ?? ""] ?? null,
  };

  if (normalizedPhone) payload.phone = normalizedPhone;
  if (normalizedEmail) payload.email = normalizedEmail;

  // Optional fields — only set if provided, never overwrite with null
  if (opt?.foodPattern?.dietType) {
    payload.diet_preference = DIET_PREFERENCE_MAP[opt.foodPattern.dietType] ?? null;
  }
  if (Array.isArray(opt?.medicalHistory) && opt.medicalHistory.length > 0) {
    payload.health_conditions = opt.medicalHistory;
  }

  if (existingId) {
    const { error } = await supabaseAdmin
      .from("clients")
      .update(payload)
      .eq("id", existingId);
    if (error) throw new Error(`Client update failed: ${error.message}`);
    return existingId;
  }

  const { data: created, error } = await supabaseAdmin
    .from("clients")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !created) throw new Error(`Client insert failed: ${error?.message ?? "unknown"}`);
  return created.id as string;
}

// ---------------------------------------------------------------------------
// Main submission server function
// ---------------------------------------------------------------------------
export const submitIntake = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submissionSchema.parse(input))
  .handler(async ({ data }): Promise<SubmitIntakeResult> => {
    const input: SubmissionInput = data;
    if (!serviceKeyConfigured) {
      throw new Error("The form can't save right now (server key not configured). Please contact the clinic.");
    }

    // 1) Insert audit row
    const insertRow = {
      branch: input.branch,
      age: input.required.age ?? null,
      dob: input.required.dob ?? null,
      full_name: input.required.fullName,
      city: input.required.city,
      phone: input.branch === "child" ? null : input.contact.phone ?? null,
      email: input.branch === "child" ? null : input.contact.email ?? null,
      guardian_name: input.branch === "child" ? input.guardian.guardianName : null,
      guardian_relationship: input.branch === "child" ? input.guardian.guardianRelationship : null,
      guardian_phone: input.branch === "child" ? input.guardian.guardianPhone : null,
      guardian_email: input.branch === "child" ? input.guardian.guardianEmail ?? null : null,
      payload: input as unknown as Record<string, unknown>,
      pms_status: "pending" as const,
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("intake_submissions")
      .insert(insertRow)
      .select("id")
      .single();

    if (insertErr || !inserted) {
      throw new Error(`Failed to save intake: ${insertErr?.message ?? "unknown"}`);
    }

    const submissionId = inserted.id as string;

    // 2) Create / update client profile
    let pmsStatus: SubmitIntakeResult["pmsStatus"];
    const update: Record<string, unknown> = { pms_attempts: 1 };

    try {
      const clientId = await upsertClient(input, submissionId);
      pmsStatus = "sent";
      update.pms_status = "sent";
      update.pms_lead_id = clientId;
      update.pms_sent_at = new Date().toISOString();
      update.pms_error = null;
    } catch (e) {
      pmsStatus = "failed";
      update.pms_status = "failed";
      update.pms_error = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.error("Client profile creation failed:", update.pms_error);
    }

    await supabaseAdmin
      .from("intake_submissions")
      .update(update)
      .eq("id", submissionId);

    return { submissionId, pmsStatus };
  });

// ---------------------------------------------------------------------------
// Admin retry
// ---------------------------------------------------------------------------
export const retrySubmission = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const v = input as { id?: string; token?: string };
    if (!v?.id || !v?.token) throw new Error("id and token required");
    return { id: String(v.id), token: String(v.token) };
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_RETRY_TOKEN;
    if (!expected || data.token !== expected) throw new Error("Unauthorized");

    const { data: row, error } = await supabaseAdmin
      .from("intake_submissions")
      .select("id, payload, pms_attempts")
      .eq("id", data.id)
      .single();

    if (error || !row) throw new Error("Submission not found");

    const parsed = submissionSchema.parse(row.payload);
    const update: Record<string, unknown> = {
      pms_attempts: ((row.pms_attempts as number) ?? 0) + 1,
    };

    try {
      const clientId = await upsertClient(parsed, row.id as string);
      update.pms_status = "sent";
      update.pms_lead_id = clientId;
      update.pms_sent_at = new Date().toISOString();
      update.pms_error = null;
    } catch (e) {
      update.pms_status = "failed";
      update.pms_error = e instanceof Error ? e.message : String(e);
    }

    await supabaseAdmin.from("intake_submissions").update(update).eq("id", row.id);
    return { ok: update.pms_status === "sent", error: update.pms_error ?? null };
  });
