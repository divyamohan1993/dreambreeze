/**
 * Agent Registry -- decouples controller from specific agent implementations.
 *
 * Agents register themselves. Controller runs whatever is registered.
 * Open for extension (new agents), closed for modification (controller unchanged).
 */

export interface RegisteredAgent {
  id: string;
  run: () => void;
}

class AgentRegistry {
  private agents: RegisteredAgent[] = [];

  register(agent: RegisteredAgent): void {
    // Replace if already registered (idempotent)
    this.agents = this.agents.filter(a => a.id !== agent.id);
    this.agents.push(agent);
  }

  unregister(id: string): void {
    this.agents = this.agents.filter(a => a.id !== id);
  }

  getAll(): readonly RegisteredAgent[] {
    return this.agents;
  }

  clear(): void {
    this.agents = [];
  }
}

export const agentRegistry = new AgentRegistry();
