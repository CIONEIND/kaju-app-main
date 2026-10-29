import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";
import type { DetalheAnalise } from "@/lib/analises/tipos";

/* ── Paleta extraída do timbrado ───────────────────────────── */
const OURO = "#B08D57";
const INK = "#1a1a1a";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const SURFACE = "#fafafa";

/* ── Assets em /public/timbrado/ ───────────────────────────── */
const MARCA_DAGUA = "/timbrado/jangada-marca.png";
const LOGO = "/timbrado/cione-logo.png";
const ARVORE = "/timbrado/cione-arvore.png";

/** Opacidade da marca d'água JANGADA. 0.05 = quase imperceptível. */
const OPACIDADE_MARCA = 0.055;

const EMPRESA = {
    nome: "COMPANHIA INDUSTRIAL DE ÓLEOS DO NORDESTE",
    linhas: [
        "Rua Professor Leite Gondim, 190 - Padre Andrade",
        "Fone: (85) 3311.6868 - Fax: (85) 3235.2406",
        "CEP: 60360-428 · Fortaleza - Ceará - Brasil",
        "CNPJ: 07.199.490/0001-46 · CGF: 06.107.458-7",
        "www.cione.com.br · cione@cione.com.br",
    ],
};

const DESTAQUES = ["média", "media", "resultado", "total"];

function ehDestaque(label: string): boolean {
    const alvo = label.toLowerCase().trim();
    return DESTAQUES.some((d) => alvo.startsWith(d));
}

const s = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 58,
        paddingHorizontal: 34,
        fontFamily: "Helvetica",
        fontSize: 9,
        color: INK,
    },

    /* Marca d'água — camada de fundo, repete em todas as páginas */
    marcaAgua: {
        position: "absolute",
        top: 210,
        left: 78,
        width: 380,
        opacity: OPACIDADE_MARCA,
    },

    /* Filete superior dourado */
    filete: { height: 1.2, backgroundColor: OURO, marginBottom: 12 },

    /* Bloco de marca central: árvore + CIONE serifado */
    marcaCentro: { alignItems: "center", marginBottom: 8 },
    arvore: { width: 26, height: 26, marginBottom: 3 },
    cione: {
        fontFamily: "Times-Roman",
        fontSize: 30,
        letterSpacing: 7,
        color: OURO,
    },
    cioneSub: {
        fontSize: 5.6,
        letterSpacing: 2.6,
        color: OURO,
        textTransform: "uppercase",
        marginTop: 1,
    },
    reguaOuro: {
        height: 0.7,
        backgroundColor: OURO,
        marginTop: 10,
        marginBottom: 12,
    },

    /* Bloco institucional: contato à esquerda, logo à direita */
    institucional: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
    contato: { flex: 1, justifyContent: "center", paddingTop: 2 },
    empresaNome: {
        fontSize: 8.6,
        fontFamily: "Helvetica-Bold",
        color: INK,
        letterSpacing: 0.3,
    },
    empresaLinha: { fontSize: 6.8, color: MUTED, marginTop: 2.5, lineHeight: 1.35 },
    logo: { width: 62, height: 62 },

    divisoria: { height: 0.7, backgroundColor: OURO, marginTop: 14, marginBottom: 18 },

    /* Corpo do relatório */
    titulo: {
        fontSize: 17,
        fontFamily: "Helvetica-Bold",
        color: INK,
        letterSpacing: -0.2,
    },
    subtitulo: { fontSize: 8.4, color: MUTED, marginTop: 3 },

    secao: { marginTop: 16 },
    secaoTitulo: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: OURO,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 7,
    },

    idGrid: { flexDirection: "row", flexWrap: "wrap" },
    idCelula: {
        width: "50%",
        paddingRight: 14,
        paddingVertical: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: LINE,
    },
    idRotulo: {
        fontSize: 6.5,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    idValor: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: INK,
        marginTop: 2,
    },

    grupo: { marginTop: 14 },
    grupoTopo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginBottom: 7,
    },
    grupoTitulo: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: INK,
        textTransform: "uppercase",
        letterSpacing: 0.9,
    },
    grupoLinha: { flexGrow: 1, height: 0.5, backgroundColor: LINE },

    metricas: { flexDirection: "row", gap: 7 },
    metrica: {
        flexGrow: 1,
        flexBasis: 0,
        borderRadius: 3,
        paddingVertical: 7,
        paddingHorizontal: 7,
        backgroundColor: SURFACE,
        borderWidth: 0.5,
        borderColor: LINE,
    },
    metricaRotulo: {
        fontSize: 6,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    metricaValor: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: INK,
        marginTop: 3,
    },

    metricaDestaque: {
        flexGrow: 1,
        flexBasis: 0,
        borderRadius: 3,
        paddingVertical: 7,
        paddingHorizontal: 7,
        backgroundColor: OURO,
        borderWidth: 0.5,
        borderColor: OURO,
    },
    metricaRotuloDestaque: {
        fontSize: 6,
        color: "#f4ead8",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    metricaValorDestaque: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
        marginTop: 3,
    },

    /* Rodapé */
    rodape: {
        position: "absolute",
        bottom: 24,
        left: 34,
        right: 34,
        borderTopWidth: 0.7,
        borderTopColor: OURO,
        paddingTop: 6,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    rodapeTexto: { fontSize: 6.5, color: MUTED },
});

export function AnalisePDF({
    detalhe,
    tipo,
}: {
    detalhe: DetalheAnalise;
    tipo: string;
}) {
    const agora = new Date();
    const emitidoEm = `${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString(
        "pt-BR",
        { hour: "2-digit", minute: "2-digit" },
    )}`;

    return (
        <Document
            title={detalhe.titulo}
            author={EMPRESA.nome}
            subject={`Análise ${tipo} #${detalhe.id}`}
        >
            <Page size="A4" style={s.page}>
                {/* ── Camada de fundo: marca d'água ── */}
                <Image fixed src={MARCA_DAGUA} style={s.marcaAgua} />

                {/* ── Timbrado ── */}
                <View style={s.filete} />

                <View style={s.marcaCentro}>
                    <Image src={ARVORE} style={s.arvore} />
                    <Text style={s.cione}>CIONE</Text>
                    <Text style={s.cioneSub}>Desde 1962</Text>
                </View>

                <View style={s.reguaOuro} />

                <View style={s.institucional}>
                    <View style={s.contato}>
                        <Text style={s.empresaNome}>{EMPRESA.nome}</Text>
                        {EMPRESA.linhas.map((linha) => (
                            <Text key={linha} style={s.empresaLinha}>
                                {linha}
                            </Text>
                        ))}
                    </View>
                    <Image src={LOGO} style={s.logo} />
                </View>

                <View style={s.divisoria} />

                {/* ── Corpo do relatório ── */}
                <Text style={s.titulo}>{detalhe.titulo}</Text>
                <Text style={s.subtitulo}>{detalhe.subtitulo}</Text>

                <View style={s.secao}>
                    <Text style={s.secaoTitulo}>Identificação</Text>
                    <View style={s.idGrid}>
                        {detalhe.identificacao.map((i) => (
                            <View key={i.label} style={s.idCelula}>
                                <Text style={s.idRotulo}>{i.label}</Text>
                                <Text style={s.idValor}>{i.valor}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {detalhe.grupos.map((g) => (
                    <View key={g.titulo} style={s.grupo}>
                        <View style={s.grupoTopo}>
                            <Text style={s.grupoTitulo}>{g.titulo}</Text>
                            <View style={s.grupoLinha} />
                        </View>

                        <View style={s.metricas}>
                            {g.itens.map((i) => {
                                const destaque = ehDestaque(i.label);

                                return (
                                    <View
                                        key={i.label}
                                        style={destaque ? s.metricaDestaque : s.metrica}
                                    >
                                        <Text
                                            style={
                                                destaque ? s.metricaRotuloDestaque : s.metricaRotulo
                                            }
                                        >
                                            {i.label}
                                        </Text>
                                        <Text
                                            style={
                                                destaque ? s.metricaValorDestaque : s.metricaValor
                                            }
                                        >
                                            {i.valor}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* ── Rodapé ── */}
                <View style={s.rodape} fixed>
                    <Text style={s.rodapeTexto}>
                        {`${detalhe.titulo} · emitido em ${emitidoEm}`}
                    </Text>
                    <Text
                        style={s.rodapeTexto}
                        render={({ pageNumber, totalPages }) =>
                            `www.cione.com.br · página ${pageNumber} de ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
}