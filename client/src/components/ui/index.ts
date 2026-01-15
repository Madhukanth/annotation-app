/**
 * UI Components
 * Reusable UI primitives and common components
 */

// shadcn components
export { Button, buttonVariants } from './button'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'
export { Input } from './input'
export { Label } from './label'
export { Badge, badgeVariants } from './badge'
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu'
export { Avatar, AvatarImage, AvatarFallback } from './avatar'
export { Skeleton } from './skeleton'
export { Separator } from './separator'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table'

// Legacy components (will be phased out)
export { default as Loader } from './Loader'
export { default as Pagination } from './Pagination'
export { default as Select } from './Select'
export { default as Tab } from './Tab'
export { default as CardSkeleton } from './CardSkeleton'
export { default as Gap } from './Gap'
export { successNotification, warningNotification, errorNotification, infoNotification } from './Notification'

// Modal components
export { default as CustomModal } from './CustomModal'
export { default as ConfirmDelete } from './ConfirmDelete'
export { default as ConfirmMessage } from './ConfirmMessage'

// Tooltip components
export { default as Tooltip } from './Tooltip'
export { default as HoverText } from './HoverText'
export { default as HoverAndClickTooltip } from './HoverAndClickTooltip'

// Search components
export { default as SearchTags } from './SearchTags'
export { default as SearchAndSelectTags } from './SearchAndSelectTags'
export { default as SearchUsers } from './SearchUsers'
