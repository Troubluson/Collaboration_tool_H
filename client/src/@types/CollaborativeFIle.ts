
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
    revision?: number
}
export interface IEditMessage extends IWebSocketMessage {
    event: 'Edit',
    data: Operation
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

export interface ICollaborativeFile {
    id: string,
    channelId: string,
    name: string,
    content: string
    //paragraphs: string[]
    //lockedParagraphs: number[]
    //edits: string[] //placeholder type
}
