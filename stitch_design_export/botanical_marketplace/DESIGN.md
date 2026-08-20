---
name: Botanica Premium
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f2f2'
  surface-container: '#f1edec'
  surface-container-high: '#ece7e7'
  surface-container-highest: '#e6e1e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#404945'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#707974'
  outline-variant: '#c0c9c3'
  surface-tint: '#396758'
  primary: '#003629'
  on-primary: '#ffffff'
  primary-container: '#1d4d3f'
  on-primary-container: '#8cbcaa'
  inverse-primary: '#a0d1be'
  secondary: '#645d56'
  on-secondary: '#ffffff'
  secondary-container: '#e8ded5'
  on-secondary-container: '#69615a'
  tertiary: '#2d2f2f'
  on-tertiary: '#ffffff'
  tertiary-container: '#434545'
  on-tertiary-container: '#b1b2b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bbedda'
  primary-fixed-dim: '#a0d1be'
  on-primary-fixed: '#002118'
  on-primary-fixed-variant: '#204f40'
  secondary-fixed: '#ebe1d8'
  secondary-fixed-dim: '#cfc5bc'
  on-secondary-fixed: '#1f1b15'
  on-secondary-fixed-variant: '#4c463f'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e6e1e1'
  surface-cream: '#fcf9f8'
  primary-container-forest: '#1b4d3e'
  secondary-container-sand: '#ebe1d8'
  accent-star: '#376757'
  error-soft: '#ba1a1a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  section-gap: 80px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style
The brand identity is rooted in a "Premium Botanical" aesthetic—sophisticated, organic, and serene. It targets a high-end plant enthusiast market, prioritizing clarity, trust, and natural beauty. 

The design style is **Modern Corporate with a Soft Organic Touch**. It utilizes heavy whitespace, a refined natural color palette, and subtle elevation to create a sense of calm and organization. It avoids harsh edges and loud transitions in favor of soft shadows and harmonious tonal layering, evoking the feeling of a high-end physical boutique.

## Colors
The palette is dominated by "Deep Forest Green" (#003629) as the primary brand anchor, supported by "Earth Tone Brown" (#645d56) for secondary actions and organizational elements. 

The background strategy relies on a "Warm Cream" (#fcf9f8) rather than pure white to reduce eye strain and feel more natural. "Forest Green" is used for primary buttons and brand headers, while "Sand" (#ebe1d8) provides a soft, low-contrast background for chips and secondary containers. Text uses a "Near-Black" (#1c1b1b) for high legibility, while metadata and icons utilize "Slate Gray" (#404945) to maintain visual hierarchy.

## Typography
The system uses **Inter** exclusively to maintain a clean, systematic, and utilitarian feel. This choice ensures that the vibrant plant imagery remains the focal point while providing excellent legibility for commerce and logistics data.

- **Headlines:** Use tight letter-spacing and semi-bold weights to create a strong visual anchor.
- **Body:** Uses a generous 1.6 line-height for the large variant to ensure comfortable reading of product descriptions.
- **Labels:** Small utility text and navigation labels use increased letter-spacing and uppercase styling for distinct separation from body content.

## Layout & Spacing
The system employs a **Fixed Grid** approach for desktop (max-width: 1280px) and a **Fluid Grid** for mobile. 

The spacing rhythm is built on a 4px baseline unit. A 12-column grid is used for the main dashboard, but the layout is primarily driven by **Bento-style containers**. 
- **Desktop:** 64px outer margins and 16px gutters between cards.
- **Mobile:** 20px outer margins and 16px vertical gaps.
- **Vertical Rhythm:** Sections are separated by a generous 80px gap to provide breathing room and enforce a premium feel.

## Elevation & Depth
Depth is communicated through **Ambient Shadows** and **Tonal Layering**. 

The primary surface is the "Warm Cream" background. Interactive cards sit on a "Pure White" surface with a very diffused, low-opacity shadow (`rgba(0,0,0,0.04)` with a 30px blur). This creates a "lifted" effect without the harshness of traditional shadows. 

A secondary layer of depth is created using "Surface Containers" (Light Grays) for inactive UI elements like "Add New" placeholders or secondary buttons. Navigation bars use a **Glassmorphism** effect (80% opacity with a 10px backdrop blur) to maintain context of the content underneath while providing clear foreground separation.

## Shapes
The shape language is defined by large, inviting radii. 
- **Main Containers/Cards:** Use a signature 20px (`rounded-[20px]`) radius to soften the layout.
- **Buttons:** Match the 20px container radius to create a cohesive look.
- **Chips & Badges:** Use a smaller 12px radius for a distinct "pill-lite" appearance.
- **Profile Images:** Strictly circular (`rounded-full`) to contrast against the rectangular grid.
- **Interactive States:** Subtle scale-down (95-98%) on active touch/click to provide tactile feedback.

## Components
- **Buttons:** Primary buttons are solid "Forest Green" with white text. Secondary buttons use the "Sand" container with green text. All buttons have a height of 48px and a 20px corner radius.
- **Product Cards:** Feature a fixed-height image area (256px) with a subtle zoom-in hover effect. Meta-info is padded (24px) with a clear price-title hierarchy.
- **Navigation Tabs:** Flat styling with a bold 2px underline for the active state. Text is "Slate Gray" when inactive and "Forest Green" when active.
- **Status Chips:** Small, low-profile badges using "Sand" backgrounds and "Forest Green" text/icons, placed inside images or near titles to denote categories (e.g., "Rare", "Low Light").
- **Usage Banners:** High-contrast containers (Primary Container color) used for SaaS or utility messaging, featuring internal progress bars and simplified call-to-action buttons.
- **Bottom Navigation:** Mobile-specific, utilizing a frosted glass background and vertically stacked icon-plus-label arrangements.