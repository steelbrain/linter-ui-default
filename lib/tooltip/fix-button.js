/* @flow */

import React from 'react'

export default ({ onClick }: { onClick: () => void }) => (
  <button className="linter-ui-default-fix-btn" onClick={onClick}>
    Fix
  </button>
)
