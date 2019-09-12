import * as React from 'react'

export interface Props {
  input: string
  onAdd: (event: React.MouseEvent) => void
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const TodoForm: React.FunctionComponent<Props> = ({ input, onAdd, onChange }) => (
  <div className="input-group">
    <input type="text" className="form-control" value={input} onChange={onChange} />
    <div className="input-group-append">
      <button type="submit" className="btn btn-primary" onClick={onAdd}>
        Add
      </button>
    </div>
  </div>
)
