"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult } from "./listings";

export interface SubmitReviewInput {
  sellerId: string;
  listingId?: string;
  rating: number;
  comment: string;
}

/**
 * Server Action to Submit Review for Seller or Listing
 */
export async function submitReviewAction(input: SubmitReviewInput): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "შეფასების დასატოვებლად გაიარეთ ავტორიზაცია" };
    }

    if (user.id === input.sellerId) {
      return { success: false, error: "საკუთარ თავს შეფასებას ვერ დაუტოვებთ" };
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      return { success: false, error: "შეფასება უნდა იყოს 1-დან 5 ვარსკვლავამდე" };
    }

    const { error } = await supabase
      .from("reviews")
      .upsert({
        reviewer_id: user.id,
        seller_id: input.sellerId,
        listing_id: input.listingId || null,
        rating: input.rating,
        comment: input.comment?.trim() || "",
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "reviewer_id,listing_id"
      });

    if (error) {
      return { success: false, error: error.message };
    }

    if (input.listingId) {
      revalidatePath(`/listings/${input.listingId}`);
    }
    revalidatePath(`/shops/${input.sellerId}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "შეცდომა შეფასების გაგზავნისას" };
  }
}
