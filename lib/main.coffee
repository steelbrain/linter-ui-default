LinterUiDefaultView = require './linter-ui-default-view'
{CompositeDisposable} = require 'atom'

module.exports = LinterUiDefault =
  linterUiDefaultView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @linterUiDefaultView = new LinterUiDefaultView(state.linterUiDefaultViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @linterUiDefaultView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'linter-ui-default:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @linterUiDefaultView.destroy()

  serialize: ->
    linterUiDefaultViewState: @linterUiDefaultView.serialize()

  toggle: ->
    console.log 'LinterUiDefault was toggled!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()
