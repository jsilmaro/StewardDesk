import { Board } from "@/components/kanban/Board";
import { Leaf } from "lucide-react";

export default function BoardPage() {
  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      
      {/* Subtle organic background overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/organic-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 flex items-center px-8 h-20 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 text-white">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
              Nature Kanban
            </h1>
            <p className="text-sm font-medium text-muted-foreground/80">Cultivate your tasks</p>
          </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <Board />
      </main>
    </div>
  );
}
