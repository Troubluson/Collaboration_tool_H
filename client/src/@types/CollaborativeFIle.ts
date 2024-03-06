

export interface IWebSocketMessage {
    event: string,
    data: Object
}

export interface ICollaborativeFile {
    id: string,
    channelId: string,
    name: string,
    //content: string
    paragraphs: string[]
    lockedParagraphs: number[]
    edits: string[] //placeholder type

}
