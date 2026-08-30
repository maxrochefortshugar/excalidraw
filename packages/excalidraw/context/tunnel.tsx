import React from "react";

type Slot = {
  children: React.ReactNode;
};

/**
 * A small external-store tunnel for rendering editor extensions in a distant
 * layout slot. Slot content lives in a ref so React 19 never enters the
 * children-identity update loop triggered by tunnel-rat 0.1.2.
 */
export const tunnel = () => {
  const slots = new Map<symbol, Slot>();
  const listeners = new Set<() => void>();
  let version = 0;

  const notify = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => version;

  const In = ({ children }: { children?: React.ReactNode }) => {
    const id = React.useMemo(() => Symbol("tunnel-slot"), []);
    const slot = React.useMemo<Slot>(() => ({ children }), []);
    slot.children = children;

    React.useLayoutEffect(() => {
      slots.set(id, slot);
      notify();
      return () => {
        slots.delete(id);
        notify();
      };
    }, [id, slot]);

    return null;
  };

  const Out = () => {
    React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return <>{[...slots.values()].map((slot, index) => (
      <React.Fragment key={index}>{slot.children}</React.Fragment>
    ))}</>;
  };

  return { In, Out };
};

export default tunnel;
