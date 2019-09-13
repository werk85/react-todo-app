import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import * as React from 'react'

export interface Stats {
  done: number
  total: number
}

export interface Props {
  stats: O.Option<Stats>
}

export const Title: React.FunctionComponent<Props> = ({ stats }: Props) => (
  <>
    Simple Todo&nbsp;
    {pipe(
      stats,
      O.fold(
        () => null,
        ({ done, total }) => (
          <span className="text-muted small">
            {done} / {total}
          </span>
        )
      )
    )}
  </>
)
