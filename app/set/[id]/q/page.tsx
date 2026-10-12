import { QuestionEditorPage } from '../../../../src/components/QuestionEditorPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <QuestionEditorPage key={id} setId={id} />
}
