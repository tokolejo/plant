"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  remainingMinutes?: number;
}

/**
 * Server Action to 1-Click Bump Up Listing to the top of catalog
 */
export async function bumpListingAction(listingId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "ავტორიზაცია აუცილებელია" };
    }

    // Call atomic RPC function
    const { data, error } = await supabase.rpc("bump_listing", {
      p_listing_id: listingId,
      p_user_id: user.id,
    });

    if (error) {
      // Fallback direct update if RPC is not yet applied
      const { error: updateErr } = await supabase
        .from("listings")
        .update({
          last_bumped_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }
    } else if (data && !data.success) {
      return {
        success: false,
        error: data.error,
        remainingMinutes: data.remaining_minutes,
      };
    }

    // Revalidate affected cache paths
    revalidatePath("/listings");
    revalidatePath("/dashboard/listings");
    revalidatePath(`/listings/${listingId}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "დაფიქსირდა შეცდომა" };
  }
}

/**
 * Server Action to toggle Wishlist item
 */
export async function toggleWishlistAction(listingId: string): Promise<ActionResult<{ inWishlist: boolean }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "გთხოვთ გაიაროთ ავტორიზაცია" };
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("wishlists")
        .delete()
        .eq("id", existing.id);

      revalidatePath("/dashboard/wishlist");
      return { success: true, data: { inWishlist: false } };
    } else {
      await supabase
        .from("wishlists")
        .insert({
          user_id: user.id,
          listing_id: listingId,
          created_at: new Date().toISOString(),
        });

      revalidatePath("/dashboard/wishlist");
      return { success: true, data: { inWishlist: true } };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "შეცდომა რჩეულებში დამატებისას" };
  }
}

/**
 * Server Action to delete a listing safely
 */
export async function deleteListingAction(listingId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "ავტორიზაცია აუცილებელია" };
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/listings");
    revalidatePath("/dashboard/listings");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "შეცდომა განცხადების წაშლისას" };
  }
}
