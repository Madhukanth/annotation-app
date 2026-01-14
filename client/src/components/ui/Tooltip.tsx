import {
  FC,
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
  MouseEventHandler,
  forwardRef
} from 'react'

import { Align, getTooltipPosition } from '@renderer/utils/tooltip'

type StyledTooltipProps = {
  children: ReactNode
  onMouseEnter: MouseEventHandler
  onMouseLeave: MouseEventHandler
}
const StyledTooltip = forwardRef<HTMLDivElement, StyledTooltipProps>(function StyledTooltip(
  { children, onMouseEnter, onMouseLeave },
  ref
) {
  return (
    <div className="relative" ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}
    </div>
  )
})

type StyledTooltipConsumerProps = {
  children: ReactNode
  align?: Align
  move?: number
}
const StyledTooltipConsumer: FC<StyledTooltipConsumerProps> = ({ children, align, move }) => {
  return (
    <div className="absolute z-20" style={{ ...getTooltipPosition(align, move) }}>
      {children}
    </div>
  )
}

type TooltipProps = {
  children: ReactNode
  tooltipChildren: ReactNode
  trigger?: 'hover' | 'click' | 'focus'
  align?: Align
  move?: number
}

const Tooltip: FC<TooltipProps> = ({
  children,
  tooltipChildren,
  trigger = 'hover',
  align = 'right',
  move = 0
}) => {
  const [show, setShow] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const clickListener = useCallback(
    (e: MouseEvent) => {
      if (!tooltipRef.current?.children) return

      const tooltipProvider = tooltipRef.current.children[0]
      if (!tooltipProvider) return

      const clickOnTooltip =
        tooltipProvider.isSameNode(e.target as Node) || tooltipProvider.contains(e.target as Node)
      if (clickOnTooltip) {
        if (trigger === 'click') {
          setShow((status) => !status)
        }

        if (trigger === 'focus' && !show) {
          setShow(true)
        }
        return
      }

      const clickOnAnotherTooltip = tooltipProvider.isEqualNode(e.target as Node)
      if (clickOnAnotherTooltip && show && trigger === 'click') {
        setShow(false)
        return
      }

      const tooltipConsumer = tooltipRef.current.children[1]
      if (!tooltipConsumer) return

      const clickWithinTooltip = tooltipConsumer.contains(e.target as Node)
      if (!clickWithinTooltip && trigger === 'focus' && show) {
        setShow(false)
      }
    },
    [trigger, show, tooltipRef]
  )

  useEffect(() => {
    document.body.addEventListener('click', clickListener)

    return () => {
      document.body.removeEventListener('click', clickListener)
    }
  }, [clickListener])

  const onMouseEnter = () => {
    if (trigger !== 'hover' || show) return
    setShow(true)
  }

  const onMouseLeave = () => {
    if (trigger !== 'hover' || !show) return
    setShow(false)
  }

  return (
    <StyledTooltip ref={tooltipRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}

      {show && (
        <StyledTooltipConsumer align={align} move={move}>
          {tooltipChildren}
        </StyledTooltipConsumer>
      )}
    </StyledTooltip>
  )
}

export default Tooltip
