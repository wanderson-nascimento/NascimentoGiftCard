import type { PaymentProviderState } from '@vtex/payment-provider'
import { PaymentProviderService } from '@vtex/payment-provider'
import type { ClientsConfig, RecorderState, ServiceContext } from '@vtex/api'
import { method } from '@vtex/api'

import FakePayIOConnector from './connector'
import { getResponse, saveResponse } from './middlewares/responses'
import { Clients } from './clients'
import { serial } from './middlewares/serial'

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: 10000,
    },
    responses: {
      memoryCache: undefined,
    },
    serial: {
      memoryCache: undefined,
    },
  },
}

declare global {
  type Context = ServiceContext<Clients, PaymentProviderState>

  type State = RecorderState
}

export default new PaymentProviderService({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connector: FakePayIOConnector as any,
  clients,
  routes: {
    serial: method({
      POST: [serial],
    }),
    responses: method({
      GET: [getResponse],
      PUT: [saveResponse],
    }),
  },
})
