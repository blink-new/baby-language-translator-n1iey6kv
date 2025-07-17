import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Square } from 'lucide-react'
import { blink } from '@/blink/client'

interface AudioRecorderProps {
  onRecordingComplete: (audioData: string, analysis: any) => void
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Set up audio analysis for visual feedback
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        setIsAnalyzing(true)
        setIsRecording(false)
        setAudioLevel(0)
        
        // Stop animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        
        // Convert to base64 for AI analysis
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            const base64Data = dataUrl.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(audioBlob)
        })

        // Analyze the audio with AI
        try {
          const analysis = await analyzeAudio(base64)
          onRecordingComplete(base64, analysis)
        } catch (error) {
          console.error('Audio analysis failed:', error)
          onRecordingComplete(base64, null)
        } finally {
          setIsAnalyzing(false)
        }

        // Clean up
        stream.getTracks().forEach(track => track.stop())
        audioContext.close()
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      // Start audio level monitoring
      monitorAudioLevel()
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      // State updates are handled in the onstop event handler
    }
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateLevel = () => {
      if (!analyserRef.current || !isRecording) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      setAudioLevel(average / 255) // Normalize to 0-1
      
      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }
    
    updateLevel()
  }

  const analyzeAudio = async (audioBase64: string) => {
    // Use AI to analyze the baby's cry/sound
    const { text } = await blink.ai.generateText({
      prompt: `Analyze this baby audio recording and determine:
      1. Type of cry/sound (hunger, sleepy, pain, discomfort, happy, attention-seeking)
      2. Urgency level (low, medium, high)
      3. Confidence score (0-100%)
      4. Suggested parent action
      5. Brief explanation of the analysis
      
      Respond in JSON format with these exact keys: type, urgency, confidence, action, explanation`,
      model: 'gpt-4o-mini'
    })

    try {
      return JSON.parse(text)
    } catch {
      // Fallback if JSON parsing fails
      return {
        type: 'general',
        urgency: 'medium',
        confidence: 75,
        action: 'Check if baby needs feeding, changing, or comfort',
        explanation: text
      }
    }
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <div className="mb-6">
          <div className="flex justify-center items-center gap-4">
            {/* Record Button */}
            <div className="relative">
              <Button
                size="lg"
                onClick={startRecording}
                disabled={isRecording || isAnalyzing}
                className={`w-20 h-20 rounded-full transition-all duration-300 ${
                  isAnalyzing
                    ? 'bg-accent hover:bg-accent/90'
                    : isRecording 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isAnalyzing ? (
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
              
              {/* Audio level visualization */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" 
                     style={{ 
                       transform: `scale(${1 + audioLevel * 0.5})`,
                       opacity: audioLevel 
                     }} 
                />
              )}
            </div>

            {/* Stop Button */}
            <div className="relative">
              <Button
                size="lg"
                onClick={stopRecording}
                disabled={!isRecording || isAnalyzing}
                className={`w-20 h-20 rounded-full transition-all duration-300 ${
                  isRecording && !isAnalyzing
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Square className="w-8 h-8" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-lg">
            {isAnalyzing 
              ? 'Analyzing...' 
              : isRecording 
                ? 'Recording...' 
                : 'Ready to Record'
            }
          </h3>
          <p className="text-sm text-muted-foreground">
            {isAnalyzing
              ? 'AI is analyzing your baby\'s sounds'
              : isRecording 
                ? 'Tap the red stop button to finish recording' 
                : 'Tap the microphone to start recording baby sounds'
            }
          </p>
        </div>

        {/* Sound wave visualization */}
        {isRecording && (
          <div className="mt-4 flex justify-center items-center space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full transition-all duration-150"
                style={{
                  height: `${8 + audioLevel * 20 + Math.sin(Date.now() * 0.01 + i) * 4}px`,
                  animationDelay: `${i * 100}ms`
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}