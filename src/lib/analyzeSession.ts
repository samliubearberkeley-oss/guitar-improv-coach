import type { NoteEvent, SessionSettings, SessionResult, ScoreMetrics } from '../types';
import { 
  calculateScaleAdherence, 
  calculateTimingAccuracy, 
  calculatePitchControl,
  calculatePhraseConsistency 
} from './musicTheory';
import insforge from './insforge';

// Calculate local metrics first
function calculateLocalMetrics(
  noteEvents: NoteEvent[],
  settings: SessionSettings
): ScoreMetrics {
  return {
    scaleAdherence: calculateScaleAdherence(noteEvents, settings.style, settings.key),
    timingAccuracy: calculateTimingAccuracy(noteEvents, settings.tempo),
    pitchControl: calculatePitchControl(noteEvents),
    phraseConsistency: calculatePhraseConsistency(noteEvents),
    styleMatch: 70, // Will be determined by AI
  };
}

// Call the InsForge edge function for AI analysis
async function callAIAnalysis(
  noteEvents: NoteEvent[],
  settings: SessionSettings
): Promise<{
  overallScore: number;
  feedback: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  metrics: ScoreMetrics;
}> {
  const response = await insforge.functions.invoke<{
    data: {
      overallScore: number;
      feedback: string[];
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      metrics: ScoreMetrics;
    };
    error?: string;
  }>('analyze-improv', {
    noteEvents: noteEvents.map(e => ({
      note: e.note,
      timestamp: e.timestamp,
      cents: e.cents,
      velocity: e.velocity,
    })),
    style: settings.style,
    key: settings.key,
    tempo: settings.tempo,
  });

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data;
}

// Main analysis function
export async function analyzeSession(
  noteEvents: NoteEvent[],
  settings: SessionSettings
): Promise<SessionResult> {
  // Calculate duration
  const duration = noteEvents.length > 1
    ? noteEvents[noteEvents.length - 1].timestamp - noteEvents[0].timestamp
    : 0;

  // Calculate local metrics first
  const localMetrics = calculateLocalMetrics(noteEvents, settings);

  try {
    // Try to get AI analysis
    const aiResult = await callAIAnalysis(noteEvents, settings);
    
    // Blend local metrics with AI metrics (trust local for objective measures)
    const blendedMetrics: ScoreMetrics = {
      scaleAdherence: Math.round((localMetrics.scaleAdherence * 0.7 + aiResult.metrics.scaleAdherence * 0.3)),
      timingAccuracy: Math.round((localMetrics.timingAccuracy * 0.7 + aiResult.metrics.timingAccuracy * 0.3)),
      pitchControl: Math.round((localMetrics.pitchControl * 0.7 + aiResult.metrics.pitchControl * 0.3)),
      phraseConsistency: Math.round((localMetrics.phraseConsistency * 0.6 + aiResult.metrics.phraseConsistency * 0.4)),
      styleMatch: aiResult.metrics.styleMatch, // Trust AI for style assessment
    };

    // Calculate overall score from blended metrics
    const overallScore = Math.round(
      blendedMetrics.scaleAdherence * 0.2 +
      blendedMetrics.timingAccuracy * 0.2 +
      blendedMetrics.pitchControl * 0.2 +
      blendedMetrics.phraseConsistency * 0.2 +
      blendedMetrics.styleMatch * 0.2
    );

    return {
      overallScore,
      metrics: blendedMetrics,
      feedback: aiResult.feedback,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
      suggestions: aiResult.suggestions,
      noteEvents,
      duration,
    };
  } catch (error) {
    console.error('AI analysis failed, using local fallback:', error);
    
    // Fallback to local-only analysis
    const overallScore = Math.round(
      localMetrics.scaleAdherence * 0.25 +
      localMetrics.timingAccuracy * 0.25 +
      localMetrics.pitchControl * 0.25 +
      localMetrics.phraseConsistency * 0.25
    );

    return {
      overallScore,
      metrics: localMetrics,
      feedback: ['Analysis completed using local metrics.'],
      strengths: generateLocalStrengths(localMetrics),
      weaknesses: generateLocalWeaknesses(localMetrics),
      suggestions: generateLocalSuggestions(localMetrics, settings),
      noteEvents,
      duration,
    };
  }
}

// Fallback feedback generators
function generateLocalStrengths(metrics: ScoreMetrics): string[] {
  const strengths: string[] = [];
  
  if (metrics.scaleAdherence >= 80) {
    strengths.push('Excellent scale awareness - staying within the key');
  }
  if (metrics.timingAccuracy >= 80) {
    strengths.push('Strong rhythmic sense with good timing');
  }
  if (metrics.pitchControl >= 80) {
    strengths.push('Great intonation and pitch stability');
  }
  if (metrics.phraseConsistency >= 80) {
    strengths.push('Consistent phrasing with musical flow');
  }
  
  if (strengths.length === 0) {
    strengths.push('Keep practicing - improvement takes time');
  }
  
  return strengths;
}

function generateLocalWeaknesses(metrics: ScoreMetrics): string[] {
  const weaknesses: string[] = [];
  
  if (metrics.scaleAdherence < 60) {
    weaknesses.push('Many notes outside the scale/key');
  }
  if (metrics.timingAccuracy < 60) {
    weaknesses.push('Timing could be tighter');
  }
  if (metrics.pitchControl < 60) {
    weaknesses.push('Pitch accuracy needs work');
  }
  if (metrics.phraseConsistency < 60) {
    weaknesses.push('Phrasing feels inconsistent');
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push('Minor areas to refine for even better playing');
  }
  
  return weaknesses;
}

function generateLocalSuggestions(metrics: ScoreMetrics, settings: SessionSettings): string[] {
  const suggestions: string[] = [];
  
  if (metrics.scaleAdherence < 70) {
    suggestions.push(`Practice the ${settings.style === 'blues' ? 'blues' : 'pentatonic minor'} scale in ${settings.key}`);
  }
  if (metrics.timingAccuracy < 70) {
    suggestions.push(`Use a metronome at ${settings.tempo} BPM for timing practice`);
  }
  if (metrics.pitchControl < 70) {
    suggestions.push('Focus on clean fretting and controlled bends');
  }
  if (metrics.phraseConsistency < 70) {
    suggestions.push('Try playing shorter, more deliberate phrases');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Continue exploring and developing your unique voice');
  }
  
  return suggestions;
}


