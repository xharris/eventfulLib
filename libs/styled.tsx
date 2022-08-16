import { createStitches, globalCss } from '@stitches/react'
import { ReactNode, useMemo } from 'react'
import { useMediaQuery as useReactResponsive } from 'react-responsive'

export const MEDIA = {
  Mobile: 400,
  Phablet: 550,
  Tablet: 750,
  Desktop: 1000,
  DesktopHd: 1200,
}

export const globalStyles = globalCss({
  // '*': {
  //   color: '#212121',
  // },
  a: {
    textDecoration: 'none',
  },
  '.rs__menu-portal': {
    zIndex: '100 !important',
  },
  '[data-radix-popper-content-wrapper=""]': {
    zIndex: '100 !important',
  },
})

export const { styled, css, config, keyframes } = createStitches({
  utils: {
    w: (v: number | string) => ({ width: v }),
    h: (v: number | string) => ({ height: v }),
  },
  media: {
    mobile: `(min-width: ${MEDIA.Mobile}px)`,
    phablet: `(min-width: ${MEDIA.Phablet}px)`,
    tablet: `(min-width: ${MEDIA.Tablet}px)`,
    desktop: `(min-width: ${MEDIA.Desktop}px)`,
    desktopHD: `(min-width: ${MEDIA.DesktopHd}px)`,
  },
  theme: {
    space: {
      1: '1rem',
      root: '$1',
      small: '0.3rem',
      controlPadding: '0.5rem',
    },
    sizes: {
      ...MEDIA,
    },
    radii: {
      control: '3px',
    },
    borderStyles: {
      control: 'solid',
    },
    fontSizes: {
      1: '5rem',
      2: '4.2rem',
      3: '3.6rem',
      4: '3rem',
      5: '2.4rem',
      6: '1.5rem',
      7: '1.25rem',
      control: '0.8rem',
      small: '0.7rem',
    },
    colors: {
      background: 'white',
      black: '#212121',
      disabled: '#BDBDBD',
      controlFg: '#212121',
      controlBorder: '#9E9E9E', // '#9E9E9E',
      controlBackground: '#E0E0E0',
      inputBackground: '#EEEEEE',
      successFg: '#1B5E20',
      successBg: '#A5D6A7',
      red: '#F44336',
      cardBg: '#ECEFF1',
    },
    shadows: {
      none: '0px 0px 0px #BDBDBD',
      text: '-1px 0px 2px white, 1px 0px 2px white, 0px -1px 2px white, 0px 1px 2px white',
      card: '2px 2px 0px 0px #BDBDBD', //'0 0 3px 0px #BDBDBD',
      popoverTrigger: '0px 0px 1px #212121',
    },
  },
})

interface UseMediaQueryProps {
  /** false if size is at or below minSize */
  minSize?: keyof typeof MEDIA
  /** false if size is at or above minSize */
  maxSize?: keyof typeof MEDIA
}

export const useMediaQuery = ({ minSize, maxSize }: UseMediaQueryProps) =>
  useReactResponsive({
    ...(minSize ? { minWidth: MEDIA[minSize] } : {}),
    ...(maxSize ? { maxWidth: MEDIA[maxSize] } : {}),
  })

export const useMobile = () => useReactResponsive({ maxWidth: MEDIA.Mobile })
export const usePhablet = () =>
  useReactResponsive({ minWidth: MEDIA.Mobile + 1, maxWidth: MEDIA.Phablet })
export const useTablet = () =>
  useReactResponsive({ minWidth: MEDIA.Phablet + 1, maxWidth: MEDIA.Tablet })
export const useDesktop = () => useReactResponsive({ minWidth: MEDIA.Tablet + 1 })

export const Mobile = ({ children }: { children?: ReactNode }) => {
  const isMobile = useReactResponsive({ maxWidth: MEDIA.Mobile })
  return isMobile ? children : null
}
export const Phablet = ({ children }: { children?: ReactNode }) => {
  const isPhablet = useReactResponsive({ minWidth: MEDIA.Mobile + 1, maxWidth: MEDIA.Phablet })
  return isPhablet ? children : null
}
export const Tablet = ({ children }: { children?: ReactNode }) => {
  const isTablet = useReactResponsive({ minWidth: MEDIA.Phablet + 1, maxWidth: MEDIA.Tablet })
  return isTablet ? children : null
}
export const Desktop = ({ children }: { children?: ReactNode }) => {
  const isDesktop = useReactResponsive({ minWidth: MEDIA.Tablet + 1 })
  return isDesktop ? children : null
}
// export const DesktopHd = ({ children }:{ children?: ReactNode }) => {
//   const isDesktop = useReactResponsive({ minWidth: 992 })
//   return isDesktop ? children : null
// }

export const slideUpAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
})

export const slideRightAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(-2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
})

export const slideDownAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
})

export const slideLeftAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
})
