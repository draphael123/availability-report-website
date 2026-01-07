'use client'

import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorStateProps {
  error: string
  troubleshooting?: string[]
  onRetry: () => void
  isLoading?: boolean
}

export function ErrorState({
  error,
  troubleshooting,
  onRetry,
  isLoading,
}: ErrorStateProps) {
  return (
    <Card className="max-w-2xl mx-auto mt-12">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <CardTitle>Unable to Load Data</CardTitle>
            <CardDescription>
              There was a problem fetching the spreadsheet data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <code className="text-sm text-destructive break-all">{error}</code>
        </div>

        {troubleshooting && troubleshooting.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Troubleshooting Steps</h4>
            <ul className="space-y-2">
              {troubleshooting.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onRetry} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Retrying...' : 'Retry'}
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Cloud Console
            </a>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <strong>Quick fixes:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Ensure the Google Sheet is shared publicly (Anyone with link can view)</li>
            <li>Or add a valid <code className="bg-muted px-1 rounded">GOOGLE_SHEETS_API_KEY</code> environment variable</li>
            <li>Verify Sheet ID and GID are correct in environment variables</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

