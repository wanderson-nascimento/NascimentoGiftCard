import type {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
  SettlementResponse,
} from '@vtex/payment-provider'
import {
  Cancellations,
  PaymentProvider,
  Refunds,
  Settlements,
  Authorizations,
} from '@vtex/payment-provider'
import type { VBase } from '@vtex/api'

import {
  getSecondsPassed,
  randomString,
  getPersistedSerialResponse,
  persistSerialResponse,
} from './utils'
import { executeAuthorization } from './flow'

const authorizationsBucket = 'authorizations'
const persistAuthorizationResponse = async (
  vbase: VBase,
  resp: AuthorizationResponse
) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp)

const getPersistedAuthorizationResponse = async (
  vbase: VBase,
  req: AuthorizationRequest
) =>
  vbase.getJSON<AuthorizationResponse | undefined>(
    authorizationsBucket,
    req.paymentId,
    true
  )

export default class FakePayIOConnector extends PaymentProvider {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.

  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    if (this.isTestSuite) {
      const persistedResponse = await getPersistedAuthorizationResponse(
        this.context.clients.vbase,
        authorization
      )

      if (persistedResponse !== undefined && persistedResponse !== null) {
        return persistedResponse
      }

      return executeAuthorization(authorization, response =>
        this.saveAndRetry(authorization, response)
      )
    }

    // To redirect payment, use last name as "redirect"
    if (authorization.miniCart.buyer.lastName.toLowerCase() === 'redirect') {
      return Promise.resolve(
        Authorizations.redirect(authorization, {
          delayToCancel: 8400,
          paymentUrl: 'www.google.com',
          message: 'This payment needs to be redirected',
          redirectUrl: 'www.instagram.com',
        })
      )
    }

    // To use 3DS2 payment flow, use last name as "3ds2"
    if (authorization.miniCart.buyer.lastName.toLowerCase() === '3ds2') {
      const { vbase } = this.context.clients

      const persistedResponse = await getPersistedAuthorizationResponse(
        vbase,
        authorization
      )

      /**
       * At the first try, return 'Authorizing' status
       * This is the payment app that is used in this flow:
       * https://github.com/vtex-apps/example-payment-authorization-app
       */
      if (persistedResponse === undefined || persistedResponse === null) {
        const payload = {
          approvePaymentUrl: authorization.callbackUrl,
          denyPaymentUrl: `https://${authorization.merchantName}.myvtex.com/_v/api/fake-pay-io/payments/${authorization.paymentId}/cancellations?an=${authorization.merchantName}`,
        }

        const response: AuthorizationResponse = await Promise.resolve(
          Authorizations.pending(authorization, {
            delayToCancel: 300000,
            paymentAppData: {
              appName: 'vtex.example-payment-auth-app',
              payload: JSON.stringify(payload),
            },
            message: 'The customer needs to finish the payment flow',
          })
        )

        persistAuthorizationResponse(vbase, response)

        return response
      }

      /**
       * At the second try, return 'Authorized'
       */
      return Promise.resolve(
        Authorizations.approve(authorization, {
          tid: randomString(),
          nsu: randomString(),
          authorizationId: randomString(),
          delayToAutoSettle: 60,
          message: 'Payment has been approved',
        })
      )
    }

    // To use Pagar.me payment flow, use last name as "pagarme"
    if (authorization.miniCart.buyer.lastName.toLowerCase() === 'pagarme') {
      const SECONDS_TO_WAIT = 30000
      const { vbase } = this.context.clients

      const persistedResponse = await getPersistedAuthorizationResponse(
        vbase,
        authorization
      )

      const persistedSerial = await getPersistedSerialResponse(
        vbase,
        authorization.paymentId
      )

      /**
       * At the first try, if there's no persistedResponse or if there's no serial sent, return vtex.pagarme-payment-app status and the serial number submitUrl at payload
       */
      if (persistedResponse === undefined || persistedResponse === null) {
        const payload = {
          submitUrl: `https://${authorization.merchantName}.myvtex.com/_v/api/fake-pay-io/payments/${authorization.paymentId}/serial-number?transactionId=${authorization.transactionId}`,
        }

        const response: AuthorizationResponse = await Promise.resolve(
          Authorizations.pending(authorization, {
            delayToCancel: SECONDS_TO_WAIT,
            paymentAppData: {
              appName: 'vtex.pagarme-payment-app',
              payload: JSON.stringify(payload),
            },
            message: 'vtex.pagarme-payment-app',
          })
        )

        persistAuthorizationResponse(vbase, response)

        return response
      }

      /**
       * if pass for the first condition and exists persistedResponse and persistedSerial, it will check if the time defined has passed. If true, return payment approved
       */
      if (
        persistedResponse &&
        persistedResponse.message === 'vtex.challenge-wait-for-confirmation' &&
        persistedSerial &&
        getSecondsPassed(persistedSerial.time) >= SECONDS_TO_WAIT
      ) {
        persistSerialResponse(vbase, null, authorization.paymentId)

        return Promise.resolve(
          Authorizations.approve(authorization, {
            tid: randomString(),
            nsu: randomString(),
            authorizationId: randomString(),
            delayToAutoSettle: 60,
            message: 'Payment has been approved',
          })
        )
      }

      /**
       * The default return is vtex.challenge-wait-for-confirmation status, if none of previous ifs is executed
       */
      const response: AuthorizationResponse = await Promise.resolve(
        Authorizations.pending(authorization, {
          delayToCancel: SECONDS_TO_WAIT,
          code: '1234',
          paymentAppData: {
            appName: 'vtex.challenge-wait-for-confirmation',
            payload: JSON.stringify({
              secondsWaiting: SECONDS_TO_WAIT,
            }),
          },
          message: 'vtex.challenge-wait-for-confirmation',
        })
      )

      persistAuthorizationResponse(vbase, response)

      return response
    }

    // To deny payment, use last name as "deny"
    if (authorization.miniCart.buyer.lastName.toLowerCase() === 'deny') {
      return Promise.resolve(
        Authorizations.deny(authorization, {
          message: 'Payment has been denied',
        })
      )
    }

    // This is the response to make the payment go to authorizing
    if (authorization.miniCart.buyer.lastName.toLowerCase() === 'pending') {
      console.log(authorization);
      return Promise.resolve(
        Authorizations.pending(authorization, {
          delayToCancel: 600,
          message: 'Esperar o callback'

        })
      )
    }
    // This is the response to make the payment go to authorizing
    if (authorization.miniCart.buyer.lastName.toLowerCase() === 'pix') {
      console.log(authorization);
      return Promise.resolve(
        Authorizations.pending(authorization, {
          delayToCancel: 600,
          authorizationId: "312421421412",
          message: 'Esperar o callback do pixizinho',
          "paymentAppData": {
            "appName": "vtex.pix-payment",
            "payload": "{\"code\":\"00020101021226860014BR.GOV.BCB.PIX2564qrpix.bradesco.com.br/qr/v2/ddd90cec-8852-4709-b739-3686b1e8cf9f5204000053039865802BR5911NIVEA BRAGA6007BARUERI62290525Sf200002622814BE5BDA89A906304F2CA\",\"qrCodeBase64Image\":\"iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQAQAAAACoxAthAAAD2klEQVR42u2cPa7jMAyEJbhImSPkKDmadbQcJUdImSKwnskZ+icvC0TybrHAuFjDP5+LR4caDulNtXlLQoQIESLk3yGPZNup3q913p/n3TTg6us0/1PSUB+Xm990EdKLXPzqI11r9geMUzr5c4Kc772NcaeQPuSWsoXATj/P9zSmwXZ20h6Q69OQOXRCjiJ2nP1onPC62wP85Z93Qv4KUi0gnmHK5OnEfwN4ThVyGEGGsUggPJbU7abhmdajT0lJyNcI1kp76/038Hn3aXkV8jWybpFMKpI6b/KTfxKKQr5DLC55Fh3pWnLkG4+Cib+765JZrJSJpJAexE4jVdu9Jq2hAYunFts8WEKOIIyLi47Bj9akXmPlnIua7VoppBm5lvlvbxdyRMnlHqR1xCyqGSE9iJXgk8k9JpNF7uFa8ZixVhRyAEF1iIDcEu0OeiA1pHU6VyGdyANldkgQi8tgP4WRK2dlbt/bHUKaESSaSgnCZTHjdYcVkrKQI4hrj0T5vKlYqLfDA3lbK4W0IOZzZGRsWtA1juymkkP1bddKIW2IrY5eD5roeGJH8ecPWMz/57Z4F9KERAl+p8JGxQIlAk2NbVvyCGlEEBda+nSY4l5z/WlP09QT0oVgIcRbn9Km6F7fepOCcP2F9CNhfVJaIzKxcm4MVCHdCERHQsaeDycIbbp5VqW7SVqFHEOg87ZtVguPG3c8mV8nId3Ig94zzDl7AOKS2CTMS1x2NpSQVgSqb6RxV1/Re0VDlv7dVigKaUb8j35fvOew8ZC4/ZpX6Q8hhxDXeYWFS9TlLrQLVaC7HkI6EZr4mMqIohstbTRTvLYZf6k+IQ2Ip3Gfh0G39crhxBiEyau3dxHSiWD0xcPD/A3XY8xoC0a/ZRDSj1hOWSqWZyyZc2qB61HhgZS96hPSijCL0OCwI5rOVjnGkMx+ikBII4IJmDMaJjV2dTWkUdQM7yPNQlqQWugpbSZAKUMuSwt251oLaUVYHXKKIJRIWhW29wDyKwnpRuApubLLSNxscHt1yIYsTVIhvch9aZhwfJwkVErIk33vVUgrAiXi3/JgWUSGmdJG9ZW3dq2QJsRaVRz9XKYImM3ZsWLM0llIL1JjRiN6VAVz43Q9SnwIMfwaNRfyNRLtqIQpOjRTYto2kNu4d0eFNCIXfq/qGZsZhlPk/AJisxPSieDTvyWNp3VUcZnYSGlXiQvpRsI+2kwbMfu8z8MI6UXSiEHQka4/7WnY/XUnSIQ0IzFRVCpmuagBF9W3mv9CepH1+8roogwsz0P14Suqj59kCvkK0X/DIkSIECH/LfID05VTv6ks9RoAAAAASUVORK5CYII=\",\"expiresAt\":\"2024-09-03 21:05:47Z\",\"paymentId\":\"7927B8C373814BE5BDA89A904F8863CD\",\"transactionId\":\"B19F660FA7FB4F5EA424D718E463CF6B\"}"
          },
          "tid": "OpaSimbora",
          "acquirer": "Nascimento Pay",
          "delayToAutoSettle": 1,
          "delayToAutoSettleAfterAntifraud": 1,
          "code": "qualquer"
        })
      )
    }


    // This is the default response when using no custom configuration
    return Promise.resolve(

      Authorizations.approve(authorization, {
        tid: randomString(),
        nsu: randomString(),
        authorizationId: randomString(),
        delayToAutoSettleAfterAntifraud: 3600,
        delayToAutoSettle: 3600,
        message: 'Payment has been approved - AutoSettle',
      })
    )
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    return Promise.resolve(
      Cancellations.approve(cancellation, {
        cancellationId: `foo-${randomString()}`,
        code: 'success',
        message: 'Payment has been canceled.',
      })
    )

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.approve(refund, {
        refundId: randomString(),
      })
    }

    if (refund.value === 777) {
      return Promise.resolve(
        Refunds.manual(refund, {
          // value: 0,
          code: 'foo',
          message: 'Refund should be manually requested',
        })
      )
    }

    // It needs to implement deny scenario

    return Promise.resolve(
      Refunds.approve(refund, {
        refundId: randomString(),
        code: 'success',
        message: 'Payment has been refunded - teste WS Nascimento',
      })
    )

    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.approve(settlement, {
        settleId: randomString(),
      })
    }

    if (settlement.value === 100.08) {
      return Promise.resolve(
        Settlements.deny(settlement, {
          code: 'foo',
          message: 'Capture operation has been failed',
        })
      )
    }

    return Promise.resolve(
      Settlements.approve(settlement, {
        settleId: randomString(),
        code: 'success',
        message: 'Payment has been captured',
      })
    )

    throw new Error('Not implemented')
  }

  public inbound: undefined
}
