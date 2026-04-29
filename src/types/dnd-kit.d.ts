import React from 'react'

declare global {
  namespace JSX {
    type Element = React.JSX.Element
    type ElementClass = React.Component
    type IntrinsicElements = React.JSX.IntrinsicElements
  }
}
