"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Settings2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type PanelPlacement,
  SECTION_LABELS,
  readPanelOrder,
  writePanelOrder,
  resetPanelOrder,
  reconcileOrder,
  moveSectionUp,
  moveSectionDown,
  moveSectionToColumn,
  getColumnItems,
  isFirstInColumn,
  isLastInColumn,
} from "@/lib/dashboard-order";

interface DashboardGridProps {
  sections: Record<string, ReactNode>;
  defaultOrder: PanelPlacement[];
}

export function DashboardGrid({ sections, defaultOrder }: DashboardGridProps) {
  const visibleIds = Object.keys(sections);
  const [panelOrder, setPanelOrder] = useState<PanelPlacement[]>(() =>
    reconcileOrder(defaultOrder, visibleIds)
  );
  const [customizing, setCustomizing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readPanelOrder();
    if (stored) {
      setPanelOrder(reconcileOrder(stored, visibleIds));
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((order: PanelPlacement[]) => {
    setPanelOrder(order);
    writePanelOrder(order);
  }, []);

  const handleMoveUp = useCallback(
    (id: string) => persist(moveSectionUp(panelOrder, id)),
    [panelOrder, persist]
  );

  const handleMoveDown = useCallback(
    (id: string) => persist(moveSectionDown(panelOrder, id)),
    [panelOrder, persist]
  );

  const handleMoveLeft = useCallback(
    (id: string) => persist(moveSectionToColumn(panelOrder, id, 0)),
    [panelOrder, persist]
  );

  const handleMoveRight = useCallback(
    (id: string) => persist(moveSectionToColumn(panelOrder, id, 1)),
    [panelOrder, persist]
  );

  const handleReset = useCallback(() => {
    resetPanelOrder();
    setPanelOrder(reconcileOrder(defaultOrder, visibleIds));
  }, [defaultOrder, visibleIds]);

  // Use default order before mount to avoid hydration mismatch
  const activeOrder = mounted ? panelOrder : reconcileOrder(defaultOrder, visibleIds);

  const col0 = getColumnItems(activeOrder, 0);
  const col1 = getColumnItems(activeOrder, 1);

  return (
    <>
      {/* Customize toggle */}
      <div className="mt-4 sm:mt-8 flex items-center justify-end gap-2">
        {customizing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
        <Button
          variant={customizing ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setCustomizing((v) => !v)}
          className="gap-1.5"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {customizing ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Two-column grid */}
      <div className="mt-2 grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="min-w-0 space-y-4 sm:space-y-6">
          {col0.map((p) => (
            <SectionWrapper
              key={p.id}
              id={p.id}
              order={activeOrder}
              customizing={customizing}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
            >
              {sections[p.id]}
            </SectionWrapper>
          ))}
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-4 sm:space-y-6">
          {col1.map((p) => (
            <SectionWrapper
              key={p.id}
              id={p.id}
              order={activeOrder}
              customizing={customizing}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
            >
              {sections[p.id]}
            </SectionWrapper>
          ))}
        </div>
      </div>
    </>
  );
}

interface SectionWrapperProps {
  id: string;
  order: PanelPlacement[];
  customizing: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveLeft: (id: string) => void;
  onMoveRight: (id: string) => void;
  children: ReactNode;
}

function SectionWrapper({
  id,
  order,
  customizing,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  children,
}: SectionWrapperProps) {
  if (!customizing) return <>{children}</>;

  const item = order.find((p) => p.id === id);
  const isFirst = isFirstInColumn(order, id);
  const isLast = isLastInColumn(order, id);
  const inCol0 = item?.column === 0;
  const inCol1 = item?.column === 1;

  return (
    <div className="relative">
      {/* Control bar */}
      <div className="mb-1.5 flex items-center justify-between rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5">
        <span className="text-xs font-medium text-primary">
          {SECTION_LABELS[id] ?? id}
        </span>
        <div className="flex items-center gap-1">
          {/* Up / Down — always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={isFirst}
            onClick={() => onMoveUp(id)}
            aria-label={`Move ${SECTION_LABELS[id] ?? id} up`}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={isLast}
            onClick={() => onMoveDown(id)}
            aria-label={`Move ${SECTION_LABELS[id] ?? id} down`}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>

          {/* Left / Right — hidden on mobile */}
          <div className="hidden lg:flex items-center gap-1 ml-1 pl-1 border-l border-primary/20">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={inCol0}
              onClick={() => onMoveLeft(id)}
              aria-label={`Move ${SECTION_LABELS[id] ?? id} to left column`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={inCol1}
              onClick={() => onMoveRight(id)}
              aria-label={`Move ${SECTION_LABELS[id] ?? id} to right column`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
