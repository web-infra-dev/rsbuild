# REM adaptation

Rsbuild supports REM adaptation via [output.convertToRem](/config/options/output.html#outputconverttorem), which can dynamically adjusts the font size according to the screen size, so that the page will be displayed correctly on different screen sizes.

## Enabling REM adaptability

By setting `output.convertToRem`, the Rsbuild can do the following things:

- Convert px to rem in CSS.
- Dynamic setting the fontSize of the root element.

```ts
export default {
  output: {
    convertToRem: true,
  },
};
```

## CSS conversion properties

By default, rootFontSize is 50. So the CSS styles value are converted according to the ratio of `1rem : 50px`.

```css
/* input */
h1 {
  margin: 0 0 16px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: 1px;
}

/* output */
h1 {
  margin: 0 0 0.32rem;
  font-size: 0.64rem;
  line-height: 1.2;
  letter-spacing: 0.02rem;
}
```

By default, Rsbuild converts all CSS properties from px to rem. If you want to convert only the `font-size` property, you can setting `pxtorem.propList` is `['font-size']`.

```ts
export default {
  output: {
    convertToRem: {
      pxtorem: {
        propList: ['font-size'],
      },
    },
  },
};
```

### How to ignore some CSS properties converted to REM?

[pxtorem.propList](https://github.com/cuth/postcss-pxtorem#options) in addition to specifying which attributes need to be converted, you also can specify which elements are not converted through `!`:

```ts
export default {
  output: {
    convertToRem: {
      pxtorem: {
        propList: ['*', '!border-width'], // not convert 'border-width'
      },
    },
  },
};
```

If you only want some individual CSS properties not to be converted to REM, you can also refer to the following writing method:

```css
/* `px` is converted to `rem` */
.convert {
    font-size: 16px; // converted to 1rem
}

/* `Px` or `PX` is ignored by `postcss-pxtorem` but still accepted by browsers */
.ignore {
    border: 1Px solid; // ignored
    border-width: 2PX; // ignored
}
```

More info about [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem#a-message-about-ignoring-properties)。

## Setting the page rootFontSize

The formula for calculating the font size of the page root element is:

```
pageRootFontSize = clientWidth * rootFontSize / screenWidth
```

In a mobile browser with a screen width of 390, the default value for rootFontSize is 50 and the screenWidth of the UI design is 375.

The calculated font size for the root element of the page is 52 (`390 * 50 / 375`).

At this point, 1 rem is 52px, 32px (0.64 rem) in the CSS style, the actual size in page is 33.28 px.

```ts
export default {
  output: {
    convertToRem: {
      rootFontSize: 50,
      screenWidth: 375,
    },
  },
};
```

### Customize maxRootFontSize

In the desktop browser, the page rootFontSize obtained from the calculation formula is often too large. When the calculated result large than the maxRootFontSize, the maxRootFontSize will used as the page rootFontSize.

In the desktop browser with a screen width of 1920, the calculated rootFontSize is 349, which exceeds the default maxRootFontSize of 64. 64 is used as the current root element font value.

```ts
export default {
  output: {
    convertToRem: {
      maxRootFontSize: 64,
    },
  },
};
```

### How to get the rootFontSize value that is actually in effect on the page?

The actual rootFontSize in effect for the page is calculated dynamically based on the current page. It can be seen by printing `document.documentElement.style.fontSize` or obtained by `window.ROOT_FONT_SIZE`.

### How to specify the actual rootFontSize value of the page?

By default, the actual rootFontSize of the page will be dynamically calculated based on the situation of the current page. If you want to specify the actual rootFontSize of the page, you can turn off the `enableRuntime` configuration and set it in [Customized html template](/config/options/html.html#htmltemplate) and inject `document.documentElement.style.fontSize = '64px'` by yourself.

```ts
export default {
  html: {
    template: './static/index.html',
  },
  output: {
    convertToRem: {
      enableRuntime: false,
    },
  },
};
```

## How to determine if REM is in effect？

1. CSS: Check the generated `.css` file to see if the value of the corresponding property is converted from px to rem.
2. HTML: Open the Page Console to see if a valid value exists for `document.documentElement.style.fontSize`.
