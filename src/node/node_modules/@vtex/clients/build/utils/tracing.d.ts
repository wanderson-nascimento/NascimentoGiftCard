import { RequestTracingConfig } from '@vtex/api';
export declare const createTracing: (metric: string, tracingConfig?: RequestTracingConfig | undefined) => {
    requestSpanNameSuffix: string;
} | {
    rootSpan?: import("@vtex/api").Span | undefined;
    referenceType?: import("@vtex/api").SpanReferenceTypes | undefined;
    requestSpanNameSuffix: string;
};
