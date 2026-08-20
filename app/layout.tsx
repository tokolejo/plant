import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

// RootLayout is a pass-through because app/[locale]/layout.tsx provides <html> and <body> with locale
export default function RootLayout({ children }: Props) {
  return children;
}
