import * as React from 'react'

export interface Props {
  done: number
  total: number
}

export const Title: React.FunctionComponent<Props> = ({ done, total }: Props) => (
  <>
    Simple Todo&nbsp;
    <span className="text-muted small">
      {done} / {total}
    </span>
  </>
)
