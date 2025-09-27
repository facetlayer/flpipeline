// @ts-nocheck
describe.skip('skipped suite', () => {
  it('never runs', () => {
    expect(1).toBe(1);
  });
});

describe('edge cases', () => {
  it('has a conditional assertion', () => {
    const result = 5;

    if (result > 0) {
      expect(result).toBeGreaterThan(0);
    }
  });

  it.skip('is explicitly skipped', () => {
    expect(true).toBe(true);
  });
});
