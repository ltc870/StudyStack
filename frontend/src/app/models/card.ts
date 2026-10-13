export interface Card {
  id: number;
  stackId: number;
  question: string;
  answer: string;
  isMonospace: boolean;
}

export interface CardCreateRequest {
  stackId: number;
  question: string;
  answer: string;
  isMonospace: boolean;
}

export interface CardUpdateRequest {
  question?: string;
  answer?: string;
  isMonospace?: boolean;
}
