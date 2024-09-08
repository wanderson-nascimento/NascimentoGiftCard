import { UserInputError } from '@vtex/api'
import { json } from 'co-body'

const acceptedFlows = ['authorize']

/* eslint-disable no-console */
export async function getResponse(ctx: Context, next: () => Promise<void>) {
  const files = await ctx.clients.payloads.listFiles('payloads')
  console.log('Files', files)

  const { flow } = ctx.vtex.route.params

  if (typeof flow !== 'string') {
    throw new UserInputError(`flow parameter needs to be an string`)
  }

  if (!flow || !acceptedFlows.includes(flow)) {
    throw new UserInputError(`${flow} not supported`)
  }

  const data = await ctx.clients.payloads.get(flow, true)

  ctx.body = data
  ctx.status = 200

  await next()
}

export async function saveResponse(ctx: Context, next: () => Promise<void>) {
  const { flow } = ctx.vtex.route.params

  if (typeof flow !== 'string') {
    throw new UserInputError(`flow parameter needs to be an string`)
  }

  if (!flow || !acceptedFlows.includes(flow)) {
    throw new UserInputError(`${flow} not supported`)
  }

  const body = await json(ctx.req)

  await ctx.clients.payloads.save(flow, body)

  ctx.body = body
  ctx.status = 200

  await next()
}
