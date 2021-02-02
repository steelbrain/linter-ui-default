"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
class BusySignal {
  constructor() {
    this.executing = new Set();
    this.providerTitles = new Set();
    this.useBusySignal = true;
    this.subscriptions = new atom_1.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-ui-default.useBusySignal', useBusySignal => {
      this.useBusySignal = useBusySignal;
    }));
  }
  attach(registry) {
    this.provider = registry.create();
    this.update();
  }
  update() {
    const provider = this.provider;
    if (!provider)
    return;
    if (!this.useBusySignal)
    return;
    const fileMap = new Map();
    const currentTitles = new Set();
    for (const { filePath, linter } of this.executing) {
      let names = fileMap.get(filePath);
      if (!names) {
        fileMap.set(filePath, names = []);
      }
      names.push(linter.name);
    }
    for (const [filePath, names] of fileMap) {
      const path = filePath ? ` on ${atom.project.relativizePath(filePath)[1]}` : '';
      names.forEach(name => {
        const title = `${name}${path}`;
        currentTitles.add(title);
        if (!this.providerTitles.has(title)) {
          this.providerTitles.add(title);
          provider.add(title);
        }
      });
    }
    this.providerTitles.forEach(title => {
      if (!currentTitles.has(title)) {
        provider.remove(title);
        this.providerTitles.delete(title);
      }
    });
    fileMap.clear();
  }
  getExecuting(linter, filePath) {
    for (const entry of this.executing) {
      if (entry.linter === linter && entry.filePath === filePath) {
        return entry;
      }
    }
    return null;
  }
  didBeginLinting(linter, filePath) {
    if (this.getExecuting(linter, filePath)) {
      return;
    }
    this.executing.add({ linter, filePath });
    this.update();
  }
  didFinishLinting(linter, filePath) {
    const entry = this.getExecuting(linter, filePath);
    if (entry) {
      this.executing.delete(entry);
      this.update();
    }
  }
  dispose() {
    if (this.provider) {
      this.provider.clear();
    }
    this.providerTitles.clear();
    this.executing.clear();
    this.subscriptions.dispose();
  }}

exports.default = BusySignal;module.exports = exports.default;