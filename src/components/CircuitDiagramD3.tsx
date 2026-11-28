import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  ArrowUpRight,
  Cable,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AiProjectBlueprint, Product } from '../types/store';

type NodeRole = 'power' | 'controller' | 'sensor' | 'actuator' | 'display' | 'support';
type WireKind = 'power' | 'ground' | 'signal';

interface CircuitNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  shortLabel: string;
  role: NodeRole;
  quantity: number;
  inCatalog: boolean;
  matchedProductId?: string;
}

interface CircuitLink extends d3.SimulationLinkDatum<CircuitNode> {
  id: string;
  source: string | CircuitNode;
  target: string | CircuitNode;
  kind: WireKind;
  wireLabel: string;
  fullText: string;
  curveIndex: number;
  curveCount: number;
}

interface CircuitDiagramD3Props {
  blueprint: AiProjectBlueprint;
  productById: Map<string, Product>;
  onSelectProduct?: (product: Product) => void;
}

const ROLE_STYLES: Record<
  NodeRole,
  { accent: string; fill: string; border: string; badge: string }
> = {
  power: {
    accent: '#F59E0B',
    fill: '#16120B',
    border: 'rgba(245, 158, 11, 0.55)',
    badge: 'POWER',
  },
  controller: {
    accent: '#2F8BFF',
    fill: '#0A1936',
    border: 'rgba(47, 139, 255, 0.72)',
    badge: 'MCU / CORE',
  },
  sensor: {
    accent: '#00C8FF',
    fill: '#071B2A',
    border: 'rgba(0, 200, 255, 0.55)',
    badge: 'SENSOR',
  },
  actuator: {
    accent: '#A855F7',
    fill: '#160E29',
    border: 'rgba(168, 85, 247, 0.55)',
    badge: 'ACTUATOR',
  },
  display: {
    accent: '#34D399',
    fill: '#081D1A',
    border: 'rgba(52, 211, 153, 0.55)',
    badge: 'DISPLAY / RF',
  },
  support: {
    accent: '#94A3B8',
    fill: '#0E1729',
    border: 'rgba(148, 163, 184, 0.42)',
    badge: 'PASSIVE / DIY',
  },
};

const WIRE_COLORS: Record<WireKind, string> = {
  power: '#F59E0B',
  ground: '#34D399',
  signal: '#00C8FF',
};

function classifyNodeRole(name: string): NodeRole {
  const lower = name.toLowerCase();
  if (/esp32|arduino|raspberry|stm32|jetson|mcu|nano|uno|mega|controller|pico/.test(lower)) {
    return 'controller';
  }
  if (/lipo|battery|18650|bms|buck|xl4015|lm2596|power|adapter|5v|12v|supply|usb/.test(lower)) {
    return 'power';
  }
  if (/servo|sg90|mg996|stepper|nema|motor|driver|l298|bts7960|esc|brushless|pump|relay|arm|chassis|rover/.test(lower)) {
    return 'actuator';
  }
  if (/oled|ssd1306|lcd|display|screen|lora|sx1278|rf|bluetooth|wifi|telemetry/.test(lower)) {
    return 'display';
  }
  if (/sensor|hc-sr04|ultrasonic|lidar|rplidar|imu|mpu|bno|dht|moisture|ir|camera/.test(lower)) {
    return 'sensor';
  }
  return 'support';
}

function classifyWireKind(text: string): WireKind {
  const lower = text.toLowerCase();
  if (/\bgnd\b|ground|\(-\)|negative/.test(lower)) {
    return 'ground';
  }
  if (/\bvcc\b|\bvin\b|3v3|3\.3v|\b5v\b|12v|\(\+\)|battery|power|lipo|buck/.test(lower)) {
    return 'power';
  }
  return 'signal';
}

function extractPinTag(endpoint: string): string {
  const match = endpoint.match(
    /\b(GPIO\s*\d+|3V3|3\.3V|5V|12V|VCC|VIN|GND|SDA|SCL|TRIG|ECHO|TX|RX|MOSI|MISO|SCK|CS|ENA|ENB|IN[1-4]|OUT[1-4]|SIG|PWM|ADC|A\d+|D\d+)\b/i
  );
  if (match) return match[0].toUpperCase().replace(/\s+/g, '');
  const paren = endpoint.match(/\(([^)]+)\)/);
  if (paren && paren[1].length <= 10) return paren[1].trim();
  return '';
}

function shortenLabel(name: string): string {
  const cleaned = name.replace(/\s*\([^)]*\)/g, '').trim();
  if (cleaned.length <= 22) return cleaned;
  return `${cleaned.slice(0, 20).trim()}…`;
}

function tokenizeKeywords(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, ' ')
    .split(/\s+/)
    .filter(
      (t) =>
        t.length >= 2 &&
        ![
          'the',
          'and',
          'for',
          'with',
          'pin',
          'pins',
          'to',
          'of',
          'on',
          'via',
          'vcc',
          'gnd',
          'vin',
          '3v3',
          '5v',
          '12v',
          'gpio',
          'sda',
          'scl',
          'trig',
          'echo',
          'input',
          'output',
          'module',
          'board',
          'common',
          'ground',
        ].includes(t)
    );
}

function matchEndpointToNode(endpoint: string, nodes: CircuitNode[]): CircuitNode | null {
  const lower = endpoint.toLowerCase();
  let bestNode: CircuitNode | null = null;
  let bestScore = 0;

  for (const node of nodes) {
    const nodeTokens = tokenizeKeywords(node.label);
    let score = 0;
    for (const tok of nodeTokens) {
      if (lower.includes(tok)) {
        score += tok.length >= 4 ? 3 : 2;
      }
    }
    if (node.role === 'controller' && /\b(esp32|arduino|mcu|pi|stm32|gpio)\b/i.test(lower)) {
      score += 2;
    }
    if (node.role === 'power' && /\b(battery|lipo|2s|3s|buck|5v rail|12v|usb)\b/i.test(lower)) {
      score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  }

  return bestScore > 0 ? bestNode : null;
}

function buildCircuitGraph(blueprint: AiProjectBlueprint): {
  nodes: CircuitNode[];
  links: CircuitLink[];
} {
  const nodes: CircuitNode[] = blueprint.requiredParts
    .filter((p) => !/jumper\s*wire/i.test(p.partName))
    .slice(0, 10)
    .map((part, idx) => ({
      id: `part-${idx}`,
      label: part.partName,
      shortLabel: shortenLabel(part.partName),
      role: classifyNodeRole(part.partName),
      quantity: part.quantity,
      inCatalog: Boolean(part.matchedProductId),
      matchedProductId: part.matchedProductId || undefined,
    }));

  if (nodes.length === 0) {
    return { nodes: [], links: [] };
  }

  const allWireStrings = blueprint.buildSteps.flatMap((step) => step.wiringConnections || []);
  const hasExplicitPowerNode = nodes.some((n) => n.role === 'power');
  if (!hasExplicitPowerNode && allWireStrings.some((w) => /usb|5v|battery|lipo|power/i.test(w))) {
    nodes.unshift({
      id: 'power-rail',
      label: 'USB / Regulated Power Rail',
      shortLabel: '5V / USB Power Rail',
      role: 'power',
      quantity: 1,
      inCatalog: false,
    });
  }

  const rawEdges: {
    sourceId: string;
    targetId: string;
    kind: WireKind;
    wireLabel: string;
    fullText: string;
  }[] = [];

  for (const rawWire of allWireStrings) {
    const segments = rawWire
      .split(/\s*(?:->|→|<->|↔|\bto\b)\s*/i)
      .map((s) => s.trim())
      .filter(Boolean);

    if (segments.length < 2) continue;

    for (let i = 0; i < segments.length - 1; i += 1) {
      const left = segments[i];
      const right = segments[i + 1];
      const leftNode = matchEndpointToNode(left, nodes);
      const rightNode = matchEndpointToNode(right, nodes);
      if (!leftNode || !rightNode || leftNode.id === rightNode.id) continue;

      const leftPin = extractPinTag(left);
      const rightPin = extractPinTag(right);
      const wireLabel =
        leftPin && rightPin
          ? `${leftPin} → ${rightPin}`
          : leftPin || rightPin || classifyWireKind(rawWire).toUpperCase();

      rawEdges.push({
        sourceId: leftNode.id,
        targetId: rightNode.id,
        kind: classifyWireKind(`${left} ${right}`),
        wireLabel,
        fullText: rawWire,
      });
    }
  }

  // Fallback topology if steps lacked explicit multi-node arrows
  if (rawEdges.length === 0) {
    const controller =
      nodes.find((n) => n.role === 'controller') ?? nodes[0];
    const powerNode = nodes.find((n) => n.role === 'power' && n.id !== controller.id);

    if (powerNode) {
      rawEdges.push({
        sourceId: powerNode.id,
        targetId: controller.id,
        kind: 'power',
        wireLabel: '5V / 3.3V',
        fullText: `${powerNode.shortLabel} → ${controller.shortLabel} (Power)`,
      });
    }

    for (const node of nodes) {
      if (node.id === controller.id || node.id === powerNode?.id) continue;
      rawEdges.push({
        sourceId: controller.id,
        targetId: node.id,
        kind: node.role === 'support' ? 'ground' : 'signal',
        wireLabel:
          node.role === 'display'
            ? 'I2C / SPI'
            : node.role === 'actuator'
            ? 'PWM / CTRL'
            : 'GPIO',
        fullText: `${controller.shortLabel} → ${node.shortLabel}`,
      });
    }
  }

  // Deduplicate identical wire labels between the same unordered node pair
  const pairGroups = new Map<string, typeof rawEdges>();
  const seenKeys = new Set<string>();
  for (const edge of rawEdges) {
    const pairKey = [edge.sourceId, edge.targetId].sort().join('::');
    const uniqueKey = `${pairKey}::${edge.wireLabel}::${edge.kind}`;
    if (seenKeys.has(uniqueKey)) continue;
    seenKeys.add(uniqueKey);
    const group = pairGroups.get(pairKey) ?? [];
    group.push(edge);
    pairGroups.set(pairKey, group);
  }

  const links: CircuitLink[] = [];
  pairGroups.forEach((group) => {
    group.slice(0, 4).forEach((edge, idx) => {
      links.push({
        id: `edge-${links.length}`,
        source: edge.sourceId,
        target: edge.targetId,
        kind: edge.kind,
        wireLabel: edge.wireLabel,
        fullText: edge.fullText,
        curveIndex: idx,
        curveCount: Math.min(group.length, 4),
      });
    });
  });

  return { nodes, links };
}

export const CircuitDiagramD3: React.FC<CircuitDiagramD3Props> = ({
  blueprint,
  productById,
  onSelectProduct,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredWireText, setHoveredWireText] = useState<string | null>(null);

  const graph = useMemo(() => buildCircuitGraph(blueprint), [blueprint]);

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graph.nodes, selectedNodeId]
  );

  const selectedProduct = useMemo(() => {
    if (!selectedNode?.matchedProductId) return null;
    return productById.get(selectedNode.matchedProductId) ?? null;
  }, [selectedNode, productById]);

  useEffect(() => {
    setSelectedNodeId(null);
    setHoveredWireText(null);
  }, [blueprint.projectTitle]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || graph.nodes.length === 0) return;

    const width = 760;
    const height = 430;
    const nodeW = 152;
    const nodeH = 54;

    const nodesCopy: CircuitNode[] = graph.nodes.map((n, index) => {
      const targetX =
        n.role === 'power'
          ? width * 0.16
          : n.role === 'controller'
          ? width * 0.48
          : width * 0.82;
      const sameColumn = graph.nodes.filter((other) => other.role === n.role);
      const colIdx = Math.max(0, sameColumn.findIndex((o) => o.id === n.id));
      const colSpacing = height / (sameColumn.length + 1);
      return {
        ...n,
        x: targetX + ((index % 2) - 0.5) * 14,
        y: colSpacing * (colIdx + 1),
      };
    });

    const linksCopy: CircuitLink[] = graph.links.map((l) => ({ ...l }));

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');

    // Blueprint dot grid pattern
    const pattern = defs
      .append('pattern')
      .attr('id', 'circuit-grid-pattern')
      .attr('width', 24)
      .attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern
      .append('circle')
      .attr('cx', 12)
      .attr('cy', 12)
      .attr('r', 0.9)
      .attr('fill', 'rgba(100, 150, 255, 0.18)');

    // Colored directional arrowheads for power / ground / signal
    (['power', 'ground', 'signal'] as WireKind[]).forEach((kind) => {
      defs
        .append('marker')
        .attr('id', `wire-arrow-${kind}`)
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 7)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4Z')
        .attr('fill', WIRE_COLORS[kind]);
    });

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#circuit-grid-pattern)');

    const viewport = svg.append('g').attr('class', 'circuit-viewport');

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 2.2])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString());
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior).on('dblclick.zoom', null);

    const simulation = d3
      .forceSimulation<CircuitNode>(nodesCopy)
      .force(
        'link',
        d3
          .forceLink<CircuitNode, CircuitLink>(linksCopy)
          .id((d) => d.id)
          .distance(190)
          .strength(0.35)
      )
      .force('charge', d3.forceManyBody<CircuitNode>().strength(-520))
      .force(
        'x',
        d3
          .forceX<CircuitNode>((d) =>
            d.role === 'power'
              ? width * 0.16
              : d.role === 'controller'
              ? width * 0.48
              : width * 0.81
          )
          .strength(0.55)
      )
      .force('y', d3.forceY<CircuitNode>(height * 0.5).strength(0.18))
      .force('collide', d3.forceCollide<CircuitNode>(96));

    // Pre-stabilize layout synchronously for crisp first paint (no chaotic bounce!)
    simulation.stop();
    for (let i = 0; i < 160; i += 1) {
      simulation.tick();
    }
    // Clamp coordinates inside safe canvas bounds
    nodesCopy.forEach((n) => {
      n.x = Math.max(nodeW / 2 + 18, Math.min(width - nodeW / 2 - 18, n.x ?? width / 2));
      n.y = Math.max(nodeH / 2 + 18, Math.min(height - nodeH / 2 - 18, n.y ?? height / 2));
    });

    const linkGroup = viewport.append('g').attr('class', 'circuit-links');
    const linkLabelGroup = viewport.append('g').attr('class', 'circuit-link-labels');
    const nodeGroup = viewport.append('g').attr('class', 'circuit-nodes');

    const computeArcPath = (d: CircuitLink): { path: string; labelX: number; labelY: number } => {
      const s = d.source as CircuitNode;
      const t = d.target as CircuitNode;
      const sx = s.x ?? 0;
      const sy = s.y ?? 0;
      const tx = t.x ?? 0;
      const ty = t.y ?? 0;

      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.hypot(dx, dy) || 1;
      const offsetIndex = d.curveIndex - (d.curveCount - 1) / 2;
      const curveOffset = offsetIndex * 34;

      const nx = -dy / dist;
      const ny = dx / dist;
      const cx = (sx + tx) / 2 + nx * curveOffset;
      const cy = (sy + ty) / 2 + ny * curveOffset;

      // Trim start & end at exact PCB card rectangle boundary so arrowheads stay visible
      const halfW = nodeW / 2 + 4;
      const halfH = nodeH / 2 + 4;
      const ux = dx / dist;
      const uy = dy / dist;
      const txBox = Math.abs(ux) > 1e-4 ? halfW / Math.abs(ux) : Infinity;
      const tyBox = Math.abs(uy) > 1e-4 ? halfH / Math.abs(uy) : Infinity;
      const edgeDist = Math.min(txBox, tyBox, dist * 0.42);
      const endX = tx - ux * edgeDist;
      const endY = ty - uy * edgeDist;
      const startX = sx + ux * edgeDist;
      const startY = sy + uy * edgeDist;

      return {
        path: `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`,
        labelX: 0.25 * startX + 0.5 * cx + 0.25 * endX,
        labelY: 0.25 * startY + 0.5 * cy + 0.25 * endY,
      };
    };

    const linkPaths = linkGroup
      .selectAll<SVGPathElement, CircuitLink>('path')
      .data(linksCopy)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (d) => WIRE_COLORS[d.kind])
      .attr('stroke-width', (d) => (d.kind === 'power' ? 2.2 : 1.7))
      .attr('stroke-opacity', 0.82)
      .attr('stroke-dasharray', (d) => (d.kind === 'ground' ? '5 4' : 'none'))
      .attr('marker-end', (d) => `url(#wire-arrow-${d.kind})`)
      .style('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        d3.select(this).attr('stroke-width', 3.2).attr('stroke-opacity', 1);
        setHoveredWireText(d.fullText);
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this)
          .attr('stroke-width', d.kind === 'power' ? 2.2 : 1.7)
          .attr('stroke-opacity', 0.82);
        setHoveredWireText(null);
      });

    const linkLabelContainers = linkLabelGroup
      .selectAll<SVGGElement, CircuitLink>('g')
      .data(linksCopy)
      .join('g')
      .style('pointer-events', 'none');

    linkLabelContainers
      .append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', '#040915')
      .attr('stroke', (d) => WIRE_COLORS[d.kind])
      .attr('stroke-opacity', 0.45)
      .attr('stroke-width', 0.8)
      .attr('width', (d) => Math.max(36, d.wireLabel.length * 5.6 + 10))
      .attr('height', 15)
      .attr('x', (d) => -Math.max(36, d.wireLabel.length * 5.6 + 10) / 2)
      .attr('y', -7.5);

    linkLabelContainers
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', (d) => WIRE_COLORS[d.kind])
      .attr('font-family', 'JetBrains Mono, ui-monospace, monospace')
      .attr('font-size', '8.5px')
      .attr('font-weight', '600')
      .text((d) => d.wireLabel);

    const nodeGroups = nodeGroup
      .selectAll<SVGGElement, CircuitNode>('g')
      .data(nodesCopy)
      .join('g')
      .style('cursor', 'grab')
      .on('click', (_event, d) => {
        setSelectedNodeId((prev) => (prev === d.id ? null : d.id));
      })
      .on('mouseenter', (_event, d) => {
        linkPaths.attr('stroke-opacity', (l) => {
          const sId = typeof l.source === 'string' ? l.source : l.source.id;
          const tId = typeof l.target === 'string' ? l.target : l.target.id;
          return sId === d.id || tId === d.id ? 1 : 0.16;
        });
      })
      .on('mouseleave', () => {
        linkPaths.attr('stroke-opacity', 0.82);
      });

    // Main node PCB card body
    nodeGroups
      .append('rect')
      .attr('x', -nodeW / 2)
      .attr('y', -nodeH / 2)
      .attr('width', nodeW)
      .attr('height', nodeH)
      .attr('rx', 10)
      .attr('fill', (d) => ROLE_STYLES[d.role].fill)
      .attr('stroke', (d) => ROLE_STYLES[d.role].border)
      .attr('stroke-width', 1.5);

    // Top accent strip
    nodeGroups
      .append('rect')
      .attr('x', -nodeW / 2)
      .attr('y', -nodeH / 2)
      .attr('width', nodeW)
      .attr('height', 4)
      .attr('rx', 2)
      .attr('fill', (d) => ROLE_STYLES[d.role].accent);

    // Role micro-label + stock dot
    nodeGroups
      .append('text')
      .attr('x', -nodeW / 2 + 10)
      .attr('y', -nodeH / 2 + 18)
      .attr('fill', (d) => ROLE_STYLES[d.role].accent)
      .attr('font-family', 'JetBrains Mono, ui-monospace, monospace')
      .attr('font-size', '8.5px')
      .attr('font-weight', '700')
      .text((d) => `${ROLE_STYLES[d.role].badge} · ×${d.quantity}`);

    nodeGroups
      .append('circle')
      .attr('cx', nodeW / 2 - 12)
      .attr('cy', -nodeH / 2 + 15)
      .attr('r', 3.5)
      .attr('fill', (d) => (d.inCatalog ? '#34D399' : '#94A3B8'));

    // Module name
    nodeGroups
      .append('text')
      .attr('x', -nodeW / 2 + 10)
      .attr('y', 12)
      .attr('fill', '#F8FAFC')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text((d) => d.shortLabel);

    const updatePositions = () => {
      linkPaths.attr('d', (d) => computeArcPath(d).path);
      linkLabelContainers.attr('transform', (d) => {
        const pt = computeArcPath(d);
        return `translate(${pt.labelX}, ${pt.labelY})`;
      });
      nodeGroups.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    };

    updatePositions();

    const dragBehavior = d3
      .drag<SVGGElement, CircuitNode>()
      .on('start', function (event, d) {
        d3.select(this).style('cursor', 'grabbing').raise();
        if (!event.active) simulation.alphaTarget(0.15).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function (event, d) {
        d3.select(this).style('cursor', 'grab');
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroups.call(dragBehavior);
    simulation.on('tick', updatePositions);

    return () => {
      simulation.stop();
    };
  }, [graph]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomRef.current.scaleBy, factor);
  };

  const handleResetView = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div className="space-y-3.5">
      {/* Diagram Toolbar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-[2px] bg-amber-400 inline-block" />
            Power Rail
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-[2px] border-t-2 border-dashed border-emerald-400 inline-block" />
            Common GND
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#00C8FF]">
            <span className="w-3 h-[2px] bg-[#00C8FF] inline-block" />
            GPIO / Bus Signal
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleZoom(1.22)}
            aria-label="Zoom in circuit diagram"
            className="p-1.5 rounded-lg bg-[#050B18] hover:bg-[#0D1E3D] border border-[rgba(100,150,255,0.24)] text-[#C8D8F4] hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.82)}
            aria-label="Zoom out circuit diagram"
            className="p-1.5 rounded-lg bg-[#050B18] hover:bg-[#0D1E3D] border border-[rgba(100,150,255,0.24)] text-[#C8D8F4] hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="px-2.5 py-1.5 rounded-lg bg-[#050B18] hover:bg-[#0D1E3D] border border-[rgba(100,150,255,0.24)] text-[11px] font-semibold text-[#C8D8F4] hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive D3.js SVG Schematic Stage */}
      <div className="relative rounded-xl bg-[#040915] border border-[rgba(0,200,255,0.25)] overflow-hidden">
        <svg
          ref={svgRef}
          role="img"
          aria-label={`Interactive circuit connection diagram for ${blueprint.projectTitle}`}
          className="w-full h-[360px] sm:h-[420px] select-none touch-none block"
        />

        <div className="px-3.5 py-2 border-t border-[rgba(100,150,255,0.14)] bg-[#060E20] flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <Cable className="w-3.5 h-3.5 text-[#00C8FF] shrink-0" />
            <span className="text-[#C8D8F4] truncate">
              {hoveredWireText
                ? hoveredWireText
                : selectedNode
                ? `${selectedNode.label} (${selectedNode.inCatalog ? 'In Robotera BD Catalog' : 'External / Generic Part'})`
                : 'Drag modules to rearrange · Scroll/pinch to zoom · Hover wires for pin details'}
            </span>
          </div>

          {selectedProduct && onSelectProduct && (
            <button
              type="button"
              onClick={() => onSelectProduct(selectedProduct)}
              className="text-[11px] font-semibold text-[#00C8FF] hover:text-white inline-flex items-center gap-1 shrink-0 transition-colors"
            >
              <span>View {selectedProduct.sku} Specs</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
          {!selectedProduct && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10.5px] text-[#7D94B8] shrink-0">
              <Maximize2 className="w-3 h-3" />
              <span>
                {graph.nodes.length} Modules · {graph.links.length} Connections
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
