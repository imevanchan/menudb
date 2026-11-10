import { redirect } from "next/navigation";

export const instant = false;

// Previously shared item links now lead to the item within the menu.
export default async function MenuItemPage({ params }: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  redirect(`/menu#item-${encodeURIComponent(itemId)}`);
}
