

export interface TipoLogradouro {
    CdTlg: number,
    NmTlg: string,
    SgTlg: string,
    SiteID: number,
    Timestamp: any
}

export interface Logradouro {
    CdLgr?: number,
    NmLgr?: string,
    CdTlg?: number,
    SiteId?: number,
    Timestamp?: any
}

export interface LigacaoLogradouro {
    CdLlg?: number,
    CdLgr?: number,
    CdLoc?: number,
    TtLlg?: string,
    Timestamp?: any
}