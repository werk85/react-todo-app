import * as React from 'react'

export interface Props {
  value: string
  onChange: (text: string) => void
  onSubmit: () => void
}

export const TodoForm: React.FunctionComponent<Props> = ({ value, onChange, onSubmit }: Props) => (
  <form
    onSubmit={event => {
      onSubmit()
      event.preventDefault()
    }}>
    <div className="input-group">
      <input type="text" className="form-control" name="task" value={value} onChange={event => onChange(event.target.value)} />
      <div className="input-group-append">
        <button type="submit" className="btn btn-primary" disabled={value === ''}>
          Add
        </button>
      </div>
    </div>
  </form>
)
