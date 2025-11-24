"use client"

import * as React from "react"

type CopyFn = (text: string) => Promise<boolean>

export function useCopyToClipboard(delay = 2000): [CopyFn, boolean] {
  const [isCopied, setIsCopied] = React.useState(false)

  React.useEffect(() => {
    if (!isCopied) return

    const timer = setTimeout(() => {
      setIsCopied(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [isCopied, delay])

  const copy: CopyFn = React.useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported")
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      return true
    } catch (error) {
      console.warn("Copy failed", error)
      return false
    }
  }, [])

  return [copy, isCopied]
}
