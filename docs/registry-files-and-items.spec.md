# idk what to call this

So the problem is simple. I want to be able to define files that are grouped together as an item but aren't all necessarily added to the same place.

The current implementation is that we calculate a basePath and try to add everything together at that path. This is a bit confusing and just not possible to do with multiple types of files in the same item.

So the solution will go something like this:

```ts
const item = {
	name: "demo",
	type: "ui",
	files: [
        // when you define a file it uses the basename as the location of the file relative to where the item is placed
        {
            // this will be added to the users project at src/components/ui/demo.svelte
            path: 'src/components/ui/demo.svelte',
        },
        {
            // lets say this has some sub files in it (demo.svelte, index.ts, etc)
            path: 'src/components/ui/demo',
            // those sub files will be added to the users project at src/components/ui/demo/<file>
        }

        // target - the location that the registry author says the file must be added to
        // path - the location that the file will be added relative to where the item is placed in the users project
        // for example: demo.svelte will have the path demo.svelte but a file in a folder with the same name will have the path demo/demo.svelte
        // when defining files that go in folders you MUST define them within a folder


		{
			path: "src/components/ui/demo",
			// no type provided so we inherit the type from the item (ui)
		},
        // alternatively we can define a directory and all of it's files
        // this is good for when you need to change dependency resolution or stuff on files
        // sub files should NEVER have a type or a target
        {
            // just a recursive file type
            path: 'src/components/ui/demo',
            files: [
                {
                    // declare sub-paths relative to the directory they're part of
                    path: 'demo.svelte',
                },
                {
                    path: 'index.ts',
                },
            ]
        },
        {
            path: 'src/components/ui/demo/demo.svelte',
        }

        // we can still have targets
		{
			path: "src/routes/demos/[...path]/+page.svelte",
			type: "page",
			target: "src/routes/demos/[...path]/+page.svelte",
		},
		{
			path: "src/routes/demos/[...path]/+layout@.svelte",
			type: "page",
			target: "src/routes/demos/[...path]/+layout@.svelte",
		},
		{
			path: "src/routes/demos/[...path]/+page.server.ts",
			type: "page",
			target: "src/routes/demos/[...path]/+page.server.ts",
		},

        // a nice QOL would be to allow a user to define just a directory for stuff like this ⬆️
        // something like:
        {
            path: 'src/routes/demos/[...path]',
            target: 'src/routes/demos/[...path]',
            // we automatically get all the files and they are added to the target path as <target>/<file>
        },

        // registry:example|doc|test files are still supported
        // they will be added to the doc|test|example path as configured by the user
        {
            path: 'src/demos/demo.svelte',
            type: 'registry:example',
        },
	],
};
```

A few changes I know we need to make that aren't immediately obvious and I will forget:

- [ ] We need to ensure all the types of all files of every needed item are resolved when adding items to the users project
- [ ] No longer allow users to define paths to a specific <type>/<name> path. They should only be able to define paths to a specific <type> path.