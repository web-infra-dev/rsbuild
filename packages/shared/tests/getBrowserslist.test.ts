import { DEFAULT_BROWSERSLIST } from '../src';
import {
  browserslistToESVersion,
  getBrowserslistWithDefault,
} from '../src/getBrowserslist';

describe('getBrowserslistWithDefault', () => {
  it('should get default browserslist correctly', async () => {
    expect(await getBrowserslistWithDefault(__dirname, {}, 'web')).toEqual(
      DEFAULT_BROWSERSLIST.web,
    );
    expect(await getBrowserslistWithDefault(__dirname, {}, 'node')).toEqual(
      DEFAULT_BROWSERSLIST.node,
    );
    expect(
      await getBrowserslistWithDefault(__dirname, {}, 'web-worker'),
    ).toEqual(DEFAULT_BROWSERSLIST['web-worker']);
    expect(
      await getBrowserslistWithDefault(__dirname, {}, 'service-worker'),
    ).toEqual(DEFAULT_BROWSERSLIST['service-worker']);
  });

  it('should override browserslist when using overrideBrowserslist config', async () => {
    const override = ['Android >= 4.4', 'iOS >= 8'];
    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'web',
      ),
    ).toEqual(override);

    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'web-worker',
      ),
    ).toEqual(override);

    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'node',
      ),
    ).toEqual(DEFAULT_BROWSERSLIST.node);

    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'service-worker',
      ),
    ).toEqual(DEFAULT_BROWSERSLIST['service-worker']);
  });

  it('should allow to override browserslist according to target', async () => {
    const override = {
      web: ['Android >= 4.4', 'iOS >= 8'],
      node: ['node >= 12'],
    };

    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'web',
      ),
    ).toEqual(override.web);

    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'node',
      ),
    ).toEqual(override.node);
  });
});

describe('browserslistToESVersion', () => {
  test('should get ecma version correctly', () => {
    expect(browserslistToESVersion(['iOS 8'])).toEqual(5);
    expect(browserslistToESVersion(['ie >= 11'])).toEqual(5);
    expect(browserslistToESVersion(['android >= 4.4'])).toEqual(5);
    expect(browserslistToESVersion(['Chrome >= 33'])).toEqual(5);
    expect(browserslistToESVersion(['Edge >= 12'])).toEqual(5);
    expect(browserslistToESVersion(['Edge >= 15'])).toEqual(2017);
    expect(browserslistToESVersion(['Chrome >= 53'])).toEqual(2016);
    expect(browserslistToESVersion(['ie >= 11', 'Chrome >= 53'])).toEqual(5);
    expect(browserslistToESVersion(['Edge >= 15', 'Chrome >= 53'])).toEqual(
      2016,
    );
    expect(
      browserslistToESVersion([
        'iOS >= 9',
        'Android >= 4.4',
        'last 2 versions',
        '> 0.2%',
        'not dead',
      ]),
    ).toEqual(5);
    expect(
      browserslistToESVersion([
        'chrome >= 87',
        'edge >= 88',
        'firefox >= 78',
        'safari >= 14',
      ]),
    ).toEqual(2017);
    expect(
      browserslistToESVersion([
        'last 1 chrome version',
        'last 1 firefox version',
        'last 1 safari version',
      ]),
    ).toEqual(2018);
    expect(
      browserslistToESVersion([
        'iOS >= 10',
        'Chrome >= 51',
        '> 0.5%',
        'not dead',
        'not op_mini all',
      ]),
    ).toEqual(2015);
    expect(browserslistToESVersion(['fully supports es6'])).toEqual(2015);
    expect(browserslistToESVersion(['fully supports es6-module'])).toEqual(
      2017,
    );
    expect(browserslistToESVersion(['ie 11', 'baidu 7.12'])).toEqual(5);
    expect(browserslistToESVersion(['ios_saf 11'])).toEqual(2017);
  });
});
