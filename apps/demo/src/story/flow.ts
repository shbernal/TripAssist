import { createContext, useContext } from 'react'

/** Scene order on the horizontal track - indexes derive from this list. */
export const SCENE_IDS = [
  'hero',
  'itinerary',
  'airport-call',
  'hotel-call',
  'notifications',
  'outro',
] as const

export type SceneId = (typeof SCENE_IDS)[number]

export interface StoryFlow {
  /**
   * Ask the story to move to the scene after `from`, once `delayMs` has passed
   * and only if `from` is still the current scene (a user gesture cancels it).
   * Lets a scene hand the baton forward when its own beat is done (e.g. a call
   * ended) without knowing anything about the scroller.
   */
  advanceFrom: (from: SceneId, delayMs?: number) => void
}

export const StoryFlowContext = createContext<StoryFlow>({ advanceFrom: () => {} })

export function useStoryFlow(): StoryFlow {
  return useContext(StoryFlowContext)
}
