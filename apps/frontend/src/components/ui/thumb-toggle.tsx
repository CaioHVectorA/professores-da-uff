import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

interface ThumbToggleProps {
    value: boolean | null
    onChange: (value: boolean) => void
    className?: string
}

export function ThumbToggle({ value, onChange, className }: ThumbToggleProps) {
    return (
        <div className={cn("flex gap-2", className)}>
            <button
                type="button"
                onClick={() => onChange(true)}
                className={cn(
                    "p-2 rounded-full transition-colors",
                    value === true ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                )}
            >
                {value === true ? <HandThumbUpSolid className="w-6 h-6" /> : <HandThumbUpIcon className="w-6 h-6" />}
            </button>
            <button
                type="button"
                onClick={() => onChange(false)}
                className={cn(
                    "p-2 rounded-full transition-colors",
                    value === false ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                )}
            >
                {value === false ? <HandThumbDownSolid className="w-6 h-6" /> : <HandThumbDownIcon className="w-6 h-6" />}
            </button>
        </div>
    )
}
