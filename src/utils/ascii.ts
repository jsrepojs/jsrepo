import color from 'chalk';
import isUnicodeSupported from 'is-unicode-supported';

const unicode = isUnicodeSupported();

const s = (c: string, fallback: string) => (unicode ? c : fallback);

export const S_STEP_ACTIVE = s('◆', '*');
export const S_STEP_CANCEL = s('■', 'x');
export const S_STEP_ERROR = s('▲', 'x');
export const S_STEP_SUBMIT = s('◇', 'o');
export const S_INFO = s('●', '•');
export const S_SUCCESS = s('◆', '*');
export const S_WARN = s('▲', '!');
export const S_ERROR = s('■', 'x');

export const VERTICAL_LINE = color.gray(s('│', '|'));
export const HORIZONTAL_LINE = color.gray(s('─', '-'));
export const TOP_RIGHT_CORNER = color.gray(s('┐', '+'));
export const BOTTOM_RIGHT_CORNER = color.gray(s('┘', '+'));
export const JUNCTION_RIGHT = color.gray(s('├', '+'));
export const JUNCTION_TOP = color.gray(s('┬', '+'));
export const TOP_LEFT_CORNER = color.gray(s('┌', 'T'));
export const BOTTOM_LEFT_CORNER = color.gray(s('└', '-'));

export const WARN = color.bgRgb(245, 149, 66).black(' WARN ');
export const INFO = color.bgBlueBright.white(' INFO ');
export const ERROR = color.bgRedBright.white(' ERROR ');

export const JSREPO = color.hex('#f7df1e')('jsrepo');
export const JSREPO_DOT_COM = color.hex('#f7df1e').bold('jsrepo.com');
