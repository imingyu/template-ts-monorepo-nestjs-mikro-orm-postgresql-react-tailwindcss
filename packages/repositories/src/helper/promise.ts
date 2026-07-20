export const oneByOne = (handlers: (() => Promise<void>)[]) => {
    return handlers.reduce((prev, cur) => prev.then(() => cur()), Promise.resolve());
};
