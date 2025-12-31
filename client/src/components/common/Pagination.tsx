import { FC, HTMLProps } from 'react'
import ReactPaginate, { ReactPaginateProps } from 'react-paginate'

import { cn } from '@renderer/utils/cn'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: ReactPaginateProps['onPageChange']
  className?: HTMLProps<HTMLElement>['className']
}
const Pagination: FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className }) => {
  return (
    <div className={cn('m-auto w-fit', className)}>
      <ReactPaginate
        forcePage={currentPage}
        pageCount={totalPages}
        onPageChange={onPageChange}
        containerClassName="flex rounded-md"
        breakLinkClassName="block py-2 px-4"
        previousLinkClassName="block py-2 px-4"
        nextLinkClassName="block py-2 px-4"
        pageLinkClassName="block py-2 px-4"
        pageClassName="block border border-gray-300 bg-white cursor-pointer border-r-0 hover:bg-brand hover:text-white first:rounded-tl-sm first:rounded-bl-sm last:rounded-tr-sm last:rounded-br-sm last:border-r last:border-r-gray-300"
        nextClassName="block border border-gray-300 bg-white cursor-pointer border-r-0 hover:bg-brand hover:text-white first:rounded-tl-sm first:rounded-bl-sm last:rounded-tr-sm last:rounded-br-sm last:border-r last:border-r-gray-300"
        previousClassName="block border border-gray-300 bg-white cursor-pointer border-r-0 hover:bg-brand hover:text-white first:rounded-tl-sm first:rounded-bl-sm last:rounded-tr-sm last:rounded-br-sm last:border-r last:border-r-gray-300"
        breakClassName="block border border-gray-300 bg-white cursor-pointer border-r-0 hover:bg-brand hover:text-white first:rounded-tl-sm first:rounded-bl-sm last:rounded-tr-sm last:rounded-br-sm last:border-r last:border-r-gray-300"
        activeClassName="!bg-brand text-white"
        nextLabel=">"
        marginPagesDisplayed={2}
        previousLabel="<"
      />
    </div>
  )
}

export default Pagination
