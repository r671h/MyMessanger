'use client';

import { colorForName } from '../lib/avatarColors';
import AttachmentView from './AttachmentView';
import Avatar from './Avatar';
import type { ChatMessage } from '../types/chat';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
  msg: ChatMessage;
  isOwn: boolean;
  showAvatarAndName: boolean; // true for the first message in a consecutive group from the same sender
  receipt?: React.ReactNode; // e.g. "✓✓" or "· Seen by 2" — rendered next to the timestamp
}

export default function MessageBubble({ msg, isOwn, showAvatarAndName, receipt }: MessageBubbleProps) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatarAndName ? 'mt-2' : 'mt-0.5'}`}>
      {!isOwn && (
        <div className="w-9 shrink-0">
          {showAvatarAndName && <Avatar name={msg.sender.username} avatarUrl={msg.sender.avatarUrl} size={36} />}
        </div>
      )}

      <div className={`max-w-[65%] px-3 py-2 rounded-2xl text-sm leading-snug ${isOwn ? 'bg-[#2B5278] rounded-br-md' : 'bg-[#182533] rounded-bl-md'}`}>
        {!isOwn && showAvatarAndName && (
          <p className="text-xs font-medium mb-0.5" style={{ color: colorForName(msg.sender.username) }}>
            {msg.sender.username}
          </p>
        )}
        <AttachmentView msg={msg} />
        {msg.content && <p className="wrap-break-words">{msg.content}</p>}
        <p className="text-[10px] text-[#8FA3AD] text-right mt-1 flex items-center justify-end gap-1">
          {formatTime(msg.createdAt)}
          {receipt}
        </p>
      </div>
    </div>
  );
}