import { RouterProvider, createBrowserRouter } from 'react-router'

import { AppLayout, type AppLayoutProps } from './components/AppLayout'
import { NotFoundPage } from './components/NotFoundPage'
import { QuestionEditorPage } from './components/QuestionEditorPage'
import { QuizPage } from './components/QuizPage'
import { SetDetailPage } from './components/SetDetailPage'
import { SetsPage } from './components/SetsPage'
import { getSet, listSets } from './data/repository'

export default function AppRoutes({ theme, setTheme }: AppLayoutProps) {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <AppLayout theme={theme} setTheme={setTheme} />,
      children: [
        {
          index: true,
          element: <SetsPage />,
          loader: async () => listSets(),
        },
        {
          path: 'set/:id',
          element: <SetDetailPage />,
          loader: async ({ params }) => (params.id ? getSet(params.id) : null),
        },
        {
          path: 'set/:id/quiz',
          element: <QuizPage />,
          loader: async ({ params }) => (params.id ? getSet(params.id) : null),
        },
        {
          path: 'set/:id/q/:qid?',
          element: <QuestionEditorPage />,
          loader: async ({ params }) => (params.id ? getSet(params.id) : null),
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ])

  return <RouterProvider router={router} />
}
