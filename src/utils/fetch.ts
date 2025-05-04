import mfFetch from 'make-fetch-happen';
import path from 'pathe';

/** Fetch method used for (i)nternal consumption */
export const iFetch = mfFetch.defaults({ cachePath: path.join(import.meta.dirname, 'cache') });
