/** Starts a browser download of in-memory data, for example a backup ZIP or a roadmap JSON file. */
export function downloadFile(fileName: string, data: BlobPart, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([data], { type: mimeType }))
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()

  // Revoke after the click has been handled, so the download is not cancelled.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
