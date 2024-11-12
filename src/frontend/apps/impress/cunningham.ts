const config = {
  themes: {
    default: {
      theme: {
        colors: {
          'card-border': '#DDDDDD',
          'primary-bg': '#FAFAFA',
          'primary-100': '#EDF5FA',
          'primary-150': '#E5EEFA',
          'info-150': '#E5EEFA',
          'grey-400': '#929292',
          'grey-800': '#2A2A2A',
        },
        font: {
          letterSpacings: {
            h5: 'normal',
          },
          sizes: {
            ml: '0.938rem',
            xl: '1.25rem',
            t: '0.6875rem',
            s: '0.75rem',
            h1: '2.2rem',
            h2: '1.7rem',
            h3: '1.37rem',
            h4: '1.15rem',
            h5: '1rem',
            h6: '0.87rem',
          },
          weights: {
            thin: 100,
            extrabold: 800,
            black: 900,
          },
        },
      },
    },
    dsfr: {
      theme: {
        colors: {
          // Primary

          'primary-text': 'var(--c--theme--colors--primary-600)',
          'primary-100': '#F5F5FE',
          'primary-200': '#ECECFE',
          'primary-300': '#E3E3FD',
          'primary-400': '#CACAFB',
          'primary-500': '#6A6AF4',
          'primary-600': '#000091',
          'primary-clicked-100': '#CBCBFA',
          'primary-clicked-200': '#BBBBFC',
          'primary-clicked-300': '#ADADF9',
          'primary-clicked-400': '#8B8BF6',
          'primary-clicked-500': '#AEAEF9',
          'primary-clicked-600': '#2323FF',
          'primary-hover-100': '#DCDCFC',
          'primary-hover-200': '#CECEFC',
          'primary-hover-300': '#C1C1FB',
          'primary-hover-400': '#A1A1F8',
          'primary-hover-500': '#9898F8',
          'primary-hover-600': '#1212FF',

          // secondary
          'secondary-100': '#FEF4F4',
          'secondary-200': '#FEE9E9',
          'secondary-300': '#FDDEDE',
          'secondary-400': '#FCBFBF',
          'secondary-500': '#E1000F',
          'secondary-600': '#C9191E',
          'secondary-clicked-100': '#FAC4C4',
          'secondary-clicked-200': '#FCAFAF',
          'secondary-clicked-300': '#FA9E9E',
          'secondary-clicked-400': '#FA7474',
          'secondary-clicked-500': '#FF4347',
          'secondary-clicked-600': '#F95A5C',
          'secondary-hover-100': '#FCD7D7',
          'secondary-hover-200': '#FDC5C5',
          'secondary-hover-300': '#FBB6B6',
          'secondary-hover-400': '#FB8F8F',
          'secondary-hover-500': '#FF292F',
          'secondary-hover-600': '#F93F42',

          // Greyscale
          'greyscale-000': '#FFFFFF',
          'greyscale-050': '#F6F6F6',
          'greyscale-100': '#EEEEEE',
          'greyscale-200': '#E5E5E5',
          'greyscale-250': '#DDDDDD',
          'greyscale-300': '#CECECE',
          'greyscale-400': '#929292',
          'greyscale-500': '#666666',
          'greyscale-700': '#3A3A3A',
          'greyscale-1000': '#161616',
          'greyscale-clicked-000': '#EDEDED',
          'greyscale-clicked-050': '#CFCFCF',
          'greyscale-clicked-100': '#C1C1C1',
          'greyscale-clicked-200': '#B2B2B2',
          'greyscale-clicked-250': '#A7A7A7',
          'greyscale-clicked-300': '#939393',
          'greyscale-clicked-400': '#CECECE',
          'greyscale-clicked-500': '#A6A6A6',
          'greyscale-clicked-700': '#777777',
          'greyscale-clicked-1000': '#474747',
          'greyscale-hover-000': '#F6F6F6',
          'greyscale-hover-050': '#DFDFDF',
          'greyscale-hover-100': '#D2D2D2',
          'greyscale-hover-200': '#C5C5C5',
          'greyscale-hover-250': '#BBBBBB',
          'greyscale-hover-300': '#A8A8A8',
          'greyscale-hover-400': '#BBBBBB',
          'greyscale-hover-500': '#919191',
          'greyscale-hover-700': '#616161',
          'greyscale-hover-1000': '#343434',

          // 'success-text': '#1f8d49',
          'success-200': '#B8FEC9',
          'success-500': '#18753C', // Same has 600 for cunningham
          'success-600': '#18753C',
          'success-clicked-200': '#34EB7B',
          'success-clicked-600': '#2FC368',
          'success-hover-200': '#46FD89',
          'success-hover-600': '#27A959',

          // 'info-text': '#0078f3',
          'info-200': '#E8EDFF',
          'info-500': '#0063CB', // Same has 600 for cunningham
          'info-600': '#0063CB',
          'info-clicked-200': '#A9BFFF',
          'info-clicked-600': '#6798FF',
          'info-hover-200': '#C2D1FF',
          'info-hover-600': '#3B87FF',

          // 'warning-text': '#d64d00',
          'warning-200': '#FFE9E6',
          'warning-500': '#B34000', // Same has 600 for cunningham
          'warning-600': '#B34000',
          'warning-clicked-200': '#FFB0A2',
          'warning-clicked-600': '#FF7A55',
          'warning-hover-200': '#FFC6BD',
          'warning-hover-600': '#FF6218',

          //  Danger
          'danger-200': '#FFE9E9',
          'danger-500': '#CE0500', // Same has 600 for cunningham
          'danger-600': '#CE0500',
          'danger-clicked-200': '#FFAFAF',
          'danger-clicked-600': '#FF4140',
          'danger-hover-200': '#FFC5C5',
          'danger-hover-600': '#FF2725',

          // Cumulus
          'cumulus-100': '#F3F6FE',
          'cumulus-200': '#E6EEFE',
          'cumulus-300': '#DAE6FD',
          'cumulus-400': '#B6CFFB',
          'cumulus-500': '#417DC4',
          'cumulus-600': '#3558A2',

          // emeraude
          'emeraude-100': '#E3FDEB',
          'emeraude-200': '#C3FAD5',
          'emeraude-300': '#9EF9BE',
          'emeraude-400': '#6FE49D',
          'emeraude-500': '#00A95F',
          'emeraude-600': '#297254',

          // glycine
          'glycine-100': '#FEF3FD',
          'glycine-200': '#FEE7FC',
          'glycine-300': '#FDDBFA',
          'glycine-400': '#FBB8F6',
          'glycine-500': '#A558A0',
          'glycine-600': '#6E445A',

          // terre-battue
          'terre-battue-100': '#FEF7DA',
          'terre-battue-200': '#FCEEAC',
          'terre-battue-300': '#FBE769',
          'terre-battue-400': '#E2CF58',
          'terre-battue-500': '#B7A73F',
          'terre-battue-600': '#66673D',

          // tilleul-verveine
          'tilleul-verveine-100': '#FEF7DA',
          'tilleul-verveine-200': '#FCEEAC',
          'tilleul-verveine-300': '#FBE769',
          'tilleul-verveine-400': '#E2CF58',
          'tilleul-verveine-500': '#B7A73F',
          'tilleul-verveine-600': '#66673D',

          // Focus
          'focus-500': '#0A76F6',
        },
        spacings: {
          '050V': '2px',
          '100V': '4px',
          '150V': '6px',
          '100W': '8px',
          '300V': '12px',
          '200W': '16px',
          '300W': '24px',
          '400W': '32px',
          '500W': '40px',
          '600W': '48px',
          '700W': '56px',
          '800W': '64px',
          '900W': '72px',
          '1200W': '96px',
          '1500W': '120px',
        },
        font: {
          families: {
            accent: 'Marianne',
            base: 'Marianne',
          },
          sizes: {
            xl: '20px',
            lg: '18px',
            md: '16px',
            sm: '14px',
            xs: '12px',
            h1: '32px',
            h2: '28px',
            h3: '24px',
            h4: '22px',
            h5: '20px',
            h6: '18px',
            'title-alt-xl': '80px',
            'title-alt-lg': '72px',
            'title-alt-md': '64px',
            'title-alt-sm': '56px',
            'title-alt-xs': '48px',
          },
        },
      },
      components: {
        alert: {
          'border-radius': '0',
          'background-color': 'var(--c--theme--colors--greyscale-000)',
        },
        modal: {
          'box-shadow': '0px 6px 18px 0px rgba(0, 0, 18, 0.16);',
        },
        button: {
          'medium-height': '48px',
          'border-radius': '4px',
          'medium-text-height': '48px',
          primary: {
            background: {
              color: 'var(--c--theme--colors--primary-600)',
              'color-hover': 'var(--c--theme--colors--primary-hover-600)',
              'color-active': 'var(--c--theme--colors--primary-600)',
              'color-focus': 'var(--c--theme--colors--focus-500)',
            },
            color: '#ffffff',
            'color-hover': '#ffffff',
            'color-active': '#ffffff',
          },
          'primary-text': {
            background: {
              'color-hover': 'var(--c--theme--colors--greyscale-hover-000)',
              'color-active': 'var(--c--theme--colors--greyscale-clicked-000)',
            },
            'color-disabled': 'var(--c--theme--colors--greyscale-400)',
            color: 'var(--c--theme--colors--primary-600)',
            'color-hover': 'var(--c--theme--colors--primary-600)',
          },
          secondary: {
            background: {
              color: 'var(--c--theme--colors--greyscale-000)',
              'color-hover': 'var(--c--theme--colors--greyscale-hover-000)',
              'color-active': '#EDEDED',
            },
            border: {
              color: 'var(--c--theme--colors--greyscale-250)',
              'color-hover': 'var(--c--theme--colors--greyscale-250)',
            },
            color: 'var(--c--theme--colors--primary-600)',
            ['color-hover']: 'var(--c--theme--colors--primary-600)',
            'color-disabled': 'var(--c--theme--colors--greyscale-400)',
          },
          tertiary: {
            background: {
              color: 'var(--c--theme--colors--primary-300)',
              'color-hover': 'var(--c--theme--colors--primary-hover-300)',
              'color-active': 'var(--c--theme--colors--primary-clicked-300)',
            },
            border: {
              color: 'var(--c--theme--colors--primary-500)',
              'color-hover': 'var(--c--theme--colors--greyscale-250)',
            },
            color: 'var(--c--theme--colors--primary-600)',
            ['color-hover']: 'var(--c--theme--colors--primary-600)',
            ['color-disabled']: 'var(--c--theme--colors--primary-400)',
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
            color: 'var(--c--theme--colors--greyscale-500)',
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
        'forms-datepicker': {
          // 'border-radius': '0',
        },
        'forms-fileuploader': {
          // 'border-radius': '0',
        },
        'forms-input': {
          // 'background-color': 'var(--c--theme--colors--greyscale-050)',
          // 'border-radius': '5px 5px 0 0',
          // 'border-color': 'var(--c--theme--colors--greyscale-100)',
          // 'border-color--focus': 'var(--c--theme--colors--greyscale-1000)',
          // 'border-width': '0 0 2px 0',
          // 'label-color--focus':
          //   'var(--c--components--forms-labelledbox--label-color--small)',
        },
        'forms-textarea': {
          // 'background-color': 'var(--c--theme--colors--greyscale-050)',
          // 'border-radius': '5px 5px 0 0',
          // 'border-color': 'var(--c--theme--colors--greyscale-100)',
          // 'border-color--focus': 'var(--c--theme--colors--greyscale-1000)',
          // 'border-width': '0 0 2px 0',
          // 'border-color--hover': 'var(--c--theme--colors--greyscale-1000)',
          // 'label-color--focus':
          //   'var(--c--components--forms-labelledbox--label-color--small)',
        },
        'forms-select': {
          // 'background-color': 'var(--c--theme--colors--greyscale-100)',
          // 'border-radius': '0',
          // 'border-color': 'var(--c--theme--colors--greyscale-1000)',
          // 'border-width': '0 0 2px 0',
          // 'border-color--focus': '#0974F6',
          // 'border-color--hover': 'var(--c--theme--colors--greyscale-1000)',
          // 'label-color--focus':
          //   'var(--c--components--forms-labelledbox--label-color--big)',
        },
        'forms-switch': {
          // 'accent-color': '#2323ff',
        },
        'forms-checkbox': {
          // 'accent-color': '#2323ff',
        },
        'la-gauffre': {
          activated: true,
        },
      },
    },
  },
};

export default config;
