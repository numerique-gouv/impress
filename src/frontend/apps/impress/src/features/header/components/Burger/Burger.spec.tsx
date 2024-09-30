import { render, screen } from '@testing-library/react';
import React from 'react';

import { Burger } from './Burger';

describe('<Burger />', () => {
  test('Burger interactions', () => {
    const { rerender } = render(<Burger isOpen={true} />);

    const burger = screen.getByRole('img');
    expect(burger).toBeInTheDocument();
    expect(burger.classList.contains('open')).toBeTruthy();

    rerender(<Burger isOpen={false} />);

    expect(burger.classList.contains('open')).not.toBeTruthy();
  });
});
