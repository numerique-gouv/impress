export function base64ToBytes(base64: string): Uint8Array {
  //   const binString = atob(base64);
  //   return Uint8Array.from(binString, (m) => m.codePointAt(0));

  return new Uint8Array(
    atob(base64)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );
}

export function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  // btoa(String.fromCharCode(...bytes));
  return btoa(binString);
}
