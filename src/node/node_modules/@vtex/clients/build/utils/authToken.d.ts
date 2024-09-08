import { IOContext } from '@vtex/api';
import { AuthMethod } from '../typings/tokens';
export declare const getAuthToken: (ctx: IOContext, method: AuthMethod) => string | null | undefined;
