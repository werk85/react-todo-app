import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons'
import * as React from 'react'

export interface Props {
  text: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCancel: () => void
  onSave: () => void
}

export const TodoEdit: React.FunctionComponent<Props> = ({ text, onChange, onSave, onCancel }) => (
  <li className="task-container list-group-item d-flex justify-content-between align-items-center">
    <div className="form-group">
      <input className="form-control" type="text" value={text} onChange={onChange} />
    </div>
    <div>
      <a href="#" className="btn-right" onClick={onCancel}>
        <FontAwesomeIcon icon={faTimes} />
      </a>
      <a href="#" className="btn-right" onClick={onSave}>
        <FontAwesomeIcon icon={faSave} />
      </a>
    </div>
  </li>
)
