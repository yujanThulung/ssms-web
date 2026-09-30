import type { FeeStructureListRow } from '../../features/fee-structures'

/**
 * Everything the drawer needs to render a class' fee structure.
 * The page builds it either from a list row or from a freshly created
 * structure, so opening the drawer never depends on a follow-up list refetch.
 */
export interface StructureTarget {
  classId: string
  className: string
  academicYearId: string
  academicYearName: string
  structureId: string | null
}

export function targetFromRow(row: FeeStructureListRow): StructureTarget {
  return {
    classId: row.classId,
    className: row.className,
    academicYearId: row.academicYearId,
    academicYearName: row.academicYearName,
    structureId: row.structure?.id ?? null,
  }
}
