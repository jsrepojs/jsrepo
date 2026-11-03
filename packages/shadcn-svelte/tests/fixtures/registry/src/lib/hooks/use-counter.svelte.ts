export class UseCounter {
	count = $state(0);

	increment() {
		this.count += 1;
	}
}
