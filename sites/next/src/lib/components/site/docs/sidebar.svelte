<script lang="ts">
    import { type Docs, docs } from '../../../../../.velite';

    const index = $derived(intoIndex(docs));

    type Doc = {
        title: string;
        slug: string;
        children: Doc[]
    }

    function intoIndex(docs: Docs[]) {
        const docsMap = new Map<string, Doc[]>();

        const result: Doc[] = []

        for (const doc of docs) {
            console.log(doc)
            const index = doc.path.lastIndexOf('/');

            if (index === -1) {
                result.push({ title: doc.title, slug: doc.path, children: [] });
                continue;
            }
        }
    }
</script>


