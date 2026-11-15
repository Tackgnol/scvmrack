import { createContext } from "react";
import type { Owlbear } from "./owlbear.models";

/** Overrides the Owlbear the app talks to; empty means the real SDK (`sdkOwlbear`). */
export const OwlbearContext = createContext<Owlbear | null>(null);
