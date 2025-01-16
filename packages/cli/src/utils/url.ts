export const removeTrailingSlash = (url: string): string => {
	let newUrl = url;
	if (newUrl.endsWith('/')) {
		newUrl = newUrl.slice(0, newUrl.length - 1);
	}

	return newUrl;
};

export const addTrailingSlash = (url: string): string => {
	let newUrl = url;
	if (!newUrl.endsWith('/')) {
		newUrl = `${newUrl}/`;
	}

	return newUrl;
};
