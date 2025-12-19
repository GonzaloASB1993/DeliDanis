import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export const defaultEase = 'power3.out'
export const defaultDuration = 0.8

export { gsap, ScrollTrigger }
