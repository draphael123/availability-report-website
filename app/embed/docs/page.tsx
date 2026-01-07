'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export default function EmbedDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://oncehub-availability-report.vercel.app'

  const widgets = [
    {
      id: 'status',
      name: 'Status Widget',
      description: 'Overall system status with key metrics',
      params: '?type=status',
      width: 300,
      height: 140,
    },
    {
      id: 'stats',
      name: 'Stats Widget',
      description: 'Detailed statistics breakdown',
      params: '?type=stats',
      width: 280,
      height: 180,
    },
    {
      id: 'best',
      name: 'Best Performers',
      description: 'Top 5 links with shortest wait times',
      params: '?type=best',
      width: 280,
      height: 200,
    },
    {
      id: 'worst',
      name: 'Needs Attention',
      description: 'Top 5 links with longest wait times',
      params: '?type=worst',
      width: 280,
      height: 200,
    },
    {
      id: 'mini',
      name: 'Mini Badge',
      description: 'Compact status badge for inline use',
      params: '?type=mini',
      width: 120,
      height: 30,
    },
  ]

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getIframeCode = (widget: typeof widgets[0], theme: string = 'dark') => {
    return `<iframe
  src="${baseUrl}/embed${widget.params}&theme=${theme}"
  width="${widget.width}"
  height="${widget.height}"
  frameborder="0"
  style="border-radius: 8px; overflow: hidden;"
></iframe>`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">Embed Widgets</h1>
            <p className="text-muted-foreground">
              Add Oncehub availability widgets to your own sites
            </p>
          </div>
        </div>

        {/* Widget Previews */}
        <div className="space-y-6">
          {widgets.map((widget) => (
            <Card key={widget.id} className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-purple-500" />
                      {widget.name}
                    </CardTitle>
                    <CardDescription>{widget.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {widget.width}×{widget.height}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="dark">Dark Code</TabsTrigger>
                    <TabsTrigger value="light">Light Code</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview">
                    <div className="flex flex-wrap gap-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Dark Theme</p>
                        <iframe
                          src={`/embed${widget.params}&theme=dark`}
                          width={widget.width}
                          height={widget.height}
                          className="rounded-lg border"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Light Theme</p>
                        <iframe
                          src={`/embed${widget.params}&theme=light`}
                          width={widget.width}
                          height={widget.height}
                          className="rounded-lg border"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="dark">
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-slate-950 text-sm text-gray-300 overflow-x-auto">
                        {getIframeCode(widget, 'dark')}
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(getIframeCode(widget, 'dark'), `${widget.id}-dark`)}
                      >
                        {copiedId === `${widget.id}-dark` ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="light">
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-slate-950 text-sm text-gray-300 overflow-x-auto">
                        {getIframeCode(widget, 'light')}
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(getIframeCode(widget, 'light'), `${widget.id}-light`)}
                      >
                        {copiedId === `${widget.id}-light` ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Parameters */}
        <Card className="glass mt-8">
          <CardHeader>
            <CardTitle>URL Parameters</CardTitle>
            <CardDescription>Customize your widgets with query parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-muted text-sm">type</code>
                  <span className="text-sm text-muted-foreground">
                    Widget type: status, stats, best, worst, mini
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-muted text-sm">theme</code>
                  <span className="text-sm text-muted-foreground">
                    Color theme: dark, light
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-muted text-sm">category</code>
                  <span className="text-sm text-muted-foreground">
                    Filter by category: all, HRT, TRT, Provider
                  </span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">Example</p>
                <code className="text-xs text-purple-400">
                  {baseUrl}/embed?type=status&theme=dark&category=HRT
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

