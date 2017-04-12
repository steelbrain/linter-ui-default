/* @flow */

// Global Atom Object
declare var atom: Object;

// Global Chromium CSS Object
declare var CSS: Object;

declare module 'atom' {
  declare var Panel: any;
  declare var Point: any;
  declare var Range: any;
  declare var Emitter: any;
  declare var Disposable: any;
  declare var TextEditor: any;
  declare var TextBuffer: any;
  declare var BufferMarker: any;
  declare var TextEditorGutter: any;
  declare var TextEditorMarker: any;
  declare var CompositeDisposable: any;
}

declare module 'electron' {
  declare var shell: any;
}
