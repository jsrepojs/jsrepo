<script setup lang="ts">
	import type { PropType } from './type';

	const props = defineProps<PropType>();
</script>

<template>
	<div>
		{{ value }}
	</div>
</template>