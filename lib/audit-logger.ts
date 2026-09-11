import { createClient } from "@/utils/supabase/client";

export type AuditAction =
  | "CREATE_PLAN"
  | "UPDATE_PLAN"
  | "DELETE_PLAN"
  | "DUPLICATE_PLAN"
  | "CHANGE_USER_ROLE"
  | "SUSPEND_USER"
  | "EXTEND_SUBSCRIPTION"
  | "UPDATE_SUBSCRIPTION_TIER"
  | "UPDATE_LISTING_STATUS"
  | "DELETE_LISTING"
  | "UPDATE_CUSTOM_SLUG"
  | "SCRAPE_AFFILIATE"
  | "SCRAPE_CATEGORY"
  | "SAVE_AFFILIATE"
  | "UPDATE_AFFILIATE"
  | "DELETE_AFFILIATE"
  | "DELETE_AFFILIATE_PARTNER"
  | "UPDATE_SITE_SETTINGS"
  | "FEEDBACK_STATUS_CHANGE"
  | "FEEDBACK_REPLY"
  | "DATA_EXPORT"
  | "TEST_AUDIT_LOG"
  | "SYSTEM_ERROR"
  | "API_ERROR"
  | "VALIDATION_ERROR"
  | "SYSTEM_MIGRATION";

export type AuditTargetType =
  | "PLAN"
  | "USER"
  | "LISTING"
  | "SUBSCRIPTION"
  | "AFFILIATE"
  | "FEEDBACK"
  | "SETTINGS"
  | "SITE_SETTINGS"
  | "SECURITY"
  | "SYSTEM"
  | "ERROR";

export interface LogAuditParams {
  actorId?: string | null;
  action: AuditAction | string;
  targetType: AuditTargetType | string;
  targetId?: string | null;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
}

export const AUDIT_EVENT_NAME = "plantsale_audit_log_added";

/**
 * Enterprise Audit Logger helper
 * Writes structured audit entries to Supabase via server route with immediate local dispatch
 */
export async function logAuditEvent(params: LogAuditParams): Promise<boolean> {
  try {
    const supabase = createClient();
    let currentActorId = params.actorId;

    if (!currentActorId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentActorId = user?.id || null;
      } catch {
        // ignore
      }
    }

    const payload = {
      actorId: currentActorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId || null,
      oldData: params.oldData || null,
      newData: params.newData || null,
    };

    // 1. Send to server API endpoint (bypasses RLS issues via service role)
    const response = await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const resData = await response.json();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUDIT_EVENT_NAME, { detail: resData.data }));
      }
      return true;
    }

    // Fallback: Direct insert if API route fails
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: currentActorId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId || null,
      old_data: params.oldData || null,
      new_data: params.newData || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Direct audit insert warning:", error.message);
    } else {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUDIT_EVENT_NAME));
      }
    }

    return true;
  } catch (err: any) {
    console.error("Audit log error:", err);
    return false;
  }
}

/**
 * Helper to log errors automatically across the site
 */
export async function logSystemError(errorTitle: string, errorDetails: any) {
  return logAuditEvent({
    action: "SYSTEM_ERROR",
    targetType: "ERROR",
    newData: {
      title: errorTitle,
      details: typeof errorDetails === "object" ? errorDetails : { message: String(errorDetails) },
      url: typeof window !== "undefined" ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Generate a test audit event for admin verification
 */
export async function logTestAuditEvent(customSummary?: string) {
  return logAuditEvent({
    action: "TEST_AUDIT_LOG",
    targetType: "SYSTEM",
    oldData: {
      status: "IDLE",
      metricScore: 84.5,
      version: "1.0.0",
      notes: "წინა სატესტო მდგომარეობა",
    },
    newData: {
      status: "ACTIVE",
      metricScore: 99.8,
      version: "1.1.0",
      changeSummary: customSummary || "სისტემური აუდიტის ტესტირება ადმინისტრატორის მიერ",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
  });
}
