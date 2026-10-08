import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
type N = { id: string; title: string; x?: number; y?: number; state?: string };
export function MechanismCanvas({
  nodes,
  edges,
  selected,
  onSelect,
}: {
  nodes: N[];
  edges: string[][];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const mapped = useMemo(
    () =>
      nodes.map((n, i) => ({
        id: n.id,
        position: {
          x: n.x ?? (i % 4) * 220,
          y: n.y ?? Math.floor(i / 4) * 160,
        },
        data: {
          label: (
            <div className={"uh-flow-node " + (n.state || "")}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{n.title}</strong>
              <small>
                {n.state === "success"
                  ? "Выполнено"
                  : n.state === "error"
                    ? "Ошибка"
                    : "Посмотреть устройство →"}
              </small>
            </div>
          ),
        },
        selected: n.id === selected,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        ariaLabel: n.title,
        style: { width: 182, padding: 0, borderRadius: 16 },
        type: "default",
      })),
    [nodes, selected],
  );
  return (
    <div className="uh-canvas">
      <ReactFlow
        nodes={mapped}
        edges={edges.map(([a, b], i) => ({
          id: String(i),
          source: a,
          target: b,
          animated: nodes.find((n) => n.id === a)?.state === "success",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "var(--accent-text)", strokeWidth: 2 },
        }))}
        onNodeClick={(_, n) => onSelect(n.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            const id = (event.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
            if (id && nodes.some((node) => node.id === id)) {
              event.preventDefault();
              onSelect(id);
            }
          }
        }}
        ariaLabelConfig={{
          "controls.ariaLabel": "Управление схемой",
          "controls.zoomIn.ariaLabel": "Увеличить",
          "controls.zoomOut.ariaLabel": "Уменьшить",
          "controls.fitView.ariaLabel": "Показать всю схему",
          "node.a11yDescription.default":
            "Нажмите Enter, чтобы открыть описание узла",
        }}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.3}
        maxZoom={1.4}
        proOptions={{ hideAttribution: false }}
      >
        <Background color="var(--line-2)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
