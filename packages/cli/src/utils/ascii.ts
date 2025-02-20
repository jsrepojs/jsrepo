import color from 'chalk';

export const VERTICAL_LINE = color.gray('│');
export const HORIZONTAL_LINE = color.gray('─');
export const TOP_RIGHT_CORNER = color.gray('┐');
export const BOTTOM_RIGHT_CORNER = color.gray('┘');
export const JUNCTION_RIGHT = color.gray('├');
export const JUNCTION_TOP = color.gray('┬');
export const TOP_LEFT_CORNER = color.gray('┌');
export const BOTTOM_LEFT_CORNER = color.gray('└');

export const WARN = color.bgRgb(245, 149, 66).black(' WARN ');
export const INFO = color.bgBlueBright.white(' INFO ');
export const ERROR = color.bgRedBright.white(' ERROR ');

export const JSREPO = color.hex('#f7df1e')('jsrepo');
