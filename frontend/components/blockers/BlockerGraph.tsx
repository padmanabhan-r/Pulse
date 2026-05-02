"use client";

import { useEffect, useRef } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";

export interface NodeIn {
  id: string;
  group: string;
}
export interface LinkIn {
  source: string;
  target: string;
  blocked: boolean;
}

interface Node extends SimulationNodeDatum {
  id: string;
  group: string;
}
interface Link extends SimulationLinkDatum<Node> {
  blocked: boolean;
}

export function BlockerGraph({ nodes, links }: { nodes: NodeIn[]; links: LinkIn[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    const simNodes: Node[] = nodes.map((n) => ({ ...n }));
    const simLinks: Link[] = links.map((l) => ({ ...l, source: l.source, target: l.target }));

    const sim: Simulation<Node, Link> = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<Node, Link>(simLinks)
          .id((d) => d.id)
          .distance(58)
          .strength(0.6),
      )
      .force("charge", forceManyBody<Node>().strength(-180))
      .force("collide", forceCollide<Node>(18))
      .force("center", forceCenter(width / 2, height / 2));

    const linkEls = svg.querySelectorAll<SVGLineElement>("line[data-link]");
    const nodeEls = svg.querySelectorAll<SVGGElement>("g[data-node]");

    sim.on("tick", () => {
      linkEls.forEach((el, i) => {
        const link = simLinks[i];
        if (!link) return;
        const s = link.source as Node;
        const t = link.target as Node;
        el.setAttribute("x1", String(s.x ?? 0));
        el.setAttribute("y1", String(s.y ?? 0));
        el.setAttribute("x2", String(t.x ?? 0));
        el.setAttribute("y2", String(t.y ?? 0));
      });
      nodeEls.forEach((el, i) => {
        const n = simNodes[i];
        if (!n) return;
        el.setAttribute("transform", `translate(${n.x ?? 0},${n.y ?? 0})`);
      });
    });

    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  return (
    <section
      aria-label="team blocker graph"
      className="border border-(--color-rule) bg-(--color-ink-2)/60 p-5 backdrop-blur-sm"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <p className="font-mono text-[10px] tracking-[0.22em] text-(--color-signal) uppercase">
          ⌥ blocker graph
        </p>
        <p className="font-mono text-[10px] tracking-widest text-(--color-prose-mute) uppercase">
          {links.filter((l) => l.blocked).length} blocked
        </p>
      </header>
      <svg ref={svgRef} role="img" aria-label="d3 force graph of team blockers" className="h-72 w-full">
        <defs>
          <marker id="arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="rgba(242,239,233,0.55)" />
          </marker>
        </defs>
        <g>
          {links.map((l, i) => (
            <line
              key={i}
              data-link
              stroke={l.blocked ? "var(--color-alert)" : "rgba(201,255,62,0.45)"}
              strokeWidth={l.blocked ? 1.6 : 1}
              strokeDasharray={l.blocked ? "4 3" : "0"}
              markerEnd="url(#arrow)"
            />
          ))}
        </g>
        <g>
          {nodes.map((n, i) => (
            <g key={i} data-node>
              <circle
                r={14}
                fill="var(--color-ink)"
                stroke={
                  links.some((l) => l.blocked && (l.source === n.id || l.target === n.id))
                    ? "var(--color-alert)"
                    : "var(--color-signal)"
                }
                strokeWidth={1.25}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--color-prose)"
                style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: 0.5 }}
              >
                {n.id.slice(0, 4)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <ul className="font-mono mt-3 grid grid-cols-2 gap-1 text-[10px] tracking-widest text-(--color-prose-mute) uppercase">
        <li>
          <span className="mr-2 inline-block size-1.5 rounded-full bg-(--color-signal)" />
          flow
        </li>
        <li>
          <span className="mr-2 inline-block size-1.5 rounded-full bg-(--color-alert)" />
          blocked
        </li>
      </ul>
    </section>
  );
}
