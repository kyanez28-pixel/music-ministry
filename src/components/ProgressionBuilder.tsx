import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const QUALITIES = ['m', '7', 'maj7', 'm7', 'dim', 'aug', 'sus4', '9', '/', '-'];

export function ProgressionBuilder({ value, onChange }: Props) {
  const appendText = (text: string) => {
    // Si agregamos un guion o barra, o si el último caracter es un espacio, solo concatenamos
    // Si es una cualidad y el último no es espacio, la agregamos junta (ej: C + m -> Cm)
    // Si es una nota y hay algo antes (que no sea espacio o separador), tal vez poner un espacio?
    // Lo más simple: si el texto es " - " o " / ", añadir espacios. Si es cualidad, sin espacio. Si es nota y el último no es espacio, añadir un espacio o guion?
    // Mejor: que el usuario sea explícito con el botón "-" que añade " - ".
    let toAdd = text;
    if (text === '-') toAdd = ' - ';
    else if (text === '/') toAdd = ' / ';
    
    onChange(value + toAdd);
  };

  return (
    <div className="space-y-3 bg-black/20 p-3 rounded-lg border border-border">
      <label className="text-xs font-semibold text-primary block">Progresión (Opcional)</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: C - F - G - Am"
        className="font-mono text-sm"
      />
      <div className="space-y-2">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase mb-1 block">Notas</span>
          <div className="flex flex-wrap gap-1">
            {NOTES.map((n) => (
              <Button
                key={n}
                variant="outline"
                size="sm"
                onClick={() => appendText(n)}
                className="h-7 px-2 text-xs font-mono"
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase mb-1 block">Cualidades / Separadores</span>
          <div className="flex flex-wrap gap-1">
            {QUALITIES.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                onClick={() => appendText(q)}
                className="h-7 px-2 text-xs font-mono"
              >
                {q}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => appendText(' ')}
              className="h-7 px-2 text-xs font-mono"
            >
              [Espacio]
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // Delete last character or block
                if (value.endsWith(' - ')) onChange(value.slice(0, -3));
                else if (value.endsWith(' / ')) onChange(value.slice(0, -3));
                else onChange(value.slice(0, -1));
              }}
              className="h-7 px-2 text-xs"
            >
              ⌫
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
