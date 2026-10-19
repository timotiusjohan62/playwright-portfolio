import { test as base, expect, APIRequestContext } from '@playwright/test';
import * as allure from 'allure-js-commons';

type Opts = Omit<NonNullable<Parameters<APIRequestContext['fetch']>[1]>, 'method'>;

export interface ApiClient {
  get: (url: string, opts?: Opts) => ReturnType<APIRequestContext['fetch']>;
  post: (url: string, opts?: Opts) => ReturnType<APIRequestContext['fetch']>;
  put: (url: string, opts?: Opts) => ReturnType<APIRequestContext['fetch']>;
  patch: (url: string, opts?: Opts) => ReturnType<APIRequestContext['fetch']>;
  delete: (url: string, opts?: Opts) => ReturnType<APIRequestContext['fetch']>;
}

const SENSITIVE = ['authorization', 'cookie', 'x-api-key'];
const mask = (headers: Record<string, string> = {}) =>
  Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k, SENSITIVE.includes(k.toLowerCase()) ? '***' : v]),
  );

const pretty = (text: string) => {
  try { return { body: JSON.stringify(JSON.parse(text), null, 2), type: 'application/json' }; }
  catch { return { body: text, type: 'text/plain' }; }
};

export const test = base.extend<{ api: ApiClient }>({
  api: async ({ request }, use, testInfo) => {
    const call = (method: string) => async (url: string, opts: Opts = {}) =>
      allure.step(`${method} ${url}`, async () => {
        const started = Date.now();
        const res = await request.fetch(url, { ...opts, method });
        const ms = Date.now() - started;
        const text = await res.text();

        await testInfo.attach(`Request: ${method} ${url}`, {
          body: JSON.stringify(
            { url: res.url(), method, headers: mask(opts.headers as any), params: opts.params, data: opts.data },
            null, 2,
          ),
          contentType: 'application/json',
        });

        const r = pretty(text);
        await testInfo.attach(`Response: ${res.status()} ${res.statusText()} (${ms} ms)`, {
          body: r.body,
          contentType: r.type,
        });
        return res;
      });

    await use({
      get: call('GET'),
      post: call('POST'),
      put: call('PUT'),
      patch: call('PATCH'),
      delete: call('DELETE'),
    });
  },
});

export { expect, allure };