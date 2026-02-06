import { Injectable, Logger } from '@nestjs/common';

type User = { id: string; name: string };

const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

@Injectable()
export class CollabService {
  // In-memory "single room" state

  private readonly logger = new Logger(CollabService.name);
  private diagramXml: string = DEFAULT_BPMN_XML;
  private version: number = 1;

  private users: Map<string, User> = new Map(); // socketId -> User
  private locks: Map<string, string> = new Map(); // elementId -> socketId

  addUser(id: string, name: string) {
    this.users.set(id, { id, name });
  }

  removeUser(id: string) {
    this.users.delete(id);

    // Remove any locks held by this user
    for (const [elementId, socketId] of this.locks.entries()) {
      if (socketId === id) {
        this.locks.delete(elementId);
      }
    }
  }

  getUsers(): User[] {
    console.log('Getting users:', Array.from(this.users.values()));
    return Array.from(this.users.values());
  }

  getDiagram() {
    return { xml: this.diagramXml, version: this.version };
  }

  updateDiagram(xml: string) {
    this.diagramXml = xml;
    this.version += 1;
    this.logger.log(`Diagram saved; version=${this.version}`);
    return { xml: this.diagramXml, version: this.version };
  }

   // Locks
  setLock(elementId: string, socketId: string) {
    // if locked by someone else, ignore (or return false)
    const current = this.locks.get(elementId);
    if (current && current !== socketId) return false;

    this.locks.set(elementId, socketId);
    return true;
  }

  clearLock(elementId: string, socketId: string) {
    const current = this.locks.get(elementId);
    if (current === socketId) {
      this.locks.delete(elementId);
      return true;
    }
    return false;
  }

  getLocksPayload() {
    const payload: Record<string, { userId: string; name: string }> = {};
    for (const [elementId, ownerId] of this.locks.entries()) {
      const user = this.users.get(ownerId);
      if (user) payload[elementId] = { userId: ownerId, name: user.name };
    }
    return payload;
  }
}
