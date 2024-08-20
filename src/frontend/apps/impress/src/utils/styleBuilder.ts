import { tokens } from '@/cunningham/cunningham-tokens';

/* eslint-disable @typescript-eslint/no-unused-vars */
const {
  '0': _0,
  st,
  t,
  s,
  b,
  bx,
  l,
  ...spacingsLight
} = tokens.themes.default.theme.spacings;
/* eslint-enable @typescript-eslint/no-unused-vars */

const spacings = {
  xtiny: tokens.themes.default.theme.spacings['st'],
  tiny: tokens.themes.default.theme.spacings['t'],
  small: tokens.themes.default.theme.spacings['s'],
  big: tokens.themes.default.theme.spacings['b'],
  xbig: tokens.themes.default.theme.spacings['bx'],
  large: tokens.themes.default.theme.spacings['l'],
  ...spacingsLight,
};

type SpacingsKey = keyof typeof spacings;
export type Spacings = SpacingsKey | (string & {});

export const spacingValue = (value?: Spacings) =>
  value && value in spacings ? spacings[value as SpacingsKey] : value;

export type MarginPadding =
  | Spacings
  | {
      vertical?: Spacings;
      horizontal?: Spacings;
      top?: Spacings;
      bottom?: Spacings;
      left?: Spacings;
      right?: Spacings;
      all?: Spacings;
    };

export const stylesPadding = (pad: MarginPadding) => {
  if (typeof pad === 'object') {
    return {
      'padding-top': spacingValue(pad.top || pad.vertical || pad.all),
      'padding-bottom': spacingValue(pad.bottom || pad.vertical || pad.all),
      'padding-left': spacingValue(pad.left || pad.horizontal || pad.all),
      'padding-right': spacingValue(pad.right || pad.horizontal || pad.all),
    };
  } else {
    return {
      padding: spacingValue(pad),
    };
  }
};

export const stylesMargin = (margin: MarginPadding) => {
  if (typeof margin === 'object') {
    return {
      'margin-top': spacingValue(margin.top || margin.vertical || margin.all),
      'margin-bottom': spacingValue(
        margin.bottom || margin.vertical || margin.all,
      ),
      'margin-left': spacingValue(
        margin.left || margin.horizontal || margin.all,
      ),
      'margin-right': spacingValue(
        margin.right || margin.horizontal || margin.all,
      ),
    };
  } else {
    return {
      margin: spacingValue(margin),
    };
  }
};
