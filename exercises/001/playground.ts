interface OpenAction {
  type: 'open'
  payload: {
    openedBy: string
  }
}

interface CloseAction {
  type: 'close'
  payload: {
    closedBy: string
  }
}

type Action = OpenAction | CloseAction

const a: Action = {
  type: 'open',
  payload: {
    openedBy: 'me'
  }
}
const b: Action = {
  type: 'open',
  payload: {
    closedBy: 'me' // Error
  }
}

export function reducer(action: Action) {
  switch (action.type) {
    case 'open':
      return action.closedBy // Error: Property 'closedBy' does not exist on type 'OpenAction'
    case 'close':
      return action.openedBy // Error
    // No need for a default statement cause all possible type values are strictly defined
  }
}
