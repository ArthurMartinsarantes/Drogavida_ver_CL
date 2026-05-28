import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import drogaVidaLogo from "@/assets/droga-vida-logo.png";

export function CartoesPage() {
  const [nome, setNome] = useState("");
  const [desconto, setDesconto] = useState(10);
  const [condicao, setCondicao] = useState("Válido apenas hoje!");
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `aniversario-${(nome || "cliente").replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Cartão de aniversário baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar o cartão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Gift className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cartão de Aniversário</h1>
          <p className="text-sm text-muted-foreground">
            Gere um cartão promocional personalizado para enviar pelo WhatsApp.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Dados da Promoção</h2>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Cliente</Label>
            <Input
              id="nome"
              placeholder="Ex: Maria da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desconto">Desconto (%)</Label>
            <Input
              id="desconto"
              type="number"
              min={1}
              max={100}
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condicao">Condição</Label>
            <Input
              id="condicao"
              placeholder="Ex: Válido apenas hoje!"
              value={condicao}
              onChange={(e) => setCondicao(e.target.value)}
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="size-4" />
            {loading ? "Gerando..." : "Baixar Cartão (WhatsApp)"}
          </Button>
        </Card>

        {/* Preview */}
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">Preview em tempo real</p>
          <div
            ref={cardRef}
            className="animate-fade-in relative w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,86,255,0.18)]"
            style={{
              aspectRatio: "1 / 1",
            }}
          >

            <div className="relative flex h-full flex-col items-center justify-between p-8 text-center">
              {/* Topo: Logo oficial — sutil e elegante */}
              <div className="flex w-full justify-center pt-2">
                <img
                  src={drogaVidaLogo}
                  alt="Logo da Droga Vida"
                  crossOrigin="anonymous"
                  className="h-10 w-auto object-contain transition-transform duration-300 ease-out hover:scale-105 md:h-12"
                  loading="eager"
                  draggable={false}
                />
              </div>

              {/* Meio: Mensagem + Nome + Desconto */}
              <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
                <div className="text-[22px] font-extrabold tracking-tight text-blue-700 transition-all duration-300 ease-out hover:tracking-wider md:text-[26px]">
                  Feliz Aniversário!
                </div>

                <div className="max-w-full">
                  <div className="break-words text-lg font-semibold leading-tight text-blue-700 md:text-xl">
                    {nome || "Nome do Cliente"}
                  </div>
                </div>

                {/* Tag de Desconto — destaque máximo */}
                <div
                  className="rounded-2xl px-8 py-5 shadow-lg transition-all duration-300 ease-out hover:scale-[1.04] hover:shadow-[0_16px_36px_-8px_rgba(0,209,102,0.65)]"
                  style={{
                    background: "linear-gradient(135deg, #00D166 0%, #00B856 100%)",
                    boxShadow:
                      "0 12px 28px -10px rgba(0, 209, 102, 0.55), inset 0 0 0 1px rgba(255,255,255,0.25)",
                  }}
                >
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                    style={{ color: "#ffffffcc" }}
                  >
                    Ganhe
                  </div>
                  <div
                    className="leading-none"
                    style={{ color: "#ffffff" }}
                  >
                    <span className="text-[56px] font-black md:text-6xl">
                      {desconto}%
                    </span>{" "}
                    <span className="text-xl font-extrabold md:text-2xl">OFF</span>
                  </div>
                </div>
              </div>

              {/* Rodapé: Condição com urgência sutil */}
              <div
                className="rounded-full px-4 py-1.5"
                style={{
                  background: "#0056FF10",
                  color: "#0056FF",
                }}
              >
                <div className="break-words text-[11px] font-semibold italic tracking-wide">
                  {condicao || "Válido apenas hoje!"}
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            A imagem será baixada em alta resolução, pronta para envio no WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
