"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthToken = void 0;
exports.getAuthToken = (ctx, method) => {
    switch (method) {
        case 'STORE_TOKEN':
            return ctx.storeUserAuthToken;
        case 'ADMIN_TOKEN':
            return ctx.adminUserAuthToken;
        case 'AUTH_TOKEN':
            return ctx.authToken;
        default:
            return null;
    }
};
