import { redirect } from "next/navigation";
import { TIPO_PADRAO } from "@/lib/analises/registro";

export default function AnalisesIndexPage() {
    redirect(`/producao/analises/${TIPO_PADRAO}`);
}