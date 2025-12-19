// Smooth scroll utility for navigation
export function smoothScrollTo(targetId: string) {
  const element = document.getElementById(targetId)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}

// Enable smooth scrolling globally
export function enableSmoothScroll() {
  if (typeof window !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'smooth'
  }
}
