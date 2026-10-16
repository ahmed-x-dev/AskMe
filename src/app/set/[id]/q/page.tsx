import { QuestionEditorPage } from '@/components/QuestionEditorPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <QuestionEditorPage key={id} setId={id} />
}
