"use client";

import React, { useEffect } from "react";
const WorkflowBuilder = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 bg-black/40">
    <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-2xl">
      ⚡
    </div>
    <h3 className="text-base font-bold text-white">Editor de Nodos y Flujos</h3>
    <p className="text-xs text-slate-400 max-w-sm">
      Construye pipelines encadenando generación de imagen, audio y video con Higgsfield AI.
    </p>
  </div>
);
import "reactflow/dist/style.css";
import "react-toastify/dist/ReactToastify.css";


const WorkflowUI = ({
  apiKey,
  workflowId,
  initialNodeSchemas,
  initialWorkflowData,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
}) => {
  useEffect(() => {
    sessionStorage.setItem("fromWorkflowBuilder", "true");
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <WorkflowBuilder
        apiKey={apiKey}
        workflowId={workflowId}
        initialNodeSchemas={initialNodeSchemas}
        initialWorkflowData={initialWorkflowData}
        costType="dollars"
        onGenerationStart={onGenerationStart}
        onGenerationEnd={onGenerationEnd}
        onGenerationComplete={onGenerationComplete}
        onGenerationError={onGenerationError}
      />
    </div>
  );
};

export default WorkflowUI;
