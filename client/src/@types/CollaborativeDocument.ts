
export interface Content {
  [key: number]: string;
}

export interface IWebSocketMessage {
  event: string,
  data: Object,
}

export interface Operation {
  type: "insert" | "delete",
  userId: string,
  index: number
  text: string
}

export interface IChangeMessage extends IWebSocketMessage {
  event: 'change',
  data: {
    revision: number,
    operation: Operation
  }
}

export interface ISyncMessage extends IWebSocketMessage {
  event: 'sync_document',
  data: {
    revision: number,
    content: string
  }
}

export interface IErrorMessage extends IWebSocketMessage {
  event: 'error',
  data: {
    reason: string
  }
}

export interface ICollaborativeDocument {
  id: string,
  channelId: string,
  name: string,
  content: string
}
