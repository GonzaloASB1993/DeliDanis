import { RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Fade in from below with scroll trigger.
 * Standard entrance animation for section elements.
 */
export function useFadeInUp(ref: RefObject<HTMLElement | null>, delay = 0) {
  useGSAP(() => {
    if (!ref.current) return

    gsap.fromTo(
      ref.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [delay])
}

/**
 * Stagger children elements on scroll.
 * Used for grids, lists, and card groups.
 */
export function useStaggerChildren(containerRef: RefObject<HTMLElement | null>, itemCount?: number) {
  useGSAP(() => {
    if (!containerRef.current) return

    const children = containerRef.current.children
    if (children.length === 0) return

    gsap.set(children, { opacity: 1, y: 0, clearProps: 'all' })

    gsap.fromTo(
      children,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.05,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        onComplete: () => {
          gsap.set(children, { clearProps: 'all' })
        },
      }
    )
  }, [itemCount])
}

/**
 * Simple fade in with scroll trigger.
 */
export function useFadeIn(ref: RefObject<HTMLElement | null>, delay = 0) {
  useGSAP(() => {
    if (!ref.current) return

    gsap.fromTo(
      ref.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.9,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [delay])
}

/**
 * Parallax scroll effect.
 * Moves element at a different rate than scroll for depth.
 */
export function useParallax(ref: RefObject<HTMLElement | null>, speed = 0.3) {
  useGSAP(() => {
    if (!ref.current) return

    gsap.to(ref.current, {
      y: () => speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, [speed])
}

/**
 * Reveal animation from left or right.
 * Used for asymmetric layouts.
 */
export function useRevealFrom(
  ref: RefObject<HTMLElement | null>,
  direction: 'left' | 'right' = 'left',
  delay = 0
) {
  useGSAP(() => {
    if (!ref.current) return

    const x = direction === 'left' ? -60 : 60

    gsap.fromTo(
      ref.current,
      { x, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [direction, delay])
}

/**
 * Scale reveal - element grows from slightly smaller.
 * Good for images and cards.
 */
export function useScaleReveal(ref: RefObject<HTMLElement | null>, delay = 0) {
  useGSAP(() => {
    if (!ref.current) return

    gsap.fromTo(
      ref.current,
      { scale: 0.92, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [delay])
}

/**
 * Counter animation for stats/numbers.
 * Animates from 0 to target value.
 */
export function useCountUp(
  ref: RefObject<HTMLElement | null>,
  endValue: number,
  duration = 1.5,
  suffix = ''
) {
  useGSAP(() => {
    if (!ref.current) return

    const obj = { value: 0 }

    gsap.to(obj, {
      value: endValue,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = Math.round(obj.value) + suffix
        }
      },
    })
  }, [endValue, duration, suffix])
}
