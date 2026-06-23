import type { PlannerState } from './types'

function toBase64Url(input: string) {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeState(state: PlannerState) {
  return toBase64Url(JSON.stringify(state))
}

export function decodeState(encoded: string): PlannerState | null {
  try {
    return JSON.parse(fromBase64Url(encoded)) as PlannerState
  } catch {
    return null
  }
}

export function buildShareUrl(state: PlannerState) {
  const url = new URL(window.location.href)
  url.searchParams.set('s', encodeState(state))
  return url.toString()
}

export function stateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('s')
  return encoded ? decodeState(encoded) : null
}
