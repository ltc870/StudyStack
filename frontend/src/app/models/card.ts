export interface Card {
  id: number;
  stackId: number;
  question: string;
  answer: string;
  isMonospace: boolean;
  substackId: number | null;
}

export interface CardCreateRequest {
  stackId: number;
  question: string;
  answer: string;
  isMonospace: boolean;
  substackId: number | null;
}

export interface CardUpdateRequest {
  question?: string;
  answer?: string;
  isMonospace?: boolean;
}

export interface MoveCardsRequest {
  cardIds: number[];
  substackId: number | null;
}
