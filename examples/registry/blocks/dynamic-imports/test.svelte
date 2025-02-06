<script lang="ts">
    import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
    import { createHighlighterCore } from 'shiki/core';

    const bundledLanguages = {
        bash: () => import('@shikijs/langs/bash'),
        diff: () => import('@shikijs/langs/diff'),
        javascript: () => import('@shikijs/langs/javascript'),
        json: () => import('@shikijs/langs/json'),
        svelte: () => import('@shikijs/langs/svelte'),
        typescript: () => import('@shikijs/langs/typescript')
    };

    /** The languages configured for the highlighter */
    type SupportedLanguage = keyof typeof bundledLanguages;

    /** A preloaded highlighter instance. */
    const highlighter = createHighlighterCore({
        themes: [
            import('@shikijs/themes/github-light-default'),
            import('@shikijs/themes/github-dark-default')
        ],
        langs: Object.entries(bundledLanguages).map(([_, lang]) => lang),
        engine: createJavaScriptRegexEngine()
    });
</script>