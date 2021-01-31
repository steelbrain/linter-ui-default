export interface Props {
  onClick: () => void
}

export function FixButton(props: Props) {
  return (
    <button className="linter-ui-default-fix-btn" onClick={props.onClick}>
      Fix
    </button>
  )
}
