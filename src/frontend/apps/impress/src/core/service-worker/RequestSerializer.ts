export type RequestData = {
  url: string;
  method?: string;
  headers: Record<string, string>;
  body?: ArrayBuffer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

const serializableProperties: Array<keyof Request> = [
  'method',
  'referrer',
  'referrerPolicy',
  'mode',
  'credentials',
  'cache',
  'redirect',
  'integrity',
  'keepalive',
];

/**
 * RequestSerializer helps to manipulate Request objects.
 */
export class RequestSerializer {
  private _requestData: RequestData;

  static async fromRequest(request: Request): Promise<RequestSerializer> {
    const requestData: RequestData = {
      url: request.url,
      headers: {},
    };

    for (const prop of serializableProperties) {
      if (request[prop] !== undefined) {
        requestData[prop] = request[prop];
      }
    }

    request.headers.forEach((value, key) => {
      requestData.headers[key] = value;
    });

    if (request.method !== 'GET') {
      requestData.body = await request.clone().arrayBuffer();
    }

    return new RequestSerializer(requestData);
  }

  constructor(requestData: RequestData) {
    if (requestData.mode === 'navigate') {
      requestData.mode = 'same-origin';
    }
    this._requestData = requestData;
  }

  toObject(): RequestData {
    const requestDataCopy: RequestData = { ...this._requestData };
    requestDataCopy.headers = { ...this._requestData.headers };
    if (requestDataCopy.body) {
      requestDataCopy.body = requestDataCopy.body.slice(0);
    }
    return requestDataCopy;
  }

  toRequest(): Request {
    const { url, ...rest } = this._requestData;
    return new Request(url, rest);
  }

  clone(): RequestSerializer {
    return new RequestSerializer(this.toObject());
  }
}
