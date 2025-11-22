<script lang="ts">
import { add } from '../../utils/math/add';

let count = $state(0);

function increment() {
	count = add(count, 1);
}
</script>

<button onclick={increment}>
    Count is {count}
</button>