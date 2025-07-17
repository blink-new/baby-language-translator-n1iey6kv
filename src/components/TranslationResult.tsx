import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Baby, 
  Heart, 
  Utensils, 
  Moon, 
  AlertTriangle, 
  Smile,
  Eye,
  Volume2,
  Save
} from 'lucide-react'

interface TranslationResultProps {
  analysis: {
    type: string
    urgency: string
    confidence: number
    action: string
    explanation: string
  } | null
  audioData: string | null
  onSave?: () => void
}

const getCryTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'hunger':
      return <Utensils className="w-5 h-5" />
    case 'sleepy':
    case 'tired':
      return <Moon className="w-5 h-5" />
    case 'pain':
    case 'discomfort':
      return <AlertTriangle className="w-5 h-5" />
    case 'happy':
    case 'content':
      return <Smile className="w-5 h-5" />
    case 'attention':
    case 'attention-seeking':
      return <Eye className="w-5 h-5" />
    default:
      return <Baby className="w-5 h-5" />
  }
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency.toLowerCase()) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
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

export function TranslationResult({ analysis, audioData, onSave }: TranslationResultProps) {
  if (!analysis) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Baby className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Record your baby's sounds to see the translation</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto animate-slide-up">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getCryTypeIcon(analysis.type)}
            Baby Translation
          </CardTitle>
          {audioData && (
            <Button variant="outline" size="sm" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Cry Type and Urgency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`${getCryTypeColor(analysis.type)} font-medium`}
            >
              {analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Urgency:</span>
              <div className={`w-3 h-3 rounded-full ${getUrgencyColor(analysis.urgency)}`} />
              <span className="text-sm font-medium capitalize">{analysis.urgency}</span>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confidence</span>
            <span className="text-sm text-muted-foreground">{analysis.confidence}%</span>
          </div>
          <Progress value={analysis.confidence} className="h-2" />
        </div>

        {/* Suggested Action */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Suggested Action
          </h4>
          <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/10">
            {analysis.action}
          </p>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-accent" />
            Analysis
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.explanation}
          </p>
        </div>

        {/* Quick Tips */}
        <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
          <h5 className="font-medium text-sm mb-2 text-accent-foreground">💡 Quick Tips</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            {analysis.type.toLowerCase() === 'hunger' && (
              <>
                <li>• Check if it's been 2-3 hours since last feeding</li>
                <li>• Look for rooting or sucking motions</li>
              </>
            )}
            {analysis.type.toLowerCase() === 'sleepy' && (
              <>
                <li>• Create a calm, dimly lit environment</li>
                <li>• Try gentle rocking or swaddling</li>
              </>
            )}
            {analysis.type.toLowerCase() === 'pain' && (
              <>
                <li>• Check for signs of discomfort (gas, diaper)</li>
                <li>• Consider consulting a pediatrician if persistent</li>
              </>
            )}
            {!['hunger', 'sleepy', 'pain'].includes(analysis.type.toLowerCase()) && (
              <>
                <li>• Stay calm and respond with gentle comfort</li>
                <li>• Try skin-to-skin contact or soft talking</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}