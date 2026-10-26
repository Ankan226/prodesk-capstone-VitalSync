'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/helpers';

interface Suggestion {
  urgent: boolean;
  specialty: string | null;
  reason: string;
  advice: string;
  disclaimer: string;
}

interface Props {
  onPickSpecialty: (specialty: string) => void;
  onUseReason: (reason: string) => void;
}

export default function AiAssistant({ onPickSpecialty, onUseReason }: Props) {
  const [open, setOpen] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Suggestion | null>(null);
  const [note, setNote] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setNote('');
    setResult(null);
    if (symptoms.trim().length < 5) return setError('Describe your symptoms in a few words first');

    setLoading(true);
    try {
      const data = await api<{ suggestion: Suggestion }>('/api/ai/suggest', {
        method: 'POST',
        body: { symptoms: symptoms.trim() },
      });
      setResult(data.suggestion);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-4 rounded border border-blue-200 bg-blue-50 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-sm font-semibold text-blue-800">
        {open ? 'Hide AI assistant' : 'Not sure which doctor to see? Ask the AI assistant'}
      </button>

      {open && (
        <form onSubmit={onSubmit} className="mt-3">
          <label htmlFor="symptoms" className="mb-1 block text-sm font-medium">Describe how you feel</label>
          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="For example: I get a tight feeling in my chest when I climb stairs"
            className="mb-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          />
          <p className="mb-2 text-xs text-gray-600">Use made-up details only. Do not enter real personal or medical information.</p>
          <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {loading ? 'Thinking...' : 'Suggest'}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {result && result.urgent && (
            <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
              {result.advice}
            </p>
          )}

          {result && !result.urgent && (
            <div className="mt-3 rounded border border-gray-200 bg-white p-3 text-sm">
              {result.specialty ? (
                <p className="mb-2">
                  Suggested specialty: <strong>{result.specialty}</strong>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onPickSpecialty(result.specialty as string);
                      setNote(`Showing ${result.specialty} doctors below.`);
                    }}
                    className="ml-1 rounded border border-gray-400 px-2 py-0.5 text-xs font-medium"
                  >
                    Show these doctors
                  </button>
                </p>
              ) : (
                <p className="mb-2 text-gray-600">None of the available specialties is a clear match. Browse the doctors below.</p>
              )}
              {result.reason && (
                <p className="mb-2">
                  Suggested reason: <em>“{result.reason}”</em>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onUseReason(result.reason);
                      setNote('Reason added. Pick a doctor and a time to finish booking.');
                    }}
                    className="ml-1 rounded border border-gray-400 px-2 py-0.5 text-xs font-medium"
                  >
                    Use this reason
                  </button>
                </p>
              )}
              {result.advice && <p className="mb-2 text-gray-700">{result.advice}</p>}
              {note && <p className="mb-2 text-green-700">{note}</p>}
              <p className="text-xs text-gray-500">{result.disclaimer}</p>
            </div>
          )}
        </form>
      )}
    </section>
  );
}