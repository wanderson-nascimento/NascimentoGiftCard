import { IOClients } from '@vtex/api'
import { vbaseFor } from '@vtex/clients'

export const Payloads = vbaseFor<string, Record<string, unknown>>('payloads')
export type Payloads = InstanceType<typeof Payloads>

export class Clients extends IOClients {
  public get payloads() {
    return this.getOrSet('payloads', Payloads)
  }
}
