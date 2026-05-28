import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Plus,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Banknote,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Caixa = Database["public"]["Tables"]["caixa"]["Row"];
type Tipo = "entrada" | "saida" | "sangria";

const tipoLabel: Record<Tipo, string> = {
  entrada: "Entrada",
  saida: "Saída",
  sangria: "Sangria",
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

export function CaixaPage() {
  const [items, setItems] = useState<Caixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<Tipo>("entrada");
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("caixa")
      .select("*")
      .order("data_hora", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Caixa[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const today = useMemo(() => items.filter((i) => isToday(i.data_hora)), [items]);
  const totals = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    for (const t of today) {
      const v = Number(t.valor);
      if (t.tipo === "entrada") entradas += v;
      else saidas += v;
    }
    return { entradas, saidas, saldo: entradas - saidas };
  }, [today]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (!descricao.trim() || !Number.isFinite(v) || v <= 0) {
      toast.error("Preencha descrição e valor válido.");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Sessão expirada.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("caixa").insert({
      user_id: userData.user.id,
      descricao: descricao.trim(),
      tipo,
      valor: v,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDescricao("");
    setValor("");
    setTipo("entrada");
    toast.success("Movimentação registrada");
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("caixa").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removido");
      load();
    }
  }

  function handleExport() {
    const month = items.filter((i) => isThisMonth(i.data_hora));
    if (month.length === 0) {
      toast.error("Sem movimentações neste mês.");
      return;
    }
    const rows = month.map((i) => ({
      Data: new Date(i.data_hora).toLocaleString("pt-BR"),
      Descrição: i.descricao,
      Tipo: tipoLabel[i.tipo as Tipo],
      Valor: Number(i.valor),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Caixa");
    const now = new Date();
    const fname = `caixa-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.xlsx`;
    XLSX.writeFile(wb, fname);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Wallet className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Controle de Caixa
            </h1>
            <p className="text-sm text-muted-foreground">
              Fluxo financeiro diário da farmácia.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar para Excel
        </Button>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Entradas hoje"
          value={brl(totals.entradas)}
          icon={<ArrowDownCircle className="h-5 w-5" />}
          tone="green"
        />
        <SummaryCard
          label="Saídas / Sangrias"
          value={brl(totals.saidas)}
          icon={<ArrowUpCircle className="h-5 w-5" />}
          tone="red"
        />
        <SummaryCard
          label="Saldo final"
          value={brl(totals.saldo)}
          icon={<Banknote className="h-5 w-5" />}
          tone="blue"
        />
      </div>

      {/* Formulário rápido */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border bg-card p-4 mb-6 grid grid-cols-1 md:grid-cols-[1fr_160px_160px_auto] gap-3 items-end"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: Venda balcão, troco, fornecedor…"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
            <SelectTrigger id="tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
              <SelectItem value="sangria">Sangria</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <Button type="submit" disabled={saving} className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar
        </Button>
      </form>

      {/* Lista de movimentações do dia */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">Movimentações de hoje</h2>
          <span className="text-xs text-muted-foreground">
            {today.length} {today.length === 1 ? "registro" : "registros"}
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : today.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada hoje.
          </div>
        ) : (
          <ul className="divide-y">
            {today.map((t) => {
              const isIn = t.tipo === "entrada";
              return (
                <li
                  key={t.id}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40"
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center ${
                      isIn
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownCircle className="h-5 w-5" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.descricao}</div>
                    <div className="text-xs text-muted-foreground">
                      {tipoLabel[t.tipo as Tipo]} ·{" "}
                      {new Date(t.data_hora).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    className={`font-semibold tabular-nums ${
                      isIn ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isIn ? "+" : "−"} {brl(Number(t.valor))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(t.id)}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "green" | "red" | "blue";
}) {
  const toneClasses =
    tone === "green"
      ? "from-emerald-50 to-emerald-100/40 text-emerald-700 border-emerald-200"
      : tone === "red"
      ? "from-red-50 to-red-100/40 text-red-700 border-red-200"
      : "from-sky-50 to-sky-100/40 text-sky-700 border-sky-200";
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${toneClasses}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide opacity-80">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}