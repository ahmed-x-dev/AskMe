import { QuestionEditorPage } from "@/components/questions/QuestionEditorPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; qid: string }>;
}) {
  const { id, qid } = await params;

  return <QuestionEditorPage key={`${id}-${qid}`} setId={id} qid={qid} />;
}
