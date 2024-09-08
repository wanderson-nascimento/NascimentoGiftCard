"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payment_provider_1 = require("@vtex/payment-provider");
const api_1 = require("@vtex/api");
const connector_1 = __importDefault(require("./connector"));
const responses_1 = require("./middlewares/responses");
const clients_1 = require("./clients");
const serial_1 = require("./middlewares/serial");
const clients = {
    implementation: clients_1.Clients,
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
};
exports.default = new payment_provider_1.PaymentProviderService({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connector: connector_1.default,
    clients,
    routes: {
        serial: api_1.method({
            POST: [serial_1.serial],
        }),
        responses: api_1.method({
            GET: [responses_1.getResponse],
            PUT: [responses_1.saveResponse],
        }),
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbm9kZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLDZEQUErRDtBQUUvRCxtQ0FBa0M7QUFFbEMsNERBQTRDO0FBQzVDLHVEQUFtRTtBQUNuRSx1Q0FBbUM7QUFDbkMsaURBQTZDO0FBRTdDLE1BQU0sT0FBTyxHQUEyQjtJQUN0QyxjQUFjLEVBQUUsaUJBQU87SUFDdkIsT0FBTyxFQUFFO1FBQ1AsT0FBTyxFQUFFO1lBQ1AsT0FBTyxFQUFFLENBQUM7WUFDVixPQUFPLEVBQUUsS0FBSztTQUNmO1FBQ0QsU0FBUyxFQUFFO1lBQ1QsV0FBVyxFQUFFLFNBQVM7U0FDdkI7UUFDRCxNQUFNLEVBQUU7WUFDTixXQUFXLEVBQUUsU0FBUztTQUN2QjtLQUNGO0NBQ0YsQ0FBQTtBQVFELGtCQUFlLElBQUkseUNBQXNCLENBQUM7SUFDeEMsOERBQThEO0lBQzlELFNBQVMsRUFBRSxtQkFBeUI7SUFDcEMsT0FBTztJQUNQLE1BQU0sRUFBRTtRQUNOLE1BQU0sRUFBRSxZQUFNLENBQUM7WUFDYixJQUFJLEVBQUUsQ0FBQyxlQUFNLENBQUM7U0FDZixDQUFDO1FBQ0YsU0FBUyxFQUFFLFlBQU0sQ0FBQztZQUNoQixHQUFHLEVBQUUsQ0FBQyx1QkFBVyxDQUFDO1lBQ2xCLEdBQUcsRUFBRSxDQUFDLHdCQUFZLENBQUM7U0FDcEIsQ0FBQztLQUNIO0NBQ0YsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBQYXltZW50UHJvdmlkZXJTdGF0ZSB9IGZyb20gJ0B2dGV4L3BheW1lbnQtcHJvdmlkZXInXG5pbXBvcnQgeyBQYXltZW50UHJvdmlkZXJTZXJ2aWNlIH0gZnJvbSAnQHZ0ZXgvcGF5bWVudC1wcm92aWRlcidcbmltcG9ydCB0eXBlIHsgQ2xpZW50c0NvbmZpZywgUmVjb3JkZXJTdGF0ZSwgU2VydmljZUNvbnRleHQgfSBmcm9tICdAdnRleC9hcGknXG5pbXBvcnQgeyBtZXRob2QgfSBmcm9tICdAdnRleC9hcGknXG5cbmltcG9ydCBGYWtlUGF5SU9Db25uZWN0b3IgZnJvbSAnLi9jb25uZWN0b3InXG5pbXBvcnQgeyBnZXRSZXNwb25zZSwgc2F2ZVJlc3BvbnNlIH0gZnJvbSAnLi9taWRkbGV3YXJlcy9yZXNwb25zZXMnXG5pbXBvcnQgeyBDbGllbnRzIH0gZnJvbSAnLi9jbGllbnRzJ1xuaW1wb3J0IHsgc2VyaWFsIH0gZnJvbSAnLi9taWRkbGV3YXJlcy9zZXJpYWwnXG5cbmNvbnN0IGNsaWVudHM6IENsaWVudHNDb25maWc8Q2xpZW50cz4gPSB7XG4gIGltcGxlbWVudGF0aW9uOiBDbGllbnRzLFxuICBvcHRpb25zOiB7XG4gICAgZGVmYXVsdDoge1xuICAgICAgcmV0cmllczogMixcbiAgICAgIHRpbWVvdXQ6IDEwMDAwLFxuICAgIH0sXG4gICAgcmVzcG9uc2VzOiB7XG4gICAgICBtZW1vcnlDYWNoZTogdW5kZWZpbmVkLFxuICAgIH0sXG4gICAgc2VyaWFsOiB7XG4gICAgICBtZW1vcnlDYWNoZTogdW5kZWZpbmVkLFxuICAgIH0sXG4gIH0sXG59XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgdHlwZSBDb250ZXh0ID0gU2VydmljZUNvbnRleHQ8Q2xpZW50cywgUGF5bWVudFByb3ZpZGVyU3RhdGU+XG5cbiAgdHlwZSBTdGF0ZSA9IFJlY29yZGVyU3RhdGVcbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IFBheW1lbnRQcm92aWRlclNlcnZpY2Uoe1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBjb25uZWN0b3I6IEZha2VQYXlJT0Nvbm5lY3RvciBhcyBhbnksXG4gIGNsaWVudHMsXG4gIHJvdXRlczoge1xuICAgIHNlcmlhbDogbWV0aG9kKHtcbiAgICAgIFBPU1Q6IFtzZXJpYWxdLFxuICAgIH0pLFxuICAgIHJlc3BvbnNlczogbWV0aG9kKHtcbiAgICAgIEdFVDogW2dldFJlc3BvbnNlXSxcbiAgICAgIFBVVDogW3NhdmVSZXNwb25zZV0sXG4gICAgfSksXG4gIH0sXG59KVxuIl19