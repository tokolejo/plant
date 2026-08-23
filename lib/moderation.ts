/**
 * Botanical & Community Safety / Spam Filter for Plant.ge
 * Validates listing titles and descriptions before insertion
 */

const BLOCKED_TERMS = [
  "casino", "crypto", "bitcoin", "forex", "loan", "кредит", "займ", "казино",
  "viagra", "cialis", "adult", "porn", "xxx", "escort"
];

export interface ModerationResult {
  isValid: boolean;
  errorKa?: string;
  errorEn?: string;
}

export function validateListingContent(title: string, description: string): ModerationResult {
  const combined = `${title} ${description}`.toLowerCase();

  for (const term of BLOCKED_TERMS) {
    if (combined.includes(term)) {
      return {
        isValid: false,
        errorKa: "განცხადების ტექსტი შეიცავს არასასურველ ან აკრძალულ სიტყვებს.",
        errorEn: "Listing text contains restricted or promotional spam terms.",
      };
    }
  }

  if (title.trim().length < 3) {
    return {
      isValid: false,
      errorKa: "სათაური უნდა შეიცავდეს მინიმუმ 3 სიმბოლოს.",
      errorEn: "Title must be at least 3 characters long.",
    };
  }

  return { isValid: true };
}
