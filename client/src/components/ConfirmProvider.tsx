import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core'
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface NotifyOptions {
  title?: string
  body?: ReactNode
}

interface DialogState extends ConfirmOptions {
  open: boolean
  mode: 'confirm' | 'notify'
}

const ConfirmContext = createContext<{
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  notify: (opts: NotifyOptions) => Promise<void>
}>({
  confirm: async () => false,
  notify: async () => undefined,
})

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ open: false, mode: 'confirm' })
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const settle = useCallback((value: boolean) => {
    setState((s) => ({ ...s, open: false }))
    resolver.current?.(value)
    resolver.current = null
  }, [])

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setState({ open: true, mode: 'confirm', ...opts })
      }),
    []
  )

  const notify = useCallback(
    (opts: NotifyOptions) =>
      new Promise<void>((resolve) => {
        resolver.current = () => resolve()
        setState({ open: true, mode: 'notify', ...opts })
      }),
    []
  )

  return (
    <ConfirmContext.Provider value={{ confirm, notify }}>
      {children}
      <Dialog open={state.open} onClose={() => settle(false)} maxWidth="xs" fullWidth>
        {state.title && <DialogTitle>{state.title}</DialogTitle>}
        {state.body != null && (
          <DialogContent>
            <DialogContentText component="div">{state.body}</DialogContentText>
          </DialogContent>
        )}
        <DialogActions>
          {state.mode === 'confirm' && (
            <Button onClick={() => settle(false)} color="inherit">
              {state.cancelLabel ?? 'Cancel'}
            </Button>
          )}
          <Button
            onClick={() => settle(true)}
            color={state.destructive ? 'secondary' : 'primary'}
            variant="contained"
            autoFocus
          >
            {state.mode === 'notify' ? 'OK' : state.confirmLabel ?? 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext).confirm
export const useNotify = () => useContext(ConfirmContext).notify
