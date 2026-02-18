import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import tailwindcss from '@tailwindcss/postcss';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const commonPlugins = [
  json(),
  replace({
    preventAssignment: true,
    include: ['node_modules/@ledgerhq/**'],
    values: {
      'Buffer.alloc': 'require("buffer").Buffer.alloc',
      'Buffer.concat': 'require("buffer").Buffer.concat',
    },
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
    preventAssignment: true,
  }),
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs({
    transformMixedEsModules: true,
  }),
  postcss({
    extract: false,
    inject: true,
    minimize: true,
    sourceMap: false,
    plugins: [tailwindcss],
  }),
  typescript({ tsconfig: './tsconfig.json' }),
  terser(),
];

const config = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: false,
      },
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: false,
      },
    ],
    plugins: [peerDepsExternal(), ...commonPlugins],
  },
  // {
  //   input: 'src/index.ts',
  //   output: [
  //     {
  //       file: 'dist/index.iife.js',
  //       format: 'iife',
  //       name: 'Blux',
  //       sourcemap: false,
  //       inlineDynamicImports: true,
  //     },
  //   ],
  //   plugins: [...commonPlugins],
  // },
];

export default config;
