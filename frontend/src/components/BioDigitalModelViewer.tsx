'use client';

import React, { useState, useEffect } from 'react';
import { Eye, ExternalLink, Loader2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIAnalysisData } from '@/types/ai-analysis.types';
import { matchBioDigitalModel, ModelMatch, formatModelMatch } from '@/lib/biodigital-model-matcher';

interface BioDigitalModelViewerProps {
  aiAnalysis: AIAnalysisData;
  className?: string;
}

export function BioDigitalModelViewer({ aiAnalysis, className = '' }: BioDigitalModelViewerProps) {
  const [modelMatch, setModelMatch] = useState<ModelMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(true); // Always show preview by default

  useEffect(() => {
    async function loadModelMatch() {
      try {
        setIsLoading(true);
        setError(null);
        
        const match = await matchBioDigitalModel(aiAnalysis);
        setModelMatch(match);
      } catch (err) {
        console.error('Failed to match BioDigital model:', err);
        setError(err instanceof Error ? err.message : 'Failed to load anatomical model');
      } finally {
        setIsLoading(false);
      }
    }

    if (aiAnalysis?.summary) {
      loadModelMatch();
    }
  }, [aiAnalysis]);

  const handleOpenViewer = () => {
    if (modelMatch?.model.viewerUrl) {
      window.open(modelMatch.model.viewerUrl, '_blank', 'width=1200,height=800');
    }
  };

  const handleToggleEmbeddedViewer = () => {
    setShowViewer(!showViewer);
  };

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Finding best anatomical model...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 border-orange-200 bg-orange-50 ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-orange-900 mb-1">Model Loading Failed</h4>
            <p className="text-sm text-orange-700">{error}</p>
            <p className="text-xs text-orange-600 mt-1">
              Anatomical visualization is temporarily unavailable
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!modelMatch) {
    return null; // Don't show anything if no match
  }

  // Don't show if confidence is too low (poor match)
  if (modelMatch.confidence < 0.3) {
    return null;
  }

  return (
    <div className={className}>
      <Card className="p-4 border-green-200 bg-green-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start">
            <Eye className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">
                3D Anatomical Model
              </h4>
              <h5 className="font-medium text-green-800 mb-2">
                {modelMatch.model.name}
              </h5>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleOpenViewer}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open 3D Model
          </Button>
        </div>

        {/* Always show the 3D model preview */}
        {modelMatch.model.viewerUrl && (
          <div className="border border-green-200 rounded-lg overflow-hidden bg-white">
            <div className="bg-green-100 px-3 py-2 text-xs text-green-700 border-b border-green-200 flex items-center justify-between">
              <span>Interactive 3D Anatomical Model - Use mouse to rotate and zoom</span>
              <Button
                onClick={handleToggleEmbeddedViewer}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-green-700 hover:bg-green-200"
              >
                {showViewer ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showViewer && (
              <>
                <iframe
                  src={modelMatch.model.viewerUrl}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  className="block"
                  title={`3D Model: ${modelMatch.model.name}`}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
                <div className="px-3 py-2 bg-gray-50 border-t border-green-200">
                  <p className="text-xs text-gray-600 break-all">
                    <strong>Model URL:</strong> {modelMatch.model.viewerUrl}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
