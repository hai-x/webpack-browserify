import 'setimmediate';
import type { Compiler, Configuration, Stats } from 'webpack';
export type { Compiler, Configuration, Stats, Watching } from 'webpack';
export * as fs from 'memfs';
export { default as webpack } from 'webpack';
/** Callback invoked once a build finishes. */
export type BuildCallback = (err: null | Error, stats?: Stats) => void;
export type WatchOptions = Parameters<Compiler['watch']>[0];
/** Create a compiler; optionally run it right away like `webpack()`. */
declare function browserifyWebpack(options?: Configuration): Compiler;
declare function browserifyWebpack(options: Configuration | undefined, callback: BuildCallback): Compiler | null;
export default browserifyWebpack;
