import { browserslistToESVersion } from '../src';

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
