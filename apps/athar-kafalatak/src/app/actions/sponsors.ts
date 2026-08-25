"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const sponsorSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  honorific: z.string().min(1).default("الأستاذ"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  sponsor_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function parseSponsorForm(formData: FormData) {
  return sponsorSchema.parse({
    full_name: formData.get("full_name"),
    honorific: formData.get("honorific") || "الأستاذ",
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    sponsor_number: formData.get("sponsor_number") || null,
    notes: formData.get("notes") || null,
  });
}

export async function createSponsor(formData: FormData) {
  const values = parseSponsorForm(formData);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("sponsors").insert(values);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors");
}

export async function updateSponsor(id: string, formData: FormData) {
  const values = parseSponsorForm(formData);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("sponsors").update(values).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors");
}

export async function deleteSponsor(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("sponsors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sponsors");
}
