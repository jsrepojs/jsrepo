<script lang="ts" module>
    import { tv, type VariantProps } from "tailwind-variants";

    export const buttonVariants = tv({
        base: "flex items-center rounded-md active:scale-98 transition-all",
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground",
                destructive: "bg-destructive text-destructive-foreground",
                outline: "border border-border hover:bg-accent",
            },
            size: {
                default: "h-8 px-2.5",
                sm: "h-7 px-2",
            },
        },
    });

    export type Variant = VariantProps<typeof buttonVariants>["variant"];
    export type Size = VariantProps<typeof buttonVariants>["size"];
</script>

<script lang="ts">
    import { cn } from "$lib/registry/lib/utils";
    import type { HTMLButtonAttributes } from "svelte/elements";

    let { class: className, children, size = 'default', variant = 'default', ...restProps }: HTMLButtonAttributes & { variant?: Variant; size?: Size } = $props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {...restProps}>
    {@render children?.()}
</button>