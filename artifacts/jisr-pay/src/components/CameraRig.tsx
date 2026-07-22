import { useMemo, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STORY_WAYPOINTS } from "./storyWaypoints";

interface CameraRigProps {
  progressRef: RefObject<number>;
}

export function CameraRig({ progressRef }: CameraRigProps) {
  const { camera } = useThree();

  const { positionCurve, lookAtCurve } = useMemo(() => {
    const positions = STORY_WAYPOINTS.map((w) => new THREE.Vector3(...w.position));
    const lookAts = STORY_WAYPOINTS.map((w) => new THREE.Vector3(...w.lookAt));
    return {
      positionCurve: new THREE.CatmullRomCurve3(positions, false, "catmullrom", 0.2),
      lookAtCurve: new THREE.CatmullRomCurve3(lookAts, false, "catmullrom", 0.2),
    };
  }, []);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const t = Math.min(1, Math.max(0, progressRef.current ?? 0));
    positionCurve.getPointAt(t, tmpPos);
    lookAtCurve.getPointAt(t, tmpLook);

    camera.position.lerp(tmpPos, 0.15);
    camera.lookAt(tmpLook);
  });

  return null;
}

export function computeWaypointOpacity(t: number, waypointT: number, window = 0.12) {
  const dist = Math.abs(t - waypointT);
  return dist > window ? 0 : 1 - dist / window;
}
