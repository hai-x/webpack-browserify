export declare const parse: typeof import("url").parse;
export declare const format: typeof import("url").format;
export declare const resolve: typeof import("url").resolve;
export declare const resolveObject: unknown;
export declare const URL: {
    new (url: string | URL, base?: string | URL): URL;
    prototype: URL;
    canParse(url: string | URL, base?: string | URL): boolean;
    createObjectURL(obj: Blob | MediaSource): string;
    parse(url: string | URL, base?: string | URL): URL | null;
    revokeObjectURL(url: string): void;
};
export declare const URLSearchParams: {
    new (init?: string[][] | Record<string, string> | string | URLSearchParams): URLSearchParams;
    prototype: URLSearchParams;
};
export declare function fileURLToPath(url: string | URL): string;
export declare function pathToFileURL(path: string): URL;
