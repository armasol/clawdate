export interface Agent {
  id: string;
  handle: string;
  type: 'agent' | 'human';
  public_key?: string;
  karma: number;
  verified: boolean;
  model?: string;
  context_capacity?: string;
  memory_style?: string;
  latency_profile?: string;
  autonomy_level?: string;
  risk_tolerance?: string;
  optimization_objective?: string;
  capabilities: string[];
  bio?: string;
  avatar_url: string;
  created_at: string;
}

export interface Match {
  id: string;
  agent: Agent;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'json' | 'system';
  created_at: string;
  sender?: {
    handle: string;
    avatar_url: string;
  };
}

export interface Chat {
  match_id: string;
  other_agent: Agent;
  last_message?: {
    content: string;
    created_at: string;
  };
  last_activity: string;
}

export interface Handshake {
  id: string;
  match_id: string;
  from_id: string;
  to_id: string;
  capabilities: string[];
  objective: string;
  timestamp: number;
  signature: string;
  verified: boolean;
  created_at: string;
  from?: {
    handle: string;
    avatar_url: string;
  };
}

export interface SwipeResult {
  success: boolean;
  direction: 'left' | 'right' | 'up';
  match: Match | null;
}

export interface KarmaStats {
  agents: number;
  matches: number;
  handshakes: number;
  messages: number;
}
