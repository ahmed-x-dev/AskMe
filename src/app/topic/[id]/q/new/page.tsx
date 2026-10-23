import { QuestionEditorPage } from "@/components/questions/QuestionEditorPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lessonId?: string | string[] }>;
}) {
  const { id } = await params;
  const { lessonId } = await searchParams;

  return (
    <QuestionEditorPage
      key={`${id}-${typeof lessonId === "string" ? lessonId : ""}`}
      topicId={id}
      lessonId={typeof lessonId === "string" ? lessonId : undefined}
    />
  );
}
