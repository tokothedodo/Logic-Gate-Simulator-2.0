import { useEffect, useRef, useState } from 'react';
import { ScopeFrame, ScopeRecorder } from '../engine/oscilloscope';

interface UseOscilloscopeArgs {
  channelIds: string[];
  wireStates: Record<string, number>;
  isRunning: boolean;
  /** Sampling rate in Hz. */
  sampleRate?: number;
  capacity?: number;
  enabled: boolean;
  /** Bump to wipe the recorded trace. */
  resetKey?: number;
}

/**
 * Records wire states on a fixed interval and returns a frame that advances on
 * every sample, so the scope renders a scrolling digital trace.
 */
export const useOscilloscope = ({
  channelIds,
  wireStates,
  isRunning,
  sampleRate = 30,
  capacity = 320,
  enabled,
  resetKey = 0,
}: UseOscilloscopeArgs): ScopeFrame => {
  const recorderRef = useRef<ScopeRecorder>(new ScopeRecorder(capacity));
  const channelKey = channelIds.join('|');
  const channelsRef = useRef<string[]>(channelIds);
  channelsRef.current = channelIds;

  const [frame, setFrame] = useState<ScopeFrame>({ times: [], series: [] });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    recorderRef.current = new ScopeRecorder(capacity);
    setFrame({ times: [], series: [] });
  }, [capacity, channelKey]);

  useEffect(() => {
    recorderRef.current.clear();
    setFrame({ times: [], series: [] });
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) return;

    const interval = Math.max(16, Math.round(1000 / sampleRate));

    const tick = () => {
      if (isRunning) {
        recorderRef.current.push(performance.now(), channelsRef.current, wireStates);
        setVersion((v) => v + 1);
      }
    };

    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [enabled, isRunning, sampleRate, wireStates]);

  useEffect(() => {
    const ids = channelKey ? channelKey.split('|') : [];
    setFrame(recorderRef.current.frame(ids));
  }, [channelKey, version]);

  return frame;
};