import { MutationFunctionOptions } from '@apollo/client';
import { RESPONSE_META_KEY } from '@app/client/constants';
import { APP_VERBOSE_ERROR_DISPLAY_SYMBOL } from '@app/GlobalVariables/constants';
import { getGlobalVariable } from '@app/GlobalVariables/util';
import {
  toastOptions as defaultToastOptions,
  toast,
  ToastOptions,
} from '@components/SystemAlerts/Toast';
import { IS_CYPRESS } from '@utils/constants';
import { ExecutionResult, GraphQLError } from 'graphql';
import { flatten, get, isEqual } from 'lodash-es';

export const REQ_ID_KEY = 'x-mastery-req-id' as const;
interface CustomOperationMeta {
  headers: {
    [REQ_ID_KEY]?: string;
  };
}

export const getErrorMessageReqIdPrefix = (
  meta: CustomOperationMeta | undefined
): string => {
  const reqId = get(meta, ['headers', REQ_ID_KEY]);
  if (reqId) {
    return `Request ID:\n${reqId}\n`;
  }
  return '';
};

type MutateFn<T> = (
  options?: MutationFunctionOptions
) => Promise<ExecutionResult<T>>;

interface Options {
  hideSuccessToast?: boolean;
  toastOptions?: Partial<ToastOptions>;
  successMessage?: string;
  showVerboseError?: boolean;
  /** Write a custom formatter that can use any part of the GraphQLErrors array for toast display. If the function returns an empty string or nullish value, a fallback will automatically be displayed. */
  errorFormatter?: (error: GraphQLError[]) => Maybe<string>;
}

const parseErrors = (
  errors: GraphQLError[],
  meta: CustomOperationMeta,
  errorFormatter: Options['errorFormatter']
): [string, boolean] => {
  const firstErr = errors[0];
  try {
    const customFormatted = errorFormatter?.(errors);
    if (customFormatted) {
      return [customFormatted, true];
    }
  } catch {
    //noop
  }

  let prefix = '';
  if (getGlobalVariable(APP_VERBOSE_ERROR_DISPLAY_SYMBOL)) {
    prefix = getErrorMessageReqIdPrefix(meta);
  }
  const path = firstErr?.path || [];

  // We explicitly know about this error, and we want to display it.
  // This one happens when a user tries to pick a carrier code that is already taken
  if (isEqual(path, ['attributes', 'code'])) {
    return [`${prefix}Code has already been taken`, true];
  }

  return [`${prefix}${firstErr?.message}`, false];
};

export const DEFAULT_TOAST_SUCCESS_MSG = 'Updated';

export const submitMutation = async <T>(
  mutate: MutateFn<T>,
  options?: Options
): ReturnType<MutateFn<T>> => {
  try {
    const response = await mutate();
    const { errors: topErrors, data } = response;
    const meta: CustomOperationMeta = get(data, RESPONSE_META_KEY);
    const mutationErrors = flatten(
      Object.values((data as anyOk) || {}).map(
        (obj: anyOk) => obj?.errors || []
      )
    );
    // topErrors are things like graphql formatting, or unknown variables + keys
    // mutationErrors are those incurred from the actual mutation sent, which are inside of the mutation name property on data
    const errors = (topErrors || []).concat(mutationErrors);
    const toastOptions: ToastOptions = {
      ...defaultToastOptions,
      ...(options?.toastOptions ?? {}),
    };
    if (errors.length && errors[0]) {
      const [msgParsed, allowDisplay] = parseErrors(
        errors,
        meta,
        options?.errorFormatter
      );

      const finalMsg =
        getGlobalVariable(APP_VERBOSE_ERROR_DISPLAY_SYMBOL) ||
        allowDisplay ||
        options?.showVerboseError
          ? msgParsed
          : 'An error occurred when attempting to submit data.';
  
      // toast({ content: finalMsg, type: 'error', toastOptions });
    } else {
      if (!options?.hideSuccessToast) {
        toast({
          content: options?.successMessage || DEFAULT_TOAST_SUCCESS_MSG,
          type: 'success',
          toastOptions,
        });
      }
    }
    return response;
  } catch (err: anyOk) {
    // This catch usually happens when Apollo client deems there to be a NetworkError
    // eslint-disable-next-line no-console
    const str = 'Failed to update. Please try again or contact support.';
    let formatted = '';
    if (options?.errorFormatter && err?.graphQLErrors?.length) {
      formatted = options.errorFormatter(err.graphQLErrors) ?? '';
    }
    toast({
      content:
        formatted ||
        (IS_CYPRESS
          ? err?.message
          : (!err?.networkError && err?.message) || str),
      type: 'error',
    });
    return err;
  }
};
