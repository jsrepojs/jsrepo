import Conf from 'conf';

function get() {
	return new Conf({ projectName: 'jsrepo' });
}

export { get };
