import { QuizPage } from '@/features/quiz/components/QuizPage'
import type { QuizMode } from '@/features/quiz'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string | string[] }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const requestedMode = Array.isArray(query.mode) ? query.mode[0] : query.mode
  const mode: QuizMode =
    requestedMode === 'mcq' || requestedMode === 'essay' ? requestedMode : 'random'

  return <QuizPage key={`${id}-${mode}`} setId={id} mode={mode} />
}
