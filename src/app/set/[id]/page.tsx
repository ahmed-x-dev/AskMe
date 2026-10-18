import { SetDetailPage } from "@/components/sets/SetDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SetDetailPage key={id} setId={id} />;
}
