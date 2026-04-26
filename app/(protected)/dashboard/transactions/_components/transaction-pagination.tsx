"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

function getVisiblePages(currentPage: number, totalPages: number) {
  const candidatePages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])

  const sortedPages = [...candidatePages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const visiblePages: Array<number | "ellipsis"> = []
  let previousPage = 0

  for (const page of sortedPages) {
    if (previousPage && page - previousPage > 1) {
      visiblePages.push("ellipsis")
    }

    visiblePages.push(page)
    previousPage = page
  }

  return visiblePages
}

export function TransactionPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) {
    return null
  }

  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault()
              onPageChange(Math.max(1, currentPage - 1))
            }}
            aria-disabled={currentPage <= 1}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(event) => {
                  event.preventDefault()
                  onPageChange(page)
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault()
              onPageChange(Math.min(totalPages, currentPage + 1))
            }}
            aria-disabled={currentPage >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
