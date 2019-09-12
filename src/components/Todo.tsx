import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faCheckSquare, faStar, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faSquare, faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons'
import * as React from 'react'

export interface Props {
  isFav: boolean
  isDone: boolean
  text: string

  onToggleFav: () => void
  onToggleDone: () => void
  onEdit: () => void
  onRemove: () => void
}

export const Todo: React.FunctionComponent<Props> = ({ isFav, isDone, text, onEdit, onToggleFav, onToggleDone, onRemove }) => (
  <li className="task-container list-group-item d-flex justify-content-between align-items-center">
    <div>
      <a href="#" className="btn-left" onClick={onToggleFav}>
        <FontAwesomeIcon icon={isFav ? faStar : faStarEmpty} />
      </a>
      <a href="#" className="btn-left" onClick={onToggleDone}>
        <FontAwesomeIcon icon={isDone ? faCheckSquare : faSquare} />
      </a>
      {!isDone ? text : <del className="text-muted">{text}</del>}
    </div>
    <div>
      <a href="#" className="btn-right" onClick={onEdit}>
        <FontAwesomeIcon icon={faEdit} />
      </a>
      <a href="#" className="btn-right" onClick={onRemove}>
        <FontAwesomeIcon icon={faTimes} />
      </a>
    </div>
  </li>
)
