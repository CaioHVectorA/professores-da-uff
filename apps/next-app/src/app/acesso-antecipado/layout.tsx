import { Analytics } from '@vercel/analytics/react'

export default function AcessoAntecipadoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
            <Analytics />
        </>
    );
}
