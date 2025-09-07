import { useState } from "react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
    value: number
    onChange: (value: number) => void
    max?: number
    className?: string
}

export function StarRating({ value, onChange, max = 5, className }: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState(0)

    return (
        <div className={cn("flex gap-1", className)}>
            {Array.from({ length: max }, (_, i) => {
                const starValue = i + 1
                const isFilled = starValue <= (hoverValue || value)

                return (
                    <button
                        key={i}
                        type="button"
                        className={cn(
                            "text-3xl w-8 h-8 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded",
                            isFilled ? "text-yellow-500" : "text-gray-300"
                        )}
                        onMouseEnter={() => setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(0)}
                        onClick={() => onChange(starValue)}
                    >
                        {isFilled ? "★" : "☆"}
                    </button>
                )
            })}
        </div>
    )
}
