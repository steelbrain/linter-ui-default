describe('activation and installation', () => {
  const deps = ['intentions', 'linter']

  beforeEach(async () => {
    jasmine.attachToDOM(atom.views.getView(atom.workspace))

    /*    Activation     */
    // Trigger deferred activation
    atom.packages.triggerDeferredActivationHooks()
    // Activate activation hook
    atom.packages.triggerActivationHook('core:loaded-shell-environment')

    // Activate the package
    await atom.packages.activatePackage('linter-ui-default')
  })

  it('Installation', function () {
    expect(atom.packages.isPackageLoaded('linter-ui-default')).toBeTruthy()
    const allDeps = atom.packages.getAvailablePackageNames()
    deps.forEach(dep => {
      expect(allDeps.includes(dep)).toBeTruthy()
    })
  })

  it('Activation', function () {
    expect(atom.packages.isPackageLoaded('linter-ui-default')).toBeTruthy()
    deps.forEach(async dep => {
      await atom.packages.activatePackage(dep)
      expect(atom.packages.isPackageLoaded(dep)).toBeTruthy()
    })
  })
})
