import { useControls, button } from "leva";

export function useDebugControls(opts: {
  onForcePublish: () => void;
  onForceCommand: (on: boolean) => void;
}) {
  useControls("DEBUG", {
    forcePublish: button(() => opts.onForcePublish()),
    lightOn: button(() => opts.onForceCommand(true)),
    lightOff: button(() => opts.onForceCommand(false)),
  });
}
