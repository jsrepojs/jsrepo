# Plan

I want to create `@jsrepo/transform-rtl` which will transform tailwind classes within items to be RTL safe.

This means remapping classes from 'left-' -> 'start-' etc.

shadcn made a transform to do this which I would presume is pretty reliable so we can use this as a starting point:
https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/packages/shadcn/src/utils/transformers/transform-rtl.ts

He uses ts-morph which I have no interest in using cause it's extremely bloated so instead lets use `oxc-parser`.

I want this package to follow the same pattern set forth by the other transforms in this project. Make sure it's documented with a README and that it has documentation in the docs along with a card in the index file for transforms.

Here is the SVG for the tailwind logo since you will likely need it:
```svg
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 54 33"><g clip-path="url(#tailwindcss-a)"><path fill="#38bdf8" fill-rule="evenodd" d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z" clip-rule="evenodd"/></g><defs><clipPath id="tailwindcss-a"><path fill="#fff" d="M0 0h54v32.4H0z"/></clipPath></defs></svg>
```