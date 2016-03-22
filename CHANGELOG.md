### Upcoming

- Add `messageTypesToIgnoreInPanel` config
- Fix a bug with Atom where it would null out ranges in messages of project scoped linters
- Add next and previous error commands

### v0.0.3

- The messages in panel are now sorted by both file path and range
- Make tooltips trigger on mouse move instead of cursor move
- Huge performance improvements
- Improve handling of messages with no range
- Implement `Current Line`, `Current File` and `All Files` filters for Panel
- Live update coords in panel messages
- Sort messages in panel by both Line and File
- Integrate with busy-signal package
- Allow copy from linter panel

#### v0.0.2

- Add `linter-ui-default:toggle-panel` command
- Add showProviderName config
- Add file link support in messages
- Make traces in bubble work
- Fix status icon in panel
- Show all available messages in bubble
- Initialize panel with existing errors

#### Improvements over linter package
 - No DOM operations are performed on panel if it's closed, it's not `hidden` like it used to be, it's completely removed from the document
 - DOM Elements of linter messages are cached as much as possible
 - Messages from all files are not painted on panel and hidden, they are never inserted unless they belong to opened file or showAll option is ticked
 - Messages from the same file are organized in DOM by default
 - Inline bubbles cost a lot less than they used to, they are no longer calculated each time user moves cursor, instead they are counted when messages are inserted

All of these changes combined should improve the linter experience significantly, I hope you like 'em :)
