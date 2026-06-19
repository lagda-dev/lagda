import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { ToastActionElement, ToastProps } from "./toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: ReactNode
  description?: ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

const genId = (): string => {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string): void => {
  if (toastTimeouts.has(toastId)) return

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((entry) => (entry.id === action.toast.id ? { ...entry, ...action.toast } : entry)),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action
      const dismissesAll = typeof toastId === "undefined"

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((entry) => {
          addToRemoveQueue(entry.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((entry) => (dismissesAll || entry.id === toastId ? { ...entry, open: false } : entry)),
      }
    }

    case "REMOVE_TOAST": {
      const removesAll = typeof action.toastId === "undefined"
      if (removesAll) return { ...state, toasts: [] }
      return { ...state, toasts: state.toasts.filter((entry) => entry.id !== action.toastId) }
    }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

const dispatch = (action: Action): void => {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

export const toast = ({ ...props }: Toast) => {
  const id = genId()

  const update = (next: ToasterToast) => dispatch({ type: "UPDATE_TOAST", toast: { ...next, id } })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}

export const useToast = () => {
  const [state, setState] = useState<State>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}
