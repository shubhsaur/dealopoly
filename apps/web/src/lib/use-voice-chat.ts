"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSettings } from "./use-settings";

export interface VoicePeer {
  id: string;
  name?: string;
  isBot?: boolean;
  isConnected?: boolean;
}

export interface VoiceSignalEvent {
  id?: string;
  fromPlayerId: string;
  signal: unknown;
  timestamp: number;
}

export interface VoicePeerLeftEvent {
  playerId: string;
  timestamp: number;
}

export interface UseVoiceChatOptions {
  roomCode?: string;
  playerId?: string;
  peers?: VoicePeer[];
  isLocalMode?: boolean;
  incomingSignal?: VoiceSignalEvent | null;
  incomingSignals?: VoiceSignalEvent[];
  peerLeftEvent?: VoicePeerLeftEvent | null;
  remoteVoiceStates?: Record<string, { isMuted: boolean; isDeafened: boolean }>;
  sendSignal: (targetPlayerId: string, signal: unknown) => void;
  sendVoiceState: (isMuted: boolean, isDeafened: boolean) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return AudioCtxClass ? new AudioCtxClass() : null;
}

export function useVoiceChat({
  roomCode,
  playerId,
  peers = [],
  isLocalMode = false,
  incomingSignal,
  incomingSignals = [],
  peerLeftEvent,
  remoteVoiceStates = {},
  sendSignal,
  sendVoiceState,
}: UseVoiceChatOptions) {
  const { settings } = useSettings();

  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isPttActive, setIsPttActive] = useState(false);
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<Set<string>>(new Set());
  const [audioLevels, setAudioLevels] = useState<Record<string, number>>({});

  // Active peer connections: peerId -> RTCPeerConnection
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Pending ICE candidates queued before remote description is set: peerId -> RTCIceCandidateInit[]
  const iceCandidateQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  // Remote audio elements: peerId -> HTMLAudioElement
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // Local microphone media stream
  const localStreamRef = useRef<MediaStream | null>(null);
  // Web Audio Context & Analyser nodes for VAD (speaking detection)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodesRef = useRef<Map<string, AnalyserNode>>(new Map());
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track processed signal IDs to prevent duplicate processing
  const processedSignalIdsRef = useRef<Set<string>>(new Set());

  // Keep references to latest callbacks/options to avoid stale closures in WebRTC events
  const sendSignalRef = useRef(sendSignal);
  sendSignalRef.current = sendSignal;
  const sendVoiceStateRef = useRef(sendVoiceState);
  sendVoiceStateRef.current = sendVoiceState;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;
  const isJoinedRef = useRef(isJoined);
  isJoinedRef.current = isJoined;

  // Filter connected human peers (exclude bots and self)
  const humanPeers = useMemo(() => {
    if (!playerId || isLocalMode) return [];
    return peers.filter(
      (p) => p.id && p.id !== playerId && !p.isBot && p.isConnected !== false,
    );
  }, [peers, playerId, isLocalMode]);

  const humanPeersRef = useRef(humanPeers);
  humanPeersRef.current = humanPeers;

  // ---------------------------------------------------------------------------
  // Web Audio Context setup for volume analysis
  // ---------------------------------------------------------------------------
  const getOrCreateAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = getAudioContext();
    }
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  const attachStreamToAnalyser = useCallback(
    (stream: MediaStream, targetId: string) => {
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;
      try {
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);

        // Connect through a silent gain node to destination to prevent garbage collection in Chrome
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        analyser.connect(silentGain);
        silentGain.connect(ctx.destination);

        analyserNodesRef.current.set(targetId, analyser);
      } catch (err) {
        console.warn("[Voice] Failed to attach stream to analyser:", err);
      }
    },
    [getOrCreateAudioContext],
  );

  // ---------------------------------------------------------------------------
  // Track enable/disable state syncing (PTT and Mute)
  // ---------------------------------------------------------------------------
  const syncLocalTrackState = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const isPttMode = settingsRef.current.voiceInputMode === "ptt";
    // If PTT mode: enabled ONLY when key is active. If Open Mic: enabled when !isMuted && !isDeafened
    const shouldTransmitting = isPttMode
      ? isPttActive && !isDeafened
      : !isMuted && !isDeafened;

    for (const track of stream.getAudioTracks()) {
      track.enabled = shouldTransmitting;
    }
  }, [isMuted, isDeafened, isPttActive]);

  useEffect(() => {
    syncLocalTrackState();
  }, [syncLocalTrackState]);

  // ---------------------------------------------------------------------------
  // Dynamic Volume & Deafen updating on remote audio elements
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const volumeFactor = isDeafened ? 0 : (settings.voiceVolume ?? 80) / 100;
    const clampedVol = Math.max(0, Math.min(1, volumeFactor));

    for (const audioEl of remoteAudioElementsRef.current.values()) {
      audioEl.muted = isDeafened;
      audioEl.volume = clampedVol;
    }
  }, [isDeafened, settings.voiceVolume]);

  // Unlock audio playback on global click/touch gesture
  useEffect(() => {
    if (!isJoined) return;

    const tryResumePlayback = () => {
      // Resume AudioContext if suspended
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
      // Play any suspended audio elements
      for (const audioEl of remoteAudioElementsRef.current.values()) {
        if (audioEl.paused && audioEl.srcObject) {
          audioEl.play().catch(() => {});
        }
      }
    };

    window.addEventListener("click", tryResumePlayback);
    window.addEventListener("touchstart", tryResumePlayback);

    return () => {
      window.removeEventListener("click", tryResumePlayback);
      window.removeEventListener("touchstart", tryResumePlayback);
    };
  }, [isJoined]);

  // ---------------------------------------------------------------------------
  // Microphone Stream Acquisition
  // ---------------------------------------------------------------------------
  const acquireLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setPermissionState("granted");

      // Set initial track transmission state
      const isPttMode = settingsRef.current.voiceInputMode === "ptt";
      const shouldTransmitting = isPttMode ? false : !isMuted && !isDeafened;
      for (const track of stream.getAudioTracks()) {
        track.enabled = shouldTransmitting;
      }

      // Attach local stream to Web Audio for speaking detection
      if (playerIdRef.current) {
        attachStreamToAnalyser(stream, playerIdRef.current);
      }

      return stream;
    } catch (err: unknown) {
      console.error("[Voice] Microphone access error:", err);
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setPermissionState(isDenied ? "denied" : "prompt");
      setErrorMessage(
        isDenied
          ? "Microphone access denied. Please allow microphone in browser settings."
          : "Could not access microphone.",
      );
      setConnectionStatus("error");
      return null;
    }
  }, [attachStreamToAnalyser, isMuted, isDeafened]);

  // ---------------------------------------------------------------------------
  // Peer Connection Factory & Event Handlers
  // ---------------------------------------------------------------------------
  const createPeerConnection = useCallback(
    (targetPeerId: string, localStream: MediaStream): RTCPeerConnection => {
      // Clean up any existing connection for this peer
      const existingPc = pcsRef.current.get(targetPeerId);
      if (existingPc) {
        existingPc.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcsRef.current.set(targetPeerId, pc);

      // Add local audio tracks to the peer connection
      for (const track of localStream.getAudioTracks()) {
        pc.addTrack(track, localStream);
      }

      // Handle local ICE candidates -> send to target peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalRef.current(targetPeerId, {
            type: "ice-candidate",
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Handle incoming remote audio track
      pc.ontrack = (event) => {
        // Fallback: use event.streams[0] or synthesize from event.track
        const remoteStream = event.streams[0] ?? new MediaStream([event.track]);

        // Create or update remote <audio> element in DOM
        let audioEl = remoteAudioElementsRef.current.get(targetPeerId);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.setAttribute("playsinline", "true");
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
          remoteAudioElementsRef.current.set(targetPeerId, audioEl);
        }

        audioEl.srcObject = remoteStream;
        audioEl.muted = isDeafened;
        const volumeFactor = isDeafened ? 0 : (settingsRef.current.voiceVolume ?? 80) / 100;
        audioEl.volume = Math.max(0, Math.min(1, volumeFactor));

        audioEl.play().catch((err) => {
          console.warn(`[Voice] Audio autoplay prevented for ${targetPeerId}:`, err);
        });

        // Ensure playback starts as soon as track un-mutes
        event.track.onunmute = () => {
          audioEl?.play().catch(() => {});
        };

        // Attach remote stream to Web Audio for volume & speaking indicator
        attachStreamToAnalyser(remoteStream, targetPeerId);
      };

      pc.onconnectionstatechange = () => {
        console.log(`[Voice] Peer connection state with ${targetPeerId}:`, pc.connectionState);
        if (pc.connectionState === "connected") {
          setConnectionStatus("connected");
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          // Check if any connections remain connected
          const hasAnyConnected = Array.from(pcsRef.current.values()).some(
            (p) => p.connectionState === "connected",
          );
          if (!hasAnyConnected && isJoinedRef.current) {
            setConnectionStatus("connecting");
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[Voice] ICE state with ${targetPeerId}:`, pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setConnectionStatus("connected");
        } else if (pc.iceConnectionState === "failed") {
          // Attempt ICE restart
          pc.restartIce();
        }
      };

      return pc;
    },
    [attachStreamToAnalyser, isDeafened],
  );

  // ---------------------------------------------------------------------------
  // WebRTC Negotiation (Deterministic caller: smaller ID initiates offer)
  // ---------------------------------------------------------------------------
  const initiateCall = useCallback(
    async (targetPeerId: string) => {
      const myId = playerIdRef.current;
      if (!myId || !localStreamRef.current) return;

      console.log(`[Voice] Initiating call to peer: ${targetPeerId}`);
      const pc = createPeerConnection(targetPeerId, localStreamRef.current);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendSignalRef.current(targetPeerId, {
          type: "offer",
          sdp: offer,
        });
      } catch (err) {
        console.error(`[Voice] Error creating offer for ${targetPeerId}:`, err);
      }
    },
    [createPeerConnection],
  );

  // ---------------------------------------------------------------------------
  // Process incoming WebRTC signaling message
  // ---------------------------------------------------------------------------
  const handleSignal = useCallback(
    async (fromPlayerId: string, signal: unknown) => {
      if (!isJoinedRef.current || !playerIdRef.current) return;
      if (!fromPlayerId || !signal || typeof signal !== "object") return;

      const myId = playerIdRef.current;
      const sig = signal as Record<string, unknown>;
      const sigType = sig["type"];

      // 1. Peer joined voice discovery ("voice-hello" / "voice-ready")
      if (sigType === "voice-hello") {
        console.log(`[Voice] Received voice-hello from ${fromPlayerId}`);
        // Reply with voice-ready so they know we are also in voice
        sendSignalRef.current(fromPlayerId, { type: "voice-ready" });

        // Deterministic role: smaller ID sends offer
        if (myId < fromPlayerId && localStreamRef.current) {
          void initiateCall(fromPlayerId);
        }
        return;
      }

      if (sigType === "voice-ready") {
        console.log(`[Voice] Received voice-ready from ${fromPlayerId}`);
        // Deterministic role: smaller ID sends offer
        if (myId < fromPlayerId && localStreamRef.current) {
          void initiateCall(fromPlayerId);
        }
        return;
      }

      let pc = pcsRef.current.get(fromPlayerId);

      // 2. Incoming SDP Offer
      if (sigType === "offer" && sig["sdp"]) {
        console.log(`[Voice] Received offer from ${fromPlayerId}`);
        if (!localStreamRef.current) {
          await acquireLocalStream();
        }
        if (!localStreamRef.current) return;

        pc = createPeerConnection(fromPlayerId, localStreamRef.current);

        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(sig["sdp"] as RTCSessionDescriptionInit),
          );

          // Flush any queued ICE candidates for this peer
          const queued = iceCandidateQueuesRef.current.get(fromPlayerId) ?? [];
          for (const cand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (candErr) {
              console.warn("[Voice] Error adding queued ICE candidate:", candErr);
            }
          }
          iceCandidateQueuesRef.current.delete(fromPlayerId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendSignalRef.current(fromPlayerId, {
            type: "answer",
            sdp: answer,
          });
        } catch (err) {
          console.error(`[Voice] Error handling offer from ${fromPlayerId}:`, err);
        }
      }

      // 3. Incoming SDP Answer
      else if (sigType === "answer" && sig["sdp"]) {
        console.log(`[Voice] Received answer from ${fromPlayerId}`);
        if (!pc) return;
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(sig["sdp"] as RTCSessionDescriptionInit),
          );

          // Flush any queued ICE candidates
          const queued = iceCandidateQueuesRef.current.get(fromPlayerId) ?? [];
          for (const cand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (candErr) {
              console.warn("[Voice] Error adding queued ICE candidate:", candErr);
            }
          }
          iceCandidateQueuesRef.current.delete(fromPlayerId);
        } catch (err) {
          console.error(`[Voice] Error handling answer from ${fromPlayerId}:`, err);
        }
      }

      // 4. Incoming ICE Candidate
      else if (sigType === "ice-candidate" && sig["candidate"]) {
        const candidateInit = sig["candidate"] as RTCIceCandidateInit;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          } catch (err) {
            console.warn(`[Voice] Error adding ICE candidate:`, err);
          }
        } else {
          // Queue candidate until remote description is set
          const queue = iceCandidateQueuesRef.current.get(fromPlayerId) ?? [];
          queue.push(candidateInit);
          iceCandidateQueuesRef.current.set(fromPlayerId, queue);
        }
      }
    },
    [acquireLocalStream, createPeerConnection, initiateCall],
  );

  // ---------------------------------------------------------------------------
  // Process signal queue (both streaming array and single event)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isJoined || !playerId) return;

    // 1. Process from array stream if provided
    if (incomingSignals && incomingSignals.length > 0) {
      for (const sigEvent of incomingSignals) {
        const key = sigEvent.id || `${sigEvent.fromPlayerId}-${sigEvent.timestamp}-${JSON.stringify(sigEvent.signal).slice(0, 30)}`;
        if (!processedSignalIdsRef.current.has(key)) {
          processedSignalIdsRef.current.add(key);
          void handleSignal(sigEvent.fromPlayerId, sigEvent.signal);
        }
      }
    }

    // 2. Fallback: process from single incomingSignal if provided
    if (incomingSignal) {
      const key = incomingSignal.id || `${incomingSignal.fromPlayerId}-${incomingSignal.timestamp}`;
      if (!processedSignalIdsRef.current.has(key)) {
        processedSignalIdsRef.current.add(key);
        void handleSignal(incomingSignal.fromPlayerId, incomingSignal.signal);
      }
    }
  }, [incomingSignals, incomingSignal, isJoined, playerId, handleSignal]);

  // ---------------------------------------------------------------------------
  // Handle peer leaving room
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!peerLeftEvent) return;
    const { playerId: leftPlayerId } = peerLeftEvent;

    // Clean up peer connection
    const pc = pcsRef.current.get(leftPlayerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(leftPlayerId);
    }

    // Clean up audio element
    const audioEl = remoteAudioElementsRef.current.get(leftPlayerId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      if (audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
      }
      remoteAudioElementsRef.current.delete(leftPlayerId);
    }

    analyserNodesRef.current.delete(leftPlayerId);
    iceCandidateQueuesRef.current.delete(leftPlayerId);

    setSpeakingPlayerIds((prev) => {
      const next = new Set(prev);
      next.delete(leftPlayerId);
      return next;
    });

    setAudioLevels((prev) => {
      const next = { ...prev };
      delete next[leftPlayerId];
      return next;
    });
  }, [peerLeftEvent]);

  // ---------------------------------------------------------------------------
  // Volume Level Monitoring & Voice Activity Detection (VAD)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isJoined) {
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
      setSpeakingPlayerIds(new Set());
      setAudioLevels({});
      return;
    }

    const checkVolumeLevels = () => {
      const sensitivity = settings.voiceSensitivity ?? 50;
      // Sensitive threshold: higher sensitivity = lower threshold needed
      const threshold = Math.max(0.003, (100 - sensitivity) * 0.0003);

      const newSpeaking = new Set<string>();
      const newLevels: Record<string, number> = {};

      const myId = playerIdRef.current;
      const isPttMode = settingsRef.current.voiceInputMode === "ptt";
      const localTransmitting = isPttMode ? isPttActive : !isMuted;

      for (const [id, analyser] of analyserNodesRef.current) {
        const buffer = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buffer);

        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i]! - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        const level = Math.min(1, rms * 5);
        newLevels[id] = level;

        if (id === myId) {
          if (localTransmitting && !isDeafened && rms > threshold) {
            newSpeaking.add(id);
          }
        } else {
          const peerState = remoteVoiceStates[id];
          const isPeerMuted = peerState?.isMuted;
          if (!isPeerMuted && !isDeafened && rms > threshold) {
            newSpeaking.add(id);
          }
        }
      }

      setSpeakingPlayerIds(newSpeaking);
      setAudioLevels(newLevels);
    };

    vadIntervalRef.current = setInterval(checkVolumeLevels, 80);

    return () => {
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
    };
  }, [isJoined, isMuted, isDeafened, isPttActive, settings.voiceSensitivity, remoteVoiceStates]);

  // ---------------------------------------------------------------------------
  // Push-to-Talk (PTT) Keyboard Listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isJoined || settings.voiceInputMode !== "ptt") return;

    const targetKey = settings.voicePttKey || "KeyV";

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger PTT while typing in inputs or textareas
      const activeTag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === targetKey && !e.repeat) {
        setIsPttActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === targetKey) {
        setIsPttActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isJoined, settings.voiceInputMode, settings.voicePttKey]);

  // ---------------------------------------------------------------------------
  // Public Control Actions
  // ---------------------------------------------------------------------------
  const joinVoice = useCallback(async () => {
    setConnectionStatus("connecting");
    setErrorMessage(null);

    // 1. Resume AudioContext immediately inside user gesture
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // 2. Acquire microphone
    const stream = await acquireLocalStream();
    if (!stream) {
      return;
    }

    setIsJoined(true);
    isJoinedRef.current = true;
    setConnectionStatus("connected");

    // 3. Broadcast initial unmuted/undeafened state to server
    sendVoiceStateRef.current(false, false);

    // 4. Announce voice-hello to all peers in the room
    for (const peer of humanPeersRef.current) {
      sendSignalRef.current(peer.id, { type: "voice-hello" });
    }
  }, [acquireLocalStream, getOrCreateAudioContext]);

  const leaveVoice = useCallback(() => {
    // Notify peers that we are leaving
    for (const peer of humanPeersRef.current) {
      sendSignalRef.current(peer.id, { type: "voice-leave" });
    }

    // Close and clear all peer connections
    for (const pc of pcsRef.current.values()) {
      pc.close();
    }
    pcsRef.current.clear();

    // Stop and remove all remote audio elements from DOM
    for (const audioEl of remoteAudioElementsRef.current.values()) {
      audioEl.pause();
      audioEl.srcObject = null;
      if (audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
      }
    }
    remoteAudioElementsRef.current.clear();

    // Stop local media stream tracks
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getAudioTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }

    analyserNodesRef.current.clear();
    iceCandidateQueuesRef.current.clear();
    processedSignalIdsRef.current.clear();

    setIsJoined(false);
    isJoinedRef.current = false;
    setConnectionStatus("idle");
    setSpeakingPlayerIds(new Set());
    setAudioLevels({});
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sendVoiceStateRef.current(next, isDeafened);
      return next;
    });
  }, [isDeafened]);

  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => {
      const next = !prev;
      // Deafening automatically mutes the user
      const nextMuted = next ? true : isMuted;
      if (next) setIsMuted(true);
      sendVoiceStateRef.current(nextMuted, next);
      return next;
    });
  }, [isMuted]);

  // Auto-cleanup on unmount or room leave
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  return {
    isJoined,
    isMuted,
    isDeafened,
    isPttActive,
    speakingPlayerIds,
    audioLevels,
    permissionState,
    connectionStatus,
    errorMessage,
    remoteVoiceStates,
    remotePeerStates: remoteVoiceStates,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
    setIsPttActive,
  };
}
