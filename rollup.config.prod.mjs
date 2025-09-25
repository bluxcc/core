import postcss from "rollup-plugin-postcss";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import tailwindcss from "@tailwindcss/postcss";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

import pkg from "./package.json" with { type: "json" };

const config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: false,
      },
      {
        file: "dist/index.cjs.js",
        format: "cjs",
        sourcemap: false,
      },
    ],
    external: [...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      peerDepsExternal(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true,
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      postcss({
        extract: false,
        inject: true,
        minimize: true,
        sourceMap: false,
        plugins: [tailwindcss],
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
  },
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.iife.js",
        format: "iife",
        name: "Blux",
        sourcemap: false,
      },
    ],
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify("development"),
        preventAssignment: true,
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      postcss({
        extract: false,
        inject: true,
        minimize: true,
        sourceMap: false,
        plugins: [tailwindcss],
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
  },
];

export default config;
