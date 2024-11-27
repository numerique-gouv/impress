import { createGlobalStyle } from 'styled-components';

export const QuickSearchStyle = createGlobalStyle`
  .quick-search-container {
    [cmdk-root] {
        width: 100%;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;

        transition: transform 100ms ease;
        outline: none;

        .dark & {
        background: rgba(22, 22, 22, 0.7);
        }
  }

  [cmdk-input] {
    border: none;
    width: 100%;
    font-size: 17px;
    padding: 8px;
    background: white;
    outline: none;
    
    color: var(--c--theme--colors--greyscale-1000);

    border-radius: 0;

    &::placeholder {
      color: var(--c--theme--colors--greyscale-500);
    }
  }

  [cmdk-vercel-badge] {
    height: 20px;
    background: var(--c--theme--colors--greyscale-700);
    display: inline-flex;
    align-items: center;
    padding: 0 8px;
    font-size: 12px;
    color: var(--c--theme--colors--greyscale-500);
    border-radius: 4px;
    margin: 4px 0 4px 4px;
    user-select: none;
    text-transform: capitalize;
    font-weight: 500;
  }

  [cmdk-item] {
    content-visibility: auto;

    cursor: pointer;
    
    
    border-radius: var(--c--theme--spacings--xs);
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    /* padding: var(--c--theme--spacings--2xs) ; */

    user-select: none;
    will-change: background, color;
    transition: all 150ms ease;
    transition-property: none;

    .show-right-on-focus {
      display: none;
    }

    &:hover,
    &[data-selected='true'] {
      background: var(--c--theme--colors--greyscale-100);
      .show-right-on-focus {
        display: inherit;
      }
    }

    &[data-disabled='true'] {
      color: var(--c--theme--colors--greyscale-500);
      cursor: not-allowed;
    }

    & + [cmdk-item] {
      margin-top: 4px;
    }
  }

  [cmdk-list] {
    height: 500px;
    padding: 0 var(--c--theme--spacings--sm) var(--c--theme--spacings--sm)
      var(--c--theme--spacings--sm);
    max-height: 700px;
    
    overflow-y: auto;
    overscroll-behavior: contain;
    transition: 100ms ease;
    transition-property: height;
  }

  [cmdk-vercel-shortcuts] {
    display: flex;
    margin-left: auto;
    gap: 8px;

    kbd {
      font-size: 12px;
      min-width: 20px;
      padding: 4px;
      height: 20px;
      border-radius: 4px;
      color: white;
      background: var(--c--theme--colors--greyscale-500);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
    }
  }

  [cmdk-separator] {
    height: 1px;
    width: 100%;
    background: var(--c--theme--colors--greyscale-500);
    margin: 4px 0;
  }

  *:not([hidden]) + [cmdk-group] {
    margin-top: 8px;
  }

  [cmdk-group-heading] {
    user-select: none;
    font-size: var(--c--theme--font--sizes--sm);
    color: var(--c--theme--colors--greyscale-700);
    font-weight: bold;

    display: flex;
    align-items: center;
    margin-bottom: var(--c--theme--spacings--base);
  }

  [cmdk-empty] {
  }
}



.c__modal__scroller:has(.quick-search-container),
.c__modal__scroller:has(.noPadding) {
  padding: 0 !important;

  .c__modal__close .c__button {
    right: 5px;
    top: 5px;
    padding: 1.5rem 1rem;
  }

  .c__modal__title {
    font-size: var(--c--theme--font--sizes--xs);
    
    padding: var(--c--theme--spacings--200W);
    margin-bottom: 0;
  }
}


`;
