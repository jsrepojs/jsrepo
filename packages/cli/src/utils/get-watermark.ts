import { packageJson } from './context';

const getWatermark = (repoUrl: string): string => {
	return `jsrepo ${packageJson.version}\nInstalled from ${repoUrl}\n${new Date()
		.toLocaleDateString()
		.replaceAll('/', '-')}`;
};

export { getWatermark };
