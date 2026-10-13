/** Contrat commun du moteur d'appel (implémenté par `room.web.ts` ; `room.ts` = plateformes sans WebRTC). */
export type CallPhase = "connecting" | "ringing" | "connected" | "ended" | "failed";

export interface CallRoomState {
  phase: CallPhase;
  muted: boolean;
  videoOn: boolean;
  remoteHasVideo: boolean;
  error: string | null;
}

export interface CallRoomHandle {
  setMuted(muted: boolean): Promise<void>;
  setVideo(on: boolean): Promise<void>;
  /** Rattache la vidéo distante / locale à un élément (web uniquement). */
  attachRemoteVideo(el: unknown): void;
  attachLocalVideo(el: unknown): void;
  leave(): void;
}

export interface CallRoomOptions {
  url: string;
  token: string;
  video: boolean;
  onState: (patch: Partial<CallRoomState>) => void;
}

export const CALLS_SUPPORTED = false;

export async function joinCallRoom(_options: CallRoomOptions): Promise<CallRoomHandle> {
  throw new Error("Les appels nécessitent l'application EduLoc native compilée (dev build) ou la version web.");
}
