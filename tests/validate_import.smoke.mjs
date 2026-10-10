import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../auth.js', import.meta.url), 'utf8');
const start = source.indexOf('function isPlainObject(value)');
const end = source.indexOf('async function getServerSnapshot(userId, migrationKey)');
assert.ok(start >= 0 && end > start, 'validator functions should exist');
const validatorBlock = source.slice(start, end);
const factory = new Function('validMuscles', 'validDays', 'builtinExerciseIds', `${validatorBlock}\nreturn { validateLocalPayload, calculateCounts };`);
const { validateLocalPayload, calculateCounts } = factory(
  new Set(['Cardio', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core']),
  new Set(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']),
  new Set(['ex_treadmill', 'ex_cycling'])
);

const validPayload = {
  settings: { userName: 'GYMFlow User', age: 25, height: 170, weight: 65, theme: 'dark', language: 'id', heightUnit: 'cm', weightUnit: 'kg', restSeconds: 90, weeklyGoal: 4 },
  exercises: [
    { id: 'ex_treadmill', name: 'Treadmill', muscle: 'Cardio', equipment: 'Machine', isCustom: false },
    { id: 'gf_custom_1', name: 'Cable Row Custom', muscle: 'Back', equipment: 'Cable', isCustom: true }
  ],
  routines: [{
    id: 'gf_routine_1', name: 'Cardio + Back', description: '', days: ['Sen'],
    exerciseIds: ['ex_treadmill', 'gf_custom_1'],
    exercises: [
      { id: 'ex_treadmill', sets: [{ reps: 15, weight: 2 }] },
      { id: 'gf_custom_1', sets: [{ reps: 10, weight: 20 }] }
    ]
  }],
  history: [{
    id: 'gf_session_1', routineId: 'gf_routine_1', startedAt: '2026-10-01T10:00:00.000Z', endedAt: '2026-10-01T10:30:00.000Z', duration: 1800,
    exercises: [{ exerciseId: 'ex_treadmill', notes: '', sets: [{ reps: 15, weight: 2, completedAt: '2026-10-01T10:15:00.000Z' }] }]
  }],
  activeSession: null,
  weightHistory: [{ date: '2026-10-01', weight: 65 }]
};

assert.deepEqual(validateLocalPayload(validPayload), [], 'valid source payload passes validation');
assert.deepEqual(calculateCounts(validPayload), {
  customExercises: 1, routines: 1, completedSessions: 1, activeSessions: 0, weightRecords: 1
});

const invalidDatePayload = structuredClone(validPayload);
invalidDatePayload.weightHistory[0].date = '2026-02-31';
assert.ok(validateLocalPayload(invalidDatePayload).some(message => message.includes('Tanggal catatan berat')), 'impossible calendar date is rejected');

const duplicateSessionPayload = structuredClone(validPayload);
duplicateSessionPayload.activeSession = { ...duplicateSessionPayload.history[0] };
assert.ok(validateLocalPayload(duplicateSessionPayload).some(message => message.includes('ID sesi duplikat')), 'duplicate legacy session id is rejected');

const invalidExercisePayload = structuredClone(validPayload);
invalidExercisePayload.exercises[1].muscle = 'Dumbbell';
assert.ok(validateLocalPayload(invalidExercisePayload).some(message => message.includes('Target otot exercise custom')), 'invalid custom muscle category is rejected');

const missingCustomPayload = structuredClone(validPayload);
missingCustomPayload.history[0].exercises[0].exerciseId = 'gf_deleted_custom';
assert.ok(validateLocalPayload(missingCustomPayload).some(message => message.includes('tidak ada di daftar exercise lokal')), 'missing custom exercise reference is blocked');

const builtinOmittedPayload = structuredClone(validPayload);
builtinOmittedPayload.exercises = builtinOmittedPayload.exercises.filter(exercise => exercise.id !== 'ex_treadmill');
assert.deepEqual(validateLocalPayload(builtinOmittedPayload), [], 'known built-in exercise ID is still allowed when absent in older local snapshots');

console.log('PASS: valid payload, preview counts, invalid date, duplicate session ID, invalid custom muscle, missing custom reference, and built-in fallback checks.');
