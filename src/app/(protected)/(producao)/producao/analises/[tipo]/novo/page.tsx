// src/app/(producao)/producao/analises/[tipo]/novo/page.tsx
export default async function NovaAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string }>; // Next 14: use params sem Promise
}) {
    const { tipo } = await params;

    return (
        <main className="p-6">
            <h1 className="text-xl font-semibold text-gray-900">Formulário {tipo}</h1>
            <p className="mt-2 text-sm text-gray-500">
                Em construção .
            </p>
        </main>
    );
}