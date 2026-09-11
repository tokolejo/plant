import ShopStorefrontPage from "../../shops/[slug]/page";

export default function UserProfilePage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  return <ShopStorefrontPage params={{ slug: params.id }} />;
}
