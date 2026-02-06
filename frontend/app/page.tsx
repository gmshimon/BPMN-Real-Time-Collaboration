"use client";

import { useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type BpmnModeler from "bpmn-js/lib/Modeler";

import OnlineUsers from "@/components/OnlineUsers/OnlineUsers";
import { useCollabSocket } from "@/hooks/useCollabSocket";

const BpmnEditor = dynamic(() => import("@/components/bpmn/bpmn-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
      Loading BPMN canvas…
    </div>
  ),
});

type ModelerApi = {
  modeler: BpmnModeler;
  exportXml: () => Promise<string>;
};

export default function Home() {
  const exportXmlRef = useRef<null | (() => Promise<string>)>(null);
  const { diagram, users, sendDiagramUpdate } = useCollabSocket();
  console.log(users);
  const handleModelerReady = useCallback((api: ModelerApi) => {
    exportXmlRef.current = api.exportXml;
  }, []);

  return (
    <main className="flex h-screen w-screen gap-4 overflow-hidden bg-slate-50 p-4">
      <section className="flex h-full min-h-0 min-w-0 flex-1">
        <div className="relative flex h-full w-full min-h-0 rounded-2xl bg-white/90 p-2 shadow-md ring-1 ring-border">
          <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 shadow-sm ring-1 ring-border">
            <OnlineUsers count={users} />
          </div>
          <BpmnEditor
            className="h-full w-full"
            diagram={diagram}
            onDiagramChange={sendDiagramUpdate}
            onModelerReady={handleModelerReady}
          />
        </div>
      </section>
    </main>
  );
}
