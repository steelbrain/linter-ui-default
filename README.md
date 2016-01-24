Linter-UI-Default
================

The default UI for linter.

### Installation

The support for UI Service isn't merged into the linter package yet, here's how
you can try this until then, this demonstration uses some [hub](https://github.com/github/hub)
commands

```
apm uninstall linter linter-ui-default

# Clone linter-ui-default package
cd ~/.atom/packages
git clone AtomLinter/linter-ui-default
cd linter-ui-default
apm install

# Install the UI service patch over linter
cd ~/.atom/packages
git clone atom-community/linter
cd linter
git checkout https://github.com/atom-community/linter/pull/995
apm install
```

### License

This Project is licensed under the terms of MIT License, check the license
file for more info.
