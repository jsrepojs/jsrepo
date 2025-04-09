<script lang="ts">
    import * as Sidebar from '$lib/components/ui/sidebar/index.js'
    import { Sidebar as DocsSidebar } from '$lib/components/site/docs'

    let { children } = $props();
</script>

<Sidebar.Provider>
    <DocsSidebar/>
    <main>
        {@render children()}
    </main>
</Sidebar.Provider>
