declare module 'convert-stream' {
  export function toBuffer(
    readableStream: NodeJS.ReadableStream,
  ): Promise<Buffer>;
}
