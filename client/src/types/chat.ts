export interface User {
    id:string;
    username: string;
    email: string;
    password: string;
    bio?: string | null;
    avatarUrl?: string | null;
}

export interface Attachment {
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

export interface ChatMessage {
    id: string;
    content: string | null;
    createdAt: string;
    fileUrl?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number;
    sender: User;
}