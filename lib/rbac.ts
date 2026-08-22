// ==============================================================================
// Plantio / Plant - Role-Based Access Control (RBAC) System
// Granular permissions matrix and helpers for all user roles
// ==============================================================================

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "VERIFIED_SELLER" | "USER";

export interface RoleConfig {
  nameKa: string;
  nameEn: string;
  badgeEmoji: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  descriptionKa: string;
}

export const ROLES_CONFIG: Record<UserRole, RoleConfig> = {
  SUPER_ADMIN: {
    nameKa: "სუპერ ადმინი",
    nameEn: "Super Admin",
    badgeEmoji: "👑",
    badgeBg: "bg-purple-100 dark:bg-purple-950/70",
    badgeText: "text-purple-700 dark:text-purple-300",
    badgeBorder: "border-purple-300 dark:border-purple-800",
    descriptionKa: "სრული წვდომა და შეუზღუდავი უფლებამოსილება მთელ პლატფორმაზე",
  },
  ADMIN: {
    nameKa: "ადმინისტრატორი",
    nameEn: "Administrator",
    badgeEmoji: "⚡",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/70",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    badgeBorder: "border-indigo-300 dark:border-indigo-800",
    descriptionKa: "მოდერაცია, მომხმარებლების მართვა, ანალიტიკა და აუდიტის ლოგები",
  },
  MODERATOR: {
    nameKa: "მოდერატორი",
    nameEn: "Moderator",
    badgeEmoji: "🛡️",
    badgeBg: "bg-blue-100 dark:bg-blue-950/70",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-300 dark:border-blue-800",
    descriptionKa: "განცხადებების შემოწმება, დამალვა, გამოჩენა და წესების დაცვა",
  },
  VERIFIED_SELLER: {
    nameKa: "ვერიფიცირებული",
    nameEn: "Verified Seller",
    badgeEmoji: "🌿",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/70",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-300 dark:border-emerald-800",
    descriptionKa: "ვერიფიცირებული სანდო გამყიდველი მწვანე ნიშნულით და პრიორიტეტული განცხადებებით",
  },
  USER: {
    nameKa: "მომხმარებელი",
    nameEn: "Standard User",
    badgeEmoji: "👤",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-200",
    badgeBorder: "border-slate-300 dark:border-slate-700",
    descriptionKa: "სტანდარტული მომხმარებელი მცენარეების ყიდვა-გაყიდვისა და გაცვლისთვის",
  },
};

export type Permission =
  | "access_admin_panel"
  | "moderate_listings"
  | "delete_listings"
  | "manage_users"
  | "assign_admin_roles"
  | "manage_subscription_plans"
  | "view_audit_logs"
  | "manage_affiliate_scraper"
  | "verified_badge"
  | "custom_shop_url";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "access_admin_panel",
    "moderate_listings",
    "delete_listings",
    "manage_users",
    "assign_admin_roles",
    "manage_subscription_plans",
    "view_audit_logs",
    "manage_affiliate_scraper",
    "verified_badge",
    "custom_shop_url",
  ],
  ADMIN: [
    "access_admin_panel",
    "moderate_listings",
    "delete_listings",
    "manage_users",
    "view_audit_logs",
    "manage_affiliate_scraper",
    "verified_badge",
    "custom_shop_url",
  ],
  MODERATOR: [
    "access_admin_panel",
    "moderate_listings",
    "verified_badge",
  ],
  VERIFIED_SELLER: [
    "verified_badge",
    "custom_shop_url",
  ],
  USER: [],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const validRole = (role.toUpperCase() as UserRole);
  const permissions = ROLE_PERMISSIONS[validRole];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Helper permission checkers
 */
export function canAccessAdmin(role: UserRole | string | undefined | null, email?: string | null): boolean {
  if (email === "tokolejo@gmail.com") return true;
  return hasPermission(role, "access_admin_panel");
}

export function canModerate(role: UserRole | string | undefined | null, email?: string | null): boolean {
  if (email === "tokolejo@gmail.com") return true;
  return hasPermission(role, "moderate_listings");
}

export function canManageUsers(role: UserRole | string | undefined | null, email?: string | null): boolean {
  if (email === "tokolejo@gmail.com") return true;
  return hasPermission(role, "manage_users");
}

export function canManagePlans(role: UserRole | string | undefined | null, email?: string | null): boolean {
  if (email === "tokolejo@gmail.com") return true;
  return hasPermission(role, "manage_subscription_plans");
}

export function isVerified(role: UserRole | string | undefined | null): boolean {
  return hasPermission(role, "verified_badge");
}
