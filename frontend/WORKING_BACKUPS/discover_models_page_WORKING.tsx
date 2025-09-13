'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, Search, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface DiscoveredModel {
  id: string
  name: string
  source: string
  viewerUrl: string
  accessible: boolean
  thumbnail?: string
  type?: string
  flags?: any
  teams?: any[]
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
      console.log('🔍 Starting comprehensive model discovery...')
      
      // Use the comprehensive discovery endpoint that tests multiple methods
      const response = await fetch('/api/biodigital/discover-models')
      const data = await response.json()
      
      console.log('📊 Discovery results:', data)
      setResults(data)
      
      if (data.discoveredModels && data.discoveredModels.length > 0) {
        console.log(`✅ Found ${data.discoveredModels.length} models`)
      }
    } catch (error) {
      console.error('Failed to discover models:', error)
      
      // Create error results
      setResults({
        success: false,
        discoveredModels: [],
        methods: [],
        summary: {
          totalFound: 0,
          workingModels: 0,
          failedModels: 0
        },
        recommendations: ['Error occurred during discovery. Please try again.'],
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const testModel = (modelId: string) => {
    setSelectedModel(modelId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 BioDigital Model Discovery System
          </h1>
          <p className="text-gray-600 mb-4">
            Comprehensive discovery system that finds all models in your BioDigital library using multiple detection methods including pattern testing, Content API scanning, and metadata analysis.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">🎯 Discovery Methods:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Content API</strong> - Tests multiple API endpoint variations</li>
              <li>• <strong>Pattern Testing</strong> - Tests 30+ model ID patterns based on your known models</li>
              <li>• <strong>Metadata Analysis</strong> - Analyzes working models for references to other models</li>
            </ul>
          </div>
        </div>

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
                Discovering Models...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Start Comprehensive Discovery
              </>
            )}
          </Button>
          
          {results && (
            <Button 
              onClick={discoverModels} 
              disabled={loading}
              variant="outline"
              size="lg"
              className="ml-4"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Refresh Discovery
            </Button>
          )}
        </div>

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
                    <div className="text-3xl font-bold text-green-600">{results.summary.totalFound}</div>
                    <div className="text-sm text-green-700">Models Found</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{results.summary.workingModels}</div>
                    <div className="text-sm text-blue-700">Working Models</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-600">{results.summary.failedModels}</div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {results.discoveredModels.map((model) => (
                      <div
                        key={model.id}
                        className="border rounded-xl p-4 hover:shadow-lg transition-all duration-200 bg-white"
                      >
                        {/* Model Thumbnail */}
                        {model.thumbnail && (
                          <div className="mb-3">
                            <img
                              src={model.thumbnail}
                              alt={model.name}
                              className="w-full h-24 object-cover rounded-lg bg-gray-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-gray-900">{model.id}</h3>
                          {model.accessible ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">{model.name}</h4>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {model.source}
                          </Badge>
                          {model.type && (
                            <Badge variant="outline" className="text-xs">
                              {model.type}
                            </Badge>
                          )}
                          {model.flags?.is_animated && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              ▶️
                            </Badge>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => testModel(model.id)}
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
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
                      <strong> Status:</strong> {results.discoveredModels.find(m => m.id === selectedModel)?.accessible ? 'Accessible' : 'Not Accessible'} |
                      <strong> Source:</strong> {results.discoveredModels.find(m => m.id === selectedModel)?.source}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discovery Methods */}
            <Card>
              <CardHeader>
                <CardTitle>🔬 Discovery Methods Results</CardTitle>
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
                        {method.hasModels && (
                          <span className="text-xs text-green-600 ml-2">✅ Found models</span>
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

        {/* No Results Message */}
        {results && results.discoveredModels.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Models Found</h3>
              <p className="text-gray-600 mb-4">
                The discovery system didn't find any accessible models. This could mean:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Your BioDigital library might be empty</li>
                <li>• API credentials may need Content API permissions</li>
                <li>• Network connectivity issues</li>
              </ul>
              <Button onClick={discoverModels} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}