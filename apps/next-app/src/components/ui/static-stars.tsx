import { cn } from "@/lib/utils"

interface StaticStarsProps {
    value: number
    max?: number
    className?: string
}

export function StaticStars({ value, max = 5, className }: StaticStarsProps) {
    return (
        <div className={cn("flex gap-1", className)}>
            {Array.from({ length: max }, (_, i) => {
                const starValue = i + 1
                const isFilled = starValue <= value

                return (
                    <span
                        key={i}
                        className={cn(
                            "text-xl w-6 h-6",
                            isFilled ? "text-yellow-500" : "text-gray-300"
                        )}
                    >
                        {isFilled ? "★" : "☆"}
                    </span>
                )
            })}
        </div>
    )
}
