'use client'

import { useState } from 'react'
import { Send, MessageSquarePlus, CheckCircle2, Lightbulb, Bug, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type SuggestionType = 'feature' | 'bug' | 'improvement' | 'other'

interface SuggestionForm {
  type: SuggestionType
  message: string
  email: string
}

const suggestionTypes: { value: SuggestionType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'feature', label: 'Feature Request', icon: <Sparkles className="h-4 w-4" />, color: 'from-purple-500 to-pink-500' },
  { value: 'bug', label: 'Bug Report', icon: <Bug className="h-4 w-4" />, color: 'from-red-500 to-orange-500' },
  { value: 'improvement', label: 'Improvement', icon: <Lightbulb className="h-4 w-4" />, color: 'from-amber-500 to-yellow-500' },
  { value: 'other', label: 'Other', icon: <MessageSquarePlus className="h-4 w-4" />, color: 'from-blue-500 to-cyan-500' },
]

export function SuggestionsBox() {
  const [form, setForm] = useState<SuggestionForm>({
    type: 'feature',
    message: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.message.trim()) {
      setError('Please enter a message')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // In a real app, this would send to an API endpoint
      // For now, we'll simulate a submission and log to console
      console.log('Suggestion submitted:', form)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsSubmitted(true)
      setForm({ type: 'feature', message: '', email: '' })
      
      // Reset after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = suggestionTypes.find(t => t.value === form.type)

  return (
    <Card className="glass border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
            <MessageSquarePlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-gradient-primary">Share Your Feedback</CardTitle>
            <CardDescription>
              Have a suggestion or found an issue? We'd love to hear from you!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-count">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Thank You!
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Your feedback has been received. We appreciate your input!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Suggestion Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">What type of feedback?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {suggestionTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: type.value }))}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium",
                      form.type === type.value
                        ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg`
                        : "border-border hover:border-purple-300 dark:hover:border-purple-700 bg-card/50"
                    )}
                  >
                    {type.icon}
                    <span className="hidden sm:inline">{type.label}</span>
                    <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Your {selectedType?.label || 'Message'}
              </Label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder={
                  form.type === 'feature' 
                    ? "Describe the feature you'd like to see..."
                    : form.type === 'bug'
                    ? "Describe the bug and steps to reproduce..."
                    : form.type === 'improvement'
                    ? "What could we improve and how?"
                    : "Share your thoughts..."
                }
                className={cn(
                  "w-full min-h-[120px] px-4 py-3 rounded-xl border-2 bg-card/50 resize-none transition-all duration-200",
                  "focus:outline-none focus:border-purple-400 dark:focus:border-purple-600",
                  "placeholder:text-muted-foreground/50"
                )}
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-muted-foreground font-normal">(optional, for follow-up)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="rounded-xl border-2 bg-card/50 focus:border-purple-400 dark:focus:border-purple-600"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !form.message.trim()}
              className={cn(
                "w-full gradient-primary text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your feedback helps us improve this dashboard for everyone.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}



