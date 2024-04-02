interface IAPIError<T = unknown> {
  status: number;
  cause?: string[];
  data?: T;
}

export class APIError<T = unknown> extends Error implements IAPIError<T> {
  public status: IAPIError['status'];
  public cause?: IAPIError['cause'];
  public data?: IAPIError<T>['data'];

  constructor(message: string, { status, cause, data }: IAPIError<T>) {
    super(message);

    this.name = 'APIError';
    this.status = status;
    this.cause = cause;
    this.data = data;
  }
}
