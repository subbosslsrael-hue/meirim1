import React from 'react'
import { Star } from 'lucide-react'

export default function Stars({ value = 0, size = 13 }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= value ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
          }
        />
      ))}
    </span>
  )
}
