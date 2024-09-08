import type { VBase } from '@vtex/api'

export const randomString = () => {
  return Math.random().toString(36).substring(7)
}

export const randomUrl = () => {
  return `https://${randomString()}.com`
}

export const getSecondsPassed = (timeInMilliseconds: number) => {
  return Date.now() - timeInMilliseconds
}

export type SerialNumberResponse = {
  serial: string
  time: number
}

export type SerialNumberRequest = {
  serial: string
}

const serialNumberBucket = 'serial-number'

export const persistSerialResponse = async (
  vbase: VBase,
  resp: SerialNumberResponse | null,
  paymentId: string | string[]
) => vbase.saveJSON(serialNumberBucket, `${paymentId}`, resp)

export const getPersistedSerialResponse = async (
  vbase: VBase,
  paymentId: string
) =>
  vbase.getJSON<SerialNumberResponse | undefined>(
    serialNumberBucket,
    paymentId,
    true
  )
