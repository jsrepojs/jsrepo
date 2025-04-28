import mfFetch from 'make-fetch-happen';

/** Fetch method used for (i)nternal consumption */
export const iFetch = mfFetch.defaults({ cachePath: './cache' });
