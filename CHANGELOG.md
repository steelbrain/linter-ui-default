## 1.2.1

- Fix a deprecation warning caused by out-of-date Atom `TextEditor#markBufferRange.properties`

## 1.2.0

* Add `showStatusBar` config
* Fix a typo in Panel Component
* Show line number styles in gutter container
* Validate ranges for NaN to workaround Atom bug
* Move the stauts bar to the left of line:col view
* Fix a typo that would not let `showProviderName` work
* Bump `sb-react-table` to include fix for [steelbrain/react-table#7](https://github.com/steelbrain/react-table/issues/7)
* Fix `Current Line` selector for Panel to support Array-like objects
* Hide Panel's `File` column when Panel is only representing current file

## 1.1.0

* Add option to configure status bar position
* Add support for `Current Line` in `panelRepresents` config
* Fix the Bottom Panel taking 1px height when hidden ([#177](https://github.com/steelbrain/linter-ui-default/pull/177))

## 1.0.0

* Read the [release post](http://steelbrain.me/2017/03/13/linter-v2-released.html).
