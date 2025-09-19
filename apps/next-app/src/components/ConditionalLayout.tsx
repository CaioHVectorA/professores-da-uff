'use client'

import { usePathname } from 'next/navigation'
import LayoutWithSidebar from './LayoutWithSidebar'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    const isAcessoAntecipado = pathname?.includes('/acesso-antecipado')

    if (isAcessoAntecipado) {
        return <>{children}</>
    }

    return <LayoutWithSidebar>{children}</LayoutWithSidebar>
}
