import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";
import type { DetalheAnalise } from "@/lib/analises/tipos";

const BRAND = "#1e3a5f";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
    page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#0f172a" },
    eyebrow: { fontSize: 7, letterSpacing: 1.2, color: MUTED, textTransform: "uppercase" },
    titulo: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BRAND, marginTop: 4 },
    subtitulo: { fontSize: 9, color: MUTED, marginTop: 3 },

    bloco: { marginTop: 16 },
    blocoTitulo: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    par: {
        width: "50%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3,
        paddingRight: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: BORDER,
    },
    rotulo: { fontSize: 8.5, color: MUTED },
    valor: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },

    metricas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    metrica: {
        width: "23%",
        borderWidth: 0.5,
        borderColor: BORDER,
        borderRadius: 4,
        padding: 6,
    },
    metricaLabel: { fontSize: 6.5, color: MUTED, textTransform: "uppercase" },
    metricaValor: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },

    rodape: {
        position: "absolute",
        bottom: 18,
        left: 32,
        right: 32,
        fontSize: 6.5,
        color: "#94a3b8",
        textAlign: "center",
    },
});

export function AnalisePDF({
    detalhe,
    tipo,
}: {
    detalhe: DetalheAnalise;
    tipo: string;
}) {
    return (
        <Document
            title={detalhe.titulo}
            author="Kaju App"
            subject={`Análise ${tipo} #${detalhe.id}`}
        >
            <Page size="A4" style={s.page}>
                <Text style={s.eyebrow}>Kaju App · Produção · {tipo}</Text>
                <Text style={s.titulo}>{detalhe.titulo}</Text>
                <Text style={s.subtitulo}>{detalhe.subtitulo}</Text>

                <View style={s.bloco}>
                    <Text style={s.blocoTitulo}>Identificação</Text>
                    <View style={s.grid}>
                        {detalhe.identificacao.map((i) => (
                            <View key={i.label} style={s.par}>
                                <Text style={s.rotulo}>{i.label}</Text>
                                <Text style={s.valor}>{i.valor}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {detalhe.grupos.map((g) => (
                    <View key={g.titulo} style={s.bloco}>
                        <Text style={s.blocoTitulo}>{g.titulo}</Text>
                        <View style={s.metricas}>
                            {g.itens.map((i) => (
                                <View key={i.label} style={s.metrica}>
                                    <Text style={s.metricaLabel}>{i.label}</Text>
                                    <Text style={s.metricaValor}>{i.valor}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <Text
                    style={s.rodape}
                    fixed
                    render={({ pageNumber, totalPages }) =>
                        `Análise ${tipo} #${detalhe.id} · página ${pageNumber} de ${totalPages}`
                    }
                />
            </Page>
        </Document>
    );
}