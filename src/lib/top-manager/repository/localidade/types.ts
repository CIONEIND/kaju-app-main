export enum TipoLocalidade {
    PAIS = 1,
    REGIAO = 2,
    ESTADO = 3,
    CIDADE = 4,
    BAIRRO = 5
}

export interface Localidade {
    CdLoc?: number;
    NmLoc?: string; //nome 
    SgLoc?: string | null; // sigla
    TpLoc?: number; // tipo

    NrLocDDD?: number | null; // ddd, ex: 85
    NrLocDDI?: string | null; // ddi (Discagem Direta Internacional), 55 para brasil, 1 para estados unidos
    NrLocIbg?: number | null;
    NrLocBcb?: number | null;

    CdLocMae?: number;

    TtLoc?: string;

    NrLocNiv?: number;

    CdLoc001?: number;
    CdLoc002?: number;
    CdLoc003?: number;
    CdLoc004?: number;
    CdLoc005?: number;

    NrLocOrd001?: number;
    NrLocOrd002?: number;
    NrLocOrd003?: number;
    NrLocOrd004?: number;
    NrLocOrd005?: number;

    LocalidadeID_Correspondente?: number | null;

    SiteID?: number;

    Timestamp?: Buffer;
}