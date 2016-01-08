Linter-UI-Default
================

The default UI for linter.

### How to try it out?

The support for UI Service isn't merged into the linter package yet, here's how
you can try this until then, this demonstration uses some [hub](https://github.com/github/hub)
APIs

```ShellSession
cd ~/.atom/packages
rm -rf linter-ui-default
git clone AtomLinter/linter-ui-default
cd linter-ui-default
apm install
cd ..
rm -rf linter
git clone atom-community/linter
cd linter
git checkout https://github.com/atom-community/linter/pull/995
apm install
```

### License

This Project is licensed under the terms of MIT License, check the license
file for more info.
