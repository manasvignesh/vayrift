import { build } from "./build.mjs";
await build();
await import("./serve.mjs");
