import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubmissionStatusBadge, TemplateStatusBadge } from './StatusBadge'
import type { SubmissionStatus, FormTemplateStatus } from '@/types'

describe('SubmissionStatusBadge', () => {
  it('renderiza el label "Pendiente" para estado SUBMITTED', () => {
    render(<SubmissionStatusBadge status="SUBMITTED" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renderiza el label "Aprobado" para estado APPROVED', () => {
    render(<SubmissionStatusBadge status="APPROVED" />)
    expect(screen.getByText('Aprobado')).toBeInTheDocument()
  })

  it('renderiza el label "Rechazado" para estado REJECTED', () => {
    render(<SubmissionStatusBadge status="REJECTED" />)
    expect(screen.getByText('Rechazado')).toBeInTheDocument()
  })

  it('renderiza el label "Borrador" para estado DRAFT', () => {
    render(<SubmissionStatusBadge status="DRAFT" />)
    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('SUBMITTED y APPROVED tienen clases distintas (colores distintos)', () => {
    const { rerender } = render(<SubmissionStatusBadge status="SUBMITTED" />)
    const submittedClass = screen.getByText('Pendiente').className

    rerender(<SubmissionStatusBadge status="APPROVED" />)
    const approvedClass = screen.getByText('Aprobado').className

    expect(submittedClass).not.toBe(approvedClass)
  })

  it('APPROVED y REJECTED tienen clases distintas (colores distintos)', () => {
    const { rerender } = render(<SubmissionStatusBadge status="APPROVED" />)
    const approvedClass = screen.getByText('Aprobado').className

    rerender(<SubmissionStatusBadge status="REJECTED" />)
    const rejectedClass = screen.getByText('Rechazado').className

    expect(approvedClass).not.toBe(rejectedClass)
  })

  it('no todos los estados tienen el mismo color: DRAFT es distinto a APPROVED', () => {
    const { rerender } = render(<SubmissionStatusBadge status="DRAFT" />)
    const draftClass = screen.getByText('Borrador').className

    rerender(<SubmissionStatusBadge status="APPROVED" />)
    const approvedClass = screen.getByText('Aprobado').className

    expect(draftClass).not.toBe(approvedClass)
  })
})

describe('TemplateStatusBadge', () => {
  it('renderiza el label "Activo" para estado ACTIVE', () => {
    render(<TemplateStatusBadge status="ACTIVE" />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('renderiza el label "Borrador" para estado DRAFT', () => {
    render(<TemplateStatusBadge status="DRAFT" />)
    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('renderiza el label "Archivado" para estado ARCHIVED', () => {
    render(<TemplateStatusBadge status="ARCHIVED" />)
    expect(screen.getByText('Archivado')).toBeInTheDocument()
  })

  it('ACTIVE y ARCHIVED tienen clases distintas (colores distintos)', () => {
    const { rerender } = render(<TemplateStatusBadge status="ACTIVE" />)
    const activeClass = screen.getByText('Activo').className

    rerender(<TemplateStatusBadge status="ARCHIVED" />)
    const archivedClass = screen.getByText('Archivado').className

    expect(activeClass).not.toBe(archivedClass)
  })

  it('DRAFT y ACTIVE tienen clases distintas (colores distintos)', () => {
    const { rerender } = render(<TemplateStatusBadge status="DRAFT" />)
    const draftClass = screen.getByText('Borrador').className

    rerender(<TemplateStatusBadge status="ACTIVE" />)
    const activeClass = screen.getByText('Activo').className

    expect(draftClass).not.toBe(activeClass)
  })
})
