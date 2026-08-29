# Type definitions for Sailfish-Studio

This is a fork of [@sailfish-studio/types](https://github.com/Sailfish-Studio/types) with additional types for Sailfish-Studio's Scratch forks.

A possibly more human-readable version of the TypeScript definitions can be found at: https://sailfish-studio.github.io/types-tw/

Install with:

```
npm install @sailfish-studio/types@git+https://github.com/Sailfish-Studio/types-tw.git#tw
```

Then use in the same way as @sailfish-studio/types.

<!--
# Type definitions for the Scratch VM and editor

Scratch doesn't provide type definitions for their libraries, so we wrote our own.

This repository only contains types for the vanilla (LLK) Scratch runtime and editor. For the additional types in the Sailfish-Studio runtimes, see [@sailfish-studio/types-tw](https://github.com/Sailfish-Studio/types-tw).

A possibly more human-readable version of the TypeScript definitions can be found at: https://sailfish-studio.github.io/types/

|Module|Status|
|:-:|:-:|
|scratch-vm|✅|
|scratch-render|✅|
|scratch-svg-renderer|✅|
|scratch-render-fonts|✅|
|scratch-audio|✅|
|scratch-storage|✅|
|scratch-parser|✅|
|scratch-blocks|🚧|
|scratch-gui redux|✅|
|scratch-paint redux|✅|
|scratch-www redux|❌|

## Using from npm

First, install the types:

```
npm install @sailfish-studio/types
```

Next, you must use `tsconfig.json` to configure TypeScript to know how to find the types.

```json5
{
  "compilerOptions": {
    // If you use require() or "module": "CommonJS", remove these lines.
    // If you use "module": "ES6", synthetic default imports are required.
    "module": "ES6",
    "allowSyntheticDefaultImports": true,

    // Tell TypeScript where to find the types for Scratch libraries.
    "paths": {
      "scratch-vm": ["./node_modules/@sailfish-studio/types/index.d.ts"],
      "scratch-render": ["./node_modules/@sailfish-studio/types/index.d.ts"],
      "scratch-svg-renderer": ["./node_modules/@sailfish-studio/types/index.d.ts"],
      "scratch-render-fonts": ["./node_modules/@sailfish-studio/types/index.d.ts"],
      "scratch-storage": ["./node_modules/@sailfish-studio/types/index.d.ts"],
      "scratch-audio": ["./node_modules/@sailfish-studio/types/index.d.ts"],
      "scratch-parser": ["./node_modules/@sailfish-studio/types/index.d.ts"],
      "scratch-blocks": ["./node_modules/@sailfish-studio/types/index.d.ts"]
    },

    // Recommended strictness settings. Change as you please.
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

Then in your JavaScript or TypeScript:

```js
import VM from 'scratch-vm';
const vm = new VM();
vm.loadProject(/* read a project somehow */ new ArrayBuffer(100))
  .then(() => {
    vm.start();
    vm.greenFlag();
  });
```

Or if you still use require():

```js
const VM = require('scratch-vm');
const vm = new VM();
vm.loadProject(/* read a project somehow */ new ArrayBuffer(100))
  .then(() => {
    vm.start();
    vm.greenFlag();
  });
```
-->

## Tests

There are some tests in the `tests` folder. These files are never actually run, but the code will be type checked.

## License

Type definitions and test code are licensed under the Apache 2.0 license.

The libraries being documented may be under different licenses.
