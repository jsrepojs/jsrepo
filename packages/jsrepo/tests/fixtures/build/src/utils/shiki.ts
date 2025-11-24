import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

export const highlighter = await createHighlighterCore({
	themes: [
		import("@shikijs/themes/nord"),
		import("@shikijs/themes/dark-plus"),
	],
	langs: [
		import("@shikijs/langs/typescript"),
		import("@shikijs/langs/javascript"),
	],
	engine: createJavaScriptRegexEngine(),
});
