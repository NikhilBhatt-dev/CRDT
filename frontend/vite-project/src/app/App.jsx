import './App.css'
import { Editor } from '@monaco-editor/react'
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from 'react'
import * as Y from 'yjs'
import { SocketIOProvider } from "y-socket.io"

function App() {

  const editorRef = useRef(null)
  const providerRef = useRef(null)
  const bindingRef = useRef(null)
  const [editorReady, setEditorReady] = useState(false)

  const [username, setUsername] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("username") || ""
  })

  const [users, setUsers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  const socketServerUrl =
    isLocalhost && window.location.port !== '3000'
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : window.location.origin

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor
    setEditorReady(true)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const name = e.target.username.value.trim()
    if (!name) return

    setUsername(name)
    window.history.pushState({}, "", "?username=" + name)
  }

  useEffect(() => {
    if (!username || !editorReady || !editorRef.current) return

    const provider = new SocketIOProvider(
      socketServerUrl,
      'monaco',
      ydoc,
      { autoConnect: true }
    )
    const editor = editorRef.current

    providerRef.current = provider
    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    )

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())

      setUsers(
        Array.from(
          new Map(
            states
              .map(state => state.user)
              .filter(user => user?.username)
              .map(user => [user.username, user])
          ).values()
        )
      )
    }

    const syncAwareness = () => {
      provider.awareness.setLocalStateField('user', { username })
      updateUsers()
    }
    const handleStatus = ({ status }) => {
      setConnectionStatus(status)

      if (status === 'connected') {
        syncAwareness()
      }
    }
    const handleConnectionError = () => {
      setConnectionStatus('disconnected')
    }

    provider.awareness.on("change", updateUsers)
    provider.on("sync", syncAwareness)
    provider.on("status", handleStatus)
    provider.on("connection-error", handleConnectionError)
    syncAwareness()

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField('user', null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      provider.awareness.off("change", updateUsers)
      provider.off("sync", syncAwareness)
      provider.off("status", handleStatus)
      provider.off("connection-error", handleConnectionError)
      provider.awareness.setLocalStateField('user', null)
      bindingRef.current?.destroy()
      bindingRef.current = null
      provider.disconnect()
      provider.destroy()
      providerRef.current = null
      setConnectionStatus('disconnected')
      setUsers([])
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }

  }, [editorReady, socketServerUrl, username, ydoc, yText])

  useEffect(() => {
    return () => {
      ydoc.destroy()
    }
  }, [ydoc])

  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className='flex flex-col items-center gap-4 w-full max-w-sm'>
          <input
            type="text"
            placeholder='enter your name'
            className='w-full p-2 rounded-lg bg-gray-800 text-white'
            name='username'
          />
          <button className='w-full p-2 rounded-lg bg-amber-50 text-gray-950 font-bold'>
            join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-gray-900 flex gap-4 p-4">
      <aside className='h-full w-1/4 bg-amber-50 rounded-lg p-2'>
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <p className='mb-4 rounded bg-gray-900 px-3 py-2 text-sm text-white'>
        Status: {connectionStatus}
      </p>
      {connectionStatus !== 'connected' && (
        <p className='mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900'>
          Collaboration server not connected. Make sure the backend is running on port 3000.
        </p>
      )}

      <ul className='p-4'>
        {users.map((u, i) => (
          <li key={i} className="bg-gray-800 text-white  p-2 rounded mb-2">
            {u.username}
          </li>
        ))}
        </ul>
      </aside>

      <section className='w-3/4 bg-neutral-800 rounded-lg overflow-hidden'>
        <Editor
          height="100%"
          defaultLanguage='javascript'
          defaultValue='//some content'
          theme='vs-dark'
          onMount={handleMount}
        />
      </section>
    </main>
  )
}

export default App
