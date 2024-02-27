import memfs from 'memfs';
import type { Compiler, Configuration, Stats } from 'webpack';
declare const _webpack: (o?: Configuration, c?: ((err?: Error | null | undefined, stats?: Stats) => void) | undefined) => Compiler;
export default _webpack;
export declare const fs: typeof memfs;
