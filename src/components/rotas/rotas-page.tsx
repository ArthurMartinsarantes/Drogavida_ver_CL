import { useEffect, useMemo, useState } from "react";
import {
  Map as MapIcon,
  Plus,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Trash2,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Entrega = Database["public"]["Tables"]["entregas"]["Row"];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function RotasPage() {
  const [items, setItems] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [dia, setDia] = useState<number>(new Date().getDate());
  const [openAdd, setOpenAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entregas")
      .select("*")
      .order("bairro", { ascending: true })
      .order("ordem_rota", { ascending: true });
    if (error) toast.error("Erro ao carregar entregas");
    else setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const doDia = useMemo(
    () => items.filter((e) => e.dia_vencimento === dia),
    [items, dia],
  );

  const grupos = useMemo(() => {
    const map = new Map<string, Entrega[]>();
    for (const e of doDia) {
      const arr = map.get(e.bairro) ?? [];
      arr.push(e);
      map.set(e.bairro, arr);
    }
    for (const arr of map.values())
      arr.sort((a, b) => a.ordem_rota - b.ordem_rota);
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [doDia]);

  const totalDia = doDia.length;
  const entreguesDia = doDia.filter((e) => e.status === "entregue").length;

  const move = async (bairro: string, index: number, dir: -1 | 1) => {
    const arr = grupos.find(([b]) => b === bairro)?.[1] ?? [];
    const target = arr[index + dir];
    const current = arr[index];
    if (!target || !current) return;
    // swap ordem_rota
    const a = current.ordem_rota;
    const b = target.ordem_rota;
    const newOrderA = a === b ? a + dir : b;
    const newOrderB = a === b ? a : a;
    setItems((prev) =>
      prev.map((e) =>
        e.id === current.id
          ? { ...e, ordem_rota: newOrderA }
          : e.id === target.id
            ? { ...e, ordem_rota: newOrderB }
            : e,
      ),
    );
    const [r1, r2] = await Promise.all([
      supabase
        .from("entregas")
        .update({ ordem_rota: newOrderA })
        .eq("id", current.id),
      supabase
        .from("entregas")
        .update({ ordem_rota: newOrderB })
        .eq("id", target.id),
    ]);
    if (r1.error || r2.error) {
      toast.error("Não foi possível salvar a ordem");
      load();
    }
  };

  const toggleStatus = async (e: Entrega) => {
    const novo = e.status === "entregue" ? "pendente" : "entregue";
    setItems((prev) =>
      prev.map((x) => (x.id === e.id ? { ...x, status: novo } : x)),
    );
    const { error } = await supabase
      .from("entregas")
      .update({ status: novo })
      .eq("id", e.id);
    if (error) {
      toast.error("Erro ao atualizar entrega");
      load();
    } else if (novo === "entregue") {
      toast.success("Entrega concluída");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta entrega?")) return;
    const { error } = await supabase.from("entregas").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    toast.success("Entrega removida");
    setItems((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <MapIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Rotas de Entregas
            </h1>
            <p className="text-sm text-muted-foreground">
              Planejamento mensal agrupado por bairro.
            </p>
          </div>
        </div>
        <AddEntregaDialog
          open={openAdd}
          setOpen={setOpenAdd}
          defaultDia={dia}
          existing={items}
          onCreated={(novo) => setItems((prev) => [...prev, novo])}
        />
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Dia do mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {DAYS.map((d) => {
              const count = items.filter((e) => e.dia_vencimento === d).length;
              const active = d === dia;
              return (
                <button
                  key={d}
                  onClick={() => setDia(d)}
                  className={cn(
                    "relative flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : "bg-card hover:border-primary/40 hover:bg-accent",
                  )}
                >
                  <span className="font-semibold">{d}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "mt-0.5 text-[10px]",
                        active ? "opacity-90" : "text-muted-foreground",
                      )}
                    >
                      {count} {count === 1 ? "ent." : "ent."}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Dia <span className="font-medium text-foreground">{dia}</span> —{" "}
              {totalDia} {totalDia === 1 ? "entrega" : "entregas"}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {entreguesDia}/{totalDia}
              </span>{" "}
              concluídas
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma entrega para o dia {dia}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grupos.map(([bairro, entregas]) => (
            <Card key={bairro}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <CardTitle className="text-base">{bairro}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {entregas.length}{" "}
                  {entregas.length === 1 ? "parada" : "paradas"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {entregas.map((e, i) => {
                  const entregue = e.status === "entregue";
                  return (
                    <div
                      key={e.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border bg-card p-2.5 transition-colors",
                        entregue && "border-primary/30 bg-primary/5",
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => move(bairro, i, -1)}
                          disabled={i === 0}
                          aria-label="Subir"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => move(bairro, i, 1)}
                          disabled={i === entregas.length - 1}
                          aria-label="Descer"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            entregue && "text-muted-foreground line-through",
                          )}
                        >
                          {e.nome_cliente}
                        </p>
                      </div>
                      <Button
                        variant={entregue ? "secondary" : "default"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleStatus(e)}
                        aria-label={
                          entregue ? "Marcar como pendente" : "Marcar entregue"
                        }
                      >
                        {entregue ? (
                          <RotateCcw className="size-4" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(e.id)}
                        aria-label="Remover"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddEntregaDialog({
  open,
  setOpen,
  defaultDia,
  existing,
  onCreated,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  defaultDia: number;
  existing: Entrega[];
  onCreated: (e: Entrega) => void;
}) {
  const [nome, setNome] = useState("");
  const [bairro, setBairro] = useState("");
  const [dia, setDia] = useState<number>(defaultDia);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome("");
      setBairro("");
      setDia(defaultDia);
    }
  }, [open, defaultDia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !bairro.trim()) {
      return toast.error("Preencha nome e bairro");
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return toast.error("Sessão expirada");
    }
    // próxima ordem dentro do bairro/dia
    const max = existing
      .filter(
        (x) =>
          x.dia_vencimento === dia &&
          x.bairro.toLowerCase() === bairro.trim().toLowerCase(),
      )
      .reduce((acc, x) => Math.max(acc, x.ordem_rota), -1);

    const { data, error } = await supabase
      .from("entregas")
      .insert({
        user_id: userData.user.id,
        nome_cliente: nome.trim(),
        bairro: bairro.trim(),
        dia_vencimento: dia,
        ordem_rota: max + 1,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) return toast.error("Erro ao cadastrar");
    toast.success("Entrega cadastrada");
    onCreated(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nova entrega
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova entrega</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome do cliente</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Maria Silva"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex.: Centro"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dia">Dia de vencimento (1–31)</Label>
            <Input
              id="dia"
              type="number"
              min={1}
              max={31}
              value={dia}
              onChange={(e) =>
                setDia(Math.max(1, Math.min(31, Number(e.target.value) || 1)))
              }
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}