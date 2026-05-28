import { useEffect, useState } from "react";
import { Bike, Plus, Droplet, AlertTriangle, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Moto = Database["public"]["Tables"]["motos"]["Row"];

const ALERT_THRESHOLD = 100;
const DEFAULT_INTERVAL = 1000;

function getStatus(m: Moto): "ok" | "warn" | "critical" {
  const remaining = m.km_proxima_troca - m.km_atual;
  if (remaining <= 0) return "critical";
  if (remaining <= ALERT_THRESHOLD) return "warn";
  return "ok";
}

export function FrotaPage() {
  const [motos, setMotos] = useState<Moto[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [trocaMoto, setTrocaMoto] = useState<Moto | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("motos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setMotos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Bike className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Controle de Frota
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhamento de motos e troca de óleo.
            </p>
          </div>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Nova moto
            </Button>
          </DialogTrigger>
          <AddMotoDialog onSaved={() => { setAddOpen(false); load(); }} />
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : motos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Bike className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma moto cadastrada. Adicione a primeira moto da frota.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {motos.map((m) => (
            <MotoCard
              key={m.id}
              moto={m}
              onTroca={() => setTrocaMoto(m)}
              onDelete={load}
            />
          ))}
        </div>
      )}

      <Dialog open={!!trocaMoto} onOpenChange={(o) => !o && setTrocaMoto(null)}>
        {trocaMoto && (
          <TrocaOleoDialog
            moto={trocaMoto}
            onSaved={() => { setTrocaMoto(null); load(); }}
          />
        )}
      </Dialog>
    </div>
  );
}

function MotoCard({
  moto,
  onTroca,
  onDelete,
}: {
  moto: Moto;
  onTroca: () => void;
  onDelete: () => void;
}) {
  const status = getStatus(moto);
  const remaining = moto.km_proxima_troca - moto.km_atual;

  const wrapperClass =
    status === "critical"
      ? "rounded-xl p-[1.5px] bg-gradient-to-br from-red-500 via-red-600 to-rose-700 shadow-lg shadow-red-500/20"
      : status === "warn"
        ? "rounded-xl p-[1.5px] bg-gradient-to-br from-amber-300 to-orange-400"
        : "rounded-xl border border-border bg-card";

  return (
    <div className={wrapperClass}>
      <div className={status === "ok" ? "" : "rounded-[10px] bg-card p-5"}>
        <div className={status === "ok" ? "p-5" : ""}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                {moto.placa}
              </div>
              <div className="font-display text-lg font-semibold leading-tight">
                {moto.modelo}
              </div>
            </div>
            <button
              onClick={async () => {
                if (!confirm(`Excluir moto ${moto.placa}?`)) return;
                const { error } = await supabase.from("motos").delete().eq("id", moto.id);
                if (error) toast.error(error.message);
                else { toast.success("Moto excluída"); onDelete(); }
              }}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <Stat label="KM atual" value={moto.km_atual.toLocaleString("pt-BR")} />
            <Stat label="Última troca" value={moto.km_ultima_troca.toLocaleString("pt-BR")} />
            <Stat label="Próxima" value={moto.km_proxima_troca.toLocaleString("pt-BR")} />
          </div>

          {status === "critical" && (
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              Atrasada em {Math.abs(remaining).toLocaleString("pt-BR")} km
            </div>
          )}
          {status === "warn" && (
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              Faltam {remaining.toLocaleString("pt-BR")} km para a troca
            </div>
          )}

          <Button
            onClick={onTroca}
            variant={status === "ok" ? "outline" : "default"}
            size="sm"
            className="w-full gap-1.5"
          >
            <Droplet className="h-4 w-4" /> Registrar troca de óleo
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function AddMotoDialog({ onSaved }: { onSaved: () => void }) {
  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const km = parseInt(kmAtual, 10) || 0;
    if (!modelo.trim() || !placa.trim()) {
      toast.error("Preencha modelo e placa");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sessão expirada"); setSaving(false); return; }
    const { error } = await supabase.from("motos").insert({
      user_id: user.id,
      modelo: modelo.trim(),
      placa: placa.trim().toUpperCase(),
      km_atual: km,
      km_ultima_troca: km,
      km_proxima_troca: km + DEFAULT_INTERVAL,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Moto cadastrada"); onSaved(); }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova moto</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Honda CG 160" maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC-1D23" maxLength={10} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="km">KM atual</Label>
          <Input id="km" type="number" min={0} value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} placeholder="0" />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function TrocaOleoDialog({ moto, onSaved }: { moto: Moto; onSaved: () => void }) {
  const [kmAtual, setKmAtual] = useState(String(moto.km_atual));
  const [proximaEm, setProximaEm] = useState(String(DEFAULT_INTERVAL));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const km = parseInt(kmAtual, 10);
    const intervalo = parseInt(proximaEm, 10);
    if (!Number.isFinite(km) || km < 0) { toast.error("KM inválido"); return; }
    if (!Number.isFinite(intervalo) || intervalo <= 0) { toast.error("Intervalo inválido"); return; }
    setSaving(true);
    const { error } = await supabase.from("motos").update({
      km_atual: km,
      km_ultima_troca: km,
      km_proxima_troca: km + intervalo,
    }).eq("id", moto.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Troca registrada"); onSaved(); }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Registrar troca — {moto.placa}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="km-troca">KM atual da moto</Label>
          <Input id="km-troca" type="number" min={0} value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="intervalo">Próxima troca em (km)</Label>
          <Input id="intervalo" type="number" min={1} value={proximaEm} onChange={(e) => setProximaEm(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Padrão: +1.000 km. Próxima:{" "}
            <span className="font-semibold tabular-nums">
              {(
                (parseInt(kmAtual, 10) || 0) + (parseInt(proximaEm, 10) || 0)
              ).toLocaleString("pt-BR")}{" "}
              km
            </span>
          </p>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Registrar troca"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}