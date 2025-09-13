import React, { useMemo, useState } from 'react';
import { Exercise, PrescriptionParams } from '@/types/medical.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExerciseSearch } from '@/components/ExerciseDatabase/ExerciseSearch';
import { BioDigitalViewer } from '@/components/BioDigitalViewer';

interface Props {
  exercise: Exercise;
  confidence?: number; // 0-1
  reasoning?: string | object;
  initialEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onSave?: (params: PrescriptionParams, newExercise?: Exercise) => Promise<void> | void;
  cachedModelUrl?: string; // Optional cached BioDigital model URL
  sessionId?: string; // Session ID to save URLs to database
  isSaving?: boolean; // Loading state for save operation
}

export function RecommendationCard({ exercise, confidence, reasoning, initialEditing = false, onEditingChange, onSave, cachedModelUrl, sessionId, isSaving = false }: Props) {
  const [editing, setEditing] = useState(initialEditing);
  const [params, setParams] = useState<PrescriptionParams>({
    sets: exercise.defaultSets,
    reps: exercise.defaultReps,
    frequency: exercise.defaultFrequency,
    durationWeeks: 4,
    instructions: '',
  });
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercise);
  const [showSearch, setShowSearch] = useState(false);

  const canSave = useMemo(() => params.sets >= 1 && params.sets <= 5 && params.reps >= 1 && params.reps <= 50 && params.durationWeeks >= 2 && params.durationWeeks <= 12, [params]);

  // Sync editing state with parent
  React.useEffect(() => {
    setEditing(initialEditing);
  }, [initialEditing]);

  const handleCancel = () => {
    setEditing(false);
    onEditingChange?.(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-[auto_1fr_200px] gap-4 items-start">
        {/* Exercise Image */}
        {selectedExercise.imageUrl ? (
          <img src={selectedExercise.imageUrl} alt={selectedExercise.name} className="w-16 h-16 object-cover rounded-lg" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>
        )}
        
        {/* Exercise Info */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedExercise.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedExercise.description}</p>
            </div>
            {typeof confidence === 'number' && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 flex-shrink-0">AI: {(confidence * 100).toFixed(0)}%</span>
            )}
          </div>
          {reasoning && (
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-medium">Reasoning:</span> {typeof reasoning === 'string' ? reasoning : JSON.stringify(reasoning)}
            </p>
          )}
          {!editing ? (
            <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Sets</p>
                <p className="font-semibold text-gray-900">{selectedExercise.defaultSets}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Reps</p>
                <p className="font-semibold text-gray-900">{selectedExercise.defaultReps}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Frequency</p>
                <p className="font-semibold text-gray-900 text-xs">{selectedExercise.defaultFrequency}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Duration</p>
                <p className="font-semibold text-gray-900">4 weeks</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Selected exercise</p>
                  <p className="text-sm font-medium">{selectedExercise.name}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSearch((s) => !s)} 
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  data-change-exercise
                >
                  {showSearch ? 'Close' : 'Change exercise'}
                </Button>
              </div>
              {showSearch && (
                <div>
                  <ExerciseSearch onSelect={(ex: Exercise) => { setSelectedExercise(ex); setShowSearch(false); }} />
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-gray-700 font-medium">Sets</Label>
                  <Select value={String(params.sets)} onValueChange={(v) => setParams({ ...params, sets: Number(v) })}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue placeholder="Sets" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-700 font-medium">Reps</Label>
                  <Input type="number" min={1} max={50} value={params.reps} onChange={(e) => setParams({ ...params, reps: Number(e.target.value) })} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-gray-700 font-medium">Frequency</Label>
                  <Select value={params.frequency} onValueChange={(v) => setParams({ ...params, frequency: v })}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Daily','3x/week','2x/week','Weekly'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-700 font-medium">Duration</Label>
                  <Input type="number" min={2} max={12} value={params.durationWeeks} onChange={(e) => setParams({ ...params, durationWeeks: Number(e.target.value) })} className="mt-1 h-8 text-sm" placeholder="weeks" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-700 font-medium">Instructions</Label>
                <Input value={params.instructions} onChange={(e) => setParams({ ...params, instructions: e.target.value })} placeholder="Optional special instructions" className="mt-1 h-8 text-sm" />
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="text-gray-600 border-gray-300 hover:bg-gray-50">Edit</Button>
            ) : (
              <>
                <Button
                  size="sm"
                  disabled={!canSave || isSaving}
                  onClick={async () => {
                    if (onSave) {
                      await onSave(params, selectedExercise);
                      setEditing(false);
                      onEditingChange?.(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="text-gray-600 border-gray-300 hover:bg-gray-50">Cancel</Button>
              </>
            )}
          </div>
        </div>
        
        {/* BioDigital 3D Preview */}
        <div className="w-full">
          <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">3D Preview</div>
          <BioDigitalViewer 
            className="aspect-square w-full"
            problematicAreas={[
              {
                name: selectedExercise.name,
                description: selectedExercise.description,
                severity: 'medium'
              }
            ]}
            patientId="exercise-preview"
            patientInfo={{
              name: selectedExercise.name,
              injuryType: selectedExercise.bodyPart,
              aiAnalysis: selectedExercise.description
            }}
          />
        </div>
      </div>
    </div>
  );
}


