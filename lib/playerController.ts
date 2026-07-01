export type PlayerController = {
  playFromGesture: (sourceId?: string) => void;
  pauseFromUser: () => void;
};

let controller: PlayerController | null = null;

export function registerPlayerController(next: PlayerController | null): void {
  controller = next;
}

export function getPlayerController(): PlayerController | null {
  return controller;
}
