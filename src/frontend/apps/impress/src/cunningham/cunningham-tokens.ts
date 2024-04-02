export const tokens = {
  themes: {
    default: {
      theme: {
        colors: {
          'secondary-text': '#555F6B',
          'secondary-100': '#F2F7FC',
          'secondary-200': '#EBF3FA',
          'secondary-300': '#E2EEF8',
          'secondary-400': '#DDEAF7',
          'secondary-500': '#D4E5F5',
          'secondary-600': '#C1D0DF',
          'secondary-700': '#97A3AE',
          'secondary-800': '#757E87',
          'secondary-900': '#596067',
          'info-text': '#FFFFFF',
          'info-100': '#EBF2FC',
          'info-200': '#8CB5EA',
          'info-300': '#5894E1',
          'info-400': '#377FDB',
          'info-500': '#055FD2',
          'info-600': '#0556BF',
          'info-700': '#044395',
          'info-800': '#033474',
          'info-900': '#022858',
          'greyscale-100': '#FAFAFB',
          'greyscale-200': '#F3F4F4',
          'greyscale-300': '#E7E8EA',
          'greyscale-400': '#C2C6CA',
          'greyscale-500': '#9EA3AA',
          'greyscale-600': '#79818A',
          'greyscale-700': '#555F6B',
          'greyscale-800': '#303C4B',
          'greyscale-900': '#0C1A2B',
          'greyscale-000': '#FFFFFF',
          'primary-100': '#EDF5FA',
          'primary-200': '#8CB5EA',
          'primary-300': '#5894E1',
          'primary-400': '#377FDB',
          'primary-500': '#055FD2',
          'primary-600': '#0556BF',
          'primary-700': '#044395',
          'primary-800': '#033474',
          'primary-900': '#022858',
          'success-100': '#EFFCD3',
          'success-200': '#DBFAA9',
          'success-300': '#BEF27C',
          'success-400': '#A0E659',
          'success-500': '#76D628',
          'success-600': '#5AB81D',
          'success-700': '#419A14',
          'success-800': '#2C7C0C',
          'success-900': '#1D6607',
          'warning-100': '#FFF8CD',
          'warning-200': '#FFEF9B',
          'warning-300': '#FFE469',
          'warning-400': '#FFDA43',
          'warning-500': '#FFC805',
          'warning-600': '#DBA603',
          'warning-700': '#B78702',
          'warning-800': '#936901',
          'warning-900': '#7A5400',
          'danger-100': '#F4B0B0',
          'danger-200': '#EE8A8A',
          'danger-300': '#E65454',
          'danger-400': '#E13333',
          'danger-500': '#DA0000',
          'danger-600': '#C60000',
          'danger-700': '#9B0000',
          'danger-800': '#780000',
          'danger-900': '#5C0000',
          'primary-text': '#FFFFFF',
          'success-text': '#FFFFFF',
          'warning-text': '#FFFFFF',
          'danger-text': '#FFFFFF',
          'card-border': '#DDDDDD',
          'primary-bg': '#FAFAFA',
          'primary-150': '#E5EEFA',
          'info-150': '#E5EEFA',
        },
        font: {
          sizes: {
            h1: '2.2rem',
            h2: '1.7rem',
            h3: '1.37rem',
            h4: '1.15rem',
            h5: '1rem',
            h6: '0.87rem',
            l: '1rem',
            m: '0.8125rem',
            s: '0.75rem',
            ml: '0.938rem',
            xl: '1.50rem',
            t: '0.6875rem',
          },
          weights: {
            thin: 100,
            light: 300,
            regular: 400,
            medium: 500,
            bold: 600,
            extrabold: 800,
            black: 900,
          },
          families: {
            base: '"Roboto Flex Variable", sans-serif',
            accent: '"Roboto Flex Variable", sans-serif',
          },
          letterSpacings: {
            h1: 'normal',
            h2: 'normal',
            h3: 'normal',
            h4: 'normal',
            h5: '1px',
            h6: 'normal',
            l: 'normal',
            m: 'normal',
            s: 'normal',
          },
        },
        spacings: {
          '0': '0',
          xl: '4rem',
          l: '3rem',
          b: '1.625rem',
          s: '1rem',
          t: '0.5rem',
          st: '0.25rem',
          none: '0',
          auto: 'auto',
          bx: '2.2rem',
          full: '100%',
        },
        transitions: {
          'ease-in': 'cubic-bezier(0.32, 0, 0.67, 0)',
          'ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
          'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
          duration: '250ms',
        },
        breakpoints: {
          xs: '480px',
          sm: '576px',
          md: '768px',
          lg: '992px',
          xl: '1200px',
          xxl: '1400px',
          xxs: '320px',
        },
      },
      components: {
        datagrid: {
          header: {
            weight: 'var(--c--theme--font--weights--extrabold)',
            size: 'var(--c--theme--font--sizes--ml)',
          },
          cell: {
            color: 'var(--c--theme--colors--primary-500)',
            size: 'var(--c--theme--font--sizes--ml)',
          },
        },
        'forms-checkbox': {
          'background-color': { hover: '#055fd214' },
          color: 'var(--c--theme--colors--primary-500)',
          'font-size': 'var(--c--theme--font--sizes--ml)',
        },
        'forms-datepicker': {
          'border-color': 'var(--c--theme--colors--primary-500)',
          'value-color': 'var(--c--theme--colors--primary-500)',
          'border-radius': {
            hover: 'var(--c--components--forms-datepicker--border-radius)',
            focus: 'var(--c--components--forms-datepicker--border-radius)',
          },
        },
        'forms-field': {
          color: 'var(--c--theme--colors--primary-500)',
          'value-color': 'var(--c--theme--colors--primary-500)',
          width: 'auto',
        },
        'forms-input': {
          'value-color': 'var(--c--theme--colors--primary-500)',
          'border-color': 'var(--c--theme--colors--primary-500)',
          color: {
            error: 'var(--c--theme--colors--danger-500)',
            'error-hover': 'var(--c--theme--colors--danger-500)',
            'box-shadow-error-hover': 'var(--c--theme--colors--danger-500)',
          },
        },
        'forms-labelledbox': {
          'label-color': {
            small: 'var(--c--theme--colors--primary-500)',
            'small-disabled': 'var(--c--theme--colors--greyscale-400)',
            big: { disabled: 'var(--c--theme--colors--greyscale-400)' },
          },
        },
        'forms-select': {
          'border-color': 'var(--c--theme--colors--primary-500)',
          'border-color-disabled-hover':
            'var(--c--theme--colors--greyscale-200)',
          'border-radius': {
            hover: 'var(--c--components--forms-select--border-radius)',
            focus: 'var(--c--components--forms-select--border-radius)',
          },
          'font-size': 'var(--c--theme--font--sizes--ml)',
          'menu-background-color': '#ffffff',
          'item-background-color': {
            hover: 'var(--c--theme--colors--primary-300)',
          },
        },
        'forms-switch': {
          'accent-color': 'var(--c--theme--colors--primary-400)',
        },
        'forms-textarea': {
          'border-color': 'var(--c--components--forms-textarea--border-color)',
          'border-color-hover':
            'var(--c--components--forms-textarea--border-color)',
          'border-radius': {
            hover: 'var(--c--components--forms-textarea--border-radius)',
            focus: 'var(--c--components--forms-textarea--border-radius)',
          },
          color: 'var(--c--theme--colors--primary-500)',
          disabled: {
            'border-color-hover': 'var(--c--theme--colors--greyscale-200)',
          },
        },
        modal: { 'background-color': '#ffffff' },
        button: {
          'border-radius': {
            active: 'var(--c--components--button--border-radius)',
          },
          'medium-height': 'auto',
          'small-height': 'auto',
          success: {
            color: 'white',
            'color-disabled': 'white',
            'color-hover': 'white',
            background: {
              color: 'var(--c--theme--colors--success-600)',
              'color-disabled': 'var(--c--theme--colors--greyscale-300)',
              'color-hover': 'var(--c--theme--colors--success-800)',
            },
          },
          danger: {
            'color-hover': 'white',
            background: {
              color: 'var(--c--theme--colors--danger-400)',
              'color-hover': 'var(--c--theme--colors--danger-500)',
              'color-disabled': 'var(--c--theme--colors--danger-100)',
            },
          },
          primary: {
            color: 'var(--c--theme--colors--primary-text)',
            'color-active': 'var(--c--theme--colors--primary-text)',
            background: {
              color: 'var(--c--theme--colors--primary-400)',
              'color-active': 'var(--c--theme--colors--primary-500)',
            },
            border: { 'color-active': 'transparent' },
          },
          secondary: {
            color: 'var(--c--theme--colors--primary-500)',
            'color-hover': 'var(--c--theme--colors--primary-text)',
            background: {
              color: 'white',
              'color-hover': 'var(--c--theme--colors--primary-700)',
            },
            border: { color: 'var(--c--theme--colors--primary-200)' },
          },
          tertiary: {
            color: 'var(--c--theme--colors--primary-text)',
            'color-disabled': 'var(--c--theme--colors--greyscale-600)',
            background: {
              'color-hover': 'var(--c--theme--colors--primary-100)',
              'color-disabled': 'var(--c--theme--colors--greyscale-200)',
            },
          },
          disabled: { color: 'white', background: { color: '#b3cef0' } },
        },
      },
    },
    dark: {
      theme: {
        colors: {
          'greyscale-100': '#182536',
          'greyscale-200': '#303C4B',
          'greyscale-300': '#555F6B',
          'greyscale-400': '#79818A',
          'greyscale-500': '#9EA3AA',
          'greyscale-600': '#C2C6CA',
          'greyscale-700': '#E7E8EA',
          'greyscale-800': '#F3F4F4',
          'greyscale-900': '#FAFAFB',
          'greyscale-000': '#0C1A2B',
          'primary-100': '#3B4C62',
          'primary-200': '#4D6481',
          'primary-300': '#6381A6',
          'primary-400': '#7FA5D5',
          'primary-500': '#8CB5EA',
          'primary-600': '#A3C4EE',
          'primary-700': '#C3D8F4',
          'primary-800': '#DDE9F8',
          'primary-900': '#F4F8FD',
          'success-100': '#EEF8D7',
          'success-200': '#D9F1B2',
          'success-300': '#BDE985',
          'success-400': '#A0E25D',
          'success-500': '#76D628',
          'success-600': '#5BB520',
          'success-700': '#43941A',
          'success-800': '#307414',
          'success-900': '#225D10',
          'warning-100': '#F7F3D5',
          'warning-200': '#F0E5AA',
          'warning-300': '#E8D680',
          'warning-400': '#E3C95F',
          'warning-500': '#D9B32B',
          'warning-600': '#BD9721',
          'warning-700': '#9D7B1C',
          'warning-800': '#7E6016',
          'warning-900': '#684D12',
          'danger-100': '#F8D0D0',
          'danger-200': '#F09898',
          'danger-300': '#F09898',
          'danger-400': '#ED8585',
          'danger-500': '#E96666',
          'danger-600': '#DD6666',
          'danger-700': '#C36666',
          'danger-800': '#AE6666',
          'danger-900': '#9D6666',
        },
      },
    },
    dsfr: {
      theme: {
        colors: {
          'card-border': '#DDDDDD',
          'primary-text': '#000091',
          'primary-100': '#f5f5fe',
          'primary-150': '#F4F4FD',
          'primary-200': '#ececfe',
          'primary-300': '#e3e3fd',
          'primary-400': '#cacafb',
          'primary-500': '#6a6af4',
          'primary-600': '#000091',
          'primary-700': '#272747',
          'primary-800': '#21213f',
          'primary-900': '#1c1a36',
          'secondary-text': '#FFFFFF',
          'secondary-100': '#fee9ea',
          'secondary-200': '#fedfdf',
          'secondary-300': '#fdbfbf',
          'secondary-400': '#e1020f',
          'secondary-500': '#c91a1f',
          'secondary-600': '#5e2b2b',
          'secondary-700': '#3b2424',
          'secondary-800': '#341f1f',
          'secondary-900': '#2b1919',
          'greyscale-text': '#303C4B',
          'greyscale-000': '#f6f6f6',
          'greyscale-100': '#eeeeee',
          'greyscale-200': '#e5e5e5',
          'greyscale-300': '#e1e1e1',
          'greyscale-400': '#dddddd',
          'greyscale-500': '#cecece',
          'greyscale-600': '#7b7b7b',
          'greyscale-700': '#666666',
          'greyscale-800': '#2a2a2a',
          'greyscale-900': '#1e1e1e',
          'success-text': '#1f8d49',
          'success-100': '#dffee6',
          'success-200': '#b8fec9',
          'success-300': '#88fdaa',
          'success-400': '#3bea7e',
          'success-500': '#1f8d49',
          'success-600': '#18753c',
          'success-700': '#204129',
          'success-800': '#1e2e22',
          'success-900': '#19281d',
          'info-text': '#0078f3',
          'info-100': '#f4f6ff',
          'info-200': '#e8edff',
          'info-300': '#dde5ff',
          'info-400': '#bdcdff',
          'info-500': '#0078f3',
          'info-600': '#0063cb',
          'info-700': '#f4f6ff',
          'info-800': '#222a3f',
          'info-900': '#1d2437',
          'warning-text': '#d64d00',
          'warning-100': '#fff4f3',
          'warning-200': '#ffe9e6',
          'warning-300': '#ffded9',
          'warning-400': '#ffbeb4',
          'warning-500': '#d64d00',
          'warning-600': '#b34000',
          'warning-700': '#5e2c21',
          'warning-800': '#3e241e',
          'warning-900': '#361e19',
          'danger-text': '#e1000f',
          'danger-100': '#fef4f4',
          'danger-200': '#fee9e9',
          'danger-300': '#fddede',
          'danger-400': '#fcbfbf',
          'danger-500': '#e1000f',
          'danger-600': '#c9191e',
          'danger-700': '#642727',
          'danger-800': '#412121',
          'danger-900': '#3a1c1c',
        },
        font: { families: { accent: 'Marianne', base: 'Marianne' } },
      },
      components: {
        alert: { 'border-radius': '0' },
        button: {
          'medium-height': '48px',
          'border-radius': '4px',
          primary: {
            background: {
              color: 'var(--c--theme--colors--primary-text)',
              'color-hover': '#1212ff',
              'color-active': '#2323ff',
            },
            color: '#ffffff',
            'color-hover': '#ffffff',
            'color-active': '#ffffff',
          },
          'primary-text': {
            background: {
              'color-hover': 'var(--c--theme--colors--primary-100)',
              'color-active': 'var(--c--theme--colors--primary-100)',
            },
            'color-hover': 'var(--c--theme--colors--primary-text)',
          },
          secondary: {
            background: { 'color-hover': '#F6F6F6', 'color-active': '#EDEDED' },
            border: {
              color: 'var(--c--theme--colors--primary-600)',
              'color-hover': 'var(--c--theme--colors--primary-600)',
            },
            color: 'var(--c--theme--colors--primary-text)',
          },
          'tertiary-text': {
            background: {
              'color-hover': 'var(--c--theme--colors--primary-100)',
            },
            'color-hover': 'var(--c--theme--colors--primary-text)',
          },
        },
        datagrid: {
          header: {
            color: 'var(--c--theme--colors--primary-text)',
            size: 'var(--c--theme--font--sizes--s)',
          },
          body: {
            'background-color': 'transparent',
            'background-color-hover': '#F4F4FD',
          },
          pagination: {
            'background-color': 'transparent',
            'background-color-active': 'var(--c--theme--colors--primary-300)',
          },
        },
        'forms-checkbox': {
          'border-radius': '0',
          color: 'var(--c--theme--colors--primary-text)',
        },
        'forms-datepicker': { 'border-radius': '0' },
        'forms-fileuploader': { 'border-radius': '0' },
        'forms-field': { color: 'var(--c--theme--colors--primary-text)' },
        'forms-input': {
          'border-radius': '4px',
          'background-color': '#ffffff',
          'border-color': 'var(--c--theme--colors--primary-text)',
          'box-shadow-color': 'var(--c--theme--colors--primary-text)',
          'value-color': 'var(--c--theme--colors--primary-text)',
        },
        'forms-labelledbox': {
          'label-color': { big: 'var(--c--theme--colors--primary-text)' },
        },
        'forms-select': {
          'border-radius': '4px',
          'border-radius-hover': '4px',
          'background-color': '#ffffff',
          'border-color': 'var(--c--theme--colors--primary-text)',
          'border-color-hover': 'var(--c--theme--colors--primary-text)',
          'box-shadow-color': 'var(--c--theme--colors--primary-text)',
        },
        'forms-switch': {
          'handle-border-radius': '2px',
          'rail-border-radius': '4px',
        },
        'forms-textarea': { 'border-radius': '0' },
      },
    },
  },
};
