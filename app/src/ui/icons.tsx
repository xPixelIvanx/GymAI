const P = (d: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
)
export const IconToday = () => P('M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12')
export const IconCoach = () => P('M4 5h16v11H9l-5 4V5z')
export const IconProgress = () => P('M4 19V5M4 19h16M8 15l4-5 3 3 4-6')
export const IconRoutines = () => P('M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01')
export const IconMe = () => P('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6')
