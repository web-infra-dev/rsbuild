import RspackChain from '../compiled/rspack-chain';

test('should generate resolve config as expected', () => {
  const chain = new RspackChain();

  chain.resolve.conditionNames.add('foo').add('bar');
  chain.resolve.merge({
    unsupportedKey: 'hello',
  });

  expect(chain.resolve.get('conditionNames')).toEqual(['foo', 'bar']);

  expect(chain.toConfig()).toEqual({
    resolve: {
      conditionNames: ['foo', 'bar'],
      unsupportedKey: 'hello',
    },
  });
});
