'use babel'

export function getMessage(type = 'Error', filePath, range) {
  return { type, text: 'Some Message', filePath, range }
}
