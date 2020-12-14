"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDecorations = exports.mergeChange = exports.getChunksByProjects = exports.getChunks = void 0;
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../helpers");
function getChunks(filePath, projectPath) {
    const toReturn = [];
    const chunks = filePath.split(path_1.default.sep);
    while (chunks.length) {
        const currentPath = chunks.join(path_1.default.sep);
        if (currentPath) {
            toReturn.push(currentPath);
            if (currentPath === projectPath) {
                break;
            }
        }
        chunks.pop();
    }
    return toReturn;
}
exports.getChunks = getChunks;
function getChunksByProjects(filePath, projectPaths) {
    const matchingProjectPath = projectPaths.find(p => filePath.startsWith(p));
    if (!matchingProjectPath) {
        return [filePath];
    }
    return getChunks(filePath, matchingProjectPath);
}
exports.getChunksByProjects = getChunksByProjects;
function mergeChange(change, filePath, severity) {
    if (!change[filePath]) {
        change[filePath] = {
            info: false,
            error: false,
            warning: false,
        };
    }
    change[filePath][severity] = true;
}
exports.mergeChange = mergeChange;
function calculateDecorations(decorateOnTreeView, messages) {
    const toReturn = {};
    const projectPaths = atom.project.getPaths();
    messages.forEach(function (message) {
        const filePath = helpers_1.$file(message);
        if (filePath) {
            const chunks = decorateOnTreeView === 'Files' ? [filePath] : getChunksByProjects(filePath, projectPaths);
            chunks.forEach(chunk => mergeChange(toReturn, chunk, message.severity));
        }
    });
    return toReturn;
}
exports.calculateDecorations = calculateDecorations;
//# sourceMappingURL=helpers.js.map