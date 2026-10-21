import { MAX_LESSON_FILE_SIZE_BYTES, type LessonResource } from '@/types/study'
import type { LessonResourceInput } from '@/lib/data/lessons'

const DOCUMENT_MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

/** Reads an allowed local document into the portable form stored with a lesson. */
export async function prepareLessonFile(file: File, title: string): Promise<LessonResourceInput> {
  const extension = file.name.split('.').at(-1)?.toLowerCase() ?? ''
  const mimeType = DOCUMENT_MIME_TYPES[extension]

  if (!mimeType) {
    throw new Error('Choose a PDF, TXT, Markdown, or Word document.')
  }
  if (file.size < 1 || file.size > MAX_LESSON_FILE_SIZE_BYTES) {
    throw new Error('Choose a document smaller than 20 MB.')
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const chunks: string[] = []
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)))
  }

  return {
    source: 'file',
    title,
    fileName: file.name,
    mimeType,
    size: file.size,
    fileData: btoa(chunks.join('')),
  }
}

/** Opens a saved document in a new tab for reading. */
export function openLessonFile(resource: LessonResource): void {
  if (resource.source !== 'file') {
    throw new Error('This resource is not a saved document.')
  }

  const url = createLessonFileUrl(resource)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Downloads a saved local lesson document to the device. */
export function downloadLessonFile(resource: LessonResource): void {
  if (resource.source !== 'file') {
    throw new Error('This resource is not a saved document.')
  }

  const url = createLessonFileUrl(resource)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = resource.fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function createLessonFileUrl(resource: Extract<LessonResource, { source: 'file' }>): string {
  const binary = atob(resource.fileData)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return URL.createObjectURL(new Blob([bytes], { type: resource.mimeType }))
}

/** Formats a document's byte size for the resource list. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
