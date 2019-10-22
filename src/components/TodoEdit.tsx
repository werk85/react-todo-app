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
  <li className="task-container list-group-item">
    <form
      onSubmit={event => {
        onSave()
        event.preventDefault()
      }}>
      <div className="input-group">
        <input className="form-control" type="text" value={text} onChange={onChange} />
        <div className="input-group-append">
          <button className="btn btn-success" type="submit" disabled={text.length === 0}>
            <FontAwesomeIcon icon={faSave} />
          </button>
          <button className="btn btn-danger" type="button" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>
    </form>
  </li>
)
