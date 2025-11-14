import path from "pathe";
import type { AbsolutePath } from "./build";

export function joinAbsolute(p: AbsolutePath, ...paths: string[]): AbsolutePath {
    return path.join(p, ...paths) as AbsolutePath;
}