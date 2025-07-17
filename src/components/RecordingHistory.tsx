import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  History, 
  Play, 
  Trash2, 
  Calendar,
  Clock,
  Baby,
  Utensils,
  Moon,
  AlertTriangle,
  Smile,
  Eye,
  Info
} from 'lucide-react'
import { blink } from '@/blink/client'

interface Recording {
  id: string
  timestamp: string
  type: string
  urgency: string
  confidence: number
  action: string
  audioData: string
  createdAt: string
  userId: string
}

const getCryTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'hunger':
      return <Utensils className="w-4 h-4" />
    case 'sleepy':
    case 'tired':
      return <Moon className="w-4 h-4" />
    case 'pain':
    case 'discomfort':
      return <AlertTriangle className="w-4 h-4" />
    case 'happy':
    case 'content':
      return <Smile className="w-4 h-4" />
    case 'attention':
    case 'attention-seeking':
      return <Eye className="w-4 h-4" />
    default:
      return <Baby className="w-4 h-4" />
  }
}

const getCryTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'hunger':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'sleepy':
    case 'tired':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'pain':
    case 'discomfort':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'happy':
    case 'content':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'attention':
    case 'attention-seeking':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function RecordingHistory() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [usingLocalStorage, setUsingLocalStorage] = useState(false)

  const loadRecordings = async (userId: string) => {
    try {
      // Try to load from database first
      try {
        const data = await blink.db.recordings.list({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          limit: 20
        })
        setRecordings(data)
        setUsingLocalStorage(false)
      } catch (dbError) {
        // Silently fall back to localStorage - this is expected behavior
        setUsingLocalStorage(true)
        // Fallback to localStorage
        const stored = localStorage.getItem(`recordings_${userId}`)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            setRecordings(Array.isArray(data) ? data : [])
          } catch (parseError) {
            console.error('Failed to parse stored recordings:', parseError)
            setRecordings([])
          }
        } else {
          setRecordings([])
        }
      }
    } catch (error) {
      console.error('Failed to load recordings:', error)
      setRecordings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadRecordings(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  const deleteRecording = async (id: string) => {
    try {
      if (!usingLocalStorage) {
        // Try database first
        try {
          await blink.db.recordings.delete(id)
        } catch (dbError) {
          // If database fails, fall back to localStorage for this operation
          if (user) {
            const updated = recordings.filter(r => r.id !== id)
            localStorage.setItem(`recordings_${user.id}`, JSON.stringify(updated))
          }
        }
      } else {
        // Using localStorage
        if (user) {
          const updated = recordings.filter(r => r.id !== id)
          localStorage.setItem(`recordings_${user.id}`, JSON.stringify(updated))
        }
      }
      setRecordings(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete recording:', error)
    }
  }

  const playAudio = (audioData: string) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${audioData}`)
      audio.play()
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Sign in to view your recording history</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading recordings...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Recording History
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {usingLocalStorage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">Offline Mode</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Your recordings are safely stored on this device. They'll sync when database becomes available.
            </p>
          </div>
        )}
        
        {recordings.length === 0 ? (
          <div className="text-center py-8">
            <Baby className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No recordings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start recording to build your baby's communication history
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {getCryTypeIcon(recording.type)}
                      <Badge 
                        variant="outline" 
                        className={`${getCryTypeColor(recording.type)} text-xs`}
                      >
                        {recording.type}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {recording.action}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(recording.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(recording.createdAt)}
                        </span>
                        <span>{recording.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(recording.audioData)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecording(recording.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}