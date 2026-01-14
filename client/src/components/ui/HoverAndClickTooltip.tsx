import {
  FC,
  MouseEventHandler,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import { Align, getTooltipPosition } from '@renderer/utils/tooltip'

type StyledTooltipConsumerProps = {
  children: ReactNode
  align?: Align
  move?: number
}
const StyledTooltipConsumer: FC<StyledTooltipConsumerProps> = ({ children, align, move }) => {
  return (
    <div className="absolute z-30" style={{ ...getTooltipPosition(align, move) }}>
      {children}
    </div>
  )
}

type StyledHoverAndClickTooltipProps = {
  children: ReactNode
  onMouseEnter: MouseEventHandler
  onMouseLeave: MouseEventHandler
}
const StyledHoverAndClickTooltip = forwardRef<HTMLDivElement, StyledHoverAndClickTooltipProps>(
  function StyledHoverAndClickTooltip({ children, onMouseEnter, onMouseLeave }, ref) {
    return (
      <div className="relative" ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {children}
      </div>
    )
  }
)

type HoverAndClickProps = {
  children: ReactNode
  hoverChildren: ReactNode
  clickChildren: ({ handleClose }: { handleClose: () => void }) => ReactNode
  hoverAlign?: Align
  clickAlign?: Align
  move?: number
  disabled?: boolean
}

const HoverAndClickTooltip: FC<HoverAndClickProps> = ({
  children,
  hoverChildren,
  clickChildren,
  hoverAlign = 'right',
  clickAlign = 'right',
  move = 0,
  disabled = false
}) => {
  const [hover, setHover] = useState(false)
  const [showClickChildren, setShowClickChildren] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const clickListener = useCallback(
    (e: MouseEvent) => {
      if (!tooltipRef.current?.children) return

      const tooltipProvider = tooltipRef.current.children[0]
      if (!tooltipProvider) return

      const clickOnTooltip =
        tooltipProvider.isSameNode(e.target as Node) || tooltipProvider.contains(e.target as Node)
      if (clickOnTooltip) {
        setShowClickChildren((status) => !status)
        return
      }

      const clickOnAnotherTooltip = tooltipProvider.isEqualNode(e.target as Node)
      if (clickOnAnotherTooltip && showClickChildren) {
        setShowClickChildren(false)
        return
      }

      const tooltipConsumer = tooltipRef.current.children[1]
      if (!tooltipConsumer) return

      const clickWithinTooltip = tooltipConsumer.contains(e.target as Node)
      if (!clickWithinTooltip && showClickChildren) {
        setShowClickChildren(false)
      }
    },
    [showClickChildren]
  )

  const onMouseEnter = () => {
    setHover(true)
  }

  const onMouseLeave = () => {
    setHover(false)
  }

  const closeClickChildren = () => {
    setShowClickChildren(false)
    setHover(false)
  }

  useEffect(() => {
    document.body.addEventListener('click', clickListener)

    return () => {
      document.body.removeEventListener('click', clickListener)
    }
  }, [clickListener])

  return (
    <StyledHoverAndClickTooltip
      ref={tooltipRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}

      {showClickChildren && !disabled && (
        <StyledTooltipConsumer align={clickAlign} move={move}>
          {clickChildren({ handleClose: closeClickChildren })}
        </StyledTooltipConsumer>
      )}

      {hover && !showClickChildren && (
        <StyledTooltipConsumer align={hoverAlign} move={move}>
          {hoverChildren}
        </StyledTooltipConsumer>
      )}
    </StyledHoverAndClickTooltip>
  )
}

export default HoverAndClickTooltip
