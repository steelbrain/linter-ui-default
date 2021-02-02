"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElement = void 0;
function getElement(icon) {
  const element = document.createElement('a');
  element.classList.add(`icon-${icon}`);
  element.appendChild(document.createTextNode(''));
  return element;
}
exports.getElement = getElement;