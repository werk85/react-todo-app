import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons'
import { faSquare } from '@fortawesome/free-regular-svg-icons'
import * as React from 'react'

export interface Props {
  text: string
  isDone: boolean
  onToggle: (event: React.MouseEvent) => void
}

export const Todo: React.FunctionComponent<Props> = ({ text, isDone, onToggle }) => (
  <li className="task-container list-group-item d-flex justify-content-between align-items-center">
    <div>
      <a href="#" className="btn-left" onClick={onToggle}>
        <FontAwesomeIcon icon={isDone ? faCheckSquare : faSquare} />
      </a>
      {!isDone ? text : <del className="text-muted">{text}</del>}
    </div>
  </li>
)
