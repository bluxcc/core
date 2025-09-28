import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import tailwindcss from '@tailwindcss/postcss';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

import pkg from './package.json' with { type: 'json' };

const config = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    external: [...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      json(),
      peerDepsExternal(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
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
        minimize: false,
        sourceMap: true,
        plugins: [tailwindcss],
      }),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.iife.js',
        format: 'iife',
        name: 'Blux',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      json(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
        preventAssignment: true,
      }),
      // nodePolyfills({ include: ["buffer", "crypto"] }),
      resolve({
        browser: true,
        preferBuiltins: false,
        // exportConditions: ["browser", "module", "default"], // Explicitly set conditions
      }),
      commonjs(),
      postcss({
        extract: false,
        inject: true,
        minimize: false,
        sourceMap: true,
        plugins: [tailwindcss],
      }),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
];

export default config;
