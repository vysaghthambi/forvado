import type React from 'react'

/** Standard form input — used across create/edit dialogs and forms */
export const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .15s',
}

/** Uppercase label above a form field */
export const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--muted-clr)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}
