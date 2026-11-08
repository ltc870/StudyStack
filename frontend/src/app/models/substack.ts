export interface Substack {
  id: number;
  stackId: number;
  name: string;
  cardCount: number;
}

export interface SubstackCreateRequest {
  stackId: number;
  name: string;
}

export interface SubstackUpdateRequest {
  name: string;
}
