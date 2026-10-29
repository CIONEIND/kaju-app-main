import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";
import type { DetalheAnalise } from "@/lib/analises/tipos";

/* ── Paleta Kaju ─────────────────────────────────────────── */
const BRAND = "#1e3a5f";
const INK = "#0f1621";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const SURFACE = "#f8fafc";
const OURO = "#B08D57";

/* ── Assets em public/timbrado/ ──────────────────────────── */
const CABECALHO = "/timbrado/cione-arvore.png";
const LOGO = "/timbrado/cione-logo.png";
const MARCA_DAGUA = "/timbrado/jangada-marca.png";

/* ── Calibragem em pontos (1pt = 1,333px da prévia) ──────── */
const PADDING_TOPO = 120;
const PADDING_BASE = 131;
const PADDING_LATERAL = 40;
const MARCA_OPACIDADE = 0.1;

const EMPRESA = {
    nome: "COMPANHIA INDUSTRIAL DE ÓLEOS DO NORDESTE",
    linhas: [
        "Rua Professor Leite Gondim, 190 - Padre Andrade · Fone: (85) 3311.6868 · Fax: (85) 3235.2406",
        "CEP: 60360-428 · Fortaleza - Ceará - Brasil · CNPJ: 07.199.490/0001-46 · CGF: 06.107.458-7",
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
        paddingTop: PADDING_TOPO,
        paddingHorizontal: PADDING_LATERAL,
        paddingBottom: PADDING_BASE,
        fontFamily: "Helvetica",
        fontSize: 9,
        color: INK,
    },

    /* Cabeçalho — apenas a marca CIONE (imagem já traz árvore e filetes) */
    cabecalho: {
        position: "absolute",
        top: 28,
        left: PADDING_LATERAL,
        width: 515,
        height: 72,
        objectFit: "contain",
    },

    /* Jangada — camada de fundo, atrás do conteúdo */
    marcaDagua: {
        position: "absolute",
        top: 322,
        left: 131,
        width: 332,
        height: 265,
        opacity: MARCA_OPACIDADE,
    },

    /* ── Corpo ─────────────────────────────────────────────── */
    filete: { height: 0.75, backgroundColor: BRAND, marginBottom: 16 },

    titulo: {
        fontSize: 17,
        fontFamily: "Helvetica-Bold",
        color: BRAND,
        letterSpacing: 0.2,
    },
    subtitulo: { fontSize: 8.5, color: MUTED, marginTop: 3 },

    secao: { marginTop: 16 },
    secaoTitulo: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: BRAND,
        textTransform: "uppercase",
        letterSpacing: 0.8,
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
        marginBottom: 7,
    },
    grupoTitulo: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: INK,
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    grupoLinha: {
        flexGrow: 1,
        height: 0.5,
        backgroundColor: LINE,
        marginLeft: 8,
    },

    /* Espaçamento por margem — react-pdf não suporta gap */
    metricas: { flexDirection: "row" },
    metrica: {
        flexGrow: 1,
        flexBasis: 0,
        marginRight: 7,
        borderRadius: 3,
        paddingVertical: 7,
        paddingHorizontal: 7,
        backgroundColor: SURFACE,
        borderWidth: 0.5,
        borderColor: LINE,
    },
    ultimaMetrica: { marginRight: 0 },
    metricaRotulo: {
        fontSize: 6,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 0.3,
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
        marginRight: 7,
        borderRadius: 3,
        paddingVertical: 7,
        paddingHorizontal: 7,
        backgroundColor: BRAND,
        borderWidth: 0.5,
        borderColor: BRAND,
    },
    metricaRotuloDestaque: {
        fontSize: 6,
        color: "#bfdbfe",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    metricaValorDestaque: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
        marginTop: 3,
    },

    /* ── Rodapé institucional ──────────────────────────────── */
    rodape: {
        position: "absolute",
        bottom: 21,
        left: PADDING_LATERAL,
        right: PADDING_LATERAL,
    },
    rodapeFilete: { height: 0.75, backgroundColor: OURO, marginBottom: 7 },
    rodapeInstitucional: { flexDirection: "row", alignItems: "flex-start" },
    rodapeTextoCol: { flex: 1, paddingRight: 12 },
    empresaNome: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: "#1a1a1a",
        letterSpacing: 0.2,
    },
    empresaLinha: {
        fontSize: 6.4,
        color: MUTED,
        marginTop: 2.5,
        lineHeight: 1.3,
    },
    logo: { width: 42, height: 42 },
    rodapeDivisoria: {
        height: 0.5,
        backgroundColor: LINE,
        marginTop: 7,
        marginBottom: 5,
    },
    rodapeMeta: { flexDirection: "row", justifyContent: "space-between" },
    rodapeMetaTexto: { fontSize: 6.4, color: MUTED },
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
            author="Kaju App"
            subject={`Análise ${tipo} #${detalhe.id}`}
        >
            <Page size="A4" style={s.page}>
                {/* 1º: marca d'água, atrás de tudo */}
                <Image fixed src={MARCA_DAGUA} style={s.marcaDagua} />

                {/* 2º: cabeçalho institucional */}
                <Image fixed src={CABECALHO} style={s.cabecalho} />

                {/* 3º: corpo */}
                <View style={s.filete} />

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
                            {g.itens.map((i, idx) => {
                                const destaque = ehDestaque(i.label);
                                const ultima = idx === g.itens.length - 1;

                                return (
                                    <View
                                        key={i.label}
                                        style={[
                                            destaque ? s.metricaDestaque : s.metrica,
                                            ultima ? s.ultimaMetrica : {},
                                        ]}
                                    >
                                        <Text
                                            style={
                                                destaque ? s.metricaRotuloDestaque : s.metricaRotulo
                                            }
                                        >
                                            {i.label}
                                        </Text>
                                        <Text
                                            style={destaque ? s.metricaValorDestaque : s.metricaValor}
                                        >
                                            {i.valor}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* 4º: rodapé institucional, repete em todas as páginas */}
                <View style={s.rodape} fixed>
                    <View style={s.rodapeFilete} />

                    <View style={s.rodapeInstitucional}>
                        <View style={s.rodapeTextoCol}>
                            <Text style={s.empresaNome}>{EMPRESA.nome}</Text>
                            {EMPRESA.linhas.map((linha) => (
                                <Text key={linha} style={s.empresaLinha}>
                                    {linha}
                                </Text>
                            ))}
                        </View>

                        <Image src={LOGO} style={s.logo} />
                    </View>

                    <View style={s.rodapeDivisoria} />

                    <View style={s.rodapeMeta}>
                        <Text style={s.rodapeMetaTexto}>
                            {`${detalhe.titulo} · emitido em ${emitidoEm}`}
                        </Text>
                        <Text
                            style={s.rodapeMetaTexto}
                            render={({ pageNumber, totalPages }) =>
                                `página ${pageNumber} de ${totalPages}`
                            }
                        />
                    </View>
                </View>
            </Page>
        </Document>
    );
}