"use strict";
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debounce_1 = __importDefault(require("lodash/debounce"));
const disposable_event_1 = __importDefault(require("disposable-event"));
const atom_1 = require("atom");
const tooltip_1 = __importDefault(require("../tooltip"));
const helpers_1 = require("../helpers");
const helpers_2 = require("./helpers");
class Editor {
  constructor(textEditor) {
    this.gutter = null;
    this.tooltip = null;
    this.emitter = new atom_1.Emitter();
    this.markers = new Map();
    this.messages = new Map();
    this.showTooltip = true;
    this.subscriptions = new atom_1.CompositeDisposable();
    this.cursorPosition = null;
    this.tooltipFollows = 'Both';
    this.showProviderName = true;
    this.ignoreTooltipInvocation = false;
    this.currentLineMarker = null;
    this.lastCursorPositions = new WeakMap();
    this.textEditor = textEditor;
    let tooltipSubscription = null;
    this.subscriptions.add(this.emitter, textEditor.onDidDestroy(() => {
      this.dispose();
    }), new atom_1.Disposable(function () {
      tooltipSubscription === null || tooltipSubscription === void 0 ? void 0 : tooltipSubscription.dispose();
    }), atom.config.observe('linter-ui-default.showProviderName', showProviderName => {
      this.showProviderName = showProviderName;
    }), atom.config.observe('linter-ui-default.showDecorations', showDecorations => {
      const notInitial = typeof this.showDecorations !== 'undefined';
      this.showDecorations = showDecorations;
      if (notInitial) {
        this.updateGutter();
      }
    }), atom.config.observe('linter-ui-default.gutterPosition', gutterPosition => {
      const notInitial = typeof this.gutterPosition !== 'undefined';
      this.gutterPosition = gutterPosition;
      if (notInitial) {
        this.updateGutter();
      }
    }), atom.config.observe('linter-ui-default.showTooltip', showTooltip => {
      this.showTooltip = showTooltip;
      if (!this.showTooltip && this.tooltip) {
        this.removeTooltip();
      }
    }), atom.config.observe('linter-ui-default.tooltipFollows', tooltipFollows => {
      this.tooltipFollows = tooltipFollows;
      if (tooltipSubscription) {
        tooltipSubscription.dispose();
      }
      tooltipSubscription = new atom_1.CompositeDisposable();
      if (tooltipFollows === 'Mouse' || tooltipFollows === 'Both') {
        tooltipSubscription.add(this.listenForMouseMovement());
      }
      if (tooltipFollows === 'Keyboard' || tooltipFollows === 'Both') {
        tooltipSubscription.add(this.listenForKeyboardMovement());
      }
      this.removeTooltip();
    }), textEditor.onDidChangeCursorPosition(({ cursor, newBufferPosition }) => {
      const lastBufferPosition = this.lastCursorPositions.get(cursor);
      if (!lastBufferPosition || !lastBufferPosition.isEqual(newBufferPosition)) {
        this.lastCursorPositions.set(cursor, newBufferPosition);
        this.ignoreTooltipInvocation = false;
      }
      if (this.tooltipFollows === 'Mouse') {
        this.removeTooltip();
      }
    }), textEditor.getBuffer().onDidChangeText(() => {
      const cursors = textEditor.getCursors();
      cursors.forEach(cursor => {
        this.lastCursorPositions.set(cursor, cursor.getBufferPosition());
      });
      if (this.tooltipFollows !== 'Mouse') {
        this.ignoreTooltipInvocation = true;
        this.removeTooltip();
      }
    }));
    this.updateGutter();
    this.listenForCurrentLine();
  }
  listenForCurrentLine() {
    this.subscriptions.add(this.textEditor.observeCursors(cursor => {
      const handlePositionChange = ({ start, end }) => {
        const gutter = this.gutter;
        if (!gutter || this.subscriptions.disposed)
        return;
        const currentRange = atom_1.Range.fromObject([start, end]);
        const linesRange = atom_1.Range.fromObject([
        [start.row, 0],
        [end.row, Infinity]]);

        const currentIsEmpty = currentRange.isEmpty();
        if (start.row !== end.row && currentRange.end.column === 0) {
          linesRange.end.row--;
        }
        if (this.lastRange && this.lastRange.isEqual(linesRange) && currentIsEmpty === this.lastIsEmpty)
        return;
        if (this.currentLineMarker) {
          this.currentLineMarker.destroy();
          this.currentLineMarker = null;
        }
        this.lastRange = linesRange;
        this.lastIsEmpty = currentIsEmpty;
        this.currentLineMarker = this.textEditor.markScreenRange(linesRange, {
          invalidate: 'never' });

        const item = document.createElement('span');
        item.className = `line-number cursor-line linter-cursor-line ${currentIsEmpty ? 'cursor-line-no-selection' : ''}`;
        gutter.decorateMarker(this.currentLineMarker, {
          item,
          class: 'linter-row' });

      };
      const cursorMarker = cursor.getMarker();
      const subscriptions = new atom_1.CompositeDisposable();
      subscriptions.add(cursorMarker.onDidChange(({ newHeadScreenPosition, newTailScreenPosition }) => {
        handlePositionChange({
          start: newHeadScreenPosition,
          end: newTailScreenPosition });

      }));
      subscriptions.add(cursor.onDidDestroy(() => {
        this.subscriptions.remove(subscriptions);
        subscriptions.dispose();
      }));
      subscriptions.add(new atom_1.Disposable(() => {
        if (this.currentLineMarker) {
          this.currentLineMarker.destroy();
          this.currentLineMarker = null;
        }
      }));
      this.subscriptions.add(subscriptions);
      handlePositionChange(cursorMarker.getScreenRange());
    }));
  }
  listenForMouseMovement() {
    const editorElement = atom.views.getView(this.textEditor);
    return disposable_event_1.default(editorElement, 'mousemove', debounce_1.default(event => {
      if (!editorElement.getComponent() || this.subscriptions.disposed || !helpers_2.hasParent(event.target, 'div.scroll-view')) {
        return;
      }
      const tooltip = this.tooltip;
      if (tooltip &&
      helpers_2.mouseEventNearPosition({
        event,
        editor: this.textEditor,
        editorElement,
        tooltipElement: tooltip.element,
        screenPosition: tooltip.marker.getStartScreenPosition() }))
      {
        return;
      }
      this.cursorPosition = helpers_2.getBufferPositionFromMouseEvent(event, this.textEditor, editorElement);
      this.ignoreTooltipInvocation = false;
      if (this.cursorPosition) {
        this.updateTooltip(this.cursorPosition);
      } else
      {
        this.removeTooltip();
      }
    }, 100), { passive: true });
  }
  listenForKeyboardMovement() {
    return this.textEditor.onDidChangeCursorPosition(debounce_1.default(({ newBufferPosition }) => {
      this.cursorPosition = newBufferPosition;
      this.updateTooltip(newBufferPosition);
    }, 16));
  }
  updateGutter() {
    this.removeGutter();
    if (!this.showDecorations) {
      this.gutter = null;
      return;
    }
    const priority = this.gutterPosition === 'Left' ? -100 : 100;
    this.gutter = this.textEditor.addGutter({
      name: 'linter-ui-default',
      priority });

    this.markers.forEach((markers, key) => {
      const message = this.messages.get(key);
      if (message) {
        for (const marker of markers) {
          this.decorateMarker(message, marker, 'gutter');
        }
      }
    });
  }
  removeGutter() {
    if (this.gutter) {
      try {
        this.gutter.destroy();
      }
      catch (_) {
      }
    }
  }
  updateTooltip(position) {
    if (!position || this.tooltip && this.tooltip.isValid(position, this.messages)) {
      return;
    }
    this.removeTooltip();
    if (!this.showTooltip) {
      return;
    }
    if (this.ignoreTooltipInvocation) {
      return;
    }
    const messages = helpers_1.filterMessagesByRangeOrPoint(this.messages, this.textEditor.getPath(), position);
    if (!messages.length) {
      return;
    }
    this.tooltip = new tooltip_1.default(messages, position, this.textEditor);
    const tooltipMarker = this.tooltip.marker;
    messages.forEach(message => {
      this.saveMarker(message.key, tooltipMarker);
    });
    this.tooltip.onDidDestroy(() => {
      this.tooltip = null;
    });
  }
  removeTooltip() {
    if (this.tooltip) {
      this.tooltip.marker.destroy();
    }
  }
  apply(added, removed) {
    const textBuffer = this.textEditor.getBuffer();
    for (let i = 0, length = removed.length; i < length; i++) {
      const message = removed[i];
      this.destroyMarker(message.key);
    }
    for (let i = 0, length = added.length; i < length; i++) {
      const message = added[i];
      const markerRange = helpers_1.$range(message);
      if (!markerRange) {
        continue;
      }
      const marker = textBuffer.markRange(markerRange, {
        invalidate: 'never' });

      this.decorateMarker(message, marker);
      marker.onDidChange(({ oldHeadPosition, newHeadPosition, isValid }) => {
        if (!isValid || newHeadPosition.row === 0 && oldHeadPosition.row !== 0) {
          return;
        }
        if (message.version === 2) {
          message.location.position = marker.previousEventState.range;
        }
      });
    }
    this.updateTooltip(this.cursorPosition);
  }
  decorateMarker(message, marker, paint = 'both') {
    this.saveMarker(message.key, marker);
    this.messages.set(message.key, message);
    if (paint === 'both' || paint === 'editor') {
      this.textEditor.decorateMarker(marker, {
        type: 'text',
        class: `linter-highlight linter-${message.severity}` });

    }
    const gutter = this.gutter;
    if (gutter && (paint === 'both' || paint === 'gutter')) {
      const element = document.createElement('span');
      element.className = `linter-gutter linter-gutter-${message.severity} icon icon-${message.icon || 'primitive-dot'}`;
      gutter.decorateMarker(marker, {
        class: 'linter-row',
        item: element });

    }
  }
  saveMarker(key, marker) {
    const allMarkers = this.markers.get(key) || [];
    allMarkers.push(marker);
    this.markers.set(key, allMarkers);
  }
  destroyMarker(key) {
    const markers = this.markers.get(key);
    if (markers) {
      markers.forEach(marker => {
        if (marker) {
          marker.destroy();
        }
      });
    }
    this.markers.delete(key);
    this.messages.delete(key);
  }
  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback);
  }
  dispose() {
    this.emitter.emit('did-destroy');
    this.subscriptions.dispose();
    this.removeGutter();
    this.removeTooltip();
  }}

exports.default = Editor;module.exports = exports.default;