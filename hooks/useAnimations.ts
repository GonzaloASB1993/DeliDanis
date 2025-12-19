import { RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useFadeInUp(ref: RefObject<HTMLElement | null>, delay = 0) {
  useGSAP(() => {
    if (!ref.current) return

    gsap.from(ref.current, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })
  }, [delay])
}

export function useStaggerChildren(containerRef: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    if (!containerRef.current) return

    gsap.from(containerRef.current.children, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })
  }, [])
}

export function useFadeIn(ref: RefObject<HTMLElement | null>, delay = 0) {
  useGSAP(() => {
    if (!ref.current) return

    gsap.from(ref.current, {
      opacity: 0,
      duration: 0.8,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })
  }, [delay])
}
