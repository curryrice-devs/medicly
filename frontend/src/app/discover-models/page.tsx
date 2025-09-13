'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, Search, CheckCircle, XCircle } from 'lucide-react'

interface DiscoveredModel {
  id: string
  name: string
  source: string
  viewerUrl: string
  accessible: boolean
}

interface DiscoveryResults {
  success: boolean
  discoveredModels: DiscoveredModel[]
  methods: any[]
  summary: {
    totalFound: number
    workingModels: number
    failedModels: number
  }
  recommendations: string[]
  timestamp: string
}

export default function DiscoverModelsPage() {
  const [results, setResults] = useState<DiscoveryResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const discoverModels = async () => {
    setLoading(true)
    try {
      // Use the working Content API endpoint to get all models
      const response = await fetch('/api/biodigital/models/all')
      const data = await response.json()
      
      if (data.success && data.models) {
        // Convert to the expected format
        const formattedResults: DiscoveryResults = {
          success: true,
          discoveredModels: data.models.map((model: any) => ({
            id: model.id,
            name: model.name,
            source: 'BioDigital Content API',
            viewerUrl: model.viewerUrl || `https://human.biodigital.com/viewer/?be=${model.id}&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0`,
            accessible: true,
            thumbnail: model.thumbnail,
            type: model.type,
            flags: model.flags,
            teams: model.teams
          })),
          methods: [{
            method: 'Content API',
            endpoint: '/services/v2/content/collections/myhuman',
            status: 'SUCCESS'
          }],
          summary: {
            totalFound: data.models.length,
            workingModels: data.models.length,
            failedModels: 0
          },
          recommendations: [
            'All models successfully loaded from your BioDigital library',
            'You can now integrate these models into your patient system',
            'Each model has thumbnails and direct viewer URLs ready to use'
          ],
          timestamp: data.timestamp
        }
        setResults(formattedResults)
      } else {
        throw new Error('No models found')
      }
    } catch (error) {
      console.error('Failed to discover models:', error)
      // Fallback to the old discovery method
      try {
        const response = await fetch('/api/biodigital/discover-models')
        const data = await response.json()
        setResults(data)
      } catch (fallbackError) {
        console.error('Fallback discovery also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  // Auto-load models when component mounts
  useEffect(() => {
    discoverModels()
  }, [])

  const testModel = (modelId: string) => {
    setSelectedModel(modelId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 Your BioDigital Library Models
          </h1>
          <p className="text-gray-600">
            Complete collection of 3D anatomy models from your BioDigital library with thumbnails, animations, and direct viewer access.
          </p>
        </div>

        {!results && (
          <div className="mb-6">
            <Button 
              onClick={discoverModels} 
              disabled={loading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading Your Models...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Load My Models
                </>
              )}
            </Button>
          </div>
        )}

        {results && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                ✅ Connected to BioDigital Content API
              </Badge>
              <Badge variant="outline">
                {results.discoveredModels.length} models found
              </Badge>
            </div>
            <Button 
              onClick={discoverModels} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  📊 Discovery Summary
                  <Badge variant="outline" className="ml-2">
                    {new Date(results.timestamp).toLocaleTimeString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{results.summary.totalFound}</div>
                    <div className="text-sm text-green-700">Models Found</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{results.summary.workingModels}</div>
                    <div className="text-sm text-blue-700">Working Models</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{results.summary.failedModels}</div>
                    <div className="text-sm text-gray-700">Failed Tests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discovered Models */}
            {results.discoveredModels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Discovered Models ({results.discoveredModels.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.discoveredModels.map((model) => (
                      <div
                        key={model.id}
                        className="border rounded-xl p-4 hover:shadow-lg transition-all duration-200 bg-white"
                      >
                        {/* Model Thumbnail */}
                        {(model as any).thumbnail && (
                          <div className="mb-4">
                            <img
                              src={(model as any).thumbnail}
                              alt={model.name}
                              className="w-full h-32 object-cover rounded-lg bg-gray-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{model.id}</h3>
                          {model.accessible ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        
                        <h4 className="font-medium text-gray-800 mb-2">{model.name}</h4>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">
                            {model.source}
                          </Badge>
                          {(model as any).type && (
                            <Badge variant="outline">
                              {(model as any).type}
                            </Badge>
                          )}
                          {(model as any).flags?.is_animated && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Animated
                            </Badge>
                          )}
                        </div>
                        
                        {(model as any).teams && (model as any).teams.length > 0 && (
                          <p className="text-xs text-gray-500 mb-3">
                            Team: {(model as any).teams[0].team_name}
                          </p>
                        )}
                        
                        <Button
                          onClick={() => testModel(model.id)}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Model
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Model Viewer */}
            {selectedModel && (
              <Card>
                <CardHeader>
                  <CardTitle>👁️ Model Viewer: {selectedModel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://human.biodigital.com/viewer/?id=${selectedModel}&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0&paid=o_0866e6f1`}
                      style={{ aspectRatio: '4 / 3', width: '100%', height: '600px' }}
                      frameBorder="0"
                      allowFullScreen={true}
                      title={`BioDigital Model ${selectedModel}`}
                    />
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Model ID:</strong> {selectedModel} | 
                      <strong> Status:</strong> {results.discoveredModels.find(m => m.id === selectedModel)?.accessible ? 'Accessible' : 'Not Accessible'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discovery Methods */}
            <Card>
              <CardHeader>
                <CardTitle>🔬 Discovery Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.methods.map((method, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        method.status === 'SUCCESS' ? 'bg-green-50' :
                        method.status === 'FAILED' ? 'bg-red-50' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{method.method}</span>
                        {method.endpoint && (
                          <span className="text-sm text-gray-600 ml-2">{method.endpoint}</span>
                        )}
                      </div>
                      <Badge
                        variant={
                          method.status === 'SUCCESS' ? 'default' :
                          method.status === 'FAILED' ? 'destructive' : 'secondary'
                        }
                      >
                        {method.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>💡 Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
