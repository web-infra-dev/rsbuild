import { describe, it, expect } from 'vitest';
import { Graph } from '../../src/common';

describe('test src/common/graph.ts', () => {
  it('formatAssetName', () => {
    expect(Graph.formatAssetName('')).toBe('');
    expect(Graph.formatAssetName('index')).toBe('index');
    expect(Graph.formatAssetName('common/index.js')).toBe('common/index.js');
    expect(Graph.formatAssetName('index.js')).toBe('index.js');
    expect(
      Graph.formatAssetName('common/index.ajsb1.js', 'common/[name].[hash].js'),
    ).toBe('common/index.js');
    expect(Graph.formatAssetName('index.ajsb1.js')).toBe('index.js');
    expect(
      Graph.formatAssetName('common/index-ajsb1.js', 'common/[name]-[hash].js'),
    ).toBe('common/index.js');
    expect(Graph.formatAssetName('index-ajsb1.js')).toBe('index.js');
    expect(Graph.formatAssetName('common/index.js.map')).toBe(
      'common/index.js.map',
    );
    expect(Graph.formatAssetName('index.js.map')).toBe('index.js.map');
    expect(Graph.formatAssetName('common/index.ajsb1.js.map')).toBe(
      'common/index.js.map',
    );
    expect(Graph.formatAssetName('index.ajsb1.js.map')).toBe('index.js.map');
    expect(Graph.formatAssetName('common/index-ajsb1.js.map')).toBe(
      'common/index.js.map',
    );
    expect(Graph.formatAssetName('index-ajsb1.js.map')).toBe('index.js.map');
    expect(Graph.formatAssetName('common/index-aas123-ajsb1.js')).toBe(
      'common/index-aas123.js',
    );
    expect(Graph.formatAssetName('common/index.aas123.ajsb1.js')).toBe(
      'common/index.aas123.js',
    );
    expect(
      Graph.formatAssetName('index-aas123-ajsb1.js', '[name]-[hash].js'),
    ).toBe('index-aas123.js');
    expect(Graph.formatAssetName('index.aas123.ajsb1.js')).toBe(
      'index.aas123.js',
    );
    expect(Graph.formatAssetName('common/index-aas123-ajsb1.js.map')).toBe(
      'common/index-aas123.js.map',
    );
    expect(Graph.formatAssetName('common/index.aas123.ajsb1.js.map')).toBe(
      'common/index.aas123.js.map',
    );
    expect(Graph.formatAssetName('index-aas123-ajsb1.js.map')).toBe(
      'index-aas123.js.map',
    );
    expect(Graph.formatAssetName('index.aas123.ajsb1.js.map')).toBe(
      'index.aas123.js.map',
    );
    expect(Graph.formatAssetName('common/index-aas123-ajsb1.txt.LICENSE')).toBe(
      'common/index-aas123.txt.LICENSE',
    );
    expect(Graph.formatAssetName('common/index.aas123.ajsb1.txt.LICENSE')).toBe(
      'common/index.aas123.txt.LICENSE',
    );
    expect(
      Graph.formatAssetName(
        'index-aas123-ajsb1.txt.LICENSE',
        '[name]-[chunkhash].txt',
      ),
    ).toBe('index-aas123.txt.LICENSE');
    expect(
      Graph.formatAssetName(
        'index.aas123.ajsb1.txt.LICENSE',
        '[name]-[chunkhash].txt',
      ),
    ).toBe('index.aas123.txt.LICENSE');
    expect(
      Graph.formatAssetName(
        'js/okr_block.663b6aff6da26ba53cc3.no.js',
        'js/[name].[chunkhash].no.js',
      ),
    ).toBe('js/okr_block.no.js');
    expect(
      Graph.formatAssetName(
        'js/okr_block.663b6aff6da26ba53cc3.no-online.js',
        'js/[name].[chunkhash].no-online.js',
      ),
    ).toBe('js/okr_block.no-online.js');
  });
});
