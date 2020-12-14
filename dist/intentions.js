"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
class Intentions {
    constructor() {
        this.messages = [];
        this.grammarScopes = ['*'];
    }
    getIntentions({ textEditor, bufferPosition }) {
        let intentions = [];
        const messages = helpers_1.filterMessages(this.messages, textEditor.getPath());
        for (const message of messages) {
            const hasFixes = message.solutions && message.solutions.length;
            if (!hasFixes) {
                continue;
            }
            const range = helpers_1.$range(message);
            const inRange = range && range.containsPoint(bufferPosition);
            if (!inRange) {
                continue;
            }
            let solutions = [];
            if (message.version === 2 && message.solutions && message.solutions.length) {
                solutions = message.solutions;
            }
            const linterName = message.linterName || 'Linter';
            intentions = intentions.concat(solutions.map(solution => ({
                priority: solution.priority ? solution.priority + 200 : 200,
                icon: 'tools',
                title: solution.title || `Fix ${linterName} issue`,
                selected() {
                    helpers_1.applySolution(textEditor, solution);
                },
            })));
        }
        return intentions;
    }
    update(messages) {
        this.messages = messages;
    }
}
exports.default = Intentions;
//# sourceMappingURL=intentions.js.map