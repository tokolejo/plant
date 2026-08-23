import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { MobileBottomNav } from "@/components/common/MobileBottomNav";
import "../globals.css";

// ─── SEO Metadata ────────────────────────────────────────────────────────────
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isKa = locale === "ka";

  return {
    metadataBase: new URL("https://plantsale.ge"),
    title: {
      default: isKa
        ? "Plant — მცენარეებისა და მებაღეობის ონლაინ პლატფორმა"
        : "Plant — Buy, Sell & Swap Plants in Georgia",
      template: isKa ? "%s | Plant" : "%s | Plant",
    },
    description: isKa
      ? "იშვიათი მონსტერები, ფილოდენდრონები, ორქიდეები, კერამიკული ქოთნები, სუბსტრატები და უფასო საჩუქრები მთელი საქართველოს მასშტაბით."
      : "Rare Monsteras, Philodendrons, Orchids, ceramic pots, substrates and free giveaways across Georgia.",
    keywords: isKa
      ? ["მცენარე", "monstera", "philodendron", "ქოთანი", "გაყიდვა", "გაცვლა", "საქართველო", "plant"]
      : ["plants", "monstera", "philodendron", "buy plants Georgia", "sell plants", "plant swap", "Georgian marketplace"],
    openGraph: {
      type: "website",
      locale: isKa ? "ka_GE" : "en_US",
      alternateLocale: isKa ? ["en_US"] : ["ka_GE"],
      url: "https://plantsale.ge",
      siteName: "Plant",
      title: isKa
        ? "Plant — მცენარეების პლატფორმა"
        : "Plant — Botanical Marketplace in Georgia",
      description: isKa
        ? "იყიდე, გაყიდე და გაცვალე მცენარეები მთელი საქართველოს მასშტაბით."
        : "Buy, sell and swap plants across all of Georgia.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Plant",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Plant",
      description: isKa
        ? "საქართველოს #1 მცენარეების პლატფორმა"
        : "Georgia's #1 plant marketplace",
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `https://plantsale.ge/${locale}`,
      languages: {
        ka: "https://plantsale.ge/ka",
        en: "https://plantsale.ge/en",
      },
    },
    manifest: "/manifest.json",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PlantSale.Ge",
              url: "https://plantsale.ge",
              logo: "https://plantsale.ge/logo.png",
              description: "Georgia's C2C & B2C plant and gardening marketplace",
              sameAs: [],
            }),
          }}
        />
        {/* Structured Data — WebSite / Sitelinks Searchbox */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "PlantSale.Ge",
              url: "https://plantsale.ge",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://plantsale.ge/ka/listings?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col justify-between">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Header />
            <main className="flex-1 pb-16 lg:pb-0" style={{ overflow: 'visible' }}>{children}</main>
            <Footer />
            <MobileBottomNav />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
