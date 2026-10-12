'use client'

import { useEffect, useState } from 'react'

import { getSet } from '../data/repository'
import type { QuizSet } from '../types/quiz'

type QuizSetState = {
  set: QuizSet | null
  setSet: (nextSet: QuizSet | null) => void
  isLoading: boolean
  errorMessage: string | null
}

/** Loads a set from browser storage and reports missing data separately from read failures. */
export function useQuizSet(setId: string): QuizSetState {
  const [set, setSet] = useState<QuizSet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    getSet(setId)
      .then((nextSet) => {
        if (isCurrent) {
          setSet(nextSet)
          setIsLoading(false)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not load this set.')
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [setId])

  return { set, setSet, isLoading, errorMessage }
}
