import React, { useMemo, useState } from 'react';
import { Exercise, PrescriptionParams } from '@/types/medical.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExerciseSearch } from '@/app/dashboard/doctor/ExerciseSearch';

interface Props {
  exercise: Exercise;
  confidence?: number; // 0-1
  reasoning?: string;
  onAccept?: () => Promise<void> | void;
  onModify?: (params: PrescriptionParams, newExercise?: Exercise) => Promise<void> | void;
}

export function RecommendationCard({ exercise, confidence, reasoning, onAccept, onModify }: Props) {
  const [editing, setEditing] = useState(false);
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

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        {selectedExercise.imageUrl ? (
          <img src={selectedExercise.imageUrl} alt={selectedExercise.name} className="w-20 h-20 object-cover rounded" />
        ) : (
          <div className="w-20 h-20 rounded bg-white/10 flex items-center justify-center text-white/50 text-xs">No Image</div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{selectedExercise.name}</h3>
            {typeof confidence === 'number' && (
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/80">AI Confidence: {(confidence * 100).toFixed(0)}%</span>
            )}
          </div>
          <p className="text-sm text-white/80 mt-1">{selectedExercise.description}</p>
          {reasoning && (
            <p className="text-xs text-white/60 mt-2">Reasoning: {reasoning}</p>
          )}
          {!editing ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/60">Sets</p>
                <p className="font-medium">{selectedExercise.defaultSets}</p>
              </div>
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/60">Reps</p>
                <p className="font-medium">{selectedExercise.defaultReps}</p>
              </div>
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/60">Frequency</p>
                <p className="font-medium">{selectedExercise.defaultFrequency}</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Selected exercise</p>
                  <p className="text-sm font-medium">{selectedExercise.name}</p>
                </div>
                <Button variant="secondary" onClick={() => setShowSearch((s) => !s)} className="rounded-full bg-white/10 hover:bg-white/20 border-white/10 text-white">
                  {showSearch ? 'Close' : 'Change exercise'}
                </Button>
              </div>
              {showSearch && (
                <div className="col-span-2">
                  <ExerciseSearch onSelect={(ex) => { setSelectedExercise(ex); setShowSearch(false); }} />
                </div>
              )}
              <div>
                <Label className="text-white/80">Sets</Label>
                <Select value={String(params.sets)} onValueChange={(v) => setParams({ ...params, sets: Number(v) })}>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/10 text-white"><SelectValue placeholder="Sets" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80">Reps</Label>
                <Input type="number" min={1} max={50} value={params.reps} onChange={(e) => setParams({ ...params, reps: Number(e.target.value) })} className="mt-1 bg-white/10 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/80">Frequency</Label>
                <Select value={params.frequency} onValueChange={(v) => setParams({ ...params, frequency: v })}>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/10 text-white"><SelectValue placeholder="Frequency" /></SelectTrigger>
                  <SelectContent>
                    {['Daily','3x/week','2x/week','Weekly'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80">Duration (weeks)</Label>
                <Input type="number" min={2} max={12} value={params.durationWeeks} onChange={(e) => setParams({ ...params, durationWeeks: Number(e.target.value) })} className="mt-1 bg-white/10 border-white/10 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-white/80">Instructions</Label>
                <Input value={params.instructions} onChange={(e) => setParams({ ...params, instructions: e.target.value })} placeholder="Optional special instructions" className="mt-1 bg-white/10 border-white/10 text-white" />
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            {!editing ? (
              <>
                <Button onClick={() => onAccept && onAccept()} className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Accept</Button>
                <Button variant="secondary" onClick={() => setEditing(true)} className="rounded-full bg-white/10 hover:bg-white/20 border-white/10 text-white">Edit</Button>
              </>
            ) : (
              <>
                <Button disabled={!canSave} onClick={() => onModify && onModify(params, selectedExercise)} className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50">Save</Button>
                <Button variant="secondary" onClick={() => setEditing(false)} className="rounded-full bg-white/10 hover:bg-white/20 border-white/10 text-white">Cancel</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


