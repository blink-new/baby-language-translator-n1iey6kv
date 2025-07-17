import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AudioRecorder } from '@/components/AudioRecorder'
import { TranslationResult } from '@/components/TranslationResult'
import { RecordingHistory } from '@/components/RecordingHistory'
import { Button } from '@/components/ui/button'
import { Baby, History, Mic, User, LogOut } from 'lucide-react'
import { blink } from '@/blink/client'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null)
  const [currentAudioData, setCurrentAudioData] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleRecordingComplete = async (audioData: string, analysis: any) => {
    setIsAnalyzing(true)
    setCurrentAudioData(audioData)
    setCurrentAnalysis(analysis)
    setIsAnalyzing(false)
  }

  const handleSaveRecording = async () => {
    if (!currentAnalysis || !currentAudioData || !user) return

    const newRecording = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: currentAnalysis.type,
      urgency: currentAnalysis.urgency,
      confidence: currentAnalysis.confidence,
      action: currentAnalysis.action,
      audioData: currentAudioData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    try {
      // Try database first
      try {
        await blink.db.recordings.create(newRecording)
      } catch (dbError) {
        console.log('Database not available, using localStorage:', dbError)
        // Fallback to localStorage
        const stored = localStorage.getItem(`recordings_${user.id}`)
        const recordings = stored ? JSON.parse(stored) : []
        recordings.unshift(newRecording)
        // Keep only last 50 recordings in localStorage
        if (recordings.length > 50) {
          recordings.splice(50)
        }
        localStorage.setItem(`recordings_${user.id}`, JSON.stringify(recordings))
      }
      
      // Clear current analysis after saving
      setCurrentAnalysis(null)
      setCurrentAudioData(null)
    } catch (error) {
      console.error('Failed to save recording:', error)
    }
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Baby className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h1 className="text-3xl font-bold mb-4">Baby Language Translator</h1>
          <p className="text-muted-foreground mb-6">
            Understand what your baby is trying to communicate through AI-powered sound analysis
          </p>
          <Button onClick={() => blink.auth.login()} size="lg" className="w-full">
            <User className="w-4 h-4 mr-2" />
            Sign In to Get Started
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Baby className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Baby Language Translator</h1>
              <p className="text-sm text-muted-foreground">AI-powered baby communication</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">Welcome back!</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Record & Analyze
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-8">
            {/* Recording Interface */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Listen to Your Baby</h2>
              <p className="text-muted-foreground mb-8">
                Record your baby's sounds and get instant AI-powered translation
              </p>
              
              <AudioRecorder 
                onRecordingComplete={handleRecordingComplete}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Analysis Results */}
            {(isAnalyzing || currentAnalysis) && (
              <div className="space-y-4">
                {isAnalyzing && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Analyzing your baby's sounds...</p>
                  </div>
                )}
                
                <TranslationResult 
                  analysis={currentAnalysis}
                  audioData={currentAudioData}
                  onSave={handleSaveRecording}
                />
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-accent/10 p-6 rounded-lg border border-accent/20">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Baby className="w-5 h-5 text-accent" />
                Tips for Better Results
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Record in a quiet environment for best analysis</li>
                <li>• Hold the device close to your baby (but safely)</li>
                <li>• Record for at least 3-5 seconds</li>
                <li>• Try different times of day to build a pattern</li>
                <li>• Save recordings to track your baby's communication patterns</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Recording History</h2>
              <p className="text-muted-foreground">
                Review past recordings and track your baby's communication patterns
              </p>
            </div>
            
            <RecordingHistory />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Baby Language Translator - Powered by AI to help you understand your little one
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App