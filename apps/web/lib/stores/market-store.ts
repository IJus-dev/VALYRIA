import { create } from "zustand";

interface MarketState {
  connectionState: "connecting" | "open" | "closed";
  setConnectionState: (state: "connecting" | "open" | "closed") => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  connectionState: "closed",
  setConnectionState: (connectionState) => set({ connectionState }),
}));
