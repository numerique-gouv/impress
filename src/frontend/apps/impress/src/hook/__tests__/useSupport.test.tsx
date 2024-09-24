import { renderHook } from '@testing-library/react';
import { Crisp } from 'crisp-sdk-web';

import { useSupport } from '../useSupport';

jest.mock('crisp-sdk-web', () => ({
  ...jest.requireActual('crisp-sdk-web'),
  Crisp: {
    configure: jest.fn(),
  },
}));

describe('useSupport', () => {
  afterEach(() => jest.clearAllMocks());

  it('checks that env NEXT_PUBLIC_CRISP_WEBSITE_ID not set give a warning', () => {
    process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID = '';
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    renderHook(() => useSupport());
    expect(console.warn).toHaveBeenCalledWith('Crisp Website ID is not set');
  });

  it('checks Crisp is configured', () => {
    process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID = '123456';
    renderHook(() => useSupport());

    expect(Crisp.configure).toHaveBeenCalledWith('123456');
  });
});
