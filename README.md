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
git clone steelbrain/linter-ui-default
cd linter-ui-default
npm install
npm run compile

# Install the latest, unreleased linter
cd ~/.atom/packages
git clone steelbrain/linter -b steelbrain/transition-towards-ide
cd linter
npm install
```

### License

This Project is licensed under the terms of MIT License, check the license
file for more info.
