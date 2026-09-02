--Query personalizada. CdQry = 152
Select distinct
	Query.AjusteEstoque
,	Query.CdObj
,	Query.CodLin
,	Query.EntradaFabricacao
,	Query.EntradaRetorno
,	Query.EntradaTransformacao
,	Query.Linha
,	Query.Mae
,	Query.Nivel
,	Query.NmObj
,	Query.OutrasEntradas
,	Query.OutrasSaidas
,	Query.SaidaBenef
,	Query.SaidaConsumo
,	Query.SaidaExpedicao
,	Query.SaldoFin
,	Query.SaldoIni
,	Query.NrObjOrd001
,	Query.NrObjOrd002
,	Query.NrObjOrd003
,	Query.NrObjOrd004
,	Query.NrObjOrd005
,	Query.NrObjOrd006
,	Query.NrObjOrd007
,	Query.NrObjOrd008
,	Query.NrObjOrd009
From	(
Select top 100000000
	Obj.CdObj
,	Obj.NmObj
,	Mae						= Obj.CdObjMae
,	Nivel					= Obj.NrObjNiv
,	CodLin					= ObjLin.CdObj
,	Linha					= ObjLin.NmObj
,	ObjV.NrObjOrd001
,	ObjV.NrObjOrd002
,	ObjV.NrObjOrd003
,	ObjV.NrObjOrd004
,	ObjV.NrObjOrd005
,	ObjV.NrObjOrd006
,	ObjV.NrObjOrd007
,	ObjV.NrObjOrd008
,	ObjV.NrObjOrd009
,	SaldoIni				= Convert(Decimal(19, 1), IsNull((
													Select	Qt = Sum((Let1.TpLetSin - 2) * Let1.QtLet)
													From	TbLet Let1
													Where	Let1.CdUne = 21
													and	Let1.CdCcs = 137
													and	Let1.CdTdo001 = 2
													--and	Let1.CdTdo = 2
													and	Let1.DtLet < '20260502'
													and	Let1.CdObj = Obj.CdObj
												), 0))
,	EntradaFabricacao			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop in (117, 404, 540, 647) Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	EntradaTransformacao		= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop in (174, 421, 572) Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	EntradaRetorno			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop = 161 Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	SaidaExpedicao			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop = 72 Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	SaidaConsumo			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop = 176 Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
--,	OutrasEntradas			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop not in (62, 72, 117, 174, 161, 170, 176, 404, 540, 421, 572, 411) and Let.TpLetSin = 3 Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
--Diogo 23/08/2023 - Mostrar Ajuste de estoque em outras entradas
,	OutrasEntradas			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop not in (72, 117, 174, 161, 170, 176, 404, 540, 421, 572, 411,647) and Let.TpLetSin = 3 Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	SaidaBenef				= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop in (170, 411) Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	OutrasSaidas			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop not in (62, 72, 117, 174, 161, 170, 176, 404, 540, 421, 572, 411) and Let.TpLetSin = 1 Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	AjusteEstoque			= Convert(Decimal(19, 1), Sum(Case When Tra.CdTop = 62 Then (Let.TpLetSin - 2) * Let.QtLet Else 0. End))
,	SaldoFin				= Convert(Decimal (19, 0), IsNull((
																Select	Qt = Sum((Let1.TpLetSin - 2) * Let1.QtLet)
																From	TbLet Let1
																Where	Let1.CdUne = 21
																and	Let1.CdCcs = 137
																and	Let1.CdTdo001 = 2
																--and	Let1.CdTdo = 2
																and	Let1.DtLet <= '20260502'
																and	Let1.CdObj = Obj.CdObj
																), 0))
From		TbObj Obj
join		TbObj ObjLin on ObjLin.CdObj = Obj.CdObjLin
join		VwObj ObjV on ObjV.CdObj = Obj.CdObj
join		TbArvObj ArvObj on ArvObj.CdObjFil = Obj.CdObj and ArvObj.CdObj = 1902
left join	TbLet Let on Let.CdObj = Obj.CdObj and Let.CdUne = 21 and	Let.CdCcs = 137 and Let.CdTdo001 = 2 and Let.DtLet between '20260502' and '20260502'
--left join	TbLet Let on Let.CdObj = Obj.CdObj and Let.CdUne = 21 and	Let.CdCcs = 137 and Let.CdTdo = 2 and Let.DtLet between '20260502' and '20260502'
left join	TbTra Tra on Tra.CdTra = Let.TransacaoID
left join	TbTop Top1 on Top1.CdTop = Tra.CdTop
Where		 
     Obj.TpObj = 4
Group by
	Obj.CdObj
,	Obj.NmObj
,	Obj.CdObjMae
,	Obj.NrObjNiv
,	ObjLin.CdObj
,	ObjLin.NmObj
,	ObjV.NrObjOrd001
,	ObjV.NrObjOrd002
,	ObjV.NrObjOrd003
,	ObjV.NrObjOrd004
,	ObjV.NrObjOrd005
,	ObjV.NrObjOrd006
,	ObjV.NrObjOrd007
,	ObjV.NrObjOrd008
,	ObjV.NrObjOrd009
Order by
	ObjV.NrObjOrd001
,	ObjV.NrObjOrd002
,	ObjV.NrObjOrd003
,	ObjV.NrObjOrd004
,	ObjV.NrObjOrd005
,	ObjV.NrObjOrd006
,	ObjV.NrObjOrd007
,	ObjV.NrObjOrd008
,	ObjV.NrObjOrd009

	) Query
Order by
	Query.NrObjOrd001
,	Query.NrObjOrd002
,	Query.NrObjOrd003
,	Query.NrObjOrd004
,	Query.NrObjOrd005
,	Query.NrObjOrd006
,	Query.NrObjOrd007
,	Query.NrObjOrd008
,	Query.NrObjOrd009
------------------------------------------------------------------