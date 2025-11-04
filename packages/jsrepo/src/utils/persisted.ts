import Conf from 'conf';

function get() {
	return new Conf({ projectName: 'jsrepo-v2' });
}

export { get };
