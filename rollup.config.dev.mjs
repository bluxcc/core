import json from "@rollup/plugin-json";
import inject from "@rollup/plugin-inject";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";
import tailwindcss from "@tailwindcss/postcss";

import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.iife.js",
      format: "iife",
      name: "blux",
      sourcemap: true,
    },
  ],
  plugins: [
    json(),
    // nodePolyfills({ include: ["buffer"] }),
    nodeResolve({
      browser: true,
      preferBuiltins: true,
    }),
    // inject({
    //   Buffer: ["buffer", "Buffer"],
    //   process: "process/browser",
    // }),
    postcss({
      extract: false,
      inject: true,
      minimize: false,
      sourceMap: true,
      plugins: [tailwindcss],
    }),
    commonjs({}),
    typescript({ tsconfig: "./tsconfig.json" }),
  ],
  // external: ["buffer", "process"],
};
