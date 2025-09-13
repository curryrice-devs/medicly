import React, { useMemo, useState } from 'react';
import { Exercise, PrescriptionParams } from '@/types/medical.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExerciseSearch } from '@/components/ExerciseDatabase/ExerciseSearch';

interface Props {
  exercise: Exercise;
  confidence?: number; // 0-1
  reasoning?: string | object;
  initialEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onAccept?: () => Promise<void> | void;
  onModify?: (params: PrescriptionParams, newExercise?: Exercise) => Promise<void> | void;
}

export function RecommendationCard({ exercise, confidence, reasoning, initialEditing = false, onEditingChange, onAccept, onModify }: Props) {
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
      <div className="flex items-start gap-3">
        {selectedExercise.imageUrl ? (
          <img src={selectedExercise.imageUrl} alt={selectedExercise.name} className="w-16 h-16 object-cover rounded-lg" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{selectedExercise.name}</h3>
            {typeof confidence === 'number' && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">AI Confidence: {(confidence * 100).toFixed(0)}%</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{selectedExercise.description}</p>
          {reasoning && (
            <p className="text-xs text-gray-500 mt-2">
              Reasoning: {typeof reasoning === 'string' ? reasoning : JSON.stringify(reasoning)}
            </p>
          )}
          {!editing ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Sets</p>
                <p className="font-semibold text-gray-900">{selectedExercise.defaultSets}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Reps</p>
                <p className="font-semibold text-gray-900">{selectedExercise.defaultReps}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Frequency</p>
                <p className="font-semibold text-gray-900">{selectedExercise.defaultFrequency}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Duration</p>
                <p className="font-semibold text-gray-900">4 weeks</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Selected exercise</p>
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
                <div className="col-span-2">
                  <ExerciseSearch onSelect={(ex: Exercise) => { setSelectedExercise(ex); setShowSearch(false); }} />
                </div>
              )}
              <div>
                <Label className="text-gray-700 text-sm font-medium">Sets</Label>
                <Select value={String(params.sets)} onValueChange={(v) => setParams({ ...params, sets: Number(v) })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sets" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">Reps</Label>
                <Input type="number" min={1} max={50} value={params.reps} onChange={(e) => setParams({ ...params, reps: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">Frequency</Label>
                <Select value={params.frequency} onValueChange={(v) => setParams({ ...params, frequency: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Daily','3x/week','2x/week','Weekly'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">Duration (weeks)</Label>
                <Input type="number" min={2} max={12} value={params.durationWeeks} onChange={(e) => setParams({ ...params, durationWeeks: Number(e.target.value) })} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-700 text-sm font-medium">Instructions</Label>
                <Input value={params.instructions} onChange={(e) => setParams({ ...params, instructions: e.target.value })} placeholder="Optional special instructions" className="mt-1" />
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            {!editing ? (
              <>
                <Button onClick={() => onAccept && onAccept()} className="bg-green-600 hover:bg-green-700 text-white">Accept</Button>
                <Button variant="outline" onClick={() => setEditing(true)} className="text-gray-600 border-gray-300 hover:bg-gray-50">Edit</Button>
              </>
            ) : (
              <>
                <Button disabled={!canSave} onClick={() => onModify && onModify(params, selectedExercise)} className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">Save</Button>
                <Button variant="outline" onClick={handleCancel} className="text-gray-600 border-gray-300 hover:bg-gray-50">Cancel</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


