export const promiseDone = () => {
  let done: (value: void | PromiseLike<void>) => void = () => {};
  const promise = new Promise<void>((resolve) => {
    done = resolve;
  });

  return { done, promise };
};
