'use client'

import { useEffect, useRef } from "react"
import BpmnModeler from "bpmn-js/lib/Modeler"

import { cn } from "@/lib/utils"

import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css"

const STARTER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="156" y="136" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

type BpmnEditorProps = {
  className?: string
  diagram?: string
  onDiagramChange?: (xml: string) => void
  onModelerReady?: (api: {
    modeler: BpmnModeler
    exportXml: () => Promise<string>
  }) => void
}

export default function BpmnEditor({
  className,
  diagram,
  onDiagramChange,
  onModelerReady,
}: BpmnEditorProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const suppressBroadcastRef = useRef(false)
  const lastAppliedXmlRef = useRef<string>("")
  const initialDiagramRef = useRef<string | undefined>(diagram)

  // boot the modeler once
  useEffect(() => {
    if (!canvasRef.current) return

    const modeler = new BpmnModeler({
      container: canvasRef.current,
    })
    modelerRef.current = modeler

    const initialXml =
      initialDiagramRef.current && initialDiagramRef.current.trim().length > 0
        ? initialDiagramRef.current
        : STARTER_XML

    suppressBroadcastRef.current = true

    modeler
      .importXML(initialXml)
      .then(() => {
        lastAppliedXmlRef.current = initialXml
        onModelerReady?.({
          modeler,
          exportXml: async () => {
            const { xml } = await modeler.saveXML({ format: true })
            return xml
          },
        })
        modeler.get("canvas").zoom("fit-viewport", "auto")
      })
      .catch((err) => {
        console.error("Failed to import BPMN diagram", err)
      })
      .finally(() => {
        suppressBroadcastRef.current = false
      })

    const handleChange = async () => {
      if (suppressBroadcastRef.current || !onDiagramChange) return
      const { xml } = await modeler.saveXML({ format: true })
      lastAppliedXmlRef.current = xml
      onDiagramChange(xml)
    }

    modeler.on("commandStack.changed", handleChange)

    const resize = () => {
      modeler.get("canvas").resized()
      modeler.get("canvas").zoom("fit-viewport", "auto")
    }

    resize()
    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
      modeler.off("commandStack.changed", handleChange)
      modeler.destroy()
      modelerRef.current = null
    }
  }, [onDiagramChange, onModelerReady])

  // apply remote diagram updates
  useEffect(() => {
    const modeler = modelerRef.current
    if (!modeler) return
    if (!diagram) return
    if (diagram === lastAppliedXmlRef.current) return

    suppressBroadcastRef.current = true
    modeler
      .importXML(diagram)
      .then(() => {
        lastAppliedXmlRef.current = diagram
        modeler.get("canvas").zoom("fit-viewport", "auto")
      })
      .catch((err) => {
        console.error("Failed to sync BPMN diagram", err)
      })
      .finally(() => {
        suppressBroadcastRef.current = false
      })
  }, [diagram])

  return (
    <div
      ref={canvasRef}
      className={cn("bpmn-canvas h-full w-full min-h-0 flex-1", className)}
    />
  )
}
