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

  // Keep references to latest callbacks/options to avoid stale closures in WebRTC events
  const sendSignalRef = useRef(sendSignal);
  sendSignalRef.current = sendSignal;
  const sendVoiceStateRef = useRef(sendVoiceState);
  sendVoiceStateRef.current = sendVoiceState;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;

  // Filter connected human peers (exclude bots and self)
  const humanPeers = useMemo(() => {
    if (!playerId || isLocalMode) return [];
    return peers.filter(
      (p) => p.id && p.id !== playerId && !p.isBot && p.isConnected !== false,
    );
  }, [peers, playerId, isLocalMode]);

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
        analyserNodesRef.current.set(targetId, analyser);
      } catch (err) {
        console.warn("[Voice] Failed to attach stream to analyser:", err);
      }
    },
    [getOrCreateAudioContext],
  );

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
  }, [attachStreamToAnalyser]);

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
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        // Create or update remote <audio> element
        let audioEl = remoteAudioElementsRef.current.get(targetPeerId);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.setAttribute("playsinline", "true");
          remoteAudioElementsRef.current.set(targetPeerId, audioEl);
        }

        audioEl.srcObject = remoteStream;
        const volumeFactor = isDeafened ? 0 : (settingsRef.current.voiceVolume ?? 80) / 100;
        audioEl.volume = Math.max(0, Math.min(1, volumeFactor));

        audioEl.play().catch(() => {
          // Autoplay policy may suspend until user interaction
        });

        // Attach remote stream to Web Audio for volume & speaking indicator
        attachStreamToAnalyser(remoteStream, targetPeerId);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setConnectionStatus("connected");
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          // Retry or handle disconnect
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
  // Connect with all room peers when joined
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isJoined || !localStreamRef.current || !playerId) return;

    for (const peer of humanPeers) {
      if (!pcsRef.current.has(peer.id)) {
        // Deterministic role: smaller ID sends offer to avoid glare
        if (playerId < peer.id) {
          void initiateCall(peer.id);
        }
      }
    }
  }, [isJoined, humanPeers, playerId, initiateCall]);

  // ---------------------------------------------------------------------------
  // Process incoming WebRTC signaling messages
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!incomingSignal || !isJoined || !playerId) return;

    const { fromPlayerId, signal } = incomingSignal;
    if (!fromPlayerId || !signal || typeof signal !== "object") return;

    const sig = signal as Record<string, unknown>;

    void (async () => {
      let pc = pcsRef.current.get(fromPlayerId);

      if (sig["type"] === "offer" && sig["sdp"]) {
        // Received offer from peer
        if (!localStreamRef.current) {
          await acquireLocalStream();
        }
        if (!localStreamRef.current) return;

        pc = createPeerConnection(fromPlayerId, localStreamRef.current);

        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(sig["sdp"] as RTCSessionDescriptionInit),
          );

          // Flush queued ICE candidates
          const queued = iceCandidateQueuesRef.current.get(fromPlayerId) ?? [];
          for (const cand of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
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
      } else if (sig["type"] === "answer" && sig["sdp"]) {
        // Received answer from peer
        if (!pc) return;
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(sig["sdp"] as RTCSessionDescriptionInit),
          );

          // Flush queued ICE candidates
          const queued = iceCandidateQueuesRef.current.get(fromPlayerId) ?? [];
          for (const cand of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          iceCandidateQueuesRef.current.delete(fromPlayerId);
        } catch (err) {
          console.error(`[Voice] Error handling answer from ${fromPlayerId}:`, err);
        }
      } else if (sig["type"] === "ice-candidate" && sig["candidate"]) {
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
    })();
  }, [incomingSignal, isJoined, playerId, acquireLocalStream, createPeerConnection]);

  // ---------------------------------------------------------------------------
  // Handle peer leaving
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
      remoteAudioElementsRef.current.delete(leftPlayerId);
    }

    // Clean up analyser
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
  // Remote audio volume adjustments (react to deafen and voiceVolume setting)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const vol = isDeafened ? 0 : (settings.voiceVolume ?? 80) / 100;
    const effectiveVolume = Math.max(0, Math.min(1, vol));

    for (const audioEl of remoteAudioElementsRef.current.values()) {
      audioEl.volume = effectiveVolume;
    }
  }, [isDeafened, settings.voiceVolume]);

  // ---------------------------------------------------------------------------
  // Voice Activity Detection (VAD) & Real-time Speaking Indicators
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isJoined) {
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
      setSpeakingPlayerIds(new Set());
      setAudioLevels({});
      return;
    }

    // Sensitivity threshold: higher sensitivity setting = lower threshold needed to trigger
    const sensitivity = settings.voiceSensitivity ?? 25;
    const threshold = Math.max(0.005, (100 - sensitivity) * 0.0006);

    const checkVolumeLevels = () => {
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

    const stream = await acquireLocalStream();
    if (!stream) {
      return;
    }

    setIsJoined(true);
    setConnectionStatus("connected");

    // Broadcast initial unmuted/undeafened state
    sendVoiceStateRef.current(false, false);
  }, [acquireLocalStream]);

  const leaveVoice = useCallback(() => {
    // Close and clear all peer connections
    for (const pc of pcsRef.current.values()) {
      pc.close();
    }
    pcsRef.current.clear();

    // Stop and clear all audio elements
    for (const audioEl of remoteAudioElementsRef.current.values()) {
      audioEl.pause();
      audioEl.srcObject = null;
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

    setIsJoined(false);
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
