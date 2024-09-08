import { json } from 'co-body'

import { persistSerialResponse } from '../utils'

export async function serial(ctx: Context, next: () => Promise<void>) {
  const body = await json(ctx.req)
  const { vbase } = ctx.clients

  const { serialNumber } = body
  const { paymentId } = ctx.vtex.route.params
  const response = {
    serial: '',
    time: Date.now(),
  }

  if (serialNumber === '1234') {
    ctx.status = 200
    response.serial = serialNumber
  } else {
    ctx.status = 500
  }

  persistSerialResponse(vbase, response, paymentId)

  ctx.body = response

  await next()
}
