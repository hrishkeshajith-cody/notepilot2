import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Network, Download, Maximize2 } from "lucide-react";
import { StudyPack } from "@/types/studyPack";
import { Button } from "@/components/ui/button";

interface MindMapSectionProps {
  studyPack: StudyPack;
}

// Generate nodes and edges from study pack data
const generateMindMapData = (studyPack: StudyPack) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;

  // Central node - Chapter Title (center of canvas)
  nodes.push({
    id: `${nodeId}`,
    type: "input",
    data: { label: studyPack.meta.chapter_title },
    position: { x: 600, y: 300 },
    style: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      padding: "16px 24px",
      fontSize: "18px",
      fontWeight: "bold",
      boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
      minWidth: "250px",
      textAlign: "center",
    },
  });
  const centralNodeId = nodeId;
  nodeId++;

  // Summary Branch (TOP-LEFT)
  if (studyPack.summary) {
    nodes.push({
      id: `${nodeId}`,
      data: { label: "📝 Summary" },
      position: { x: 250, y: 100 },
      style: {
        background: "#10b981",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
        minWidth: "120px",
      },
    });
    edges.push({
      id: `e${centralNodeId}-${nodeId}`,
      source: `${centralNodeId}`,
      target: `${nodeId}`,
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 },
    });
    const summaryNodeId = nodeId;
    nodeId++;

    // TL;DR sub-node
    if (studyPack.summary.tl_dr) {
      nodes.push({
        id: `${nodeId}`,
        data: { label: `💡 ${studyPack.summary.tl_dr.substring(0, 60)}...` },
        position: { x: 50, y: 0 },
        style: {
          background: "#d1fae5",
          color: "#065f46",
          border: "2px solid #10b981",
          borderRadius: "8px",
          padding: "10px 16px",
          fontSize: "12px",
          maxWidth: "250px",
        },
      });
      edges.push({
        id: `e${summaryNodeId}-${nodeId}`,
        source: `${summaryNodeId}`,
        target: `${nodeId}`,
        style: { stroke: "#10b981" },
      });
      nodeId++;
    }

    // Important points
    if (studyPack.summary.important_points && studyPack.summary.important_points.length > 0) {
      studyPack.summary.important_points.slice(0, 3).forEach((point, idx) => {
        nodes.push({
          id: `${nodeId}`,
          data: { label: `✓ ${point.substring(0, 50)}...` },
          position: { x: 50 + idx * 180, y: 200 },
          style: {
            background: "#d1fae5",
            color: "#065f46",
            border: "2px solid #10b981",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "11px",
            maxWidth: "170px",
          },
        });
        edges.push({
          id: `e${summaryNodeId}-${nodeId}`,
          source: `${summaryNodeId}`,
          target: `${nodeId}`,
          style: { stroke: "#10b981" },
        });
        nodeId++;
      });
    }
  }

  // Key Terms Branch (TOP-RIGHT)
  if (studyPack.key_terms && studyPack.key_terms.length > 0) {
    nodes.push({
      id: `${nodeId}`,
      data: { label: "📚 Key Terms" },
      position: { x: 950, y: 100 },
      style: {
        background: "#f59e0b",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
        minWidth: "120px",
      },
    });
    edges.push({
      id: `e${centralNodeId}-${nodeId}`,
      source: `${centralNodeId}`,
      target: `${nodeId}`,
      animated: true,
      style: { stroke: "#f59e0b", strokeWidth: 2 },
    });
    const keyTermsNodeId = nodeId;
    nodeId++;

    // Add key term nodes in grid
    studyPack.key_terms.slice(0, 6).forEach((term, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      nodes.push({
        id: `${nodeId}`,
        data: { label: `📖 ${term.term}` },
        position: { x: 850 + col * 180, y: 0 + row * 120 },
        style: {
          background: "#fef3c7",
          color: "#92400e",
          border: "2px solid #f59e0b",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "12px",
          fontWeight: "500",
          maxWidth: "160px",
        },
      });
      edges.push({
        id: `e${keyTermsNodeId}-${nodeId}`,
        source: `${keyTermsNodeId}`,
        target: `${nodeId}`,
        style: { stroke: "#f59e0b" },
      });
      nodeId++;
    });
  }

  // Notes Branch (BOTTOM)
  if (studyPack.notes && studyPack.notes.length > 0) {
    nodes.push({
      id: `${nodeId}`,
      data: { label: "📔 Detailed Notes" },
      position: { x: 580, y: 500 },
      style: {
        background: "#8b5cf6",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
        minWidth: "150px",
      },
    });
    edges.push({
      id: `e${centralNodeId}-${nodeId}`,
      source: `${centralNodeId}`,
      target: `${nodeId}`,
      animated: true,
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
    });
    const notesNodeId = nodeId;
    nodeId++;

    // Add note section nodes spread horizontally
    studyPack.notes.slice(0, 5).forEach((note, idx) => {
      nodes.push({
        id: `${nodeId}`,
        data: { label: `📄 ${note.title}` },
        position: { x: 200 + idx * 220, y: 620 },
        style: {
          background: "#ede9fe",
          color: "#5b21b6",
          border: "2px solid #8b5cf6",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "11px",
          maxWidth: "200px",
        },
      });
      edges.push({
        id: `e${notesNodeId}-${nodeId}`,
        source: `${notesNodeId}`,
        target: `${nodeId}`,
        style: { stroke: "#8b5cf6" },
      });
      nodeId++;
    });
  }

  return { nodes, edges };
};

export const MindMapSection = ({ studyPack }: MindMapSectionProps) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateMindMapData(studyPack),
    [studyPack]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const downloadImage = useCallback(() => {
    // Simple download functionality - could be enhanced with html2canvas
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${studyPack.meta.chapter_title}-mindmap.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, studyPack.meta.chapter_title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Mind Map</h2>
            <p className="text-sm text-muted-foreground">
              Visual overview of the chapter concepts and relationships
            </p>
          </div>
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className="relative w-full h-[800px] bg-card border border-border rounded-xl overflow-hidden shadow-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{
            padding: 0.3,
            includeHiddenNodes: false,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          minZoom={0.3}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls className="bg-card border border-border rounded-lg" />
          <Panel position="top-right" className="flex gap-2">
            <Button
              onClick={downloadImage}
              size="sm"
              variant="outline"
              className="gap-2 bg-card"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#667eea] to-[#764ba2]" />
          <span className="text-muted-foreground">Central Topic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#10b981]" />
          <span className="text-muted-foreground">Summary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#f59e0b]" />
          <span className="text-muted-foreground">Key Terms</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#8b5cf6]" />
          <span className="text-muted-foreground">Notes</span>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm"
      >
        <div className="flex items-start gap-3">
          <Maximize2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground mb-1">Interactive Mind Map</p>
            <p className="text-muted-foreground">
              Drag nodes to reorganize • Zoom in/out with controls • Pan by dragging the canvas • 
              This visual representation helps you see connections between concepts
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
