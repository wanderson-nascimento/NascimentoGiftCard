"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_provider_1 = require("@vtex/payment-provider");
const utils_1 = require("./utils");
const flow_1 = require("./flow");
const authorizationsBucket = 'authorizations';
const persistAuthorizationResponse = async (vbase, resp) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp);
const getPersistedAuthorizationResponse = async (vbase, req) => vbase.getJSON(authorizationsBucket, req.paymentId, true);
class FakePayIOConnector extends payment_provider_1.PaymentProvider {
    // This class needs modifications to pass the test suit.
    // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
    // in order to learn about the protocol and make the according changes.
    async saveAndRetry(req, resp) {
        await persistAuthorizationResponse(this.context.clients.vbase, resp);
        this.callback(req, resp);
    }
    async authorize(authorization) {
        if (this.isTestSuite) {
            const persistedResponse = await getPersistedAuthorizationResponse(this.context.clients.vbase, authorization);
            if (persistedResponse !== undefined && persistedResponse !== null) {
                return persistedResponse;
            }
            return flow_1.executeAuthorization(authorization, response => this.saveAndRetry(authorization, response));
        }
        // To redirect payment, use last name as "redirect"
        if (authorization.miniCart.buyer.lastName.toLowerCase() === 'redirect') {
            return Promise.resolve(payment_provider_1.Authorizations.redirect(authorization, {
                delayToCancel: 8400,
                paymentUrl: 'www.google.com',
                message: 'This payment needs to be redirected',
                redirectUrl: 'deprecated',
            }));
        }
        // To use 3DS2 payment flow, use last name as "3ds2"
        if (authorization.miniCart.buyer.lastName.toLowerCase() === '3ds2') {
            const { vbase } = this.context.clients;
            const persistedResponse = await getPersistedAuthorizationResponse(vbase, authorization);
            /**
             * At the first try, return 'Authorizing' status
             * This is the payment app that is used in this flow:
             * https://github.com/vtex-apps/example-payment-authorization-app
             */
            if (persistedResponse === undefined || persistedResponse === null) {
                const payload = {
                    approvePaymentUrl: authorization.callbackUrl,
                    denyPaymentUrl: `https://${authorization.merchantName}.myvtex.com/_v/api/fake-pay-io/payments/${authorization.paymentId}/cancellations?an=${authorization.merchantName}`,
                };
                const response = await Promise.resolve(payment_provider_1.Authorizations.pending(authorization, {
                    delayToCancel: 300000,
                    paymentAppData: {
                        appName: 'vtex.example-payment-auth-app',
                        payload: JSON.stringify(payload),
                    },
                    message: 'The customer needs to finish the payment flow',
                }));
                persistAuthorizationResponse(vbase, response);
                return response;
            }
            /**
             * At the second try, return 'Authorized'
             */
            return Promise.resolve(payment_provider_1.Authorizations.approve(authorization, {
                tid: utils_1.randomString(),
                nsu: utils_1.randomString(),
                authorizationId: utils_1.randomString(),
                delayToAutoSettle: 60,
                message: 'Payment has been approved',
            }));
        }
        // To use Pagar.me payment flow, use last name as "pagarme"
        if (authorization.miniCart.buyer.lastName.toLowerCase() === 'pagarme') {
            const SECONDS_TO_WAIT = 30000;
            const { vbase } = this.context.clients;
            const persistedResponse = await getPersistedAuthorizationResponse(vbase, authorization);
            const persistedSerial = await utils_1.getPersistedSerialResponse(vbase, authorization.paymentId);
            /**
             * At the first try, if there's no persistedResponse or if there's no serial sent, return vtex.pagarme-payment-app status and the serial number submitUrl at payload
             */
            if (persistedResponse === undefined || persistedResponse === null) {
                const payload = {
                    submitUrl: `https://${authorization.merchantName}.myvtex.com/_v/api/fake-pay-io/payments/${authorization.paymentId}/serial-number?transactionId=${authorization.transactionId}`,
                };
                const response = await Promise.resolve(payment_provider_1.Authorizations.pending(authorization, {
                    delayToCancel: SECONDS_TO_WAIT,
                    paymentAppData: {
                        appName: 'vtex.pagarme-payment-app',
                        payload: JSON.stringify(payload),
                    },
                    message: 'vtex.pagarme-payment-app',
                }));
                persistAuthorizationResponse(vbase, response);
                return response;
            }
            /**
             * if pass for the first condition and exists persistedResponse and persistedSerial, it will check if the time defined has passed. If true, return payment approved
             */
            if (persistedResponse &&
                persistedResponse.message === 'vtex.challenge-wait-for-confirmation' &&
                persistedSerial &&
                utils_1.getSecondsPassed(persistedSerial.time) >= SECONDS_TO_WAIT) {
                utils_1.persistSerialResponse(vbase, null, authorization.paymentId);
                return Promise.resolve(payment_provider_1.Authorizations.approve(authorization, {
                    tid: utils_1.randomString(),
                    nsu: utils_1.randomString(),
                    authorizationId: utils_1.randomString(),
                    delayToAutoSettle: 60,
                    message: 'Payment has been approved',
                }));
            }
            /**
             * The default return is vtex.challenge-wait-for-confirmation status, if none of previous ifs is executed
             */
            const response = await Promise.resolve(payment_provider_1.Authorizations.pending(authorization, {
                delayToCancel: SECONDS_TO_WAIT,
                code: '1234',
                paymentAppData: {
                    appName: 'vtex.challenge-wait-for-confirmation',
                    payload: JSON.stringify({
                        secondsWaiting: SECONDS_TO_WAIT,
                    }),
                },
                message: 'vtex.challenge-wait-for-confirmation',
            }));
            persistAuthorizationResponse(vbase, response);
            return response;
        }
        // To deny payment, use last name as "deny"
        if (authorization.miniCart.buyer.lastName.toLowerCase() === 'deny') {
            return Promise.resolve(payment_provider_1.Authorizations.deny(authorization, {
                message: 'Payment has been denied',
            }));
        }
        // This is the default response when using no custom configuration
        return Promise.resolve(payment_provider_1.Authorizations.approve(authorization, {
            tid: utils_1.randomString(),
            nsu: utils_1.randomString(),
            authorizationId: utils_1.randomString(),
            delayToAutoSettle: 3600,
            message: 'Payment has been approved',
        }));
    }
    async cancel(cancellation) {
        if (this.isTestSuite) {
            return payment_provider_1.Cancellations.approve(cancellation, {
                cancellationId: utils_1.randomString(),
            });
        }
        return Promise.resolve(payment_provider_1.Cancellations.approve(cancellation, {
            cancellationId: `foo-${utils_1.randomString()}`,
            code: 'success',
            message: 'Payment has been canceled.',
        }));
        throw new Error('Not implemented');
    }
    async refund(refund) {
        if (this.isTestSuite) {
            return payment_provider_1.Refunds.approve(refund, {
                refundId: utils_1.randomString(),
            });
        }
        if (refund.value === 101010) {
            return Promise.resolve(payment_provider_1.Refunds.manual(refund, {
                // value: 0,
                code: 'foo',
                message: 'Refund should be manually requested',
            }));
        }
        // It needs to implement deny scenario
        return Promise.resolve(payment_provider_1.Refunds.approve(refund, {
            refundId: `foo-${utils_1.randomString()}`,
            code: 'success',
            message: 'Payment has been refunded',
        }));
        throw new Error('Not implemented');
    }
    async settle(settlement) {
        if (this.isTestSuite) {
            return payment_provider_1.Settlements.approve(settlement, {
                settleId: utils_1.randomString(),
            });
        }
        if (settlement.value === 1001) {
            return Promise.resolve(payment_provider_1.Settlements.deny(settlement, {
                code: 'foo',
                message: 'Capture operation has been failed',
            }));
        }
        return Promise.resolve(payment_provider_1.Settlements.approve(settlement, {
            settleId: utils_1.randomString(),
            code: 'success',
            message: 'Payment has been captured',
        }));
        throw new Error('Not implemented');
    }
}
exports.default = FakePayIOConnector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL25vZGUvY29ubmVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBVUEsNkRBTStCO0FBRy9CLG1DQUtnQjtBQUNoQixpQ0FBNkM7QUFFN0MsTUFBTSxvQkFBb0IsR0FBRyxnQkFBZ0IsQ0FBQTtBQUM3QyxNQUFNLDRCQUE0QixHQUFHLEtBQUssRUFDeEMsS0FBWSxFQUNaLElBQTJCLEVBQzNCLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFFL0QsTUFBTSxpQ0FBaUMsR0FBRyxLQUFLLEVBQzdDLEtBQVksRUFDWixHQUF5QixFQUN6QixFQUFFLENBQ0YsS0FBSyxDQUFDLE9BQU8sQ0FDWCxvQkFBb0IsRUFDcEIsR0FBRyxDQUFDLFNBQVMsRUFDYixJQUFJLENBQ0wsQ0FBQTtBQUVILE1BQXFCLGtCQUFtQixTQUFRLGtDQUFlO0lBQzdELHdEQUF3RDtJQUN4RCxpRkFBaUY7SUFDakYsdUVBQXVFO0lBRS9ELEtBQUssQ0FBQyxZQUFZLENBQ3hCLEdBQXlCLEVBQ3pCLElBQTJCO1FBRTNCLE1BQU0sNEJBQTRCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzFCLENBQUM7SUFFTSxLQUFLLENBQUMsU0FBUyxDQUNwQixhQUFtQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGlDQUFpQyxDQUMvRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzFCLGFBQWEsQ0FDZCxDQUFBO1lBRUQsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO2dCQUNqRSxPQUFPLGlCQUFpQixDQUFBO2FBQ3pCO1lBRUQsT0FBTywyQkFBb0IsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQzNDLENBQUE7U0FDRjtRQUVELG1EQUFtRDtRQUNuRCxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxVQUFVLEVBQUU7WUFDdEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUNwQixpQ0FBYyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUU7Z0JBQ3JDLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixVQUFVLEVBQUUsZ0JBQWdCO2dCQUM1QixPQUFPLEVBQUUscUNBQXFDO2dCQUM5QyxXQUFXLEVBQUUsWUFBWTthQUMxQixDQUFDLENBQ0gsQ0FBQTtTQUNGO1FBRUQsb0RBQW9EO1FBQ3BELElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sRUFBRTtZQUNsRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUE7WUFFdEMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGlDQUFpQyxDQUMvRCxLQUFLLEVBQ0wsYUFBYSxDQUNkLENBQUE7WUFFRDs7OztlQUlHO1lBQ0gsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO2dCQUNqRSxNQUFNLE9BQU8sR0FBRztvQkFDZCxpQkFBaUIsRUFBRSxhQUFhLENBQUMsV0FBVztvQkFDNUMsY0FBYyxFQUFFLFdBQVcsYUFBYSxDQUFDLFlBQVksMkNBQTJDLGFBQWEsQ0FBQyxTQUFTLHFCQUFxQixhQUFhLENBQUMsWUFBWSxFQUFFO2lCQUN6SyxDQUFBO2dCQUVELE1BQU0sUUFBUSxHQUEwQixNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQzNELGlDQUFjLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtvQkFDcEMsYUFBYSxFQUFFLE1BQU07b0JBQ3JCLGNBQWMsRUFBRTt3QkFDZCxPQUFPLEVBQUUsK0JBQStCO3dCQUN4QyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7cUJBQ2pDO29CQUNELE9BQU8sRUFBRSwrQ0FBK0M7aUJBQ3pELENBQUMsQ0FDSCxDQUFBO2dCQUVELDRCQUE0QixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQTtnQkFFN0MsT0FBTyxRQUFRLENBQUE7YUFDaEI7WUFFRDs7ZUFFRztZQUNILE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDcEIsaUNBQWMsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO2dCQUNwQyxHQUFHLEVBQUUsb0JBQVksRUFBRTtnQkFDbkIsR0FBRyxFQUFFLG9CQUFZLEVBQUU7Z0JBQ25CLGVBQWUsRUFBRSxvQkFBWSxFQUFFO2dCQUMvQixpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixPQUFPLEVBQUUsMkJBQTJCO2FBQ3JDLENBQUMsQ0FDSCxDQUFBO1NBQ0Y7UUFFRCwyREFBMkQ7UUFDM0QsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssU0FBUyxFQUFFO1lBQ3JFLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQTtZQUM3QixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUE7WUFFdEMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGlDQUFpQyxDQUMvRCxLQUFLLEVBQ0wsYUFBYSxDQUNkLENBQUE7WUFFRCxNQUFNLGVBQWUsR0FBRyxNQUFNLGtDQUEwQixDQUN0RCxLQUFLLEVBQ0wsYUFBYSxDQUFDLFNBQVMsQ0FDeEIsQ0FBQTtZQUVEOztlQUVHO1lBQ0gsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO2dCQUNqRSxNQUFNLE9BQU8sR0FBRztvQkFDZCxTQUFTLEVBQUUsV0FBVyxhQUFhLENBQUMsWUFBWSwyQ0FBMkMsYUFBYSxDQUFDLFNBQVMsZ0NBQWdDLGFBQWEsQ0FBQyxhQUFhLEVBQUU7aUJBQ2hMLENBQUE7Z0JBRUQsTUFBTSxRQUFRLEdBQTBCLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FDM0QsaUNBQWMsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO29CQUNwQyxhQUFhLEVBQUUsZUFBZTtvQkFDOUIsY0FBYyxFQUFFO3dCQUNkLE9BQU8sRUFBRSwwQkFBMEI7d0JBQ25DLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztxQkFDakM7b0JBQ0QsT0FBTyxFQUFFLDBCQUEwQjtpQkFDcEMsQ0FBQyxDQUNILENBQUE7Z0JBRUQsNEJBQTRCLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFBO2dCQUU3QyxPQUFPLFFBQVEsQ0FBQTthQUNoQjtZQUVEOztlQUVHO1lBQ0gsSUFDRSxpQkFBaUI7Z0JBQ2pCLGlCQUFpQixDQUFDLE9BQU8sS0FBSyxzQ0FBc0M7Z0JBQ3BFLGVBQWU7Z0JBQ2Ysd0JBQWdCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsRUFDekQ7Z0JBQ0EsNkJBQXFCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUE7Z0JBRTNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDcEIsaUNBQWMsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO29CQUNwQyxHQUFHLEVBQUUsb0JBQVksRUFBRTtvQkFDbkIsR0FBRyxFQUFFLG9CQUFZLEVBQUU7b0JBQ25CLGVBQWUsRUFBRSxvQkFBWSxFQUFFO29CQUMvQixpQkFBaUIsRUFBRSxFQUFFO29CQUNyQixPQUFPLEVBQUUsMkJBQTJCO2lCQUNyQyxDQUFDLENBQ0gsQ0FBQTthQUNGO1lBRUQ7O2VBRUc7WUFDSCxNQUFNLFFBQVEsR0FBMEIsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUMzRCxpQ0FBYyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BDLGFBQWEsRUFBRSxlQUFlO2dCQUM5QixJQUFJLEVBQUUsTUFBTTtnQkFDWixjQUFjLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLHNDQUFzQztvQkFDL0MsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7d0JBQ3RCLGNBQWMsRUFBRSxlQUFlO3FCQUNoQyxDQUFDO2lCQUNIO2dCQUNELE9BQU8sRUFBRSxzQ0FBc0M7YUFDaEQsQ0FBQyxDQUNILENBQUE7WUFFRCw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFFN0MsT0FBTyxRQUFRLENBQUE7U0FDaEI7UUFFRCwyQ0FBMkM7UUFDM0MsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssTUFBTSxFQUFFO1lBQ2xFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDcEIsaUNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUNqQyxPQUFPLEVBQUUseUJBQXlCO2FBQ25DLENBQUMsQ0FDSCxDQUFBO1NBQ0Y7UUFFRCxrRUFBa0U7UUFDbEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUNwQixpQ0FBYyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDcEMsR0FBRyxFQUFFLG9CQUFZLEVBQUU7WUFDbkIsR0FBRyxFQUFFLG9CQUFZLEVBQUU7WUFDbkIsZUFBZSxFQUFFLG9CQUFZLEVBQUU7WUFDL0IsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixPQUFPLEVBQUUsMkJBQTJCO1NBQ3JDLENBQUMsQ0FDSCxDQUFBO0lBQ0gsQ0FBQztJQUVNLEtBQUssQ0FBQyxNQUFNLENBQ2pCLFlBQWlDO1FBRWpDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixPQUFPLGdDQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtnQkFDekMsY0FBYyxFQUFFLG9CQUFZLEVBQUU7YUFDL0IsQ0FBQyxDQUFBO1NBQ0g7UUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQ3BCLGdDQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNsQyxjQUFjLEVBQUUsT0FBTyxvQkFBWSxFQUFFLEVBQUU7WUFDdkMsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsNEJBQTRCO1NBQ3RDLENBQUMsQ0FDSCxDQUFBO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFFTSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQXFCO1FBQ3ZDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixPQUFPLDBCQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtnQkFDN0IsUUFBUSxFQUFFLG9CQUFZLEVBQUU7YUFDekIsQ0FBQyxDQUFBO1NBQ0g7UUFFRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssTUFBTSxFQUFFO1lBQzNCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDcEIsMEJBQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNyQixZQUFZO2dCQUNaLElBQUksRUFBRSxLQUFLO2dCQUNYLE9BQU8sRUFBRSxxQ0FBcUM7YUFDL0MsQ0FBQyxDQUNILENBQUE7U0FDRjtRQUVELHNDQUFzQztRQUV0QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQ3BCLDBCQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUN0QixRQUFRLEVBQUUsT0FBTyxvQkFBWSxFQUFFLEVBQUU7WUFDakMsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsMkJBQTJCO1NBQ3JDLENBQUMsQ0FDSCxDQUFBO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFFTSxLQUFLLENBQUMsTUFBTSxDQUNqQixVQUE2QjtRQUU3QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsT0FBTyw4QkFBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBQ3JDLFFBQVEsRUFBRSxvQkFBWSxFQUFFO2FBQ3pCLENBQUMsQ0FBQTtTQUNIO1FBRUQsSUFBSSxVQUFVLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRTtZQUM3QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQ3BCLDhCQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDM0IsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsT0FBTyxFQUFFLG1DQUFtQzthQUM3QyxDQUFDLENBQ0gsQ0FBQTtTQUNGO1FBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUNwQiw4QkFBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDOUIsUUFBUSxFQUFFLG9CQUFZLEVBQUU7WUFDeEIsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsMkJBQTJCO1NBQ3JDLENBQUMsQ0FDSCxDQUFBO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7Q0FHRjtBQXJSRCxxQ0FxUkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEF1dGhvcml6YXRpb25SZXF1ZXN0LFxuICBBdXRob3JpemF0aW9uUmVzcG9uc2UsXG4gIENhbmNlbGxhdGlvblJlcXVlc3QsXG4gIENhbmNlbGxhdGlvblJlc3BvbnNlLFxuICBSZWZ1bmRSZXF1ZXN0LFxuICBSZWZ1bmRSZXNwb25zZSxcbiAgU2V0dGxlbWVudFJlcXVlc3QsXG4gIFNldHRsZW1lbnRSZXNwb25zZSxcbn0gZnJvbSAnQHZ0ZXgvcGF5bWVudC1wcm92aWRlcidcbmltcG9ydCB7XG4gIENhbmNlbGxhdGlvbnMsXG4gIFBheW1lbnRQcm92aWRlcixcbiAgUmVmdW5kcyxcbiAgU2V0dGxlbWVudHMsXG4gIEF1dGhvcml6YXRpb25zLFxufSBmcm9tICdAdnRleC9wYXltZW50LXByb3ZpZGVyJ1xuaW1wb3J0IHR5cGUgeyBWQmFzZSB9IGZyb20gJ0B2dGV4L2FwaSdcblxuaW1wb3J0IHtcbiAgZ2V0U2Vjb25kc1Bhc3NlZCxcbiAgcmFuZG9tU3RyaW5nLFxuICBnZXRQZXJzaXN0ZWRTZXJpYWxSZXNwb25zZSxcbiAgcGVyc2lzdFNlcmlhbFJlc3BvbnNlLFxufSBmcm9tICcuL3V0aWxzJ1xuaW1wb3J0IHsgZXhlY3V0ZUF1dGhvcml6YXRpb24gfSBmcm9tICcuL2Zsb3cnXG5cbmNvbnN0IGF1dGhvcml6YXRpb25zQnVja2V0ID0gJ2F1dGhvcml6YXRpb25zJ1xuY29uc3QgcGVyc2lzdEF1dGhvcml6YXRpb25SZXNwb25zZSA9IGFzeW5jIChcbiAgdmJhc2U6IFZCYXNlLFxuICByZXNwOiBBdXRob3JpemF0aW9uUmVzcG9uc2VcbikgPT4gdmJhc2Uuc2F2ZUpTT04oYXV0aG9yaXphdGlvbnNCdWNrZXQsIHJlc3AucGF5bWVudElkLCByZXNwKVxuXG5jb25zdCBnZXRQZXJzaXN0ZWRBdXRob3JpemF0aW9uUmVzcG9uc2UgPSBhc3luYyAoXG4gIHZiYXNlOiBWQmFzZSxcbiAgcmVxOiBBdXRob3JpemF0aW9uUmVxdWVzdFxuKSA9PlxuICB2YmFzZS5nZXRKU09OPEF1dGhvcml6YXRpb25SZXNwb25zZSB8IHVuZGVmaW5lZD4oXG4gICAgYXV0aG9yaXphdGlvbnNCdWNrZXQsXG4gICAgcmVxLnBheW1lbnRJZCxcbiAgICB0cnVlXG4gIClcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmFrZVBheUlPQ29ubmVjdG9yIGV4dGVuZHMgUGF5bWVudFByb3ZpZGVyIHtcbiAgLy8gVGhpcyBjbGFzcyBuZWVkcyBtb2RpZmljYXRpb25zIHRvIHBhc3MgdGhlIHRlc3Qgc3VpdC5cbiAgLy8gUmVmZXIgdG8gaHR0cHM6Ly9oZWxwLnZ0ZXguY29tL2VuL3R1dG9yaWFsL3BheW1lbnQtcHJvdmlkZXItcHJvdG9jb2wjNC10ZXN0aW5nXG4gIC8vIGluIG9yZGVyIHRvIGxlYXJuIGFib3V0IHRoZSBwcm90b2NvbCBhbmQgbWFrZSB0aGUgYWNjb3JkaW5nIGNoYW5nZXMuXG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQW5kUmV0cnkoXG4gICAgcmVxOiBBdXRob3JpemF0aW9uUmVxdWVzdCxcbiAgICByZXNwOiBBdXRob3JpemF0aW9uUmVzcG9uc2VcbiAgKSB7XG4gICAgYXdhaXQgcGVyc2lzdEF1dGhvcml6YXRpb25SZXNwb25zZSh0aGlzLmNvbnRleHQuY2xpZW50cy52YmFzZSwgcmVzcClcbiAgICB0aGlzLmNhbGxiYWNrKHJlcSwgcmVzcClcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhdXRob3JpemUoXG4gICAgYXV0aG9yaXphdGlvbjogQXV0aG9yaXphdGlvblJlcXVlc3RcbiAgKTogUHJvbWlzZTxBdXRob3JpemF0aW9uUmVzcG9uc2U+IHtcbiAgICBpZiAodGhpcy5pc1Rlc3RTdWl0ZSkge1xuICAgICAgY29uc3QgcGVyc2lzdGVkUmVzcG9uc2UgPSBhd2FpdCBnZXRQZXJzaXN0ZWRBdXRob3JpemF0aW9uUmVzcG9uc2UoXG4gICAgICAgIHRoaXMuY29udGV4dC5jbGllbnRzLnZiYXNlLFxuICAgICAgICBhdXRob3JpemF0aW9uXG4gICAgICApXG5cbiAgICAgIGlmIChwZXJzaXN0ZWRSZXNwb25zZSAhPT0gdW5kZWZpbmVkICYmIHBlcnNpc3RlZFJlc3BvbnNlICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBwZXJzaXN0ZWRSZXNwb25zZVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhlY3V0ZUF1dGhvcml6YXRpb24oYXV0aG9yaXphdGlvbiwgcmVzcG9uc2UgPT5cbiAgICAgICAgdGhpcy5zYXZlQW5kUmV0cnkoYXV0aG9yaXphdGlvbiwgcmVzcG9uc2UpXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gVG8gcmVkaXJlY3QgcGF5bWVudCwgdXNlIGxhc3QgbmFtZSBhcyBcInJlZGlyZWN0XCJcbiAgICBpZiAoYXV0aG9yaXphdGlvbi5taW5pQ2FydC5idXllci5sYXN0TmFtZS50b0xvd2VyQ2FzZSgpID09PSAncmVkaXJlY3QnKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICBBdXRob3JpemF0aW9ucy5yZWRpcmVjdChhdXRob3JpemF0aW9uLCB7XG4gICAgICAgICAgZGVsYXlUb0NhbmNlbDogODQwMCxcbiAgICAgICAgICBwYXltZW50VXJsOiAnd3d3Lmdvb2dsZS5jb20nLFxuICAgICAgICAgIG1lc3NhZ2U6ICdUaGlzIHBheW1lbnQgbmVlZHMgdG8gYmUgcmVkaXJlY3RlZCcsXG4gICAgICAgICAgcmVkaXJlY3RVcmw6ICdkZXByZWNhdGVkJyxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICB9XG5cbiAgICAvLyBUbyB1c2UgM0RTMiBwYXltZW50IGZsb3csIHVzZSBsYXN0IG5hbWUgYXMgXCIzZHMyXCJcbiAgICBpZiAoYXV0aG9yaXphdGlvbi5taW5pQ2FydC5idXllci5sYXN0TmFtZS50b0xvd2VyQ2FzZSgpID09PSAnM2RzMicpIHtcbiAgICAgIGNvbnN0IHsgdmJhc2UgfSA9IHRoaXMuY29udGV4dC5jbGllbnRzXG5cbiAgICAgIGNvbnN0IHBlcnNpc3RlZFJlc3BvbnNlID0gYXdhaXQgZ2V0UGVyc2lzdGVkQXV0aG9yaXphdGlvblJlc3BvbnNlKFxuICAgICAgICB2YmFzZSxcbiAgICAgICAgYXV0aG9yaXphdGlvblxuICAgICAgKVxuXG4gICAgICAvKipcbiAgICAgICAqIEF0IHRoZSBmaXJzdCB0cnksIHJldHVybiAnQXV0aG9yaXppbmcnIHN0YXR1c1xuICAgICAgICogVGhpcyBpcyB0aGUgcGF5bWVudCBhcHAgdGhhdCBpcyB1c2VkIGluIHRoaXMgZmxvdzpcbiAgICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS92dGV4LWFwcHMvZXhhbXBsZS1wYXltZW50LWF1dGhvcml6YXRpb24tYXBwXG4gICAgICAgKi9cbiAgICAgIGlmIChwZXJzaXN0ZWRSZXNwb25zZSA9PT0gdW5kZWZpbmVkIHx8IHBlcnNpc3RlZFJlc3BvbnNlID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgICAgYXBwcm92ZVBheW1lbnRVcmw6IGF1dGhvcml6YXRpb24uY2FsbGJhY2tVcmwsXG4gICAgICAgICAgZGVueVBheW1lbnRVcmw6IGBodHRwczovLyR7YXV0aG9yaXphdGlvbi5tZXJjaGFudE5hbWV9Lm15dnRleC5jb20vX3YvYXBpL2Zha2UtcGF5LWlvL3BheW1lbnRzLyR7YXV0aG9yaXphdGlvbi5wYXltZW50SWR9L2NhbmNlbGxhdGlvbnM/YW49JHthdXRob3JpemF0aW9uLm1lcmNoYW50TmFtZX1gLFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2U6IEF1dGhvcml6YXRpb25SZXNwb25zZSA9IGF3YWl0IFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICBBdXRob3JpemF0aW9ucy5wZW5kaW5nKGF1dGhvcml6YXRpb24sIHtcbiAgICAgICAgICAgIGRlbGF5VG9DYW5jZWw6IDMwMDAwMCxcbiAgICAgICAgICAgIHBheW1lbnRBcHBEYXRhOiB7XG4gICAgICAgICAgICAgIGFwcE5hbWU6ICd2dGV4LmV4YW1wbGUtcGF5bWVudC1hdXRoLWFwcCcsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdUaGUgY3VzdG9tZXIgbmVlZHMgdG8gZmluaXNoIHRoZSBwYXltZW50IGZsb3cnLFxuICAgICAgICAgIH0pXG4gICAgICAgIClcblxuICAgICAgICBwZXJzaXN0QXV0aG9yaXphdGlvblJlc3BvbnNlKHZiYXNlLCByZXNwb25zZSlcblxuICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBBdCB0aGUgc2Vjb25kIHRyeSwgcmV0dXJuICdBdXRob3JpemVkJ1xuICAgICAgICovXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICBBdXRob3JpemF0aW9ucy5hcHByb3ZlKGF1dGhvcml6YXRpb24sIHtcbiAgICAgICAgICB0aWQ6IHJhbmRvbVN0cmluZygpLFxuICAgICAgICAgIG5zdTogcmFuZG9tU3RyaW5nKCksXG4gICAgICAgICAgYXV0aG9yaXphdGlvbklkOiByYW5kb21TdHJpbmcoKSxcbiAgICAgICAgICBkZWxheVRvQXV0b1NldHRsZTogNjAsXG4gICAgICAgICAgbWVzc2FnZTogJ1BheW1lbnQgaGFzIGJlZW4gYXBwcm92ZWQnLFxuICAgICAgICB9KVxuICAgICAgKVxuICAgIH1cblxuICAgIC8vIFRvIHVzZSBQYWdhci5tZSBwYXltZW50IGZsb3csIHVzZSBsYXN0IG5hbWUgYXMgXCJwYWdhcm1lXCJcbiAgICBpZiAoYXV0aG9yaXphdGlvbi5taW5pQ2FydC5idXllci5sYXN0TmFtZS50b0xvd2VyQ2FzZSgpID09PSAncGFnYXJtZScpIHtcbiAgICAgIGNvbnN0IFNFQ09ORFNfVE9fV0FJVCA9IDMwMDAwXG4gICAgICBjb25zdCB7IHZiYXNlIH0gPSB0aGlzLmNvbnRleHQuY2xpZW50c1xuXG4gICAgICBjb25zdCBwZXJzaXN0ZWRSZXNwb25zZSA9IGF3YWl0IGdldFBlcnNpc3RlZEF1dGhvcml6YXRpb25SZXNwb25zZShcbiAgICAgICAgdmJhc2UsXG4gICAgICAgIGF1dGhvcml6YXRpb25cbiAgICAgIClcblxuICAgICAgY29uc3QgcGVyc2lzdGVkU2VyaWFsID0gYXdhaXQgZ2V0UGVyc2lzdGVkU2VyaWFsUmVzcG9uc2UoXG4gICAgICAgIHZiYXNlLFxuICAgICAgICBhdXRob3JpemF0aW9uLnBheW1lbnRJZFxuICAgICAgKVxuXG4gICAgICAvKipcbiAgICAgICAqIEF0IHRoZSBmaXJzdCB0cnksIGlmIHRoZXJlJ3Mgbm8gcGVyc2lzdGVkUmVzcG9uc2Ugb3IgaWYgdGhlcmUncyBubyBzZXJpYWwgc2VudCwgcmV0dXJuIHZ0ZXgucGFnYXJtZS1wYXltZW50LWFwcCBzdGF0dXMgYW5kIHRoZSBzZXJpYWwgbnVtYmVyIHN1Ym1pdFVybCBhdCBwYXlsb2FkXG4gICAgICAgKi9cbiAgICAgIGlmIChwZXJzaXN0ZWRSZXNwb25zZSA9PT0gdW5kZWZpbmVkIHx8IHBlcnNpc3RlZFJlc3BvbnNlID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgICAgc3VibWl0VXJsOiBgaHR0cHM6Ly8ke2F1dGhvcml6YXRpb24ubWVyY2hhbnROYW1lfS5teXZ0ZXguY29tL192L2FwaS9mYWtlLXBheS1pby9wYXltZW50cy8ke2F1dGhvcml6YXRpb24ucGF5bWVudElkfS9zZXJpYWwtbnVtYmVyP3RyYW5zYWN0aW9uSWQ9JHthdXRob3JpemF0aW9uLnRyYW5zYWN0aW9uSWR9YCxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlOiBBdXRob3JpemF0aW9uUmVzcG9uc2UgPSBhd2FpdCBQcm9taXNlLnJlc29sdmUoXG4gICAgICAgICAgQXV0aG9yaXphdGlvbnMucGVuZGluZyhhdXRob3JpemF0aW9uLCB7XG4gICAgICAgICAgICBkZWxheVRvQ2FuY2VsOiBTRUNPTkRTX1RPX1dBSVQsXG4gICAgICAgICAgICBwYXltZW50QXBwRGF0YToge1xuICAgICAgICAgICAgICBhcHBOYW1lOiAndnRleC5wYWdhcm1lLXBheW1lbnQtYXBwJyxcbiAgICAgICAgICAgICAgcGF5bG9hZDogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZTogJ3Z0ZXgucGFnYXJtZS1wYXltZW50LWFwcCcsXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuXG4gICAgICAgIHBlcnNpc3RBdXRob3JpemF0aW9uUmVzcG9uc2UodmJhc2UsIHJlc3BvbnNlKVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZVxuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIGlmIHBhc3MgZm9yIHRoZSBmaXJzdCBjb25kaXRpb24gYW5kIGV4aXN0cyBwZXJzaXN0ZWRSZXNwb25zZSBhbmQgcGVyc2lzdGVkU2VyaWFsLCBpdCB3aWxsIGNoZWNrIGlmIHRoZSB0aW1lIGRlZmluZWQgaGFzIHBhc3NlZC4gSWYgdHJ1ZSwgcmV0dXJuIHBheW1lbnQgYXBwcm92ZWRcbiAgICAgICAqL1xuICAgICAgaWYgKFxuICAgICAgICBwZXJzaXN0ZWRSZXNwb25zZSAmJlxuICAgICAgICBwZXJzaXN0ZWRSZXNwb25zZS5tZXNzYWdlID09PSAndnRleC5jaGFsbGVuZ2Utd2FpdC1mb3ItY29uZmlybWF0aW9uJyAmJlxuICAgICAgICBwZXJzaXN0ZWRTZXJpYWwgJiZcbiAgICAgICAgZ2V0U2Vjb25kc1Bhc3NlZChwZXJzaXN0ZWRTZXJpYWwudGltZSkgPj0gU0VDT05EU19UT19XQUlUXG4gICAgICApIHtcbiAgICAgICAgcGVyc2lzdFNlcmlhbFJlc3BvbnNlKHZiYXNlLCBudWxsLCBhdXRob3JpemF0aW9uLnBheW1lbnRJZClcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgIEF1dGhvcml6YXRpb25zLmFwcHJvdmUoYXV0aG9yaXphdGlvbiwge1xuICAgICAgICAgICAgdGlkOiByYW5kb21TdHJpbmcoKSxcbiAgICAgICAgICAgIG5zdTogcmFuZG9tU3RyaW5nKCksXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uSWQ6IHJhbmRvbVN0cmluZygpLFxuICAgICAgICAgICAgZGVsYXlUb0F1dG9TZXR0bGU6IDYwLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1BheW1lbnQgaGFzIGJlZW4gYXBwcm92ZWQnLFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgZGVmYXVsdCByZXR1cm4gaXMgdnRleC5jaGFsbGVuZ2Utd2FpdC1mb3ItY29uZmlybWF0aW9uIHN0YXR1cywgaWYgbm9uZSBvZiBwcmV2aW91cyBpZnMgaXMgZXhlY3V0ZWRcbiAgICAgICAqL1xuICAgICAgY29uc3QgcmVzcG9uc2U6IEF1dGhvcml6YXRpb25SZXNwb25zZSA9IGF3YWl0IFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgQXV0aG9yaXphdGlvbnMucGVuZGluZyhhdXRob3JpemF0aW9uLCB7XG4gICAgICAgICAgZGVsYXlUb0NhbmNlbDogU0VDT05EU19UT19XQUlULFxuICAgICAgICAgIGNvZGU6ICcxMjM0JyxcbiAgICAgICAgICBwYXltZW50QXBwRGF0YToge1xuICAgICAgICAgICAgYXBwTmFtZTogJ3Z0ZXguY2hhbGxlbmdlLXdhaXQtZm9yLWNvbmZpcm1hdGlvbicsXG4gICAgICAgICAgICBwYXlsb2FkOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHNlY29uZHNXYWl0aW5nOiBTRUNPTkRTX1RPX1dBSVQsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1lc3NhZ2U6ICd2dGV4LmNoYWxsZW5nZS13YWl0LWZvci1jb25maXJtYXRpb24nLFxuICAgICAgICB9KVxuICAgICAgKVxuXG4gICAgICBwZXJzaXN0QXV0aG9yaXphdGlvblJlc3BvbnNlKHZiYXNlLCByZXNwb25zZSlcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgfVxuXG4gICAgLy8gVG8gZGVueSBwYXltZW50LCB1c2UgbGFzdCBuYW1lIGFzIFwiZGVueVwiXG4gICAgaWYgKGF1dGhvcml6YXRpb24ubWluaUNhcnQuYnV5ZXIubGFzdE5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2RlbnknKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICBBdXRob3JpemF0aW9ucy5kZW55KGF1dGhvcml6YXRpb24sIHtcbiAgICAgICAgICBtZXNzYWdlOiAnUGF5bWVudCBoYXMgYmVlbiBkZW5pZWQnLFxuICAgICAgICB9KVxuICAgICAgKVxuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgdGhlIGRlZmF1bHQgcmVzcG9uc2Ugd2hlbiB1c2luZyBubyBjdXN0b20gY29uZmlndXJhdGlvblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXG4gICAgICBBdXRob3JpemF0aW9ucy5hcHByb3ZlKGF1dGhvcml6YXRpb24sIHtcbiAgICAgICAgdGlkOiByYW5kb21TdHJpbmcoKSxcbiAgICAgICAgbnN1OiByYW5kb21TdHJpbmcoKSxcbiAgICAgICAgYXV0aG9yaXphdGlvbklkOiByYW5kb21TdHJpbmcoKSxcbiAgICAgICAgZGVsYXlUb0F1dG9TZXR0bGU6IDM2MDAsXG4gICAgICAgIG1lc3NhZ2U6ICdQYXltZW50IGhhcyBiZWVuIGFwcHJvdmVkJyxcbiAgICAgIH0pXG4gICAgKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGNhbmNlbChcbiAgICBjYW5jZWxsYXRpb246IENhbmNlbGxhdGlvblJlcXVlc3RcbiAgKTogUHJvbWlzZTxDYW5jZWxsYXRpb25SZXNwb25zZT4ge1xuICAgIGlmICh0aGlzLmlzVGVzdFN1aXRlKSB7XG4gICAgICByZXR1cm4gQ2FuY2VsbGF0aW9ucy5hcHByb3ZlKGNhbmNlbGxhdGlvbiwge1xuICAgICAgICBjYW5jZWxsYXRpb25JZDogcmFuZG9tU3RyaW5nKCksXG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXG4gICAgICBDYW5jZWxsYXRpb25zLmFwcHJvdmUoY2FuY2VsbGF0aW9uLCB7XG4gICAgICAgIGNhbmNlbGxhdGlvbklkOiBgZm9vLSR7cmFuZG9tU3RyaW5nKCl9YCxcbiAgICAgICAgY29kZTogJ3N1Y2Nlc3MnLFxuICAgICAgICBtZXNzYWdlOiAnUGF5bWVudCBoYXMgYmVlbiBjYW5jZWxlZC4nLFxuICAgICAgfSlcbiAgICApXG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVmdW5kKHJlZnVuZDogUmVmdW5kUmVxdWVzdCk6IFByb21pc2U8UmVmdW5kUmVzcG9uc2U+IHtcbiAgICBpZiAodGhpcy5pc1Rlc3RTdWl0ZSkge1xuICAgICAgcmV0dXJuIFJlZnVuZHMuYXBwcm92ZShyZWZ1bmQsIHtcbiAgICAgICAgcmVmdW5kSWQ6IHJhbmRvbVN0cmluZygpLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAocmVmdW5kLnZhbHVlID09PSAxMDEwMTApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXG4gICAgICAgIFJlZnVuZHMubWFudWFsKHJlZnVuZCwge1xuICAgICAgICAgIC8vIHZhbHVlOiAwLFxuICAgICAgICAgIGNvZGU6ICdmb28nLFxuICAgICAgICAgIG1lc3NhZ2U6ICdSZWZ1bmQgc2hvdWxkIGJlIG1hbnVhbGx5IHJlcXVlc3RlZCcsXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gSXQgbmVlZHMgdG8gaW1wbGVtZW50IGRlbnkgc2NlbmFyaW9cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXG4gICAgICBSZWZ1bmRzLmFwcHJvdmUocmVmdW5kLCB7XG4gICAgICAgIHJlZnVuZElkOiBgZm9vLSR7cmFuZG9tU3RyaW5nKCl9YCxcbiAgICAgICAgY29kZTogJ3N1Y2Nlc3MnLFxuICAgICAgICBtZXNzYWdlOiAnUGF5bWVudCBoYXMgYmVlbiByZWZ1bmRlZCcsXG4gICAgICB9KVxuICAgIClcblxuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJylcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzZXR0bGUoXG4gICAgc2V0dGxlbWVudDogU2V0dGxlbWVudFJlcXVlc3RcbiAgKTogUHJvbWlzZTxTZXR0bGVtZW50UmVzcG9uc2U+IHtcbiAgICBpZiAodGhpcy5pc1Rlc3RTdWl0ZSkge1xuICAgICAgcmV0dXJuIFNldHRsZW1lbnRzLmFwcHJvdmUoc2V0dGxlbWVudCwge1xuICAgICAgICBzZXR0bGVJZDogcmFuZG9tU3RyaW5nKCksXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChzZXR0bGVtZW50LnZhbHVlID09PSAxMDAxKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICBTZXR0bGVtZW50cy5kZW55KHNldHRsZW1lbnQsIHtcbiAgICAgICAgICBjb2RlOiAnZm9vJyxcbiAgICAgICAgICBtZXNzYWdlOiAnQ2FwdHVyZSBvcGVyYXRpb24gaGFzIGJlZW4gZmFpbGVkJyxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgU2V0dGxlbWVudHMuYXBwcm92ZShzZXR0bGVtZW50LCB7XG4gICAgICAgIHNldHRsZUlkOiByYW5kb21TdHJpbmcoKSxcbiAgICAgICAgY29kZTogJ3N1Y2Nlc3MnLFxuICAgICAgICBtZXNzYWdlOiAnUGF5bWVudCBoYXMgYmVlbiBjYXB0dXJlZCcsXG4gICAgICB9KVxuICAgIClcblxuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJylcbiAgfVxuXG4gIHB1YmxpYyBpbmJvdW5kOiB1bmRlZmluZWRcbn1cbiJdfQ==