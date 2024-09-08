"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTracing = void 0;
exports.createTracing = (metric, tracingConfig) => ({
    requestSpanNameSuffix: metric,
    ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
});
