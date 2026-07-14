/// <reference types="@rsbuild/core/types" />

document.body.innerHTML = '<div id="title">before</div>';

import.meta.webpackHot?.accept();
