import { MetadataRoute } from "next";
import { createAdminClient } from "@/utils/supabase/admin";

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://plantio.ge";

  const staticRoutes = [
    "",
    "/listings",
    "/shops",
    "/services",
    "/iso",
    "/pricing",
    "/plant-doctor",
    "/faq",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of staticRoutes) {
    const isPriority = route === "" || route === "/listings";
    sitemapEntries.push({
      url: `${baseUrl}/ka${route}`,
      lastModified: new Date(),
      changeFrequency: isPriority ? "hourly" : "weekly",
      priority: route === "" ? 1.0 : route === "/listings" ? 0.9 : 0.7,
      alternates: {
        languages: {
          ka: `${baseUrl}/ka${route}`,
          en: `${baseUrl}/en${route}`,
        },
      },
    });
  }

  try {
    const admin = createAdminClient();
    const { data: listings } = await admin
      .from("listings")
      .select("id, updated_at")
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (listings && listings.length > 0) {
      for (const item of listings) {
        sitemapEntries.push({
          url: `${baseUrl}/ka/listings/${item.id}`,
          lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
          changeFrequency: "daily",
          priority: 0.8,
          alternates: {
            languages: {
              ka: `${baseUrl}/ka/listings/${item.id}`,
              en: `${baseUrl}/en/listings/${item.id}`,
            },
          },
        });
      }
    }
  } catch (err) {
    console.warn("[Sitemap Listings Fetch Warn]:", err);
  }

  return sitemapEntries;
}
