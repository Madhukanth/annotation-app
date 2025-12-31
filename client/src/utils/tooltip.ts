export type Align =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'left-start'
  | 'left'
  | 'left-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'right-start'
  | 'right'
  | 'right-end'

export const getTooltipPosition = (align: Align = 'right', move = 0) => {
  switch (align) {
    case 'top-start': {
      return {
        bottom: `calc(100% + ${move}px)`,
        left: 0
      }
    }

    case 'top': {
      return {
        bottom: `calc(100% + ${move}px)`,
        left: `50%`,
        transform: `translateX(-50%)`
      }
    }

    case 'top-end': {
      return {
        bottom: `calc(100% + ${move}px)`,
        right: 0
      }
    }

    case 'left-start': {
      return {
        right: `calc(100% + ${move}px)`,
        top: 0
      }
    }

    case 'left': {
      return {
        right: `calc(100% + ${move}px)`,
        top: '50%',
        transform: `translateY(-50%)`
      }
    }

    case 'left-end': {
      return {
        right: `calc(100% + ${move}px)`,
        bottom: 0
      }
    }

    case 'bottom-start': {
      return {
        top: `calc(100% + ${move}px)`,
        left: 0
      }
    }

    case 'bottom': {
      return {
        top: `calc(100% + ${move}px)`,
        left: `50%`,
        transform: `translateX(-50%)`
      }
    }

    case 'bottom-end': {
      return {
        top: `calc(100% + ${move}px)`,
        right: 0
      }
    }

    case 'right-start': {
      return {
        left: `calc(100% + ${move}px)`,
        top: 0
      }
    }

    case 'right': {
      return {
        left: `calc(100% + ${move}px)`,
        top: `50%`,
        transform: `translateY(-50%)`
      }
    }

    case 'right-end': {
      return {
        left: `calc(100% + ${move}px)`,
        bottom: 0
      }
    }

    default:
      return {
        top: `calc(100% + ${move}px)`,
        left: `50%`,
        transform: `translateX(-50%)`
      }
  }
}
