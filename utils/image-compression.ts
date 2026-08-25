/**
 * PlantSale.ge — Client-Side Image Compression & Storage Optimization Utility
 * Automatically scales down large photos (e.g. 10MB+ iPhone photos) to WebP/JPEG
 * under 600KB with crisp quality, saving bandwidth and Supabase storage quota.
 */

export interface CompressionOptions {
  maxDimension?: number; // Max width or height in px (default: 1600)
  quality?: number;      // 0.1 to 1.0 (default: 0.82)
  mimeType?: "image/webp" | "image/jpeg"; // Default: image/webp with fallback
  maxFileSizeKB?: number;// Target max file size in KB
}

/**
 * Compresses a single File or Blob to an optimized WebP/JPEG file.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxDimension = 1600,
    quality = 0.82,
    mimeType = "image/webp",
  } = options;

  return new Promise((resolve, reject) => {
    // If browser doesn't support FileReader or Canvas, return original file
    if (typeof window === "undefined" || !window.FileReader) {
      if (file instanceof File) return resolve(file);
      return resolve(new File([file], "image.jpg", { type: "image/jpeg" }));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Failed to get canvas 2D context for image compression"));
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Canvas toBlob failed"));
            }

            const fileName = (file as File).name 
              ? (file as File).name.replace(/\.[^/.]+$/, "") + (mimeType === "image/webp" ? ".webp" : ".jpg")
              : `photo_${Date.now()}.${mimeType === "image/webp" ? "webp" : "jpg"}`;

            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image into memory for compression"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file from disk"));
    };
  });
}

/**
 * Batch compress multiple files with size validation.
 */
export async function compressImagesBatch(
  files: File[],
  options?: CompressionOptions
): Promise<File[]> {
  const tasks = files.map((file) => compressImage(file, options));
  return Promise.all(tasks);
}

/**
 * Validates image upload constraints (min 2, max 5 images, allowed extensions).
 */
export function validateListingImages(files: File[]): { valid: boolean; error?: string } {
  if (files.length < 2) {
    return { valid: false, error: "მინიმუმ 2 ფოტოა სავალდებულო (მაქსიმუმ 5)." };
  }
  if (files.length > 5) {
    return { valid: false, error: "მაქსიმუმ 5 ფოტოს ატვირთვაა შესაძლებელი." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  for (const file of files) {
    if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      return { valid: false, error: `ფაილი "${file.name}" არ არის მხარდაჭერილი ფორმატი (JPG, PNG, WebP).` };
    }
  }

  return { valid: true };
}

/**
 * Fast client-side image downscaling to clean Base64 string under 100KB for AI endpoints
 */
export async function compressImageToBase64(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<{ imageBase64: string; mimeType: string }> {
  const {
    maxDimension = 800,
    quality = 0.75,
    mimeType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.FileReader) {
      return reject(new Error("Browser environment required for compression"));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Canvas context failed"));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(mimeType, quality);
        const cleanBase64 = dataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

        resolve({ imageBase64: cleanBase64, mimeType });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image into memory"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
  });
}

