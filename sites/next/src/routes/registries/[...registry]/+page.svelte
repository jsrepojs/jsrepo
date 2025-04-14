<script lang="ts">
    import '../../../markdown.css'

    let { data } = $props();
</script>

<div class="prose">
    {@html data.readme}
</div>