import { createClient } from "./client";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function uploadListingImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { url: null, error: "დაშვებულია მხოლოდ სურათები (JPG, PNG, WebP)" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { url: null, error: "ფოტოს ზომა არ უნდა აღემატებოდეს 5MB-ს" };
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `listings/${userId}/${Date.now()}_${cleanFileName}`;

  const { data, error } = await supabase.storage
    .from("listing-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("listing-images")
    .getPublicUrl(data.path);

  return { url: publicUrlData.publicUrl, error: null };
}

export async function deleteListingImage(
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("listing-images")
    .remove([filePath]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
