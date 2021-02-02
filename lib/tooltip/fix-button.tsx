export interface Props {
  onClick: () => void
}

export function FixButton(props: Props) {
  return (
    <button className="fix-btn" onClick={props.onClick}>
      Fix
    </button>
  )
}
